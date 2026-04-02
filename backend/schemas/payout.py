import datetime

from pydantic import BaseModel


class CreatePayoutRequest(BaseModel):
    employee_id: str
    group_id: str
    amount: float
    date: datetime.date


class PayoutOut(BaseModel):
    payout_id: str
    employee_id: str
    group_id: str
    amount: float
    date: datetime.date
    status: str


class PayoutGroupOut(BaseModel):
    payouts: list[PayoutOut]
    total: float


class EmployeePayoutsOut(BaseModel):
    employee_id: str
    groups: dict[str, PayoutGroupOut]


class ObligationPayoutOut(BaseModel):
    payout_id: str
    group_id: str
    amount: float
    date: datetime.date
    status: str


class ObligationEmployeeOut(BaseModel):
    employee_id: str
    name: str
    role: str
    department: str
    obligation_count: int
    outstanding: float
    paid: float
    payouts: list[ObligationPayoutOut]


class ObligationSummaryOut(BaseModel):
    total_outstanding: float
    total_paid: float
    scheduled_count: int
    paid_count: int


class PaymentObligationsOut(BaseModel):
    summary: ObligationSummaryOut
    employees: list[ObligationEmployeeOut]
