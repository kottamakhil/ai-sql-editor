"""Base classes for the tool system.

These are portable across storage backends. Tools depend only on
PlanServiceBase (an ABC), never on ORM models or database sessions.
"""

from __future__ import annotations

import json
import logging
from abc import ABC, abstractmethod
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from typing import Any

from services.plan_service import PlanServiceBase

log = logging.getLogger(__name__)

ProgressCallback = Callable[[dict[str, Any]], Awaitable[None]]


@dataclass
class ToolContext:
    """Shared state passed to every tool during an agent loop iteration."""

    plan_service: PlanServiceBase
    skills: list[dict]
    schema_ddls: list[str]
    on_progress: ProgressCallback | None = None


@dataclass
class ToolResult:
    """Structured result returned by a tool execution."""

    success: bool
    data: dict[str, Any] = field(default_factory=dict)
    error: str | None = None

    def to_message(self) -> str:
        """Serialize for inclusion in the OpenAI tool response message."""
        if self.error:
            return json.dumps({"success": False, "error": self.error})
        return json.dumps({"success": True, **self.data})


class BaseTool(ABC):
    """Protocol for all tools. Implement name, description, parameters_schema, and execute."""

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
        """Return the OpenAI function calling schema for this tool."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters_schema,
            },
        }
