// API Client for TestPilot AI Backend
const API_BASE = "http://127.0.0.1:8000";

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: "GET" });
    if (!res.ok) throw new Error(`Health check returned HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      status: "disconnected",
      database: "offline",
      node_available: false,
      playwright_available: false,
      timestamp: new Date().toISOString(),
      error: err.message
    };
  }
}

export async function analyzeCode(payload) {
  const res = await fetch(`${API_BASE}/api/analyze-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Analysis request failed with status ${res.status}`);
  }
  return await res.json();
}

export async function exploreWebsite(payload) {
  const res = await fetch(`${API_BASE}/api/explore`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Exploration failed with status ${res.status}`);
  }
  return await res.json();
}

export async function generateTests(payload) {
  const res = await fetch(`${API_BASE}/api/generate-tests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Test generation failed with status ${res.status}`);
  }
  return await res.json();
}

export async function runTests(payload) {
  const res = await fetch(`${API_BASE}/api/run-tests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Test execution failed with status ${res.status}`);
  }
  return await res.json();
}

export async function fetchReports(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.severity && params.severity !== "ALL") query.append("severity", params.severity);
  if (params.source_type) query.append("source_type", params.source_type);

  const res = await fetch(`${API_BASE}/api/reports?${query.toString()}`);
  if (!res.ok) throw new Error(`Failed to load reports (HTTP ${res.status})`);
  return await res.json();
}

export async function fetchReportDetails(reportId) {
  const res = await fetch(`${API_BASE}/api/reports/${reportId}`);
  if (!res.ok) throw new Error(`Report ${reportId} not found`);
  return await res.json();
}

export async function deleteReportApi(reportId) {
  const res = await fetch(`${API_BASE}/api/reports/${reportId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete report ${reportId}`);
  return await res.json();
}

export function getScreenshotUrl(pathOrFilename) {
  if (!pathOrFilename) return "";
  if (pathOrFilename.startsWith("http")) return pathOrFilename;
  if (pathOrFilename.startsWith("/api/")) return `${API_BASE}${pathOrFilename}`;
  return `${API_BASE}/api/screenshots/${pathOrFilename}`;
}
