from __future__ import annotations

import calendar
import datetime

from sqlalchemy import DateTime, Integer, String, Text, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, _new_id


class Plan(Base):
    __tablename__ = "plans"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    plan_type: Mapped[str] = mapped_column(String(20), nullable=False, default="RECURRING")
    frequency: Mapped[str] = mapped_column(String(20), nullable=False, default="QUARTERLY")
    mode: Mapped[str] = mapped_column(String(20), nullable=False, default="AI_ASSISTED")
    start_date: Mapped[datetime.date | None] = mapped_column(nullable=True)
    end_date: Mapped[datetime.date | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    artifacts: Mapped[list["SqlArtifact"]] = relationship(
        back_populates="plan", cascade="all, delete-orphan", order_by="SqlArtifact.created_at"
    )
    cycles: Mapped[list["PlanCycle"]] = relationship(
        back_populates="plan", cascade="all, delete-orphan", order_by="PlanCycle.start_date"
    )
    config: Mapped["PlanConfig | None"] = relationship(
        back_populates="plan", uselist=False, cascade="all, delete-orphan"
    )
    inferred_config: Mapped["PlanInferredConfig | None"] = relationship(
        back_populates="plan", uselist=False, cascade="all, delete-orphan"
    )


class PlanConfig(Base):
    __tablename__ = "plan_configs"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    plan_id: Mapped[str] = mapped_column(String(12), ForeignKey("plans.id"), nullable=False, unique=True)

    is_automatic_payout_enabled: Mapped[bool] = mapped_column(default=False)
    final_payment_offset: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_draws_enabled: Mapped[bool] = mapped_column(default=False)
    draw_frequency: Mapped[str | None] = mapped_column(String(20), nullable=True)

    payout_type: Mapped[str | None] = mapped_column(String(20), nullable=True)

    is_disputes_enabled: Mapped[bool] = mapped_column(default=True)

    plan: Mapped["Plan"] = relationship(back_populates="config")

    def to_dict(self) -> dict:
        return {
            "payout": {
                "is_automatic_payout_enabled": self.is_automatic_payout_enabled,
                "final_payment_offset": self.final_payment_offset,
                "is_draws_enabled": self.is_draws_enabled,
                "draw_frequency": self.draw_frequency,
            },
            "payroll": {
                "payout_type": self.payout_type,
            },
            "disputes": {
                "is_disputes_enabled": self.is_disputes_enabled,
            },
        }


class PlanInferredConfig(Base):
    __tablename__ = "plan_inferred_configs"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    plan_id: Mapped[str] = mapped_column(String(12), ForeignKey("plans.id"), nullable=False, unique=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    plan: Mapped["Plan"] = relationship(back_populates="inferred_config")


class PlanCycle(Base):
    __tablename__ = "plan_cycles"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    plan_id: Mapped[str] = mapped_column(String(12), ForeignKey("plans.id"), nullable=False)
    period_name: Mapped[str] = mapped_column(String(50), nullable=False)
    start_date: Mapped[datetime.date] = mapped_column(nullable=False)
    end_date: Mapped[datetime.date] = mapped_column(nullable=False)

    plan: Mapped["Plan"] = relationship(back_populates="cycles")


class SqlArtifact(Base):
    __tablename__ = "sql_artifacts"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    plan_id: Mapped[str] = mapped_column(String(12), ForeignKey("plans.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    sql_expression: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    plan: Mapped["Plan"] = relationship(back_populates="artifacts")


class PlanTemplate(Base):
    __tablename__ = "plan_templates"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )


def generate_cycles(
    plan_id: str,
    frequency: str,
    start_date: datetime.date,
    end_date: datetime.date,
) -> list[PlanCycle]:
    cycles = []
    current = start_date
    freq = frequency.upper()

    while current <= end_date:
        if freq == "MONTHLY":
            last_day = calendar.monthrange(current.year, current.month)[1]
            cycle_end = min(datetime.date(current.year, current.month, last_day), end_date)
            name = current.strftime("%B %Y")
            next_start = datetime.date(current.year + (current.month // 12), (current.month % 12) + 1, 1)
        elif freq == "QUARTERLY":
            quarter = (current.month - 1) // 3 + 1
            quarter_end_month = quarter * 3
            last_day = calendar.monthrange(current.year, quarter_end_month)[1]
            cycle_end = min(datetime.date(current.year, quarter_end_month, last_day), end_date)
            name = f"Q{quarter} {current.year}"
            next_month = quarter_end_month + 1
            next_start = datetime.date(current.year + (next_month - 1) // 12, ((next_month - 1) % 12) + 1, 1)
        elif freq == "ANNUALLY":
            cycle_end = min(datetime.date(current.year, 12, 31), end_date)
            name = str(current.year)
            next_start = datetime.date(current.year + 1, 1, 1)
        else:
            cycles.append(PlanCycle(plan_id=plan_id, period_name="Full Period", start_date=start_date, end_date=end_date))
            break

        cycles.append(PlanCycle(plan_id=plan_id, period_name=name, start_date=current, end_date=cycle_end))
        current = next_start

    return cycles


def default_config_dict() -> dict:
    return {
        "payout": {
            "is_automatic_payout_enabled": False,
            "final_payment_offset": None,
            "is_draws_enabled": False,
            "draw_frequency": None,
        },
        "payroll": {
            "payout_type": None,
        },
        "disputes": {
            "is_disputes_enabled": True,
        },
    }
