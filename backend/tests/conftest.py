"""Shared fixtures for both unit and integration tests."""

from __future__ import annotations

import os

import httpx
import pytest
from httpx import ASGITransport

BASE_URL = os.getenv("TEST_BASE_URL", "http://localhost:8000")


LLM_TIMEOUT = httpx.Timeout(60.0, connect=10.0)


@pytest.fixture
def live_client() -> httpx.AsyncClient:
    """Client that talks to a running server (integration tests)."""
    return httpx.AsyncClient(base_url=BASE_URL, timeout=LLM_TIMEOUT)


@pytest.fixture
def app_client() -> httpx.AsyncClient:
    """Client that talks to the FastAPI app in-process (unit tests)."""
    from main import app

    transport = ASGITransport(app=app)
    return httpx.AsyncClient(transport=transport, base_url="http://test", timeout=LLM_TIMEOUT)
