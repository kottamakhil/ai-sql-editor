from __future__ import annotations

import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, LargeBinary, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, _new_id

_MESSAGE_ROLE_MAX = 20


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
    __tablename__ = "conversation_skill_versions"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    conversation_id: Mapped[str] = mapped_column(
        String(12), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False
    )
    skill_version_id: Mapped[str] = mapped_column(
        String(12), ForeignKey("skill_versions.id"), nullable=False
    )


class ChatFile(Base):
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
