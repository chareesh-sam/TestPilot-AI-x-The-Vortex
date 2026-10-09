import subprocess
import sys
import tempfile
import time
import re
from pathlib import Path
from typing import Dict, Any, List

def run_test_suite_safely(test_code: str, timeout_seconds: int = 30) -> Dict[str, Any]:
    """
    Executes a test file safely in a controlled subprocess using `pytest`.
    No shell=True interpolation. Fixed executable and argument list.
    """
    start_time = time.time()
    temp_dir = Path(tempfile.gettempdir()) / "testpilot_runs"
    temp_dir.mkdir(parents=True, exist_ok=True)

    test_file = temp_dir / f"test_{int(time.time()*1000)}.py"

    try:
        with open(test_file, "w", encoding="utf-8") as f:
            f.write(test_code)

        # Build controlled command list
        # python -m pytest <test_file> -v --tb=short
        cmd = [
            sys.executable,
            "-m",
            "pytest",
            str(test_file),
            "-v",
            "--tb=short"
        ]

        proc = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=timeout_seconds,
            cwd=str(temp_dir)
        )

        stdout = proc.stdout
        stderr = proc.stderr
        combined_output = stdout + ("\n" + stderr if stderr else "")
        duration = round(time.time() - start_time, 2)

        # Parse pytest summary line
        # e.g.: === 3 passed, 1 failed in 2.34s ===
        passed = 0
        failed = 0
        skipped = 0

        pass_match = re.search(r"(\d+)\s+passed", combined_output)
        fail_match = re.search(r"(\d+)\s+failed", combined_output)
        skip_match = re.search(r"(\d+)\s+skipped", combined_output)

        if pass_match:
            passed = int(pass_match.group(1))
        if fail_match:
            failed = int(fail_match.group(1))
        if skip_match:
            skipped = int(skip_match.group(1))

        total = passed + failed + skipped
        if total == 0 and proc.returncode == 0:
            total = 1
            passed = 1

        failures = []
        if failed > 0:
            # Extract failure blocks
            fail_blocks = re.findall(r"_{3,}\s+([^\n]+)\s+_{3,}(.+?)(?=(?:_{3,}|\Z))", combined_output, re.DOTALL)
            for title, block in fail_blocks:
                failures.append({
                    "test_name": title.strip(),
                    "trace": block.strip()[:600]
                })

        return {
            "status": "COMPLETED" if proc.returncode == 0 else "FAILED",
            "total_tests": total,
            "passed_tests": passed,
            "failed_tests": failed,
            "skipped_tests": skipped,
            "duration_seconds": duration,
            "output": combined_output,
            "failures": failures,
            "artifacts": []
        }

    except subprocess.TimeoutExpired:
        return {
            "status": "TIMEOUT",
            "total_tests": 1,
            "passed_tests": 0,
            "failed_tests": 1,
            "skipped_tests": 0,
            "duration_seconds": timeout_seconds,
            "output": f"Test execution exceeded maximum timeout of {timeout_seconds}s and was terminated.",
            "failures": [{"test_name": "ExecutionTimeout", "trace": f"Timeout of {timeout_seconds}s exceeded"}],
            "artifacts": []
        }
    except Exception as e:
        return {
            "status": "ERROR",
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
            "skipped_tests": 0,
            "duration_seconds": round(time.time() - start_time, 2),
            "output": f"Subprocess runner error: {str(e)}",
            "failures": [{"test_name": "RunnerError", "trace": str(e)}],
            "artifacts": []
        }
    finally:
        try:
            if test_file.exists():
                test_file.unlink()
        except OSError:
            pass
