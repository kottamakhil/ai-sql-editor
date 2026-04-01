from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.payment_schedule import PaymentScheduleConfig
from schemas.payment_schedule import (
    CreateScheduleRequest,
    ScheduleConfigOut,
    ScheduleWithPayoutsOut,
    TrancheOut,
)
from services.payment_schedule_service import PaymentScheduleService

router = APIRouter()


def _config_to_out(config: PaymentScheduleConfig) -> ScheduleConfigOut:
    return ScheduleConfigOut(
        config_id=config.id,
        employee_id=config.employee_id,
        name=config.name,
        schedule_type=config.schedule_type,
        total_amount=config.total_amount,
        frequency=config.frequency,
        duration_months=config.duration_months,
        created_at=config.created_at,
        tranches=[
            TrancheOut(
                tranche_id=t.id,
                sequence=t.sequence,
                amount_pct=t.amount_pct,
                amount=round(config.total_amount * t.amount_pct / 100.0, 2),
                trigger_type=t.trigger_type,
                trigger_months=t.trigger_months,
            )
            for t in config.tranches
        ],
    )


@router.post("/payment-schedules", response_model=ScheduleWithPayoutsOut, status_code=201)
async def create_payment_schedule(
    req: CreateScheduleRequest,
    session: AsyncSession = Depends(get_db),
):
    svc = PaymentScheduleService(session)
    try:
        config, payouts = await svc.create_schedule(
            employee_id=req.employee_id,
            name=req.name,
            schedule_type=req.schedule_type,
            total_amount=req.total_amount,
            frequency=req.frequency,
            duration_months=req.duration_months,
            effective_date=req.effective_date,
            tranches=[t.model_dump() for t in req.tranches] if req.tranches else None,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return ScheduleWithPayoutsOut(
        config=_config_to_out(config),
        payouts_generated=len(payouts),
    )


@router.get(
    "/employees/{employee_id}/payment-schedules",
    response_model=list[ScheduleConfigOut],
)
async def list_employee_schedules(
    employee_id: str,
    session: AsyncSession = Depends(get_db),
):
    svc = PaymentScheduleService(session)
    configs = await svc.list_schedules(employee_id)
    return [_config_to_out(c) for c in configs]


@router.get("/payment-schedules/{config_id}", response_model=ScheduleConfigOut)
async def get_payment_schedule(
    config_id: str,
    session: AsyncSession = Depends(get_db),
):
    svc = PaymentScheduleService(session)
    config = await svc.get_schedule(config_id)
    if not config:
        raise HTTPException(status_code=404, detail=f"Schedule {config_id} not found")
    return _config_to_out(config)
