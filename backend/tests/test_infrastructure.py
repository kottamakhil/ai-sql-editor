"""Infrastructure tests: health, schema, seed data, plan CRUD, artifacts, skills.

Run against a live server:  pytest tests/test_infrastructure.py
Run in-process:             pytest tests/test_infrastructure.py --in-process
"""

from __future__ import annotations

import pytest


@pytest.fixture
def client(live_client):
    return live_client


class TestHealthAndSchema:
    async def test_health_check(self, client):
        resp = await client.get("/ping")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"

    async def test_schema_returns_3_tables(self, client):
        resp = await client.get("/api/schema")
        assert resp.status_code == 200
        tables = resp.json()["tables"]
        assert len(tables) >= 3

    async def test_seed_data_employees(self, client):
        resp = await client.post("/api/execute", json={"sql_expression": "SELECT COUNT(*) FROM employees"})
        assert resp.status_code == 200
        assert resp.json()["rows"][0][0] >= 1

    async def test_seed_data_deals(self, client):
        resp = await client.post("/api/execute", json={"sql_expression": "SELECT COUNT(*) FROM deals"})
        assert resp.status_code == 200
        assert resp.json()["rows"][0][0] >= 1


class TestPlanCRUD:
    async def test_create_plan(self, client):
        resp = await client.post("/api/plans", json={
            "name": "Pytest Plan", "plan_type": "RECURRING", "frequency": "QUARTERLY",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["plan_id"]
        assert data["name"] == "Pytest Plan"

    async def test_get_plan(self, client):
        create = await client.post("/api/plans", json={"name": "Get Test", "plan_type": "RECURRING", "frequency": "QUARTERLY"})
        plan_id = create.json()["plan_id"]

        resp = await client.get(f"/api/plans/{plan_id}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Get Test"

    async def test_list_plans(self, client):
        resp = await client.get("/api/plans")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_update_plan(self, client):
        create = await client.post("/api/plans", json={"name": "Before", "plan_type": "RECURRING", "frequency": "QUARTERLY"})
        plan_id = create.json()["plan_id"]

        resp = await client.patch(f"/api/plans/{plan_id}", json={"name": "After"})
        assert resp.status_code == 200
        assert resp.json()["name"] == "After"


class TestArtifactCRUD:
    async def test_create_and_execute_artifact(self, client):
        plan = await client.post("/api/plans", json={"name": "Art Plan", "plan_type": "RECURRING", "frequency": "QUARTERLY"})
        plan_id = plan.json()["plan_id"]

        art = await client.post(f"/api/plans/{plan_id}/artifacts", json={
            "name": "test_cte", "sql_expression": "SELECT 1 AS val",
        })
        assert art.status_code == 200
        art_id = art.json()["artifact_id"]

        exec_resp = await client.post("/api/execute", json={"artifact_id": art_id})
        assert exec_resp.status_code == 200
        assert exec_resp.json().get("error") is None

    async def test_delete_artifact(self, client):
        plan = await client.post("/api/plans", json={"name": "Del Plan", "plan_type": "RECURRING", "frequency": "QUARTERLY"})
        plan_id = plan.json()["plan_id"]

        art = await client.post(f"/api/plans/{plan_id}/artifacts", json={
            "name": "to_delete", "sql_expression": "SELECT 1",
        })
        art_id = art.json()["artifact_id"]

        resp = await client.delete(f"/api/artifacts/{art_id}")
        assert resp.status_code == 204


class TestSkillsCRUD:
    async def test_create_and_get_skill(self, client):
        create = await client.post("/api/skills", json={"name": "test_skill", "content": "Test"})
        assert create.status_code == 200
        skill_id = create.json()["skill_id"]

        get = await client.get(f"/api/skills/{skill_id}")
        assert get.status_code == 200
        assert get.json()["name"] == "test_skill"

    async def test_list_skills(self, client):
        resp = await client.get("/api/skills")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_update_skill(self, client):
        create = await client.post("/api/skills", json={"name": "old_name", "content": "old"})
        skill_id = create.json()["skill_id"]

        resp = await client.put(f"/api/skills/{skill_id}", json={"name": "new_name", "content": "new"})
        assert resp.status_code == 200
        assert resp.json()["name"] == "new_name"
