import pytest
from httpx import AsyncClient, ASGITransport
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app
from app.services.ssrf_validator import validate_safe_url

def test_ssrf_blocks_private_and_localhost_urls():
    bad_urls = [
        "http://localhost:8000/secret",
        "http://127.0.0.1:8080",
        "http://127.0.1.1",
        "http://10.0.0.5/admin",
        "http://192.168.1.1/router",
        "http://172.16.0.1/internal",
        "http://169.254.169.254/latest/meta-data/",
        "http://metadata.google.internal/computeMetadata/v1/",
        "ftp://example.com/file",
        "file:///etc/passwd",
        "gopher://example.com"
    ]
    for url in bad_urls:
        is_safe, msg = validate_safe_url(url)
        assert not is_safe, f"Expected {url} to be blocked by SSRF validator, but was permitted!"

def test_ssrf_allows_public_https_domains():
    good_urls = [
        "https://example.com",
        "https://httpbin.org",
        "http://example.com"
    ]
    for url in good_urls:
        is_safe, msg = validate_safe_url(url)
        assert is_safe, f"Expected {url} to be safe, but got error: {msg}"

@pytest.mark.asyncio
async def test_explore_endpoint_rejects_ssrf_targets():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/explore", json={
            "url": "http://127.0.0.1:8000/sensitive",
            "max_pages": 1,
            "max_duration_seconds": 10
        })
    assert res.status_code == 400
    assert "SSRF" in res.json()["detail"] or "loopback" in res.json()["detail"].lower()
