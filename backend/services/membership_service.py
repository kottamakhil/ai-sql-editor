from __future__ import annotations

import json

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Employee, PlanMembershipRule

FILTERABLE_FIELDS = {"department", "role", "country"}


def _get_column(field: str):
    if field not in FILTERABLE_FIELDS:
        raise ValueError(f"Invalid filter field: {field}")
    return getattr(Employee, field)


async def get_field_values(session: AsyncSession) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {}
    for field in sorted(FILTERABLE_FIELDS):
        col = _get_column(field)
        rows = await session.execute(select(col).distinct().order_by(col))
        result[field] = [r[0] for r in rows]
    return result


def build_members_query(rule: PlanMembershipRule):
    rules = json.loads(rule.rules_json)
    exceptions = json.loads(rule.exceptions_json)

    query = select(Employee)

    if rules:
        if rule.match_type == "any":
            conditions = []
            for r in rules:
                col = _get_column(r["field"])
                conditions.append(col.in_(r["values"]))
            query = query.where(or_(*conditions))
        else:
            for r in rules:
                col = _get_column(r["field"])
                query = query.where(col.in_(r["values"]))

    for exc in exceptions:
        col = _get_column(exc["field"])
        query = query.where(~col.in_(exc["values"]))

    return query.order_by(Employee.name)


async def upsert_membership(
    plan_id: str,
    match_type: str,
    rules: list[dict],
    exceptions: list[dict],
    session: AsyncSession,
) -> PlanMembershipRule:
    result = await session.execute(
        select(PlanMembershipRule).where(PlanMembershipRule.plan_id == plan_id)
    )
    membership = result.scalar_one_or_none()

    if membership is None:
        membership = PlanMembershipRule(plan_id=plan_id)
        session.add(membership)

    membership.match_type = match_type
    membership.rules_json = json.dumps(rules)
    membership.exceptions_json = json.dumps(exceptions)

    await session.flush()
    return membership
