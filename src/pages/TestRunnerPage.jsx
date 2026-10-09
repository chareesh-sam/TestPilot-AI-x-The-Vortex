import React, { useState } from 'react';
import { 
  PlaySquare, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Terminal, 
  ShieldCheck, 
  Flame 
} from 'lucide-react';
import { runTests } from '../services/api';
import { sound } from '../soundEffects';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';

const SAMPLE_RUNNABLE_SPEC = `import pytest

def test_hawkins_quantum_gate_lockdown():
    """Validates that emergency security gate seals within containment parameters."""
    containment_level = 99.98
    assert containment_level >= 99.0, "Containment integrity degraded below threshold"

def test_shadow_dom_memory_retention_bound():
    """Asserts detached DOM node counter remains below overflow boundary."""
    heap_elements = 184
    assert heap_elements < 500, f"Heap overflow: {heap_elements} detached nodes"

def test_biometric_clearance_concurrency_mutex():
    """Ensures duplicate token dispatch is handled via rate-limiting."""
    response_statuses = [200, 429]
    assert 200 in response_statuses
    assert 429 in response_statuses

def test_upside_down_dimensional_time_sync():
    """Verifies timestamps across dimensional boundary stay synchronized."""
    client_ts = 19831106
    server_ts = 19831106
    assert client_ts == server_ts, "Dimensional timestamp desync detected"
`;

export default function TestRunnerPage({ initialCode, userProfile }) {
  const [testCode, setTestCode] = useState(initialCode || SAMPLE_RUNNABLE_SPEC);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { success, error, warning, info } = useToast();

  const handleExecuteTests = async () => {
    if (running) return;
    if (!testCode.trim()) {
      warning('Please enter or generate Python pytest test code before dispatching to the runner.', 'CODE REQUIRED');
      return;
    }

    sound.drone();
    setRunning(true);
    setErrorMsg('');
    try {
      const data = await runTests({
        test_code: testCode,
        timeout_seconds: 30
      });
      setResults(data);

      if (data.failed_tests > 0) {
        sound.bugAlert();
        warning(
          `Subprocess execution completed with ${data.failed_tests} failure(s) out of ${data.total_tests} tests (${data.duration_seconds}s).`,
          'TEST FAILURES ENCOUNTERED'
        );
      } else {
        sound.success();
        success(
          `Subprocess execution successful! All ${data.passed_tests} test(s) passed cleanly in ${data.duration_seconds}s.`,
          'ALL TESTS PASSED'
        );
      }
    } catch (err) {
      const msg = err.message || 'Execution failed. Check backend connection.';
      setErrorMsg(msg);
      error(
        `Execution failure: ${msg}. Verify your pytest test syntax.`,
        'SUBPROCESS ERROR'
      );
    } finally {
      setRunning(false);
    }
  };

  const handleConfirmReset = () => {
    sound.warp();
    setTestCode(SAMPLE_RUNNABLE_SPEC);
    setResults(null);
    setErrorMsg('');
    setShowResetConfirm(false);
    info('Test runner workspace reset to default test specification.', 'RUNNER RESET');
  };

  return (
    <div className="test-runner-page">
      <div className="page-header-row">
        <div>
          <h1 className="stranger-title neon-flicker">MODULE D: CONTROLLED SUBPROCESS TEST RUNNER</h1>
          <p className="page-subtitle">
            Isolated subprocess test execution via fixed pytest arguments with memory constraints and strict timeouts.
          </p>
        </div>

        <div className="flex-center gap-2">
          {userProfile?.projectName && (
            <div className="profile-badge-pill">
              <span className="badge-low mini font-mono">PROJECT: {userProfile.projectName.toUpperCase()}</span>
            </div>
          )}
          <div className="sandbox-indicator-pill">
            <ShieldCheck size={15} className="text-green-pass" />
            <span>ISOLATED SUBPROCESS SANDBOX • SHELL INTERPOLATION RESTRICTED</span>
          </div>
        </div>
      </div>

      <div className="runner-grid-layout">
        {/* Left: Test Code to Execute */}
        <div className="runner-code-panel neon-card">
          <div className="panel-title-bar">
            <span>TARGET TEST SCRIPT FOR SUBPROCESS DISPATCH</span>
            <span className="badge-low">PYTEST SYNTAX</span>
          </div>

          <div className="code-viewer-container">
            <textarea
              className="code-textarea retro-code full-height-code font-mono"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
              rows={16}
              spellCheck={false}
              disabled={running}
            />
          </div>

          <div className="runner-submit-bar">
            <button
              className="btn-neon-red execute-btn"
              onClick={handleExecuteTests}
              disabled={running}
            >
              {running ? (
                <>
                  <span className="radar-blip"></span>
                  <span>EXECUTING IN SUBPROCESS...</span>
                </>
              ) : (
                <>
                  <Play size={16} fill="white" />
                  <span>DISPATCH TO SUBPROCESS RUNNER</span>
                </>
              )}
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                sound.click();
                if (testCode !== SAMPLE_RUNNABLE_SPEC || results) {
                  setShowResetConfirm(true);
                } else {
                  handleConfirmReset();
                }
              }}
              disabled={running}
            >
              <RotateCcw size={14} /> Reset Sample
            </button>
          </div>

          {errorMsg && (
            <div className="error-banner">
              <AlertTriangle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Right: Subprocess Execution Results */}
        <div className="runner-results-panel neon-card">
          <div className="panel-title-bar">
            <span>SUBPROCESS RUN TELEMETRY</span>
            {results && (
              <span className={`badge-${results.status === 'COMPLETED' && results.failed_tests === 0 ? 'low' : 'critical'}`}>
                STATUS: {results.status}
              </span>
            )}
          </div>

          {!results ? (
            <div className="empty-runner-state">
              <Terminal size={36} className="text-text-dim" />
              <h3>READY FOR TEST DISPATCH</h3>
              <p>Click "DISPATCH TO SUBPROCESS RUNNER" to execute the test suite in a sandboxed process.</p>
            </div>
          ) : (
            <div className="runner-results-content">
              {/* Metrics Strip */}
              <div className="runner-stats-row">
                <div className="r-stat">
                  <span className="r-lbl">TOTAL</span>
                  <span className="r-val">{results.total_tests}</span>
                </div>
                <div className="r-stat">
                  <span className="r-lbl text-green-pass">PASSED</span>
                  <span className="r-val text-green-pass">{results.passed_tests}</span>
                </div>
                <div className="r-stat">
                  <span className="r-lbl text-red-neon">FAILED</span>
                  <span className="r-val text-red-neon">{results.failed_tests}</span>
                </div>
                <div className="r-stat">
                  <span className="r-lbl">DURATION</span>
                  <span className="r-val">{results.duration_seconds}s</span>
                </div>
              </div>

              {/* Failures Breakdown */}
              {results.failures && results.failures.length > 0 && (
                <div className="failures-container">
                  <span className="failures-header flex-center gap-1 text-red-neon">
                    <Flame size={14} /> FAILURE TRACES DETECTED ({results.failures.length}):
                  </span>
                  {results.failures.map((f, idx) => (
                    <div key={idx} className="failure-item">
                      <span className="fail-name font-mono">{f.test_name}</span>
                      <pre className="retro-code fail-trace">{f.trace}</pre>
                    </div>
                  ))}
                </div>
              )}

              {/* Terminal Standard Output */}
              <div className="terminal-stdout-container">
                <span className="terminal-title">SUBPROCESS STDOUT / STDERR CONSOLE:</span>
                <pre className="retro-code console-raw-output">
                  <code>{results.output}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <ConfirmationModal 
        isOpen={showResetConfirm}
        title="CONFIRM TEST WORKSPACE RESET"
        message="Are you sure you want to discard current test code modifications and clear previous subprocess execution telemetry? This action cannot be undone."
        confirmLabel="YES, RESET WORKSPACE"
        cancelLabel="CANCEL"
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetConfirm(false)}
        severity="warning"
      />
    </div>
  );
}
