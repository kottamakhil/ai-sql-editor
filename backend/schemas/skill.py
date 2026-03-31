from pydantic import BaseModel


class CreateSkillRequest(BaseModel):
    name: str
    content: str


class SkillVersionOut(BaseModel):
    version_id: str
    version: int
    content: str


class SkillOut(BaseModel):
    skill_id: str
    name: str
    content: str
    current_version: int = 1
    versions: list[SkillVersionOut] | None = None
