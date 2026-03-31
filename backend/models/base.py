import uuid

from sqlalchemy.orm import DeclarativeBase


def _new_id() -> str:
    return uuid.uuid4().hex[:12]


class Base(DeclarativeBase):
    pass
