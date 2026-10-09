import re
import tempfile
import subprocess
import shutil
from pathlib import Path
from typing import List, Dict, Any, Tuple

# Check Node.js availability
def find_node_executable() -> str:
    # First check standard PATH
    node_path = shutil.which("node")
    if node_path:
        return node_path
    # Check known Windows locations
    candidates = [
        r"C:\Program Files\nodejs\node.exe",
        r"C:\Users\Chareesh.Sam\AppData\Local\Programs\nodejs\node.exe"
    ]
    for c in candidates:
        if Path(c).exists():
            return c
    return ""

NODE_EXEC = find_node_executable()

def check_js_syntax_with_node(js_code: str) -> List[Dict[str, Any]]:
    """Runs `node --check` on a temporary file to validate JavaScript syntax."""
    findings = []
    if not NODE_EXEC:
        return findings

    try:
        with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as tmp:
            tmp.write(js_code)
            tmp_path = tmp.name

        proc = subprocess.run(
            [NODE_EXEC, "--check", tmp_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=5
        )

        if proc.returncode != 0:
            stderr = proc.stderr
            # Parse line and column from Node error output
            # e.g., tmp_path:3:10 \n SyntaxError: Unexpected token ';'
            line_match = re.search(r":(\d+)(?::(\d+))?", stderr)
            line_no = int(line_match.group(1)) if line_match else 1
            col_no = int(line_match.group(2)) if line_match and line_match.group(2) else None
            
            # Extract first relevant error line
            err_lines = [l for l in stderr.splitlines() if "SyntaxError" in l or "Error" in l]
            err_msg = err_lines[0] if err_lines else "JavaScript syntax error detected by Node.js"

            findings.append({
                "id": "JS-SYNTAX-ERR",
                "severity": "CRITICAL",
                "issue": "Syntax Error: " + err_msg.strip(),
                "file_type": "js",
                "line": line_no,
                "column": col_no,
                "explanation": f"Node.js engine failed to parse code. Details: {stderr.strip()[:200]}",
                "suggested_fix": "Review syntax around line {line_no}. Check for missing parentheses, brackets, or misplaced tokens.",
                "confidence": "HIGH"
            })
    except Exception as e:
        # If node check fails or times out, degrade gracefully
        pass
    finally:
        try:
            if 'tmp_path' in locals() and Path(tmp_path).exists():
                Path(tmp_path).unlink()
        except OSError:
            pass

    return findings

def analyze_javascript(js_code: str) -> List[Dict[str, Any]]:
    findings = []
    if not js_code or not js_code.strip():
        return findings

    # 1. Real Node.js syntax check
    syntax_issues = check_js_syntax_with_node(js_code)
    findings.extend(syntax_issues)

    lines = js_code.splitlines()

    # 2. Heuristic checks
    for idx, line in enumerate(lines, start=1):
        # A. Unsafe DOM sinks (XSS risk)
        if re.search(r"\binnerHTML\s*=", line):
            findings.append({
                "id": f"JS-XSS-INNERHTML-L{idx}",
                "severity": "HIGH",
                "issue": "Unsafe DOM Assignment (innerHTML)",
                "file_type": "js",
                "line": idx,
                "explanation": "Assigning to innerHTML with unescaped data exposes the application to Cross-Site Scripting (XSS).",
                "suggested_fix": "Use textContent, createElement, or a sanitization library (such as DOMPurify) before inserting HTML.",
                "confidence": "HIGH"
            })

        if re.search(r"\bdocument\.write\s*\(", line):
            findings.append({
                "id": f"JS-DOC-WRITE-L{idx}",
                "severity": "HIGH",
                "issue": "Deprecated & Insecure document.write()",
                "file_type": "js",
                "line": idx,
                "explanation": "document.write can overwrite page content and degrades performance.",
                "suggested_fix": "Use modern DOM manipulation APIs such as appendChild or insertAdjacentHTML.",
                "confidence": "HIGH"
            })

        if re.search(r"\beval\s*\(", line) or re.search(r"\bnew\s+Function\s*\(", line):
            findings.append({
                "id": f"JS-EVAL-L{idx}",
                "severity": "CRITICAL",
                "issue": "Dynamic Code Evaluation (eval / Function constructor)",
                "file_type": "js",
                "line": idx,
                "explanation": "Executing arbitrary strings as code introduces critical remote code execution and injection vulnerabilities.",
                "suggested_fix": "Refactor to use structured data parsing (JSON.parse) or safe dictionary lookups instead of eval.",
                "confidence": "HIGH"
            })

        # B. Accidental assignment in conditional
        if re.search(r"\bif\s*\([^=!<>\n]*=[^=!<>\n]*\)", line) and not re.search(r"[=!<>]==?", line):
            findings.append({
                "id": f"JS-ASSIGN-COND-L{idx}",
                "severity": "MEDIUM",
                "issue": "Accidental Assignment in Conditional",
                "file_type": "js",
                "line": idx,
                "explanation": "Single equals '=' inside if-condition assigns value instead of comparing, which often causes unintended execution branches.",
                "suggested_fix": "Change '=' to strict equality '==='.",
                "confidence": "MEDIUM"
            })

        # C. Loose equality
        if re.search(r"[^!=]==[^=]", line) or re.search(r"!=[^=]", line):
            if not re.search(r"===", line) and not re.search(r"!==", line):
                findings.append({
                    "id": f"JS-LOOSE-EQ-L{idx}",
                    "severity": "LOW",
                    "issue": "Loose Equality Operator (== or !=)",
                    "file_type": "js",
                    "line": idx,
                    "explanation": "Loose equality performs unexpected type coercion (e.g. '' == 0 is true).",
                    "suggested_fix": "Use strict equality '===' and '!==' to avoid implicit type coercion bugs.",
                    "confidence": "HIGH"
                })

        # D. Deprecated event.keyCode
        if re.search(r"\bkeyCode\b", line):
            findings.append({
                "id": f"JS-DEPRECATED-KEYCODE-L{idx}",
                "severity": "LOW",
                "issue": "Deprecated KeyboardEvent.keyCode",
                "file_type": "js",
                "line": idx,
                "explanation": "KeyboardEvent.keyCode is deprecated in the W3C specification.",
                "suggested_fix": "Use modern 'event.key' or 'event.code' instead.",
                "confidence": "HIGH"
            })

        # E. Debugger statement
        if re.search(r"^\s*debugger\s*;", line):
            findings.append({
                "id": f"JS-DEBUGGER-L{idx}",
                "severity": "MEDIUM",
                "issue": "Debugger Statement in Code",
                "file_type": "js",
                "line": idx,
                "explanation": "debugger statements pause script execution in production if devtools are opened.",
                "suggested_fix": "Remove debugger statement before committing or deploying.",
                "confidence": "HIGH"
            })

    # F. Unhandled fetch promises
    fetch_matches = [m.start() for m in re.finditer(r"\bfetch\s*\(", js_code)]
    for m in fetch_matches:
        line_num = js_code[:m].count("\n") + 1
        snippet = js_code[m:m+250]
        if "catch" not in snippet and "await" not in js_code[max(0, m-20):m]:
            findings.append({
                "id": f"JS-UNHANDLED-FETCH-L{line_num}",
                "severity": "MEDIUM",
                "issue": "Potentially Unhandled Fetch Promise",
                "file_type": "js",
                "line": line_num,
                "explanation": "Network fetch() appears without an immediate .catch() handler or await in try/catch block.",
                "suggested_fix": "Chain .catch(error => { ... }) or wrap in an async function with try/catch block to handle offline/network errors.",
                "confidence": "MEDIUM"
            })

    return findings

def analyze_css(css_code: str) -> List[Dict[str, Any]]:
    findings = []
    if not css_code or not css_code.strip():
        return findings

    # 1. Unbalanced braces
    open_braces = css_code.count("{")
    close_braces = css_code.count("}")
    if open_braces != close_braces:
        diff = abs(open_braces - close_braces)
        findings.append({
            "id": "CSS-UNBALANCED-BRACES",
            "severity": "CRITICAL",
            "issue": f"Unbalanced Braces ({open_braces} open vs {close_braces} close)",
            "file_type": "css",
            "line": 1,
            "explanation": f"CSS parser encountered mismatched curly braces ({diff} unbalanced). This can break styling rules below the fault.",
            "suggested_fix": "Verify that every selector rule block has a matching closing brace '}'.",
            "confidence": "HIGH"
        })

    # 2. Unclosed comments
    open_comments = css_code.count("/*")
    close_comments = css_code.count("*/")
    if open_comments > close_comments:
        findings.append({
            "id": "CSS-UNCLOSED-COMMENT",
            "severity": "HIGH",
            "issue": "Unclosed Comment Block (/* without matching */)",
            "file_type": "css",
            "line": 1,
            "explanation": "An unclosed CSS comment causes subsequent rules to be inadvertently commented out.",
            "suggested_fix": "Close the open comment using '*/'.",
            "confidence": "HIGH"
        })

    lines = css_code.splitlines()
    in_rule_block = False
    current_properties = {}

    for idx, line in enumerate(lines, start=1):
        clean = line.strip()

        if "{" in clean:
            in_rule_block = True
            current_properties = {}

        if "}" in clean:
            in_rule_block = False
            current_properties = {}

        # 3. Missing units (e.g. width: 500; instead of width: 500px;)
        unit_match = re.search(r"\b(width|height|margin|padding|top|left|right|bottom|font-size)\s*:\s*([1-9]\d*)\s*;", clean)
        if unit_match:
            prop = unit_match.group(1)
            val = unit_match.group(2)
            findings.append({
                "id": f"CSS-MISSING-UNIT-L{idx}",
                "severity": "HIGH",
                "issue": f"Missing Unit on '{prop}: {val}'",
                "file_type": "css",
                "line": idx,
                "explanation": f"CSS lengths other than 0 require a unit (e.g., px, rem, %, vh). Value '{val}' without unit will be rejected by browsers.",
                "suggested_fix": f"Specify a unit, e.g., '{prop}: {val}px;' or '{prop}: {val}rem;'.",
                "confidence": "HIGH"
            })

        # 4. Duplicate properties in same block
        if in_rule_block and ":" in clean and ";" in clean:
            prop_name = clean.split(":")[0].strip().lower()
            if prop_name.startswith("/*") or prop_name.startswith("//"):
                continue
            if prop_name in current_properties:
                findings.append({
                    "id": f"CSS-DUP-PROP-L{idx}",
                    "severity": "LOW",
                    "issue": f"Duplicate Property '{prop_name}' in Same Rule",
                    "file_type": "css",
                    "line": idx,
                    "explanation": f"Property '{prop_name}' was already defined on line {current_properties[prop_name]}. The second declaration overrides the first.",
                    "suggested_fix": f"Remove redundant declaration or ensure purposeful browser fallback.",
                    "confidence": "MEDIUM"
                })
            else:
                current_properties[prop_name] = idx

        # 5. Fixed wide desktop width (Responsive issue)
        width_match = re.search(r"\bwidth\s*:\s*([0-9]{3,4})px\s*;", clean)
        if width_match:
            px_val = int(width_match.group(1))
            if px_val >= 900:
                findings.append({
                    "id": f"CSS-FIXED-WIDTH-L{idx}",
                    "severity": "MEDIUM",
                    "issue": f"Fixed Width ({px_val}px) Breaks Mobile Viewports",
                    "file_type": "css",
                    "line": idx,
                    "explanation": f"Fixed width of {px_val}px causes horizontal scrollbars and layout clipping on mobile screens (375px - 768px).",
                    "suggested_fix": f"Use 'max-width: {px_val}px; width: 100%;' or responsive flex/grid layouts.",
                    "confidence": "HIGH"
                })

        # 6. Abuse of !important
        if "!important" in clean:
            findings.append({
                "id": f"CSS-IMPORTANT-L{idx}",
                "severity": "INFO",
                "issue": "Use of '!important' Declaration",
                "file_type": "css",
                "line": idx,
                "explanation": "!important breaks CSS cascade specificity and makes component overrides difficult to maintain.",
                "suggested_fix": "Refactor selector specificity or structure instead of using !important.",
                "confidence": "HIGH"
            })

    # 7. Overall responsive design heuristic
    if "@media" not in css_code and len(lines) > 20:
        findings.append({
            "id": "CSS-NO-MEDIA-QUERIES",
            "severity": "INFO",
            "issue": "No Responsive Media Queries Detected",
            "file_type": "css",
            "line": 1,
            "explanation": "Stylesheet contains over 20 lines without any @media breakpoints or fluid container queries.",
            "suggested_fix": "Add media queries (e.g., @media (max-width: 768px)) to ensure mobile and tablet responsiveness.",
            "confidence": "MEDIUM"
        })

    return findings

def analyze_combined(js_code: str, css_code: str) -> Tuple[List[Dict[str, Any]], List[str]]:
    """Analyzes both files and cross-references selectors and classes."""
    findings = []
    recommendations = []

    if js_code:
        js_findings = analyze_javascript(js_code)
        findings.extend(js_findings)
    if css_code:
        css_findings = analyze_css(css_code)
        findings.extend(css_findings)

    if js_code and css_code:
        # Cross reference classes
        # Find classes queried by JS: document.querySelector('.my-class') or getElementsByClassName('my-class')
        js_classes = set(re.findall(r"querySelector(?:All)?\s*\(\s*['\"][^'\"]*\.([a-zA-Z0-9_-]+)", js_code))
        js_classes.update(re.findall(r"getElementsByClassName\s*\(\s*['\"]([a-zA-Z0-9_-]+)", js_code))
        js_classes.update(re.findall(r"classList\.(?:add|remove|contains|toggle)\s*\(\s*['\"]([a-zA-Z0-9_-]+)", js_code))

        # Find classes defined in CSS: .my-class { ... }
        css_classes = set(re.findall(r"\.([a-zA-Z0-9_-]+)\s*(?:[^{,]*)\{", css_code))

        missing_in_css = [c for c in js_classes if c not in css_classes and not c.startswith("js-")]
        for cls in missing_in_css[:5]:
            findings.append({
                "id": f"COMBO-MISSING-CSS-{cls}",
                "severity": "LOW",
                "issue": f"JS References Class '.{cls}' Not Found in CSS",
                "file_type": "both",
                "line": None,
                "explanation": f"JavaScript queries or toggles class '.{cls}', but no corresponding rule exists in the provided CSS.",
                "suggested_fix": f"Add rule for '.{cls}' in CSS or verify if this class is exclusively used as a behavioral hook.",
                "confidence": "MEDIUM"
            })

        if missing_in_css:
            recommendations.append(f"Synchronize {len(missing_in_css)} DOM classes queried in JS that have no styling declarations in CSS.")

    if any(f["severity"] == "CRITICAL" for f in findings):
        recommendations.append("Resolve CRITICAL syntax errors first before deploying to staging.")
    if any("XSS" in f["issue"] for f in findings):
        recommendations.append("Audit all dynamic HTML sinks with DOMPurify to eliminate XSS attack vectors.")

    return findings, recommendations
