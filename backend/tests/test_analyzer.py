import pytest
from httpx import AsyncClient, ASGITransport
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app

@pytest.mark.asyncio
async def test_valid_javascript_analysis():
    transport = ASGITransport(app=app)
    valid_js = """
    function calculateTotal(price, taxRate) {
        if (typeof price !== 'number' || typeof taxRate !== 'number') {
            throw new Error('Invalid arguments');
        }
        return price + (price * taxRate);
    }
    """
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/analyze-code", json={
            "code_type": "js",
            "js_code": valid_js
        })
    assert res.status_code == 200
    data = res.json()
    assert data["code_type"] == "js"
    # Should have zero critical syntax errors
    assert not any(f["severity"] == "CRITICAL" for f in data["findings"])

@pytest.mark.asyncio
async def test_invalid_javascript_syntax_detected():
    transport = ASGITransport(app=app)
    # Deliberate syntax error: missing bracket / unexpected token
    invalid_js = """
    function brokenFunction( {
        const x = ;
    }
    """
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/analyze-code", json={
            "code_type": "js",
            "js_code": invalid_js
        })
    assert res.status_code == 200
    data = res.json()
    # If node is available, this flags as critical syntax error
    # Or static fallback flags it
    assert data["summary"]["total_findings"] > 0

@pytest.mark.asyncio
async def test_xss_and_eval_heuristics_detected():
    transport = ASGITransport(app=app)
    vulnerable_js = """
    function render(userInput) {
        document.getElementById('target').innerHTML = userInput;
        eval("var temp = " + userInput);
    }
    """
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/analyze-code", json={
            "code_type": "js",
            "js_code": vulnerable_js
        })
    assert res.status_code == 200
    findings = res.json()["findings"]
    assert any("innerHTML" in f["issue"] for f in findings)
    assert any("eval" in f["issue"].lower() for f in findings)

@pytest.mark.asyncio
async def test_css_syntax_and_responsive_issues():
    transport = ASGITransport(app=app)
    defective_css = """
    .unbalanced-block {
        width: 1400px;
        margin: 20;
    /* missing closing brace and unclosed comment
    """
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/analyze-code", json={
            "code_type": "css",
            "css_code": defective_css
        })
    assert res.status_code == 200
    findings = res.json()["findings"]
    assert any("Unbalanced" in f["issue"] or "Unclosed" in f["issue"] for f in findings)
    assert any("Missing Unit" in f["issue"] for f in findings)
    assert any("Fixed Width" in f["issue"] for f in findings)

@pytest.mark.asyncio
async def test_combined_js_and_css_analysis():
    transport = ASGITransport(app=app)
    js = "document.querySelector('.missing-class').classList.add('active');"
    css = ".existing-class { color: red; }"
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/analyze-code", json={
            "code_type": "both",
            "js_code": js,
            "css_code": css
        })
    assert res.status_code == 200
    data = res.json()
    assert data["code_type"] == "both"
    # Should flag missing class in css
    assert any("missing-class" in f["issue"] for f in data["findings"])
    assert data["generated_tests"] is not None
