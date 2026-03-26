import datetime
import uuid

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def _new_id() -> str:
    return uuid.uuid4().hex[:12]


class Base(DeclarativeBase):
    pass


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    department: Mapped[str] = mapped_column(String(60), nullable=False)
    role: Mapped[str] = mapped_column(String(60), nullable=False)
    start_date: Mapped[datetime.date] = mapped_column(nullable=False)


class Deal(Base):
    __tablename__ = "deals"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    employee_id: Mapped[str] = mapped_column(String(12), ForeignKey("employees.id"), nullable=False)
    deal_value: Mapped[float] = mapped_column(Float, nullable=False)
    stage: Mapped[str] = mapped_column(String(30), nullable=False)
    closed_date: Mapped[datetime.date | None] = mapped_column(nullable=True)
    region: Mapped[str] = mapped_column(String(30), nullable=False)


class Quota(Base):
    __tablename__ = "quotas"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    employee_id: Mapped[str] = mapped_column(String(12), ForeignKey("employees.id"), nullable=False)
    quarter: Mapped[str] = mapped_column(String(10), nullable=False)
    target_amount: Mapped[float] = mapped_column(Float, nullable=False)
    attainment_pct: Mapped[float] = mapped_column(Float, nullable=False)


class Plan(Base):
    __tablename__ = "plans"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    plan_type: Mapped[str] = mapped_column(String(20), nullable=False, default="RECURRING")
    frequency: Mapped[str] = mapped_column(String(20), nullable=False, default="QUARTERLY")
    mode: Mapped[str] = mapped_column(String(20), nullable=False, default="AI_ASSISTED")
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    artifacts: Mapped[list["SqlArtifact"]] = relationship(
        back_populates="plan", cascade="all, delete-orphan", order_by="SqlArtifact.created_at"
    )


class SqlArtifact(Base):
    __tablename__ = "sql_artifacts"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    plan_id: Mapped[str] = mapped_column(String(12), ForeignKey("plans.id"), nullable=False)
    name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    sql_expression: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    plan: Mapped["Plan"] = relationship(back_populates="artifacts")


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
