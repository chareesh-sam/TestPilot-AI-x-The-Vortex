# TestPilot AI 🔺 — Autonomous Software Testing Agent

> **Developed by**: **TEAM VORTEX**  
> **Theme**: *Stranger Things / The Upside Down* (Dark black void, glowing red neon, cyan rift accents, retro typography, and atmospheric spores)

TestPilot AI is an autonomous, full-stack software testing agent MVP that combines static code analysis (JavaScript & CSS), safe Playwright-based website exploration with SSRF defense, automated Python Playwright test generation, sandboxed test execution, and SQLite-backed reporting.

---

## ⚡ Architecture Overview

```
x:/hak/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py         # FastAPI endpoints (/health, /api/analyze-code, /api/explore, etc.)
│   │   ├── services/
│   │   │   ├── analyzer.py       # Node.js syntax checker + Python CSS/static heuristics
│   │   │   ├── explorer.py       # Safe Playwright browser exploration with SSRF protection
│   │   │   ├── generator.py      # Python Playwright test suite generator
│   │   │   ├── runner.py         # Sandboxed pytest subprocess runner with timeouts
│   │   │   └── ssrf_validator.py # Strict DNS/IP validation (blocks loopback, private IPs, metadata)
│   │   ├── database.py           # SQLite persistence layer (reports, findings, screenshots)
│   │   ├── schemas.py            # Pydantic request & response validation models
│   │   └── main.py               # FastAPI application with CORS and lifespan handler
│   ├── data/                     # SQLite database & captured screenshots storage
│   ├── tests/                    # Pytest test suite (13 automated tests)
│   ├── requirements.txt
│   └── .env.example
├── src/
│   ├── components/               # Header, Sidebar, SporesCanvas, CinematicIntro, Footer
│   ├── pages/
│   │   ├── DashboardPage.jsx     # Mission Control with live stats and quick actions
│   │   ├── CodeAnalyzerPage.jsx  # Module A: JS & CSS editor, file upload, findings table
│   │   ├── ExplorerPage.jsx      # Module B: URL input, presets, observations, screenshots
│   │   ├── TestGeneratorPage.jsx # Module C: Playwright test synthesis, copy/download
│   │   ├── TestRunnerPage.jsx    # Module D: Sandboxed subprocess execution & stdout logs
│   │   └── ReportsPage.jsx       # Module E: SQLite reports, filters, screenshot drawer, JSON export
│   ├── services/
│   │   └── api.js                # Fetch API client connected to backend (with Demo Mode fallback)
│   ├── soundEffects.js           # Zero-dependency Web Audio API procedural 80s synth SFX
│   ├── App.jsx
│   ├── App.css
│   └── index.css
├── package.json
└── README.md
```

---

## 🚀 Installation & Local Startup

### Prerequisites
- **Python**: 3.10+ (tested on Python 3.14)
- **Node.js**: v18+ (tested on Node v24)
- **Browsers**: Google Chrome, Microsoft Edge, or Playwright Chromium

---

### Step 1: Backend Setup & Startup

#### Windows (PowerShell)
```powershell
# 1. Install backend dependencies
python -m pip install -r backend/requirements.txt

# 2. Start the FastAPI backend
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

#### macOS / Linux (Bash)
```bash
# 1. Install backend dependencies
python3 -m pip install -r backend/requirements.txt

# 2. Start the FastAPI backend
python3 -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

* Backend Health: `http://127.0.0.1:8000/health`
* Interactive API Documentation (Swagger): `http://127.0.0.1:8000/docs`

---

### Step 2: Frontend Setup & Startup

#### Windows (PowerShell)
```powershell
# 1. Install Node dependencies
npm install

# 2. Start Vite development server
npm run dev
```

#### macOS / Linux (Bash)
```bash
# 1. Install Node dependencies
npm install

# 2. Start Vite development server
npm run dev
```

* Frontend Application: `http://localhost:5173`

---

## 🧪 Running Automated Backend Tests

The project includes a 13-test automated test suite covering health, JavaScript static checks, Node syntax errors, CSS responsive checks, SSRF blocking, test generation, subprocess test execution, and SQLite report lifecycles:

```bash
python -m pytest backend/tests -v
```

Output:
```text
backend/tests/test_analyzer.py::test_valid_javascript_analysis PASSED
backend/tests/test_analyzer.py::test_invalid_javascript_syntax_detected PASSED
backend/tests/test_analyzer.py::test_xss_and_eval_heuristics_detected PASSED
backend/tests/test_analyzer.py::test_css_syntax_and_responsive_issues PASSED
backend/tests/test_analyzer.py::test_combined_js_and_css_analysis PASSED
backend/tests/test_generator_and_runner.py::test_generate_tests_endpoint PASSED
backend/tests/test_generator_and_runner.py::test_run_tests_endpoint_success PASSED
backend/tests/test_generator_and_runner.py::test_run_tests_endpoint_failure_reporting PASSED
backend/tests/test_health.py::test_health_check_endpoint PASSED
backend/tests/test_reports.py::test_report_lifecycle_creation_retrieval_and_deletion PASSED
backend/tests/test_ssrf_and_explore.py::test_ssrf_blocks_private_and_localhost_urls PASSED
backend/tests/test_ssrf_and_explore.py::test_ssrf_allows_public_https_domains PASSED
backend/tests/test_ssrf_and_explore.py::test_explore_endpoint_rejects_ssrf_targets PASSED

======================== 13 passed in 1.76s ========================
```

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check verifying SQLite, Node.js, and Playwright availability |
| `POST` | `/api/analyze-code` | Analyzes JS/CSS code (syntax checks, XSS sinks, responsive flaws) |
| `POST` | `/api/explore` | Headless Playwright crawl with SSRF validation, screenshot capture, and a11y audit |
| `POST` | `/api/generate-tests` | Synthesizes clean Python Playwright test scripts |
| `POST` | `/api/run-tests` | Controlled subprocess execution of test code via pytest |
| `GET` | `/api/reports` | Lists audit reports stored in SQLite (search & severity filters) |
| `GET` | `/api/reports/{id}` | Fetches detailed report including findings, screenshot paths, and test code |
| `DELETE` | `/api/reports/{id}` | Deletes an audit report and purges associated screenshot files from disk |
| `GET` | `/api/screenshots/{name}` | Safely serves captured browser screenshots |

---

## 🛡️ Security & SSRF Defense

- **SSRF Mitigation**: Hostnames are resolved to IP addresses before navigation. All loopback (`127.0.0.0/8`), private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local addresses (`169.254.0.0/16`), and cloud metadata services (`169.254.169.254`, `metadata.google.internal`) are blocked.
- **Safe Subprocess Execution**: Test code is executed via `sys.executable -m pytest` with `shell=False`, fixed arguments, and hard execution timeouts. Arbitrary shell commands supplied by users are never executed.
- **No Arbitrary Code Execution on Upload**: Source code uploaded to the analyzer is parsed statically using `node --check` and Python regex heuristics; it is never executed on the host.

---

## 👥 Credits
**Developed by TEAM VORTEX**  
*Department of Energy • Hawkins National Laboratory Division*
