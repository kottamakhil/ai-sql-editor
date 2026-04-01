import calendar
import datetime
from dateutil.relativedelta import relativedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.base import _new_id
from models.business import Employee
from models.payout import Payout
from models.payment_schedule import PaymentScheduleConfig, Tranche


FREQUENCY_TO_MONTHS = {"monthly": 1, "quarterly": 3, "annually": 12}


def _current_month_end() -> datetime.date:
    today = datetime.date.today()
    last_day = calendar.monthrange(today.year, today.month)[1]
    return datetime.date(today.year, today.month, last_day)


def _compute_payout_date(
    trigger_type: str,
    trigger_months: int | None,
    anchor_date: datetime.date,
) -> datetime.date:
    if trigger_type == "next_payroll_run":
        return _current_month_end()
    return anchor_date + relativedelta(months=trigger_months or 0)


def _build_recurring_tranches(
    frequency: str,
    duration_months: int,
) -> list[dict]:
    interval = FREQUENCY_TO_MONTHS[frequency]
    count = duration_months // interval
    pct = round(100.0 / count, 4)
    tranches = []
    for i in range(count):
        months_offset = interval * (i + 1)
        tranches.append({
            "sequence": i + 1,
            "amount_pct": pct,
            "trigger_type": "months_after_start",
            "trigger_months": months_offset,
        })
    return tranches


class PaymentScheduleService:
    """Reusable service for creating payment schedules and generating payouts.

    Other teams (e.g. hiring flow) should import and call this service
    rather than hitting the REST endpoints directly.

    Usage:
        svc = PaymentScheduleService(session)
        result = await svc.create_schedule(
            employee_id="emp_01",
            name="Sign-On Bonus",
            schedule_type="installments",
            total_amount=20000,
            tranches=[
                {"amount_pct": 50, "trigger_type": "next_payroll_run"},
                {"amount_pct": 50, "trigger_type": "months_after_start", "trigger_months": 6},
            ],
        )
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def _get_employee(self, employee_id: str) -> Employee:
        result = await self._session.execute(
            select(Employee).where(Employee.id == employee_id)
        )
        emp = result.scalar_one_or_none()
        if not emp:
            raise ValueError(f"Employee {employee_id} not found")
        return emp

    async def _check_name_unique(self, employee_id: str, name: str) -> None:
        result = await self._session.execute(
            select(PaymentScheduleConfig.id)
            .where(PaymentScheduleConfig.employee_id == employee_id)
            .where(PaymentScheduleConfig.name == name)
        )
        if result.scalar_one_or_none() is not None:
            raise ValueError(
                f"Schedule '{name}' already exists for employee {employee_id}"
            )

    async def create_schedule(
        self,
        employee_id: str,
        name: str,
        schedule_type: str,
        total_amount: float,
        frequency: str | None = None,
        duration_months: int | None = None,
        effective_date: datetime.date | None = None,
        tranches: list[dict] | None = None,
    ) -> tuple[PaymentScheduleConfig, list[Payout]]:
        employee = await self._get_employee(employee_id)
        await self._check_name_unique(employee_id, name)

        anchor = effective_date or employee.start_date

        config = PaymentScheduleConfig(
            employee_id=employee_id,
            name=name,
            schedule_type=schedule_type,
            total_amount=total_amount,
            frequency=frequency,
            duration_months=duration_months,
        )
        self._session.add(config)
        await self._session.flush()

        tranche_defs = self._resolve_tranches(
            schedule_type, total_amount, frequency, duration_months, tranches,
        )

        tranche_models = []
        for td in tranche_defs:
            t = Tranche(
                schedule_config_id=config.id,
                sequence=td["sequence"],
                amount_pct=td["amount_pct"],
                trigger_type=td["trigger_type"],
                trigger_months=td.get("trigger_months"),
            )
            tranche_models.append(t)
        self._session.add_all(tranche_models)
        await self._session.flush()

        payouts = self._generate_payouts(
            config, tranche_defs, total_amount, anchor, name,
        )
        self._session.add_all(payouts)
        await self._session.commit()

        result = await self._session.execute(
            select(PaymentScheduleConfig)
            .options(selectinload(PaymentScheduleConfig.tranches))
            .where(PaymentScheduleConfig.id == config.id)
        )
        config = result.scalar_one()
        return config, payouts

    def _resolve_tranches(
        self,
        schedule_type: str,
        total_amount: float,
        frequency: str | None,
        duration_months: int | None,
        tranches: list[dict] | None,
    ) -> list[dict]:
        if schedule_type == "recurring":
            return _build_recurring_tranches(frequency, duration_months)

        if schedule_type == "lump_sum":
            if tranches and len(tranches) == 1:
                td = tranches[0]
                return [{
                    "sequence": 1,
                    "amount_pct": 100.0,
                    "trigger_type": td.get("trigger_type", "next_payroll_run"),
                    "trigger_months": td.get("trigger_months"),
                }]
            return [{
                "sequence": 1,
                "amount_pct": 100.0,
                "trigger_type": "next_payroll_run",
                "trigger_months": None,
            }]

        result = []
        for i, td in enumerate(tranches):
            result.append({
                "sequence": i + 1,
                "amount_pct": td["amount_pct"],
                "trigger_type": td["trigger_type"],
                "trigger_months": td.get("trigger_months"),
            })
        return result

    def _generate_payouts(
        self,
        config: PaymentScheduleConfig,
        tranche_defs: list[dict],
        total_amount: float,
        anchor: datetime.date,
        group_id: str,
    ) -> list[Payout]:
        payouts = []
        for td in tranche_defs:
            amount = round(total_amount * td["amount_pct"] / 100.0, 2)
            payout_date = _compute_payout_date(
                td["trigger_type"], td.get("trigger_months"), anchor,
            )
            payouts.append(Payout(
                id=_new_id(),
                employee_id=config.employee_id,
                group_id=group_id,
                amount=amount,
                date=payout_date,
            ))
        return payouts

    async def get_schedule(self, config_id: str) -> PaymentScheduleConfig | None:
        result = await self._session.execute(
            select(PaymentScheduleConfig)
            .options(selectinload(PaymentScheduleConfig.tranches))
            .where(PaymentScheduleConfig.id == config_id)
        )
        return result.scalar_one_or_none()

    async def list_schedules(self, employee_id: str) -> list[PaymentScheduleConfig]:
        result = await self._session.execute(
            select(PaymentScheduleConfig)
            .options(selectinload(PaymentScheduleConfig.tranches))
            .where(PaymentScheduleConfig.employee_id == employee_id)
            .order_by(PaymentScheduleConfig.created_at)
        )
        return list(result.scalars())
