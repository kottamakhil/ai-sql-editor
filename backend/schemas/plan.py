from __future__ import annotations

from pydantic import BaseModel

from schemas.membership import MembershipOut
from services.executor import ExecutionResult


class CreatePlanRequest(BaseModel):
    name: str
    plan_type: str = "RECURRING"
    frequency: str = "QUARTERLY"


class UpdatePlanRequest(BaseModel):
    name: str | None = None
    plan_type: str | None = None
    frequency: str | None = None


class UpdatePayoutConfig(BaseModel):
    is_automatic_payout_enabled: bool | None = None
    final_payment_offset: int | None = None
    is_draws_enabled: bool | None = None
    draw_frequency: str | None = None


class UpdatePayrollConfig(BaseModel):
    payout_type: str | None = None


class UpdateDisputeConfig(BaseModel):
    is_disputes_enabled: bool | None = None


class UpdatePlanConfigRequest(BaseModel):
    payout: UpdatePayoutConfig | None = None
    payroll: UpdatePayrollConfig | None = None
    disputes: UpdateDisputeConfig | None = None


class ArtifactOut(BaseModel):
    artifact_id: str
    name: str | None
    sql_expression: str


class PayoutConfigOut(BaseModel):
    is_automatic_payout_enabled: bool = False
    final_payment_offset: int | None = None
    is_draws_enabled: bool = False
    draw_frequency: str | None = None


class PayrollConfigOut(BaseModel):
    payout_type: str | None = None


class DisputeConfigOut(BaseModel):
    is_disputes_enabled: bool = True


class PlanConfigOut(BaseModel):
    payout: PayoutConfigOut = PayoutConfigOut()
    payroll: PayrollConfigOut = PayrollConfigOut()
    disputes: DisputeConfigOut = DisputeConfigOut()


class PlanCycleOut(BaseModel):
    cycle_id: str
    period_name: str
    start_date: str
    end_date: str


class ConversationSkillOut(BaseModel):
    skill_id: str
    skill_name: str
    version_id: str
    version: int
    content: str


class PlanOut(BaseModel):
    plan_id: str
    name: str
    plan_type: str
    frequency: str
    mode: str
    start_date: str | None = None
    end_date: str | None = None
    artifacts: list[ArtifactOut]
    cycles: list[PlanCycleOut] | None = None
    config: PlanConfigOut = PlanConfigOut()
    inferred_config: str | None = None
    conversation_id: str | None = None
    skills: list[ConversationSkillOut] | None = None
    membership: MembershipOut | None = None


class CreateArtifactRequest(BaseModel):
    name: str | None = None
    sql_expression: str


class UpdateArtifactRequest(BaseModel):
    name: str | None = None
    sql_expression: str | None = None


class LineageNode(BaseModel):
    id: str
    name: str | None
    sql: str
    type: str


class LineageEdge(BaseModel):
    source: str
    target: str


class LineageDAG(BaseModel):
    nodes: list[LineageNode]
    edges: list[LineageEdge]


class PlanTemplateOut(BaseModel):
    template_id: str
    name: str
    content: str


class CreatePlanTemplateRequest(BaseModel):
    name: str
    content: str


class ExplainRequest(BaseModel):
    cycle_id: str | None = None


class ExplainResponse(BaseModel):
    artifact_id: str
    artifact_name: str | None
    html_content: str


class PreviewResponse(BaseModel):
    composed_sql: str
    result: ExecutionResult
