from __future__ import annotations

from pydantic import BaseModel


class MembershipRuleItem(BaseModel):
    field: str
    values: list[str]


class UpdateMembershipRequest(BaseModel):
    match_type: str = "all"
    rules: list[MembershipRuleItem] = []
    exceptions: list[MembershipRuleItem] = []


class MembershipOut(BaseModel):
    match_type: str
    rules: list[MembershipRuleItem]
    exceptions: list[MembershipRuleItem]


class FieldValuesOut(BaseModel):
    department: list[str]
    role: list[str]
    country: list[str]
