from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import Skill, SkillVersion
from schemas.skill import CreateSkillRequest, SkillOut, SkillVersionOut

router = APIRouter()


def _skill_to_out(skill: Skill, include_versions: bool = False) -> SkillOut:
    latest = skill.versions[-1] if skill.versions else None
    out = SkillOut(
        skill_id=skill.id,
        name=skill.name,
        content=latest.content if latest else skill.content,
        current_version=latest.version if latest else 1,
    )
    if include_versions and skill.versions:
        out.versions = [
            SkillVersionOut(version_id=v.id, version=v.version, content=v.content)
            for v in skill.versions
        ]
    return out


@router.post("/skills", response_model=SkillOut)
async def create_skill(req: CreateSkillRequest, session: AsyncSession = Depends(get_db)):
    skill = Skill(name=req.name, content=req.content)
    session.add(skill)
    await session.flush()

    v1 = SkillVersion(skill_id=skill.id, version=1, content=req.content)
    session.add(v1)
    await session.commit()

    result = await session.execute(
        select(Skill).options(selectinload(Skill.versions)).where(Skill.id == skill.id)
    )
    skill = result.scalar_one()
    return _skill_to_out(skill)


@router.get("/skills", response_model=list[SkillOut])
async def list_skills(session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(Skill).options(selectinload(Skill.versions)))
    return [_skill_to_out(s) for s in result.scalars()]


@router.get("/skills/{skill_id}", response_model=SkillOut)
async def get_skill(skill_id: str, session: AsyncSession = Depends(get_db)):
    result = await session.execute(
        select(Skill).options(selectinload(Skill.versions)).where(Skill.id == skill_id)
    )
    skill = result.scalar_one_or_none()
    if not skill:
        raise HTTPException(status_code=404, detail=f"Skill {skill_id} not found")
    return _skill_to_out(skill, include_versions=True)


@router.put("/skills/{skill_id}", response_model=SkillOut)
async def update_skill(skill_id: str, req: CreateSkillRequest, session: AsyncSession = Depends(get_db)):
    result = await session.execute(
        select(Skill).options(selectinload(Skill.versions)).where(Skill.id == skill_id)
    )
    skill = result.scalar_one_or_none()
    if not skill:
        raise HTTPException(status_code=404, detail=f"Skill {skill_id} not found")

    skill.name = req.name
    skill.content = req.content
    next_version = (skill.versions[-1].version + 1) if skill.versions else 1
    session.add(SkillVersion(skill_id=skill.id, version=next_version, content=req.content))
    await session.commit()

    result = await session.execute(
        select(Skill).options(selectinload(Skill.versions)).where(Skill.id == skill.id)
    )
    skill = result.scalar_one()
    return _skill_to_out(skill, include_versions=True)
