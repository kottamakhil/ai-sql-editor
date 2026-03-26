from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from models import Plan, Skill, SqlArtifact

log = logging.getLogger(__name__)


@dataclass
class ToolContext:
    session: AsyncSession
    plan: Plan
    artifacts: list[SqlArtifact]
    skills: list[Skill]
    schema_ddls: list[str]

    async def reload_artifacts(self) -> None:
        from sqlalchemy import select

        result = await self.session.execute(
            select(SqlArtifact)
            .where(SqlArtifact.plan_id == self.plan.id)
            .order_by(SqlArtifact.created_at)
        )
        self.artifacts = list(result.scalars())

    async def reload_plan(self) -> None:
        await self.session.refresh(self.plan)


@dataclass
class ToolResult:
    success: bool
    data: dict[str, Any] = field(default_factory=dict)
    error: str | None = None

    def to_message(self) -> str:
        import json

        if self.error:
            return json.dumps({"success": False, "error": self.error})
        return json.dumps({"success": True, **self.data})


class BaseTool(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        ...

    @property
    @abstractmethod
    def description(self) -> str:
        ...

    @property
    @abstractmethod
    def parameters_schema(self) -> dict:
        ...

    @abstractmethod
    async def execute(self, arguments: dict, context: ToolContext) -> ToolResult:
        ...

    def openai_function_def(self) -> dict:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters_schema,
            },
        }
