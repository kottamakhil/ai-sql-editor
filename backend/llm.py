import logging
import os

from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionMessage

log = logging.getLogger(__name__)

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.4")

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI()
    return _client


async def call_openai_with_tools(
    messages: list[dict],
    tools: list[dict],
) -> ChatCompletionMessage:
    kwargs: dict = {
        "model": OPENAI_MODEL,
        "messages": messages,
        "temperature": 0.2,
    }
    if tools:
        kwargs["tools"] = tools

    response = await _get_client().chat.completions.create(**kwargs)
    return response.choices[0].message
