import logging

from fastapi import HTTPException
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import Plan

log = logging.getLogger(__name__)

BUSINESS_TABLES = {"employees", "deals", "quotas", "plan_cycles"}


async def load_plan(plan_id: str, session: AsyncSession) -> Plan:
    result = await session.execute(
        select(Plan).options(
            selectinload(Plan.artifacts), selectinload(Plan.config),
            selectinload(Plan.inferred_config), selectinload(Plan.cycles),
            selectinload(Plan.membership_rule),
        ).where(Plan.id == plan_id)
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail=f"Plan {plan_id} not found")
    return plan


async def get_schema_ddls(session: AsyncSession) -> list[str]:
    placeholders = ", ".join(f":t{i}" for i in range(len(BUSINESS_TABLES)))
    params = {f"t{i}": name for i, name in enumerate(BUSINESS_TABLES)}
    stmt = text(
        "SELECT table_name, column_name, data_type, is_nullable "
        "FROM information_schema.columns "
        f"WHERE table_schema = 'public' AND table_name IN ({placeholders}) "
        "ORDER BY table_name, ordinal_position"
    )
    result = await session.execute(stmt, params)
    rows = result.fetchall()

    tables: dict[str, list[str]] = {}
    for table_name, col_name, data_type, nullable in rows:
        tables.setdefault(table_name, [])
        null_str = "" if nullable == "YES" else " NOT NULL"
        tables[table_name].append(f"  {col_name} {data_type.upper()}{null_str}")

    return [
        f"CREATE TABLE {name} (\n" + ",\n".join(cols) + "\n)"
        for name, cols in tables.items()
    ]
