from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Dict, Any

class HealthResponse(BaseModel):
    status: str
    database: str
    node_available: bool
    playwright_available: bool
    timestamp: str
    version: str = "2.4.0-HAWKINS"

class Finding(BaseModel):
    id: str
    severity: str = Field(..., description="CRITICAL, HIGH, MEDIUM, LOW, INFO")
    issue: str
    file_type: str = Field(..., description="js, css, or both")
    line: Optional[int] = None
    column: Optional[int] = None
    explanation: str
    suggested_fix: str
    confidence: str = Field("HIGH", description="HIGH, MEDIUM, LOW")

class AnalyzeCodeRequest(BaseModel):
    code_type: str = Field("both", description="js, css, or both")
    js_code: Optional[str] = None
    css_code: Optional[str] = None
    target_name: Optional[str] = "input_snippet"

class AnalyzeCodeResponse(BaseModel):
    analysis_id: str
    code_type: str
    summary: Dict[str, Any]
    findings: List[Finding]
    generated_tests: Optional[str] = None
    recommendations: List[str]

class ExploreRequest(BaseModel):
    url: str
    max_pages: int = Field(3, ge=1, le=10)
    max_duration_seconds: int = Field(30, ge=5, le=120)

class ExplorePageObservation(BaseModel):
    url: str
    title: str
    status_code: Optional[int] = None
    links: List[str]
    buttons: List[str]
    inputs: List[Dict[str, str]]
    forms: List[Dict[str, Any]]
    console_errors: List[str]
    network_failures: List[Dict[str, Any]]
    screenshot_url: Optional[str] = None
    a11y_issues: List[str]

class ExploreResponse(BaseModel):
    report_id: str
    target_url: str
    status: str
    duration_seconds: float
    pages_explored: int
    findings: List[Finding]
    observations: List[ExplorePageObservation]
    summary: Dict[str, Any]

class GenerateTestsRequest(BaseModel):
    source_type: str = Field(..., description="code_analysis or exploration")
    report_id: Optional[str] = None
    target_url: Optional[str] = None
    findings: Optional[List[Dict[str, Any]]] = None
    observations: Optional[List[Dict[str, Any]]] = None
    framework: str = Field("playwright_python", description="playwright_python")

class GenerateTestsResponse(BaseModel):
    test_suite_id: str
    framework: str
    test_code: str
    test_count: int
    instructions: str

class RunTestsRequest(BaseModel):
    test_code: Optional[str] = None
    report_id: Optional[str] = None
    timeout_seconds: int = Field(30, ge=5, le=60)

class RunTestsResponse(BaseModel):
    run_id: str
    status: str
    total_tests: int
    passed_tests: int
    failed_tests: int
    skipped_tests: int
    duration_seconds: float
    output: str
    failures: List[Dict[str, Any]]
    artifacts: List[Dict[str, str]]
