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
