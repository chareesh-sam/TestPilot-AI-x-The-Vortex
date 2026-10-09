import uuid
import shutil
from pathlib import Path
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form, Request
from fastapi.responses import FileResponse
from typing import Optional, List

from app.schemas import (
    HealthResponse,
    AnalyzeCodeRequest,
    AnalyzeCodeResponse,
    ExploreRequest,
    ExploreResponse,
    GenerateTestsRequest,
    GenerateTestsResponse,
    RunTestsRequest,
    RunTestsResponse
)
from app.services.analyzer import (
    analyze_javascript,
    analyze_css,
    analyze_combined,
    find_node_executable
)
from app.services.explorer import explore_website
from app.services.generator import (
    generate_playwright_python_tests,
    generate_code_analysis_tests
)
from app.services.runner import run_test_suite_safely
from app.database import (
    save_report,
    get_reports,
    get_report_by_id,
    delete_report,
    SCREENSHOTS_DIR,
    DB_PATH
)

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def get_health():
    node_available = bool(find_node_executable())
    playwright_avail = False
    try:
        import playwright
        playwright_avail = True
    except ImportError:
        pass

    db_status = "connected" if DB_PATH.exists() else "initialized"

    return {
        "status": "healthy",
        "database": db_status,
        "node_available": node_available,
        "playwright_available": playwright_avail,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "2.4.0-HAWKINS"
    }

@router.post("/api/analyze-code", response_model=AnalyzeCodeResponse)
async def analyze_code_endpoint(raw_req: Request):
    content_type = raw_req.headers.get("content-type", "")
    target_type = "both"
    js_content = ""
    css_content = ""

    if "multipart/form-data" in content_type:
        form = await raw_req.form()
        target_type = form.get("code_type", "both")
        file_js = form.get("file_js")
        file_css = form.get("file_css")
        if file_js and hasattr(file_js, "read"):
            js_content = (await file_js.read()).decode("utf-8", errors="replace")
        elif "js_code" in form:
            js_content = str(form.get("js_code"))

        if file_css and hasattr(file_css, "read"):
            css_content = (await file_css.read()).decode("utf-8", errors="replace")
        elif "css_code" in form:
            css_content = str(form.get("css_code"))
    else:
        try:
            body = await raw_req.json()
            target_type = body.get("code_type", "both")
            js_content = body.get("js_code", "") or ""
            css_content = body.get("css_code", "") or ""
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON or form payload.")

    if not js_content.strip() and not css_content.strip():
        raise HTTPException(status_code=400, detail="Cannot analyze empty source code.")

    analysis_id = f"ANL-{uuid.uuid4().hex[:8].upper()}"

    if target_type == "js":
        findings = analyze_javascript(js_content)
        recommendations = ["Ensure strict linting on all JavaScript modules."]
    elif target_type == "css":
        findings = analyze_css(css_content)
        recommendations = ["Verify responsive breakpoints on mobile devices."]
    else:
        findings, recommendations = analyze_combined(js_content, css_content)

    generated_tests = generate_code_analysis_tests(findings)

    # Save to SQLite reports
    summary = {
        "code_type": target_type,
        "total_findings": len(findings),
        "critical_count": sum(1 for f in findings if f["severity"] == "CRITICAL"),
        "high_count": sum(1 for f in findings if f["severity"] == "HIGH"),
        "medium_count": sum(1 for f in findings if f["severity"] == "MEDIUM"),
        "low_count": sum(1 for f in findings if f["severity"] == "LOW"),
        "info_count": sum(1 for f in findings if f["severity"] == "INFO")
    }

    save_report(
        report_id=analysis_id,
        target=f"Code Snippet ({target_type.upper()})",
        source_type="code_analysis",
        status="completed",
        summary=summary,
        findings=findings,
        evidence={"js_length": len(js_content), "css_length": len(css_content)},
        generated_tests=generated_tests
    )

    return {
        "analysis_id": analysis_id,
        "code_type": target_type,
        "summary": summary,
        "findings": findings,
        "generated_tests": generated_tests,
        "recommendations": recommendations
    }

@router.post("/api/explore", response_model=ExploreResponse)
async def explore_endpoint(payload: ExploreRequest):
    try:
        findings, observations, summary = await explore_website(
            target_url=payload.url,
            max_pages=payload.max_pages,
            max_duration_seconds=payload.max_duration_seconds
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Exploration failure: {str(e)}")

    report_id = f"EXP-{uuid.uuid4().hex[:8].upper()}"
    generated_tests = generate_playwright_python_tests(
        target_url=payload.url,
        observations=observations,
        findings=findings
    )

    save_report(
        report_id=report_id,
        target=payload.url,
        source_type="exploration",
        status="completed",
        summary=summary,
        findings=findings,
        evidence={
            "observations": observations,
            "screenshots": [
                {"url": obs["url"], "path": obs["screenshot_url"]}
                for obs in observations if obs.get("screenshot_url")
            ]
        },
        generated_tests=generated_tests
    )

    return {
        "report_id": report_id,
        "target_url": payload.url,
        "status": "completed",
        "duration_seconds": summary["duration_seconds"],
        "pages_explored": summary["pages_visited"],
        "findings": findings,
        "observations": observations,
        "summary": summary
    }

@router.post("/api/generate-tests", response_model=GenerateTestsResponse)
async def generate_tests_endpoint(payload: GenerateTestsRequest):
    test_suite_id = f"SUITE-{uuid.uuid4().hex[:8].upper()}"

    if payload.source_type == "exploration":
        test_code = generate_playwright_python_tests(
            target_url=payload.target_url or "https://example.com",
            observations=payload.observations or [],
            findings=payload.findings or []
        )
    else:
        test_code = generate_code_analysis_tests(payload.findings or [])

    test_count = test_code.count("def test_")

    instructions = (
        "1. Save this script as test_pilot_suite.py\n"
        "2. Install Playwright: pip install pytest-playwright\n"
        "3. Install Browser: playwright install chromium\n"
        "4. Run Suite: pytest test_pilot_suite.py -v\n"
    )

    return {
        "test_suite_id": test_suite_id,
        "framework": payload.framework,
        "test_code": test_code,
        "test_count": test_count,
        "instructions": instructions
    }

@router.post("/api/run-tests", response_model=RunTestsResponse)
async def run_tests_endpoint(payload: RunTestsRequest):
    code_to_run = payload.test_code

    if not code_to_run and payload.report_id:
        report = get_report_by_id(payload.report_id)
        if report and report.get("generated_tests"):
            code_to_run = report["generated_tests"]

    if not code_to_run or not code_to_run.strip():
        raise HTTPException(status_code=400, detail="No test code provided to execute.")

    run_id = f"RUN-{uuid.uuid4().hex[:8].upper()}"
    results = run_test_suite_safely(code_to_run, timeout_seconds=payload.timeout_seconds)

    # If linked to a report, update its execution results
    if payload.report_id:
        report = get_report_by_id(payload.report_id)
        if report:
            save_report(
                report_id=payload.report_id,
                target=report["target"],
                source_type=report["source_type"],
                status=report["status"],
                summary=report["summary"],
                findings=report["findings"],
                evidence=report["evidence"],
                generated_tests=report["generated_tests"],
                execution_results=results
            )

    return {
        "run_id": run_id,
        "status": results["status"],
        "total_tests": results["total_tests"],
        "passed_tests": results["passed_tests"],
        "failed_tests": results["failed_tests"],
        "skipped_tests": results["skipped_tests"],
        "duration_seconds": results["duration_seconds"],
        "output": results["output"],
        "failures": results["failures"],
        "artifacts": results["artifacts"]
    }

@router.get("/api/reports")
async def list_reports(
    search: Optional[str] = None,
    severity: Optional[str] = None,
    source_type: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    return get_reports(search=search, severity=severity, source_type=source_type, limit=limit, offset=offset)

@router.get("/api/reports/{report_id}")
async def get_report(report_id: str):
    report = get_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found.")
    return report

@router.delete("/api/reports/{report_id}")
async def remove_report(report_id: str):
    success = delete_report(report_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found.")
    return {"message": f"Report '{report_id}' successfully deleted.", "deleted": True}

@router.get("/api/screenshots/{filename}")
async def serve_screenshot(filename: str):
    safe_name = Path(filename).name
    file_path = SCREENSHOTS_DIR / safe_name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Screenshot not found.")
    return FileResponse(file_path, media_type="image/png")
