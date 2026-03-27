from __future__ import annotations

import logging

from tools.base import BaseTool

log = logging.getLogger(__name__)


class ToolRegistry:
    def __init__(self) -> None:
        self._tools: dict[str, BaseTool] = {}

    def register(self, tool: BaseTool) -> None:
        log.info("Registered tool: %s", tool.name)
        self._tools[tool.name] = tool

    def get(self, name: str) -> BaseTool:
        if name not in self._tools:
            raise KeyError(f"Unknown tool: {name}")
        return self._tools[name]

    def openai_tool_definitions(self) -> list[dict]:
        return [tool.openai_function_def() for tool in self._tools.values()]


registry = ToolRegistry()


def _register_all() -> None:
    from tools.ask_clarification import AskClarificationTool
    from tools.create_plan import CreatePlanTool
    from tools.execute_query import ExecuteQueryTool
    from tools.infer_plan_config import InferPlanConfigTool
    from tools.update_plan import UpdatePlanTool
    from tools.update_plan_config import UpdatePlanConfigTool
    from tools.update_sql_artifacts import UpdateSqlArtifactsTool
    from tools.validate_sql import ValidateSqlTool

    registry.register(CreatePlanTool())
    registry.register(UpdateSqlArtifactsTool())
    registry.register(UpdatePlanTool())
    registry.register(UpdatePlanConfigTool())
    registry.register(InferPlanConfigTool())
    registry.register(ExecuteQueryTool())
    registry.register(ValidateSqlTool())
    registry.register(AskClarificationTool())


_register_all()
