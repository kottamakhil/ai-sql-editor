from __future__ import annotations

from pydantic import BaseModel

from schemas.plan import ArtifactOut, ConversationSkillOut, PlanOut


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None
    skill_ids: list[str] | None = None
    file_ids: list[str] | None = None


class ToolCallOut(BaseModel):
    tool_name: str
    arguments: dict
    success: bool
    result_data: dict | None = None
    error: str | None = None


class ClarificationOption(BaseModel):
    value: str
    label: str


class ClarificationQuestion(BaseModel):
    id: str
    question: str
    options: list[ClarificationOption]
    allow_multiple: bool = False
    allow_freetext: bool = False


class MessageOut(BaseModel):
    message_id: str
    role: str
    content: str


class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    composed_sql: str | None = None
    tool_calls: list[ToolCallOut]
    current_artifacts: list[ArtifactOut]
    plan: PlanOut | None = None
    iterations: int = 0
    pending_questions: list[ClarificationQuestion] | None = None


class ConversationOut(BaseModel):
    conversation_id: str
    plan_id: str | None = None
    title: str | None = None
    pending_questions: list[ClarificationQuestion] | None = None
    skills: list[ConversationSkillOut] | None = None
    messages: list[MessageOut]


class ConversationSummaryOut(BaseModel):
    conversation_id: str
    plan_id: str | None = None
    title: str | None = None
    message_count: int


class ChatFileOut(BaseModel):
    file_id: str
    filename: str
    mime_type: str
    size_bytes: int
