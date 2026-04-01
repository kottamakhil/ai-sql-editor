import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import (
    Conversation,
    ConversationSkillVersion,
    Plan,
    PlanConfig,
    PlanTemplate,
    Skill,
    SkillVersion,
    SqlArtifact,
    default_config_dict,
)
from schemas.plan import (
    ConversationSkillOut,
    ArtifactOut,
    CreateArtifactRequest,
    CreatePlanRequest,
    CreatePlanTemplateRequest,
    DisputeConfigOut,
    ExplainRequest,
    ExplainResponse,
    LineageDAG,
    LineageEdge,
    LineageNode,
    PayoutConfigOut,
    PayrollConfigOut,
    PlanConfigOut,
    PlanCycleOut,
    PlanOut,
    PlanTemplateOut,
    PreviewResponse,
    UpdateArtifactRequest,
    UpdatePlanConfigRequest,
    UpdatePlanRequest,
)
from schemas.commission import (
    CommissionPayoutOut,
    SendToPayrollResponse,
)
from services.commission_payout_service import CommissionPayoutService
from routes.membership import _rule_to_out
from services.data_access import load_plan
from services.executor import (
    ExecutionResult,
    _build_cte_query,
    _find_final_artifact,
    _resolve_dependencies,
    build_lineage_dag,
    execute_artifact,
    execute_plan_preview,
    execute_raw_sql,
)

log = logging.getLogger(__name__)

router = APIRouter()


# --- Helpers ---


def _artifact_to_out(a: SqlArtifact) -> ArtifactOut:
    return ArtifactOut(artifact_id=a.id, name=a.name, sql_expression=a.sql_expression)


async def _plan_to_out(plan: Plan, session: AsyncSession) -> PlanOut:
    conv_result = await session.execute(
        select(Conversation.id)
        .where(Conversation.plan_id == plan.id)
        .order_by(Conversation.created_at.desc())
        .limit(1)
    )
    conv_id = conv_result.scalar_one_or_none()

    skills = None
    if conv_id:
        skills_result = await session.execute(
            select(ConversationSkillVersion, SkillVersion, Skill)
            .join(SkillVersion, ConversationSkillVersion.skill_version_id == SkillVersion.id)
            .join(Skill, SkillVersion.skill_id == Skill.id)
            .where(ConversationSkillVersion.conversation_id == conv_id)
        )
        skills = [
            ConversationSkillOut(
                skill_id=skill.id, skill_name=skill.name,
                version_id=sv.id, version=sv.version, content=sv.content,
            )
            for _, sv, skill in skills_result.all()
        ] or None

    cfg = plan.config.to_dict() if plan.config else default_config_dict()
    plan_config = PlanConfigOut(
        payout=PayoutConfigOut(**cfg["payout"]),
        payroll=PayrollConfigOut(**cfg["payroll"]),
        disputes=DisputeConfigOut(**cfg["disputes"]),
    )

    cycles = [
        PlanCycleOut(
            cycle_id=c.id, period_name=c.period_name,
            start_date=c.start_date.isoformat(), end_date=c.end_date.isoformat(),
        )
        for c in plan.cycles
    ] if hasattr(plan, 'cycles') and plan.cycles else None

    membership = None
    if hasattr(plan, 'membership_rule') and plan.membership_rule:
        membership = _rule_to_out(plan.membership_rule)

    return PlanOut(
        plan_id=plan.id,
        name=plan.name,
        plan_type=plan.plan_type,
        frequency=plan.frequency,
        mode=plan.mode,
        start_date=plan.start_date.isoformat() if plan.start_date else None,
        end_date=plan.end_date.isoformat() if plan.end_date else None,
        artifacts=[_artifact_to_out(a) for a in plan.artifacts],
        cycles=cycles,
        config=plan_config,
        inferred_config=plan.inferred_config.content if plan.inferred_config else None,
        conversation_id=conv_id,
        skills=skills,
        membership=membership,
    )


# --- Plan CRUD ---


@router.get("/plans", response_model=list[PlanOut])
async def list_plans(session: AsyncSession = Depends(get_db)):
    result = await session.execute(
        select(Plan).options(
            selectinload(Plan.artifacts), selectinload(Plan.config),
            selectinload(Plan.inferred_config), selectinload(Plan.cycles),
            selectinload(Plan.membership_rule),
        ).order_by(Plan.created_at.desc())
    )
    return [await _plan_to_out(p, session) for p in result.scalars()]


@router.post("/plans", response_model=PlanOut)
async def create_plan(req: CreatePlanRequest, session: AsyncSession = Depends(get_db)):
    plan = Plan(
        name=req.name,
        plan_type=req.plan_type.upper(),
        frequency=req.frequency.upper(),
        mode="AI_ASSISTED",
    )
    session.add(plan)
    await session.flush()

    config = PlanConfig(plan_id=plan.id)
    session.add(config)

    await session.commit()
    plan = await load_plan(plan.id, session)
    return await _plan_to_out(plan, session)


@router.get("/plans/{plan_id}", response_model=PlanOut)
async def get_plan(plan_id: str, session: AsyncSession = Depends(get_db)):
    plan = await load_plan(plan_id, session)
    return await _plan_to_out(plan, session)


@router.patch("/plans/{plan_id}", response_model=PlanOut)
async def update_plan(plan_id: str, req: UpdatePlanRequest, session: AsyncSession = Depends(get_db)):
    plan = await load_plan(plan_id, session)

    if req.name is not None:
        plan.name = req.name.strip()
    if req.plan_type is not None:
        plan.plan_type = req.plan_type.upper()
    if req.frequency is not None:
        plan.frequency = req.frequency.upper()

    await session.commit()
    plan = await load_plan(plan.id, session)
    return await _plan_to_out(plan, session)


@router.patch("/plans/{plan_id}/config", response_model=PlanConfigOut)
async def update_plan_config_endpoint(
    plan_id: str, req: UpdatePlanConfigRequest, session: AsyncSession = Depends(get_db),
):
    plan = await load_plan(plan_id, session)
    config = plan.config
    if not config:
        config = PlanConfig(plan_id=plan.id)
        session.add(config)

    field_map = {
        "payout": {
            "is_automatic_payout_enabled": "is_automatic_payout_enabled",
            "final_payment_offset": "final_payment_offset",
            "is_draws_enabled": "is_draws_enabled",
            "draw_frequency": "draw_frequency",
        },
        "payroll": {"payout_type": "payout_type"},
        "disputes": {"is_disputes_enabled": "is_disputes_enabled"},
    }

    patch = req.model_dump(exclude_none=True)
    for section, fields in patch.items():
        if section in field_map and isinstance(fields, dict):
            for field_key, column_name in field_map[section].items():
                if field_key in fields:
                    setattr(config, column_name, fields[field_key])

    await session.commit()
    await session.refresh(config)
    cfg = config.to_dict()
    return PlanConfigOut(
        payout=PayoutConfigOut(**cfg["payout"]),
        payroll=PayrollConfigOut(**cfg["payroll"]),
        disputes=DisputeConfigOut(**cfg["disputes"]),
    )


# --- Artifact CRUD ---


@router.post("/plans/{plan_id}/artifacts", response_model=ArtifactOut)
async def create_artifact(plan_id: str, req: CreateArtifactRequest, session: AsyncSession = Depends(get_db)):
    await load_plan(plan_id, session)
    artifact = SqlArtifact(plan_id=plan_id, name=req.name, sql_expression=req.sql_expression)
    session.add(artifact)
    await session.commit()
    await session.refresh(artifact)
    return _artifact_to_out(artifact)


@router.patch("/artifacts/{artifact_id}", response_model=ArtifactOut)
async def update_artifact(artifact_id: str, req: UpdateArtifactRequest, session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(SqlArtifact).where(SqlArtifact.id == artifact_id))
    artifact = result.scalar_one_or_none()
    if not artifact:
        raise HTTPException(status_code=404, detail=f"Artifact {artifact_id} not found")

    if req.name is not None:
        artifact.name = req.name
    if req.sql_expression is not None:
        artifact.sql_expression = req.sql_expression

    await session.commit()
    await session.refresh(artifact)
    return _artifact_to_out(artifact)


@router.delete("/artifacts/{artifact_id}", status_code=204)
async def delete_artifact(artifact_id: str, session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(SqlArtifact).where(SqlArtifact.id == artifact_id))
    artifact = result.scalar_one_or_none()
    if not artifact:
        raise HTTPException(status_code=404, detail=f"Artifact {artifact_id} not found")
    await session.delete(artifact)
    await session.commit()


# --- Explain ---


@router.post("/artifacts/{artifact_id}/explain", response_model=ExplainResponse)
async def explain_artifact(artifact_id: str, req: ExplainRequest, session: AsyncSession = Depends(get_db)):
    from agent.prompts import EXPLAIN_SYSTEM_PROMPT
    from llm import call_openai_with_tools

    result = await session.execute(select(SqlArtifact).where(SqlArtifact.id == artifact_id))
    artifact = result.scalar_one_or_none()
    if not artifact:
        raise HTTPException(status_code=404, detail=f"Artifact {artifact_id} not found")

    plan_result = await session.execute(
        select(SqlArtifact).where(SqlArtifact.plan_id == artifact.plan_id).order_by(SqlArtifact.created_at)
    )
    all_artifacts = list(plan_result.scalars())
    plan = await load_plan(artifact.plan_id, session)

    artifacts_context = "\n".join(f"- {a.name}: {a.sql_expression}" for a in all_artifacts)

    payout_result = await execute_artifact(artifact, all_artifacts, session)
    if req.cycle_id and not payout_result.error and "cycle_id" in payout_result.columns:
        payout_result = await _execute_with_cycle_filter(artifact, all_artifacts, req.cycle_id, session)

    base_artifact = next((a for a in all_artifacts if a.name and a.name != "payout" and a.name != artifact.name), None)
    base_result = None
    if base_artifact:
        base_result = await execute_artifact(base_artifact, all_artifacts, session)
        if req.cycle_id and not base_result.error and "cycle_id" in base_result.columns:
            base_result = await _execute_with_cycle_filter(base_artifact, all_artifacts, req.cycle_id, session)

    def _fmt(exec_res: ExecutionResult, max_rows: int = 20) -> str:
        if exec_res.error or not exec_res.rows:
            return "(no data)"
        header = "| " + " | ".join(exec_res.columns) + " |"
        rows = "\n".join("| " + " | ".join(str(c) for c in row) + " |" for row in exec_res.rows[:max_rows])
        return f"{header}\n{rows}"

    cycle_label = ""
    if req.cycle_id and plan.cycles:
        cycle = next((c for c in plan.cycles if c.id == req.cycle_id), None)
        if cycle:
            cycle_label = f"Period: {cycle.period_name}"

    user_msg = (
        f"Plan: {plan.name} ({plan.frequency})\n{cycle_label}\n\n"
        f"SQL artifacts:\n{artifacts_context}\n\n"
        f"Payout results:\n{_fmt(payout_result)}\n\n"
        f"Source data ({base_artifact.name if base_artifact else 'base'}):\n"
        f"{_fmt(base_result) if base_result else '(not available)'}"
    )

    plan_seed = int(artifact.plan_id, 16) % (2**31)

    response = await call_openai_with_tools(
        messages=[
            {"role": "system", "content": EXPLAIN_SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        tools=[],
        temperature=0,
        seed=plan_seed,
    )

    html = (response.content or "").strip()
    if html.startswith("```"):
        html = "\n".join(html.split("\n")[1:])
    if html.endswith("```"):
        html = "\n".join(html.split("\n")[:-1])

    return ExplainResponse(
        artifact_id=artifact.id,
        artifact_name=artifact.name,
        html_content=html or "<p>Unable to generate explanation.</p>",
    )


# --- Plan preview + lineage ---


@router.get("/plans/{plan_id}/preview", response_model=PreviewResponse)
async def preview_plan(plan_id: str, cycle_id: str | None = None, session: AsyncSession = Depends(get_db)):
    plan = await load_plan(plan_id, session)
    artifacts = list(plan.artifacts)

    if not artifacts:
        raise HTTPException(status_code=400, detail="Plan has no artifacts")

    named = {a.name: a for a in artifacts if a.name}
    final = _find_final_artifact(artifacts)
    deps = _resolve_dependencies(final, named)
    composed_sql = _build_cte_query(deps, final.sql_expression)

    if cycle_id:
        filtered_sql = f"SELECT * FROM ({composed_sql}) AS _result WHERE cycle_id = '{cycle_id}'"
        exec_result = await execute_raw_sql(filtered_sql, session)
    else:
        exec_result = await execute_plan_preview(artifacts, session)

    return PreviewResponse(composed_sql=composed_sql, result=exec_result)


@router.get("/plans/{plan_id}/lineage", response_model=LineageDAG)
async def get_plan_lineage(plan_id: str, session: AsyncSession = Depends(get_db)):
    plan = await load_plan(plan_id, session)
    artifacts = list(plan.artifacts)
    if not artifacts:
        return LineageDAG(nodes=[], edges=[])
    dag = build_lineage_dag(artifacts)
    return LineageDAG(
        nodes=[LineageNode(**n) for n in dag["nodes"]],
        edges=[LineageEdge(**e) for e in dag["edges"]],
    )


# --- Send to Payroll ---


@router.post("/plans/{plan_id}/cycles/{cycle_id}/send-to-payroll", response_model=SendToPayrollResponse)
async def send_to_payroll(
    plan_id: str,
    cycle_id: str,
    session: AsyncSession = Depends(get_db),
):
    svc = CommissionPayoutService(session)
    try:
        payouts = await svc.send_to_payroll(plan_id=plan_id, cycle_id=cycle_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    plan = await load_plan(plan_id, session)
    cycle = next(c for c in plan.cycles if c.id == cycle_id)

    return SendToPayrollResponse(
        plan_id=plan.id,
        plan_name=plan.name,
        cycle_id=cycle.id,
        cycle_name=cycle.period_name,
        payouts_created=len(payouts),
        payouts=[
            CommissionPayoutOut(
                payout_id=p.id,
                employee_id=p.employee_id,
                amount=p.amount,
                date=p.date,
                group_id=p.group_id,
            )
            for p in payouts
        ],
    )


# --- Plan Templates ---


@router.post("/plan-templates", response_model=PlanTemplateOut)
async def create_plan_template(req: CreatePlanTemplateRequest, session: AsyncSession = Depends(get_db)):
    tpl = PlanTemplate(name=req.name, content=req.content)
    session.add(tpl)
    await session.commit()
    await session.refresh(tpl)
    return PlanTemplateOut(template_id=tpl.id, name=tpl.name, content=tpl.content)


@router.get("/plan-templates", response_model=list[PlanTemplateOut])
async def list_plan_templates(session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(PlanTemplate).order_by(PlanTemplate.created_at.desc()))
    return [PlanTemplateOut(template_id=t.id, name=t.name, content=t.content) for t in result.scalars()]


@router.get("/plan-templates/{template_id}", response_model=PlanTemplateOut)
async def get_plan_template(template_id: str, session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(PlanTemplate).where(PlanTemplate.id == template_id))
    tpl = result.scalar_one_or_none()
    if not tpl:
        raise HTTPException(status_code=404, detail=f"Template {template_id} not found")
    return PlanTemplateOut(template_id=tpl.id, name=tpl.name, content=tpl.content)


@router.put("/plan-templates/{template_id}", response_model=PlanTemplateOut)
async def update_plan_template(template_id: str, req: CreatePlanTemplateRequest, session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(PlanTemplate).where(PlanTemplate.id == template_id))
    tpl = result.scalar_one_or_none()
    if not tpl:
        raise HTTPException(status_code=404, detail=f"Template {template_id} not found")
    tpl.name = req.name
    tpl.content = req.content
    await session.commit()
    await session.refresh(tpl)
    return PlanTemplateOut(template_id=tpl.id, name=tpl.name, content=tpl.content)


# --- Shared helper ---


async def _execute_with_cycle_filter(
    artifact: SqlArtifact,
    all_artifacts: list[SqlArtifact],
    cycle_id: str,
    session: AsyncSession,
) -> ExecutionResult:
    named = {a.name: a for a in all_artifacts if a.name}
    deps = _resolve_dependencies(artifact, named)
    composed_sql = _build_cte_query(deps, artifact.sql_expression)

    filtered_sql = f"SELECT * FROM ({composed_sql}) AS _result WHERE cycle_id = '{cycle_id}'"
    return await execute_raw_sql(filtered_sql, session)
