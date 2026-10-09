import pytest
from httpx import AsyncClient, ASGITransport
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app

@pytest.mark.asyncio
async def test_report_lifecycle_creation_retrieval_and_deletion():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Trigger code analysis to create a report
        res_create = await ac.post("/api/analyze-code", json={
            "code_type": "js",
            "js_code": "function sample() { document.write('test'); }"
        })
        assert res_create.status_code == 200
        analysis_id = res_create.json()["analysis_id"]

        # 2. List reports and verify it appears
        res_list = await ac.get("/api/reports")
        assert res_list.status_code == 200
        reports = res_list.json()
        assert any(r["id"] == analysis_id for r in reports)

        # 3. Retrieve specific report details
        res_detail = await ac.get(f"/api/reports/{analysis_id}")
        assert res_detail.status_code == 200
        detail = res_detail.json()
        assert detail["id"] == analysis_id
        assert "findings" in detail
        assert len(detail["findings"]) > 0

        # 4. Delete the report
        res_del = await ac.delete(f"/api/reports/{analysis_id}")
        assert res_del.status_code == 200
        assert res_del.json()["deleted"] is True

        # 5. Verify 404 on subsequent retrieval
        res_get_deleted = await ac.get(f"/api/reports/{analysis_id}")
        assert res_get_deleted.status_code == 404
