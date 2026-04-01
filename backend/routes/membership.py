import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import PlanMembershipRule
from schemas.employee import EmployeeOut
from schemas.membership import (
    FieldValuesOut,
    MembershipOut,
    MembershipRuleItem,
    UpdateMembershipRequest,
)
from services.data_access import load_plan
from services.membership_service import (
    build_members_query,
    get_field_values,
    upsert_membership,
)

router = APIRouter()


def _rule_to_out(rule: PlanMembershipRule) -> MembershipOut:
    return MembershipOut(
        match_type=rule.match_type,
        rules=[MembershipRuleItem(**r) for r in json.loads(rule.rules_json)],
        exceptions=[MembershipRuleItem(**e) for e in json.loads(rule.exceptions_json)],
    )


@router.get("/employees/field-values", response_model=FieldValuesOut)
async def employee_field_values(session: AsyncSession = Depends(get_db)):
    values = await get_field_values(session)
    return FieldValuesOut(**values)


@router.put("/plans/{plan_id}/membership", response_model=MembershipOut)
async def update_membership(
    plan_id: str,
    req: UpdateMembershipRequest,
    session: AsyncSession = Depends(get_db),
):
    await load_plan(plan_id, session)

    if req.match_type not in ("all", "any"):
        raise HTTPException(status_code=400, detail="match_type must be 'all' or 'any'")

    rules_dicts = [r.model_dump() for r in req.rules]
    exceptions_dicts = [e.model_dump() for e in req.exceptions]

    membership = await upsert_membership(
        plan_id, req.match_type, rules_dicts, exceptions_dicts, session,
    )
    await session.commit()
    await session.refresh(membership)
    return _rule_to_out(membership)


@router.get("/plans/{plan_id}/membership", response_model=MembershipOut)
async def get_membership(plan_id: str, session: AsyncSession = Depends(get_db)):
    await load_plan(plan_id, session)
    result = await session.execute(
        select(PlanMembershipRule).where(PlanMembershipRule.plan_id == plan_id)
    )
    rule = result.scalar_one_or_none()
    if not rule:
        return MembershipOut(match_type="all", rules=[], exceptions=[])
    return _rule_to_out(rule)


@router.get("/plans/{plan_id}/members", response_model=list[EmployeeOut])
async def get_plan_members(plan_id: str, session: AsyncSession = Depends(get_db)):
    await load_plan(plan_id, session)
    result = await session.execute(
        select(PlanMembershipRule).where(PlanMembershipRule.plan_id == plan_id)
    )
    rule = result.scalar_one_or_none()
    if not rule:
        return []

    query = build_members_query(rule)
    employees = await session.execute(query)
    return [
        EmployeeOut(
            employee_id=e.id, name=e.name, department=e.department,
            role=e.role, country=e.country, start_date=e.start_date,
        )
        for e in employees.scalars()
    ]
