"""Chat agent tests: session-based chat, plan creation via tool, multi-turn, rename,
data exploration, modify, parallel tools, conversation history, preview.

Requires a running server with OPENAI_API_KEY set.
"""

from __future__ import annotations

import pytest


@pytest.fixture
def client(live_client):
    return live_client


class TestCreatePlanFromPrompt:
    """First chat turn: LLM should create a plan and artifacts from a prompt."""

    @pytest.fixture(autouse=True)
    async def _setup(self, client):
        resp = await client.post("/api/chat", json={
            "message": "Create a quarterly commission plan called Q1 Sales with 10% on all closed-won deals over 50000",
        })
        assert resp.status_code == 200
        self.data = resp.json()
        self.conv_id = self.data["conversation_id"]
        self.plan = self.data.get("plan")
        self.client = client

    def test_conversation_created(self):
        assert self.conv_id

    def test_plan_created(self):
        assert self.plan is not None
        assert self.plan["plan_id"]

    def test_artifacts_created(self):
        assert len(self.data["current_artifacts"]) >= 1

    def test_tool_calls_present(self):
        assert len(self.data["tool_calls"]) >= 1

    def test_create_plan_tool_called(self):
        tool_names = [tc["tool_name"] for tc in self.data["tool_calls"]]
        assert "create_plan" in tool_names

    def test_composed_sql_present(self):
        assert self.data.get("composed_sql")

    async def test_plan_persisted_in_db(self):
        resp = await self.client.get(f"/api/plans/{self.plan['plan_id']}")
        assert resp.status_code == 200
        assert len(resp.json()["artifacts"]) >= 1


class TestMultiTurnChat:
    """Multi-turn conversation: rename, explore, modify, parallel tools."""

    @pytest.fixture(autouse=True)
    async def _setup(self, client):
        resp = await client.post("/api/chat", json={
            "message": "Create a quarterly 10% commission plan called Test Plan on closed-won deals over 50000",
        })
        assert resp.status_code == 200
        data = resp.json()
        self.conv_id = data["conversation_id"]
        self.plan_id = data["plan"]["plan_id"]
        self.client = client

    async def test_rename_plan(self):
        resp = await self.client.post("/api/chat", json={
            "conversation_id": self.conv_id,
            "message": "Rename this plan to Q2 Sales Commissions",
        })
        assert resp.status_code == 200
        data = resp.json()
        tool_names = [tc["tool_name"] for tc in data["tool_calls"]]
        assert "update_plan" in tool_names

        db_resp = await self.client.get(f"/api/plans/{self.plan_id}")
        assert "Q2" in db_resp.json()["name"]

    async def test_data_exploration(self):
        resp = await self.client.post("/api/chat", json={
            "conversation_id": self.conv_id,
            "message": "How many closed-won deals are there? Run a query to find out.",
        })
        assert resp.status_code == 200
        data = resp.json()
        tool_names = [tc["tool_name"] for tc in data["tool_calls"]]
        assert "execute_query" in tool_names or len(data["tool_calls"]) == 0

    async def test_modify_commission(self):
        resp = await self.client.post("/api/chat", json={
            "conversation_id": self.conv_id,
            "message": "Change the commission rate to 15% and remove the 50k deal threshold",
        })
        assert resp.status_code == 200
        assert len(resp.json()["current_artifacts"]) >= 1

    async def test_parallel_tools(self):
        resp = await self.client.post("/api/chat", json={
            "conversation_id": self.conv_id,
            "message": "Rename this plan to Q3 Plan and add a 2x accelerator for deals over 100k",
        })
        assert resp.status_code == 200
        tool_names = {tc["tool_name"] for tc in resp.json()["tool_calls"]}
        assert len(tool_names) >= 1


class TestConversationAndPreview:
    """Conversation history and plan preview."""

    @pytest.fixture(autouse=True)
    async def _setup(self, client):
        resp1 = await client.post("/api/chat", json={
            "message": "Create a quarterly commission plan called Preview Test with 10% on all closed-won deals over 50000",
        })
        data1 = resp1.json()
        self.conv_id = data1["conversation_id"]
        assert data1.get("plan") is not None, "LLM did not create a plan"
        self.plan_id = data1["plan"]["plan_id"]
        self.client = client

        await client.post("/api/chat", json={
            "conversation_id": self.conv_id,
            "message": "Change the commission rate to 15%",
        })

    async def test_conversation_history(self):
        resp = await self.client.get(f"/api/conversations/{self.conv_id}")
        assert resp.status_code == 200
        messages = resp.json()["messages"]
        assert len(messages) >= 4

    async def test_plan_preview(self):
        resp = await self.client.get(f"/api/plans/{self.plan_id}/preview")
        assert resp.status_code == 200
        assert resp.json().get("composed_sql")

    async def test_list_conversations(self):
        resp = await self.client.get(f"/api/plans/{self.plan_id}/conversations")
        assert resp.status_code == 200
        assert len(resp.json()) >= 1
