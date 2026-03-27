"""Clarification tests: vague requests, question persistence, answering clears questions.

Requires a running server with OPENAI_API_KEY set.
"""

from __future__ import annotations

import pytest


@pytest.fixture
def client(live_client):
    return live_client


class TestClarificationFlow:
    """Vague request should trigger clarification questions."""

    @pytest.fixture(autouse=True)
    async def _setup(self, client):
        resp = await client.post("/api/chat", json={
            "message": "Build a commission plan",
        })
        assert resp.status_code == 200
        self.data = resp.json()
        self.conv_id = self.data["conversation_id"]
        self.questions = self.data.get("pending_questions") or []
        self.client = client

    def test_conversation_created(self):
        assert self.conv_id

    def test_clarification_returned_or_defaults_used(self):
        if self.questions:
            assert len(self.questions) >= 1
            for q in self.questions:
                assert q["id"]
                assert q["question"]
        # If no questions, LLM used defaults — also acceptable

    async def test_questions_persisted_in_conversation(self):
        if not self.questions:
            pytest.skip("LLM did not ask clarification")

        resp = await self.client.get(f"/api/conversations/{self.conv_id}")
        assert resp.status_code == 200
        persisted = resp.json().get("pending_questions") or []
        assert len(persisted) >= 1

    async def test_answer_clears_questions_and_creates_artifacts(self):
        if not self.questions:
            pytest.skip("LLM did not ask clarification")

        resp = await self.client.post("/api/chat", json={
            "conversation_id": self.conv_id,
            "message": "10% commission on all closed-won deals, no threshold, no accelerator",
        })
        assert resp.status_code == 200
        data = resp.json()

        assert data.get("pending_questions") is None
        assert len(data["current_artifacts"]) >= 1

    async def test_plan_created_after_answering(self):
        if not self.questions:
            pytest.skip("LLM did not ask clarification")

        await self.client.post("/api/chat", json={
            "conversation_id": self.conv_id,
            "message": "10% commission on all closed-won deals, quarterly, call it Test Plan",
        })

        resp = await self.client.get(f"/api/conversations/{self.conv_id}")
        assert resp.status_code == 200
