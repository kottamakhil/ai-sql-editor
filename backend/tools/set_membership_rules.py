import logging

from tools.base import BaseTool, ToolContext, ToolResult

log = logging.getLogger(__name__)


class SetMembershipRulesTool(BaseTool):
    @property
    def name(self) -> str:
        return "set_membership_rules"

    @property
    def description(self) -> str:
        return (
            "Set the membership rules for the current plan, defining which employees "
            "are eligible. Extract rules from the user's description of who the plan "
            "applies to (e.g. 'Sales department Account Executives except SDRs'). "
            "Available fields: department, role, country."
        )

    @property
    def parameters_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "match_type": {
                    "type": "string",
                    "enum": ["all", "any"],
                    "description": "'all' = employee must match every rule (AND), 'any' = at least one rule (OR)",
                },
                "rules": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "field": {
                                "type": "string",
                                "enum": ["department", "role", "country"],
                            },
                            "values": {
                                "type": "array",
                                "items": {"type": "string"},
                            },
                        },
                        "required": ["field", "values"],
                    },
                    "description": "Inclusion rules. Each rule specifies a field and acceptable values.",
                },
                "exceptions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "field": {
                                "type": "string",
                                "enum": ["department", "role", "country"],
                            },
                            "values": {
                                "type": "array",
                                "items": {"type": "string"},
                            },
                        },
                        "required": ["field", "values"],
                    },
                    "description": "Exception rules. Employees matching these are excluded.",
                },
            },
            "required": ["match_type", "rules"],
        }

    async def execute(self, arguments: dict, context: ToolContext) -> ToolResult:
        match_type = arguments.get("match_type", "all")
        rules = arguments.get("rules", [])
        exceptions = arguments.get("exceptions", [])

        if not rules:
            return ToolResult(success=False, error="At least one rule is required")

        result = await context.plan_service.set_membership_rules(
            match_type=match_type, rules=rules, exceptions=exceptions,
        )
        log.info("Set membership rules: %s", result)
        return ToolResult(success=True, data={"membership": result})
