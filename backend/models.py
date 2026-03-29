import datetime
import uuid

from sqlalchemy import DateTime, Float, ForeignKey, Integer, LargeBinary, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

_MESSAGE_ROLE_MAX = 20


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
    """1:1 plan configuration matching production PayoutConfig + VCPayrollConfig + DisputeConfig."""
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
        """Serialize to the nested dict structure matching the API response."""
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
    """1:1 table storing the LLM-inferred plan configuration YAML."""
    __tablename__ = "plan_inferred_configs"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    plan_id: Mapped[str] = mapped_column(String(12), ForeignKey("plans.id"), nullable=False, unique=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    plan: Mapped["Plan"] = relationship(back_populates="inferred_config")


class PlanCycle(Base):
    """A time period within a plan, auto-generated from plan frequency and dates."""
    __tablename__ = "plan_cycles"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    plan_id: Mapped[str] = mapped_column(String(12), ForeignKey("plans.id"), nullable=False)
    period_name: Mapped[str] = mapped_column(String(50), nullable=False)
    start_date: Mapped[datetime.date] = mapped_column(nullable=False)
    end_date: Mapped[datetime.date] = mapped_column(nullable=False)

    plan: Mapped["Plan"] = relationship(back_populates="cycles")


def generate_cycles(
    plan_id: str,
    frequency: str,
    start_date: datetime.date,
    end_date: datetime.date,
) -> list[PlanCycle]:
    """Generate PlanCycle rows from plan frequency and date range."""
    import calendar

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
    """Default config values as a dict."""
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


class PlanTemplate(Base):
    """A reusable YAML/JSON template that defines what the LLM should infer from the conversation."""
    __tablename__ = "plan_templates"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )


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


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    versions: Mapped[list["SkillVersion"]] = relationship(
        back_populates="skill", cascade="all, delete-orphan", order_by="SkillVersion.version"
    )


class SkillVersion(Base):
    __tablename__ = "skill_versions"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    skill_id: Mapped[str] = mapped_column(String(12), ForeignKey("skills.id"), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    skill: Mapped["Skill"] = relationship(back_populates="versions")


class ChatFile(Base):
    """Uploaded file attached to a conversation for multimodal LLM input."""
    __tablename__ = "chat_files"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    conversation_id: Mapped[str | None] = mapped_column(
        String(12), ForeignKey("conversations.id"), nullable=True
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    plan_id: Mapped[str | None] = mapped_column(String(12), ForeignKey("plans.id", ondelete="CASCADE"), nullable=True)
    title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    pending_questions_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    messages: Mapped[list["ConversationMessage"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="ConversationMessage.created_at",
    )
    plan: Mapped["Plan"] = relationship()


class ConversationMessage(Base):
    __tablename__ = "conversation_messages"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    conversation_id: Mapped[str] = mapped_column(
        String(12), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(String(_MESSAGE_ROLE_MAX), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    tool_call_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    tool_calls_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")

    def to_openai_message(self) -> dict:
        msg: dict = {"role": self.role, "content": self.content}
        if self.role == "tool" and self.tool_call_id:
            msg["tool_call_id"] = self.tool_call_id
        if self.role == "assistant" and self.tool_calls_json:
            import json
            msg["tool_calls"] = json.loads(self.tool_calls_json)
        return msg


class ConversationSkillVersion(Base):
    """Pins a conversation to specific skill versions at creation time."""
    __tablename__ = "conversation_skill_versions"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    conversation_id: Mapped[str] = mapped_column(
        String(12), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False
    )
    skill_version_id: Mapped[str] = mapped_column(
        String(12), ForeignKey("skill_versions.id"), nullable=False
    )
