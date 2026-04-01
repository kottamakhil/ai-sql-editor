import datetime

from pydantic import BaseModel


class CommissionPayoutOut(BaseModel):
    payout_id: str
    employee_id: str
    amount: float
    date: datetime.date
    group_id: str


class SendToPayrollResponse(BaseModel):
    plan_id: str
    plan_name: str
    cycle_id: str
    cycle_name: str
    payouts_created: int
    payouts: list[CommissionPayoutOut]
