import sqlite3
import json
import os
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any

# Ensure data directory exists
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
SCREENSHOTS_DIR = DATA_DIR / "screenshots"
DB_PATH = DATA_DIR / "testpilot.db"

def init_db():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                target TEXT NOT NULL,
                source_type TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                summary TEXT NOT NULL,
                findings TEXT NOT NULL,
                evidence TEXT NOT NULL,
                generated_tests TEXT,
                execution_results TEXT
            )
        """)
        conn.commit()

def get_db_connection():
    init_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def save_report(
    report_id: str,
    target: str,
    source_type: str,
    status: str,
    summary: Dict[str, Any],
    findings: List[Dict[str, Any]],
    evidence: Dict[str, Any],
    generated_tests: Optional[str] = None,
    execution_results: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    from datetime import timezone
    created_at = datetime.now(timezone.utc).isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO reports (
                id, target, source_type, status, created_at,
                summary, findings, evidence, generated_tests, execution_results
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            report_id,
            target,
            source_type,
            status,
            created_at,
            json.dumps(summary),
            json.dumps(findings),
            json.dumps(evidence),
            generated_tests or "",
            json.dumps(execution_results) if execution_results else ""
        ))
        conn.commit()
    return get_report_by_id(report_id)

def get_reports(
    search: Optional[str] = None,
    severity: Optional[str] = None,
    source_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM reports WHERE 1=1"
        params = []
        
        if search:
            query += " AND (target LIKE ? OR id LIKE ?)"
            params.extend([f"%{search}%", f"%{search}%"])
            
        if source_type:
            query += " AND source_type = ?"
            params.append(source_type)
            
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        results = []
        for r in rows:
            findings = json.loads(r["findings"])
            # Filter by severity if requested
            if severity and severity.upper() != "ALL":
                has_sev = any(f.get("severity", "").upper() == severity.upper() for f in findings)
                if not has_sev:
                    continue
            results.append({
                "id": r["id"],
                "target": r["target"],
                "source_type": r["source_type"],
                "status": r["status"],
                "created_at": r["created_at"],
                "summary": json.loads(r["summary"]),
                "findings_count": len(findings),
                "has_tests": bool(r["generated_tests"]),
                "findings": findings
            })
        return results

def get_report_by_id(report_id: str) -> Optional[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM reports WHERE id = ?", (report_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return {
            "id": row["id"],
            "target": row["target"],
            "source_type": row["source_type"],
            "status": row["status"],
            "created_at": row["created_at"],
            "summary": json.loads(row["summary"]),
            "findings": json.loads(row["findings"]),
            "evidence": json.loads(row["evidence"]),
            "generated_tests": row["generated_tests"],
            "execution_results": json.loads(row["execution_results"]) if row["execution_results"] else None
        }

def delete_report(report_id: str) -> bool:
    # First delete any screenshots referenced
    report = get_report_by_id(report_id)
    if not report:
        return False
        
    evidence = report.get("evidence", {})
    screenshots = evidence.get("screenshots", [])
    for sc in screenshots:
        path_str = sc.get("path") or sc.get("filename")
        if path_str:
            sc_path = SCREENSHOTS_DIR / Path(path_str).name
            if sc_path.exists():
                try:
                    sc_path.unlink()
                except OSError:
                    pass

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM reports WHERE id = ?", (report_id,))
        conn.commit()
        return cursor.rowcount > 0
