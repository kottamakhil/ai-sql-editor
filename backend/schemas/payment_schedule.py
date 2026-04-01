import datetime
from typing import Literal

from pydantic import BaseModel, model_validator


class TrancheInput(BaseModel):
    amount_pct: float
    trigger_type: Literal["next_payroll_run", "months_after_start"]
    trigger_months: int | None = None

    @model_validator(mode="after")
    def validate_trigger(self) -> "TrancheInput":
        if self.trigger_type == "months_after_start" and self.trigger_months is None:
            raise ValueError("trigger_months is required when trigger_type is months_after_start")
        return self


class CreateScheduleRequest(BaseModel):
    employee_id: str
    name: str
    schedule_type: Literal["lump_sum", "installments", "recurring"]
    total_amount: float
    frequency: Literal["monthly", "quarterly", "annually"] | None = None
    duration_months: int | None = None
    effective_date: datetime.date | None = None
    tranches: list[TrancheInput] | None = None

    @model_validator(mode="after")
    def validate_schedule(self) -> "CreateScheduleRequest":
        if self.schedule_type == "recurring":
            if not self.frequency:
                raise ValueError("frequency is required for recurring schedules")
            if not self.duration_months:
                raise ValueError("duration_months is required for recurring schedules")
        if self.schedule_type == "installments":
            if not self.tranches or len(self.tranches) < 2:
                raise ValueError("installments requires at least 2 tranches")
        if self.schedule_type == "lump_sum" and self.tranches and len(self.tranches) > 1:
            raise ValueError("lump_sum supports at most 1 tranche")
        return self


class TrancheOut(BaseModel):
    tranche_id: str
    sequence: int
    amount_pct: float
    amount: float
    trigger_type: str
    trigger_months: int | None


class ScheduleConfigOut(BaseModel):
    config_id: str
    employee_id: str
    name: str
    schedule_type: str
    total_amount: float
    frequency: str | None
    duration_months: int | None
    created_at: datetime.datetime
    tranches: list[TrancheOut]


class ScheduleWithPayoutsOut(BaseModel):
    config: ScheduleConfigOut
    payouts_generated: int
