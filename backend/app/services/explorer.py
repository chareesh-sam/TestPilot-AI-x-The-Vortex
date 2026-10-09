import asyncio
import time
import uuid
import re
from pathlib import Path
from urllib.parse import urlparse, urljoin
from typing import List, Dict, Any, Tuple

from app.services.ssrf_validator import validate_safe_url
from app.database import SCREENSHOTS_DIR

# Dangerous action button regex to avoid destructive clicks
DANGEROUS_ACTION_REGEX = re.compile(
    r"\b(delete|remove|destroy|purge|buy|purchase|pay|checkout|order|subscribe|charge|transfer|post|submit)\b",
    re.IGNORECASE
)

async def explore_website(
    target_url: str,
    max_pages: int = 3,
    max_duration_seconds: int = 30
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], Dict[str, Any]]:
    """
    Safely explores a target website using Playwright.
    Collects DOM metadata, forms, buttons, console errors, failed network requests,
    screenshots, and accessibility observations.
    """
    # 1. SSRF validation
    is_safe, error_msg = validate_safe_url(target_url)
    if not is_safe:
        raise ValueError(f"SSRF Safety Validation Failed: {error_msg}")

    target_domain = urlparse(target_url).netloc.lower()
    visited_urls = set()
    queue = [target_url]
    observations = []
    findings = []
    start_time = time.time()

    # Try importing Playwright
    playwright_available = False
    try:
        from playwright.async_api import async_playwright
        playwright_available = True
    except ImportError:
        pass

    if playwright_available:
        try:
            async with async_playwright() as p:
                # Launch browser with safe flags and sandbox using system Chrome/Edge
                launch_kwargs = {
                    "headless": True,
                    "args": ["--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage"]
                }
                browser = None
                for channel in ["chrome", "msedge", None]:
                    try:
                        if channel:
                            browser = await p.chromium.launch(channel=channel, **launch_kwargs)
                        else:
                            browser = await p.chromium.launch(**launch_kwargs)
                        break
                    except Exception:
                        continue

                if not browser:
                    raise RuntimeError("Failed to initialize system browser")
                context = await browser.new_context(
                    user_agent="TestPilot-AI/2.4 (Security Audit Bot; Autonomous Testing Agent)",
                    viewport={"width": 1280, "height": 800},
                    ignore_https_errors=False
                )

                while queue and len(visited_urls) < max_pages:
                    if (time.time() - start_time) > max_duration_seconds:
                        break

                    current_url = queue.pop(0)
                    if current_url in visited_urls:
                        continue

                    # Validate each hopped URL
                    hop_safe, hop_err = validate_safe_url(current_url)
                    if not hop_safe:
                        continue

                    visited_urls.add(current_url)
                    page = await context.new_page()

                    console_errors = []
                    network_failures = []

                    def on_console(msg):
                        if msg.type == "error":
                            console_errors.append(msg.text)

                    def on_page_error(err):
                        console_errors.append(str(err))

                    def on_response(resp):
                        if resp.status >= 400:
                            network_failures.append({
                                "url": resp.url,
                                "status": resp.status,
                                "status_text": resp.status_text
                            })

                    page.on("console", on_console)
                    page.on("pageerror", on_page_error)
                    page.on("response", on_response)

                    try:
                        response = await page.goto(
                            current_url,
                            wait_until="domcontentloaded",
                            timeout=15000
                        )
                        status_code = response.status if response else 200
                        title = await page.title()

                        # Collect screenshot
                        sc_filename = f"sc_{uuid.uuid4().hex[:12]}.png"
                        sc_path = SCREENSHOTS_DIR / sc_filename
                        await page.screenshot(path=str(sc_path), full_page=False)
                        screenshot_url = f"/api/screenshots/{sc_filename}"

                        # Extract DOM elements safely via evaluate
                        dom_data = await page.evaluate("""() => {
                            const links = Array.from(document.querySelectorAll('a[href]'))
                                .map(a => a.href)
                                .filter(h => h.startsWith('http'));

                            const buttons = Array.from(document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]'))
                                .map(b => (b.innerText || b.value || b.getAttribute('aria-label') || '').trim())
                                .filter(Boolean);

                            const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea'))
                                .map(i => ({
                                    name: i.name || '',
                                    type: i.type || 'text',
                                    placeholder: i.placeholder || '',
                                    id: i.id || '',
                                    has_label: Boolean(
                                        i.labels && i.labels.length > 0 ||
                                        i.getAttribute('aria-label') ||
                                        i.getAttribute('aria-labelledby')
                                    )
                                }));

                            const forms = Array.from(document.querySelectorAll('form'))
                                .map(f => ({
                                    action: f.action || '',
                                    method: (f.method || 'GET').toUpperCase(),
                                    field_count: f.elements ? f.elements.length : 0
                                }));

                            // Basic accessibility audit
                            const a11y = [];
                            const imagesWithoutAlt = Array.from(document.querySelectorAll('img:not([alt])'));
                            if (imagesWithoutAlt.length > 0) {
                                a11y.push(`${imagesWithoutAlt.length} image(s) missing alt text description`);
                            }

                            const inputsWithoutLabels = inputs.filter(inp => !inp.has_label);
                            if (inputsWithoutLabels.length > 0) {
                                a11y.push(`${inputsWithoutLabels.length} input field(s) missing accessible label or aria-label`);
                            }

                            const buttonsWithoutText = Array.from(document.querySelectorAll('button'))
                                .filter(b => !(b.innerText || b.getAttribute('aria-label') || b.title));
                            if (buttonsWithoutText.length > 0) {
                                a11y.push(`${buttonsWithoutText.length} button(s) have empty text with no accessible name`);
                            }

                            if (!document.title || document.title.trim() === '') {
                                a11y.push('Document title (<title>) is empty or missing');
                            }

                            if (!document.documentElement.lang) {
                                a11y.push('Root <html> element missing lang attribute (e.g. lang="en")');
                            }

                            return {
                                links: Array.from(new Set(links)).slice(0, 30),
                                buttons: Array.from(new Set(buttons)).slice(0, 25),
                                inputs: inputs.slice(0, 20),
                                forms: forms.slice(0, 10),
                                a11y: a11y
                            };
                        }""")

                        # Extract internal links for crawl queue
                        for lk in dom_data["links"]:
                            parsed_lk = urlparse(lk)
                            if parsed_lk.netloc.lower() == target_domain and lk not in visited_urls and lk not in queue:
                                # Avoid logout / delete paths
                                if not DANGEROUS_ACTION_REGEX.search(parsed_lk.path):
                                    queue.append(lk)

                        # Check for console errors as findings
                        for err in console_errors:
                            findings.append({
                                "id": f"EXPLORE-CONSOLE-ERR-{uuid.uuid4().hex[:6]}",
                                "severity": "HIGH",
                                "issue": f"Browser Console Error on {urlparse(current_url).path or '/'}",
                                "file_type": "js",
                                "line": None,
                                "explanation": f"Uncaught client-side runtime error: {err[:200]}",
                                "suggested_fix": "Inspect script execution stack on this route to resolve unhandled exceptions.",
                                "confidence": "HIGH"
                            })

                        # Check for HTTP errors as findings
                        for fail in network_failures:
                            findings.append({
                                "id": f"EXPLORE-HTTP-FAIL-{uuid.uuid4().hex[:6]}",
                                "severity": "MEDIUM",
                                "issue": f"Network Failure {fail['status']} on {urlparse(fail['url']).path}",
                                "file_type": "js",
                                "line": None,
                                "explanation": f"HTTP request failed with status {fail['status']} {fail.get('status_text', '')}.",
                                "suggested_fix": "Verify endpoint availability, API routing, or CORS configurations.",
                                "confidence": "HIGH"
                            })

                        # Convert a11y issues to findings
                        for a11y in dom_data["a11y"]:
                            findings.append({
                                "id": f"EXPLORE-A11Y-{uuid.uuid4().hex[:6]}",
                                "severity": "LOW",
                                "issue": f"Accessibility Warning: {a11y}",
                                "file_type": "css",
                                "line": None,
                                "explanation": f"WCAG 2.1 check on {current_url}: {a11y}.",
                                "suggested_fix": "Ensure all interactive elements and assets have accessible labels and descriptions.",
                                "confidence": "HIGH"
                            })

                        observations.append({
                            "url": current_url,
                            "title": title or "Untitled Page",
                            "status_code": status_code,
                            "links": dom_data["links"][:20],
                            "buttons": dom_data["buttons"][:15],
                            "inputs": dom_data["inputs"][:15],
                            "forms": dom_data["forms"],
                            "console_errors": console_errors,
                            "network_failures": network_failures,
                            "screenshot_url": screenshot_url,
                            "a11y_issues": dom_data["a11y"]
                        })

                    except Exception as page_ex:
                        # Record error observation rather than aborting entirely
                        observations.append({
                            "url": current_url,
                            "title": "Navigation Error",
                            "status_code": 500,
                            "links": [],
                            "buttons": [],
                            "inputs": [],
                            "forms": [],
                            "console_errors": [str(page_ex)],
                            "network_failures": [],
                            "screenshot_url": None,
                            "a11y_issues": []
                        })
                    finally:
                        await page.close()

                await context.close()
                await browser.close()

        except Exception as browser_ex:
            # If Playwright browser launch failed (e.g. chromium not downloaded yet), fallback to httpx HTML parse
            fallback_obs, fallback_findings = await fallback_http_explore(target_url)
            observations.extend(fallback_obs)
            findings.extend(fallback_findings)
    else:
        # Fallback HTTP explorer
        fallback_obs, fallback_findings = await fallback_http_explore(target_url)
        observations.extend(fallback_obs)
        findings.extend(fallback_findings)

    duration = round(time.time() - start_time, 2)
    summary = {
        "pages_visited": len(observations),
        "duration_seconds": duration,
        "total_findings": len(findings),
        "console_errors_count": sum(len(o.get("console_errors", [])) for o in observations),
        "network_failures_count": sum(len(o.get("network_failures", [])) for o in observations)
    }

    return findings, observations, summary

async def fallback_http_explore(target_url: str):
    """Fallback safe HTTP inspector using httpx when Playwright browser binary is installing or unavailable."""
    import httpx
    from html.parser import HTMLParser

    class SimpleHTMLParser(HTMLParser):
        def __init__(self):
            super().__init__()
            self.title = ""
            self.in_title = False
            self.links = []
            self.buttons = []
            self.inputs = []
            self.forms = []
            self.images_without_alt = 0

        def handle_starttag(self, tag, attrs):
            attr_dict = dict(attrs)
            if tag == "title":
                self.in_title = True
            elif tag == "a" and "href" in attr_dict:
                self.links.append(attr_dict["href"])
            elif tag in ("button", "input") and attr_dict.get("type") in ("button", "submit"):
                self.buttons.append(attr_dict.get("value") or attr_dict.get("name") or "Button")
            elif tag == "input":
                self.inputs.append({
                    "name": attr_dict.get("name", ""),
                    "type": attr_dict.get("type", "text"),
                    "placeholder": attr_dict.get("placeholder", ""),
                    "has_label": bool(attr_dict.get("aria-label"))
                })
            elif tag == "form":
                self.forms.append({
                    "action": attr_dict.get("action", ""),
                    "method": attr_dict.get("method", "GET").upper()
                })
            elif tag == "img" and "alt" not in attr_dict:
                self.images_without_alt += 1

        def handle_endtag(self, tag):
            if tag == "title":
                self.in_title = False

        def handle_data(self, data):
            if self.in_title:
                self.title += data

    observations = []
    findings = []

    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.get(target_url, headers={"User-Agent": "TestPilot-AI/2.4 (Security Audit Bot)"})
            parser = SimpleHTMLParser()
            parser.feed(resp.text)

            a11y = []
            if parser.images_without_alt > 0:
                a11y.append(f"{parser.images_without_alt} image(s) missing alt attribute")
            if not parser.title:
                a11y.append("Document missing <title> element")

            observations.append({
                "url": str(resp.url),
                "title": parser.title.strip() or "Web Page",
                "status_code": resp.status_code,
                "links": [l for l in parser.links if l.startswith("http")][:15],
                "buttons": parser.buttons[:10],
                "inputs": parser.inputs[:10],
                "forms": parser.forms[:5],
                "console_errors": [],
                "network_failures": [],
                "screenshot_url": None,
                "a11y_issues": a11y
            })
    except Exception as ex:
        findings.append({
            "id": "EXPLORE-HTTP-ERROR",
            "severity": "HIGH",
            "issue": f"Target Unreachable: {str(ex)}",
            "file_type": "js",
            "line": None,
            "explanation": f"Failed to connect to target URL: {str(ex)}",
            "suggested_fix": "Verify that the target server is online and accepting connections.",
            "confidence": "HIGH"
        })

    return observations, findings
