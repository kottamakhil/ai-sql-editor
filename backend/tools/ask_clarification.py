"""Tool for asking structured clarification questions when the user's request is ambiguous."""

import logging

from tools.base import BaseTool, ToolContext, ToolResult

log = logging.getLogger(__name__)

CLARIFICATION_TOOL_NAME = "ask_clarification"


class AskClarificationTool(BaseTool):
    @property
    def name(self) -> str:
        return CLARIFICATION_TOOL_NAME

    @property
    def description(self) -> str:
        return (
            "Ask the user clarification questions when the request is ambiguous "
            "or missing critical details like commission rate, deal filters, or thresholds. "
            "Returns structured questions with predefined options for the user to choose from."
        )

    @property
    def parameters_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "questions": {
                    "type": "array",
                    "description": "List of clarification questions to ask the user",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {
                                "type": "string",
                                "description": "Unique identifier for this question (e.g. 'rate', 'deal_filter')",
                            },
                            "question": {
                                "type": "string",
                                "description": "The question text to display to the user",
                            },
                            "options": {
                                "type": "array",
                                "description": "Predefined answer choices",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "value": {"type": "string"},
                                        "label": {"type": "string"},
                                    },
                                    "required": ["value", "label"],
                                },
                            },
                            "allow_multiple": {
                                "type": "boolean",
                                "default": False,
                                "description": "Whether the user can select multiple options",
                            },
                            "allow_freetext": {
                                "type": "boolean",
                                "default": False,
                                "description": "Whether the user can type a custom answer",
                            },
                        },
                        "required": ["id", "question", "options"],
                    },
                },
            },
            "required": ["questions"],
        }

    async def execute(self, arguments: dict, context: ToolContext) -> ToolResult:
        """No-op on the backend. Questions are captured by the agent loop and returned to the FE."""

        questions = arguments.get("questions", [])
        if not questions:
            return ToolResult(success=False, error="No questions provided")

        log.info("Clarification requested: %d question(s)", len(questions))
        return ToolResult(success=True, data={"questions": questions})
