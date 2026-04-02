import datetime
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Employee, Payout
from schemas.payout import (
    CreatePayoutRequest,
    EmployeePayoutsOut,
    ObligationEmployeeOut,
    ObligationPayoutOut,
    ObligationSummaryOut,
    PaymentObligationsOut,
    PayoutGroupOut,
    PayoutOut,
)

router = APIRouter()


def _infer_status(payout_date: datetime.date) -> str:
    return "paid" if payout_date <= datetime.date.today() else "scheduled"


def _payout_to_out(p: Payout) -> PayoutOut:
    return PayoutOut(
        payout_id=p.id,
        employee_id=p.employee_id,
        group_id=p.group_id,
        amount=p.amount,
        date=p.date,
        status=_infer_status(p.date),
    )


@router.post("/payouts", response_model=PayoutOut, status_code=201)
async def create_payout(req: CreatePayoutRequest, session: AsyncSession = Depends(get_db)):
    emp_exists = await session.execute(select(Employee.id).where(Employee.id == req.employee_id))
    if emp_exists.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail=f"Employee {req.employee_id} not found")

    payout = Payout(
        employee_id=req.employee_id,
        group_id=req.group_id,
        amount=req.amount,
        date=req.date,
    )
    session.add(payout)
    await session.commit()
    await session.refresh(payout)
    return _payout_to_out(payout)


@router.get("/payouts", response_model=list[PayoutOut])
async def list_payouts(
    employee_id: str | None = None,
    group_id: str | None = None,
    session: AsyncSession = Depends(get_db),
):
    stmt = select(Payout).order_by(Payout.date)
    if employee_id:
        stmt = stmt.where(Payout.employee_id == employee_id)
    if group_id:
        stmt = stmt.where(Payout.group_id == group_id)
    result = await session.execute(stmt)
    return [_payout_to_out(p) for p in result.scalars()]


@router.get("/payment-obligations", response_model=PaymentObligationsOut)
async def get_payment_obligations(session: AsyncSession = Depends(get_db)):
    emp_result = await session.execute(select(Employee).order_by(Employee.name))
    all_employees = list(emp_result.scalars())

    payout_result = await session.execute(select(Payout).order_by(Payout.date))
    all_payouts = list(payout_result.scalars())

    by_employee: dict[str, list[Payout]] = defaultdict(list)
    for p in all_payouts:
        by_employee[p.employee_id].append(p)

    total_outstanding = 0.0
    total_paid = 0.0
    scheduled_count = 0
    paid_count = 0
    employees_out: list[ObligationEmployeeOut] = []

    for emp in all_employees:
        payouts = by_employee.get(emp.id, [])
        if not payouts:
            continue

        emp_outstanding = 0.0
        emp_paid = 0.0
        payout_items: list[ObligationPayoutOut] = []

        for p in payouts:
            status = _infer_status(p.date)
            if status == "paid":
                emp_paid += p.amount
                paid_count += 1
            else:
                emp_outstanding += p.amount
                scheduled_count += 1
            payout_items.append(ObligationPayoutOut(
                payout_id=p.id, group_id=p.group_id,
                amount=p.amount, date=p.date, status=status,
            ))

        total_outstanding += emp_outstanding
        total_paid += emp_paid

        employees_out.append(ObligationEmployeeOut(
            employee_id=emp.id, name=emp.name, role=emp.role,
            department=emp.department, obligation_count=len(payouts),
            outstanding=emp_outstanding, paid=emp_paid, payouts=payout_items,
        ))

    return PaymentObligationsOut(
        summary=ObligationSummaryOut(
            total_outstanding=total_outstanding, total_paid=total_paid,
            scheduled_count=scheduled_count, paid_count=paid_count,
        ),
        employees=employees_out,
    )


@router.get("/employees/{employee_id}/payouts", response_model=EmployeePayoutsOut)
async def get_employee_payouts(employee_id: str, session: AsyncSession = Depends(get_db)):
    emp_exists = await session.execute(select(Employee.id).where(Employee.id == employee_id))
    if emp_exists.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail=f"Employee {employee_id} not found")

    result = await session.execute(
        select(Payout).where(Payout.employee_id == employee_id).order_by(Payout.date)
    )

    grouped: dict[str, list[Payout]] = defaultdict(list)
    for p in result.scalars():
        grouped[p.group_id].append(p)

    groups = {}
    for gid, payouts in grouped.items():
        payout_outs = [_payout_to_out(p) for p in payouts]
        groups[gid] = PayoutGroupOut(
            payouts=payout_outs,
            total=sum(p.amount for p in payout_outs),
        )

    return EmployeePayoutsOut(employee_id=employee_id, groups=groups)
