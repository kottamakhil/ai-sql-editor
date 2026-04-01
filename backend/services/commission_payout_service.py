import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.base import _new_id
from models.business import Employee
from models.payout import Payout
from models.plan import Plan, PlanCycle, SqlArtifact
from services.data_access import load_plan
from services.executor import (
    ExecutionResult,
    _build_cte_query,
    _find_final_artifact,
    _resolve_dependencies,
    execute_raw_sql,
)

log = logging.getLogger(__name__)


class CommissionPayoutService:
    """Executes a plan's payout artifact for a given cycle and creates
    Payout records for each employee row in the result.

    Usage:
        svc = CommissionPayoutService(session)
        payouts = await svc.send_to_payroll(plan_id="abc", cycle_id="xyz")
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def send_to_payroll(
        self,
        plan_id: str,
        cycle_id: str,
    ) -> list[Payout]:
        plan = await load_plan(plan_id, self._session)
        cycle = self._find_cycle(plan, cycle_id)
        artifacts = list(plan.artifacts)

        result = await self._execute_payout_artifact(artifacts, cycle_id)
        if result.error:
            raise ValueError(f"Payout artifact execution failed: {result.error}")

        employee_col, amount_col = self._resolve_columns(result.columns)
        valid_employee_ids = await self._load_valid_employee_ids()

        payouts = []
        for row in result.rows:
            emp_id = str(row[employee_col])
            amount = float(row[amount_col])

            if emp_id not in valid_employee_ids:
                log.warning(
                    "Skipping unknown employee_id=%s in plan=%s cycle=%s",
                    emp_id, plan_id, cycle_id,
                )
                continue

            if amount <= 0:
                continue

            payouts.append(Payout(
                id=_new_id(),
                employee_id=emp_id,
                group_id=plan.name,
                amount=round(amount, 2),
                date=cycle.end_date,
            ))

        if not payouts:
            raise ValueError("No valid payout rows produced by the payout artifact")

        self._session.add_all(payouts)
        await self._session.commit()

        log.info(
            "Created %d payouts for plan=%s cycle=%s",
            len(payouts), plan.name, cycle.period_name,
        )
        return payouts

    def _find_cycle(self, plan: Plan, cycle_id: str) -> PlanCycle:
        for c in plan.cycles:
            if c.id == cycle_id:
                return c
        raise ValueError(f"Cycle {cycle_id} not found in plan {plan.id}")

    async def _execute_payout_artifact(
        self,
        artifacts: list[SqlArtifact],
        cycle_id: str,
    ) -> ExecutionResult:
        if not artifacts:
            raise ValueError("Plan has no artifacts")

        final = _find_final_artifact(artifacts)
        if final.name != "payout":
            raise ValueError(
                f"Final artifact is '{final.name}', expected 'payout'. "
                "Ensure the plan has an artifact named 'payout'."
            )

        named = {a.name: a for a in artifacts if a.name}
        deps = _resolve_dependencies(final, named)
        composed_sql = _build_cte_query(deps, final.sql_expression)

        filtered_sql = (
            f"SELECT * FROM ({composed_sql}) AS _result "
            f"WHERE cycle_id = '{cycle_id}'"
        )
        return await execute_raw_sql(filtered_sql, self._session)

    def _resolve_columns(self, columns: list[str]) -> tuple[int, int]:
        col_lower = [c.lower() for c in columns]

        employee_idx = None
        for candidate in ("employee_id", "emp_id", "payee_id"):
            if candidate in col_lower:
                employee_idx = col_lower.index(candidate)
                break

        amount_idx = None
        for candidate in ("commission_amount", "commission", "amount", "payout_amount", "total_commission"):
            if candidate in col_lower:
                amount_idx = col_lower.index(candidate)
                break

        if employee_idx is None:
            raise ValueError(
                f"Cannot find employee column in payout result. "
                f"Columns: {columns}. Expected one of: employee_id, emp_id, payee_id"
            )
        if amount_idx is None:
            raise ValueError(
                f"Cannot find amount column in payout result. "
                f"Columns: {columns}. Expected one of: commission_amount, commission, amount, payout_amount, total_commission"
            )

        return employee_idx, amount_idx

    async def _load_valid_employee_ids(self) -> set[str]:
        result = await self._session.execute(select(Employee.id))
        return {row[0] for row in result.all()}
