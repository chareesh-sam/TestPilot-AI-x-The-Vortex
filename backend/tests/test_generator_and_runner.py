import pytest
from httpx import AsyncClient, ASGITransport
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app

@pytest.mark.asyncio
async def test_generate_tests_endpoint():
    transport = ASGITransport(app=app)
    sample_obs = [{
        "url": "https://example.com",
        "title": "Example Domain",
        "links": ["https://example.com/more"],
        "buttons": ["Click Me"],
        "inputs": [{"name": "search", "type": "text", "placeholder": "Search..."}],
        "forms": [],
        "console_errors": [],
        "network_failures": [],
        "a11y_issues": []
    }]
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/generate-tests", json={
            "source_type": "exploration",
            "target_url": "https://example.com",
            "observations": sample_obs,
            "findings": []
        })
    assert res.status_code == 200
    data = res.json()
    assert "test_code" in data
    assert "def test_page_loads_successfully" in data["test_code"]
    assert data["test_count"] >= 1

@pytest.mark.asyncio
async def test_run_tests_endpoint_success():
    transport = ASGITransport(app=app)
    passing_code = """
import pytest

def test_arithmetic_assertion():
    assert 2 + 2 == 4

def test_string_membership():
    assert "vortex" in "team_vortex_testing"
"""
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/run-tests", json={
            "test_code": passing_code,
            "timeout_seconds": 15
        })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "COMPLETED"
    assert data["total_tests"] == 2
    assert data["passed_tests"] == 2
    assert data["failed_tests"] == 0

@pytest.mark.asyncio
async def test_run_tests_endpoint_failure_reporting():
    transport = ASGITransport(app=app)
    failing_code = """
import pytest

def test_intentional_failure():
    assert 1 == 2, "Intentional math mismatch for telemetry"
"""
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/run-tests", json={
            "test_code": failing_code,
            "timeout_seconds": 15
        })
    assert res.status_code == 200
    data = res.json()
    assert data["failed_tests"] == 1
    assert len(data["failures"]) > 0
    assert "Intentional math mismatch" in data["failures"][0]["trace"]
