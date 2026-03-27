"""Abstract interface for plan operations.

Tools call these methods instead of touching the database directly.
Swap the implementation to port across storage backends (SQLAlchemy, Django+Mongo, etc.).
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class PlanServiceBase(ABC):
    """Storage-agnostic interface for plan and artifact operations."""

    @abstractmethod
    async def create_plan(self, name: str, plan_type: str = "RECURRING", frequency: str = "QUARTERLY") -> dict:
        """Create a new plan. Returns dict with plan_id, name, plan_type, frequency."""
        ...

    @abstractmethod
    async def update_plan(self, **fields: Any) -> dict:
        """Update fields on the current plan. Returns updated plan dict."""
        ...

    @abstractmethod
    async def get_plan(self) -> dict | None:
        """Return the current plan as a dict, or None if no plan exists."""
        ...

    @abstractmethod
    async def replace_artifacts(self, specs: list[dict]) -> list[dict]:
        """Delete all artifacts and create new ones from specs [{name, sql}].

        Returns list of dicts with name, sql, row_count, columns, error per artifact.
        """
        ...

    @abstractmethod
    async def get_artifacts(self) -> list[dict]:
        """Return all artifacts for the current plan as dicts."""
        ...

    @abstractmethod
    async def execute_sql(self, sql: str) -> dict:
        """Execute a read-only SQL query. Returns {columns, rows, row_count, error}."""
        ...

    @abstractmethod
    async def validate_sql(self, sql: str) -> dict:
        """Validate SQL without returning data. Returns {valid: bool, error: str|None}."""
        ...
