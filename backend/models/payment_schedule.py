from __future__ import annotations

import datetime

from sqlalchemy import Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, _new_id


class PaymentScheduleConfig(Base):
    __tablename__ = "payment_schedule_configs"
    __table_args__ = (
        UniqueConstraint("employee_id", "name", name="uq_employee_schedule_name"),
    )

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    employee_id: Mapped[str] = mapped_column(String(12), ForeignKey("employees.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    schedule_type: Mapped[str] = mapped_column(String(30), nullable=False)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    frequency: Mapped[str | None] = mapped_column(String(30), nullable=True)
    duration_months: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        default=datetime.datetime.utcnow, nullable=False,
    )

    tranches: Mapped[list["Tranche"]] = relationship(
        back_populates="schedule_config",
        cascade="all, delete-orphan",
        order_by="Tranche.sequence",
    )


class Tranche(Base):
    __tablename__ = "tranches"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    schedule_config_id: Mapped[str] = mapped_column(
        String(12), ForeignKey("payment_schedule_configs.id"), nullable=False,
    )
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)
    amount_pct: Mapped[float] = mapped_column(Float, nullable=False)
    trigger_type: Mapped[str] = mapped_column(String(30), nullable=False)
    trigger_months: Mapped[int | None] = mapped_column(Integer, nullable=True)

    schedule_config: Mapped["PaymentScheduleConfig"] = relationship(back_populates="tranches")
