import datetime

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, _new_id


class Payout(Base):
    __tablename__ = "payouts"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    employee_id: Mapped[str] = mapped_column(String(12), ForeignKey("employees.id"), nullable=False)
    group_id: Mapped[str] = mapped_column(String(120), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    date: Mapped[datetime.date] = mapped_column(nullable=False)
