"""SQLAlchemy + PostgreSQL implementation of PlanServiceBase.

This is the only file that touches ORM models and the database session.
Swap this out for a Django+MongoDB implementation in prod.
"""

from __future__ import annotations

import logging

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from executor import execute_artifact, execute_raw_sql
from models import Plan, SqlArtifact
from services.plan_service import PlanServiceBase

log = logging.getLogger(__name__)


class SqlAlchemyPlanService(PlanServiceBase):
    def __init__(self, session: AsyncSession, plan: Plan | None = None) -> None:
        self._session = session
        self._plan = plan

    @property
    def plan(self) -> Plan | None:
        return self._plan

    async def create_plan(
        self, name: str, plan_type: str = "RECURRING", frequency: str = "QUARTERLY"
    ) -> dict:
        from models import PlanConfig

        plan = Plan(
            name=name,
            plan_type=plan_type.upper(),
            frequency=frequency.upper(),
            mode="AI_ASSISTED",
        )
        self._session.add(plan)
        await self._session.flush()

        config = PlanConfig(plan_id=plan.id)
        self._session.add(config)
        await self._session.commit()
        self._plan = plan
        plan = await self._reload_plan()
        log.info("Created plan %s: %s", plan.id, name)
        return self._plan_to_dict(plan)

    async def update_plan(self, **fields) -> dict:
        plan = self._require_plan()
        for key, value in fields.items():
            if hasattr(plan, key) and value is not None:
                setattr(plan, key, value.strip() if isinstance(value, str) else value)
        await self._session.commit()
        plan = await self._reload_plan()
        log.info("Updated plan %s: %s", plan.id, list(fields.keys()))
        return self._plan_to_dict(plan)

    async def get_plan(self) -> dict | None:
        if not self._plan:
            return None
        plan = await self._reload_plan()
        return self._plan_to_dict(plan)

    async def replace_artifacts(self, specs: list[dict]) -> list[dict]:
        plan = self._require_plan()

        old = await self._load_artifacts()
        for a in old:
            await self._session.delete(a)
        await self._session.commit()
        log.info("Deleted %d old artifact(s) for plan=%s", len(old), plan.id)

        for spec in specs:
            self._session.add(
                SqlArtifact(plan_id=plan.id, name=spec["name"], sql_expression=spec["sql"])
            )
        await self._session.commit()
        log.info("Created %d artifact(s) for plan=%s", len(specs), plan.id)

        all_artifacts = await self._load_artifacts()
        results = []
        for artifact in all_artifacts:
            exec_result = await execute_artifact(artifact, all_artifacts, self._session)
            results.append({
                "name": artifact.name,
                "sql": artifact.sql_expression,
                "row_count": exec_result.row_count,
                "columns": exec_result.columns,
                "error": exec_result.error,
            })
        return results

    async def get_artifacts(self) -> list[dict]:
        if not self._plan:
            return []
        artifacts = await self._load_artifacts()
        return [{"name": a.name, "sql": a.sql_expression} for a in artifacts]

    async def execute_sql(self, sql: str) -> dict:
        result = await execute_raw_sql(sql, self._session)
        return {
            "columns": result.columns,
            "rows": result.rows,
            "row_count": result.row_count,
            "error": result.error,
        }

    async def validate_sql(self, sql: str) -> dict:
        try:
            async with self._session.begin_nested():
                await self._session.execute(text(f"EXPLAIN {sql}"))
            return {"valid": True, "error": None}
        except Exception as exc:
            return {"valid": False, "error": str(exc).split("\n")[0]}

    def _require_plan(self) -> Plan:
        if not self._plan:
            raise ValueError("No plan exists. Call create_plan first.")
        return self._plan

    async def _reload_plan(self) -> Plan:
        """Re-query the plan with config eagerly loaded to avoid lazy-load in async."""
        plan = self._require_plan()
        result = await self._session.execute(
            select(Plan).options(selectinload(Plan.config)).where(Plan.id == plan.id)
        )
        self._plan = result.scalar_one()
        return self._plan

    async def _load_artifacts(self) -> list[SqlArtifact]:
        plan = self._require_plan()
        result = await self._session.execute(
            select(SqlArtifact)
            .where(SqlArtifact.plan_id == plan.id)
            .order_by(SqlArtifact.created_at)
        )
        return list(result.scalars())

    async def update_plan_config(self, config_patch: dict) -> dict:
        """Apply config fields from nested patch to the PlanConfig row."""
        from models import PlanConfig, default_config_dict

        plan = self._require_plan()
        config = plan.config
        if not config:
            config = PlanConfig(plan_id=plan.id)
            self._session.add(config)

        field_map = {
            "payout": {
                "is_automatic_payout_enabled": "is_automatic_payout_enabled",
                "final_payment_offset": "final_payment_offset",
                "is_draws_enabled": "is_draws_enabled",
                "draw_frequency": "draw_frequency",
            },
            "payroll": {
                "payout_type": "payout_type",
            },
            "disputes": {
                "is_disputes_enabled": "is_disputes_enabled",
            },
        }

        for section, fields in config_patch.items():
            if section in field_map and isinstance(fields, dict):
                for field_key, column_name in field_map[section].items():
                    if field_key in fields:
                        setattr(config, column_name, fields[field_key])

        await self._session.commit()
        plan = await self._reload_plan()
        log.info("Updated plan %s config: %s", plan.id, list(config_patch.keys()))
        return plan.config.to_dict() if plan.config else {}

    @staticmethod
    def _plan_to_dict(plan: Plan) -> dict:
        return {
            "plan_id": plan.id,
            "name": plan.name,
            "plan_type": plan.plan_type,
            "frequency": plan.frequency,
            "mode": plan.mode,
            "config": plan.config.to_dict() if plan.config else default_config_dict(),
        }
