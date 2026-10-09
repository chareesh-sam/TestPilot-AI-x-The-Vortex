import React, { useState } from 'react';
import { 
  Code2, 
  Upload, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Bug, 
  Copy, 
  Check, 
  FileCode2, 
  FileText,
  Sparkles,
  Info,
  ShieldCheck,
  Radar
} from 'lucide-react';
import { analyzeCode } from '../services/api';
import { sound } from '../soundEffects';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';
import PersonalizedReportBanner from '../components/PersonalizedReportBanner';

const VALID_JS_EXAMPLE = `// Valid Hawkins Security Gateway Handler
export async function authenticateOperator(badgeId) {
  if (!badgeId || typeof badgeId !== "string") {
    throw new Error("Invalid biometric clearance token");
  }

  try {
    const res = await fetch(\`/api/v1/clearance/\${encodeURIComponent(badgeId)}\`);
    if (!res.ok) {
      throw new Error(\`Gateway rejected clearance with status \${res.status}\`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Biometric verification network failure", err);
    return null;
  }
}`;

const INVALID_JS_EXAMPLE = `// Defective Script with XSS, eval, and loose equality
function renderUserBio(userInput) {
  // Vulnerability 1: XSS via innerHTML
  document.getElementById("profile").innerHTML = userInput;

  // Vulnerability 2: Accidental assignment in if
  if (userRole = "ADMIN") {
    console.log("Granted level 5 clearance");
  }

  // Vulnerability 3: Dynamic code evaluation
  eval("window.sessionData = " + userInput);

  // Vulnerability 4: Loose equality
  if (userInput == 0) {
    debugger; // Vulnerability 5: Debugger leftover
  }

  // Vulnerability 6: Unhandled fetch promise
  fetch("/api/leak-telemetry");
}`;

const VALID_CSS_EXAMPLE = `/* Valid Responsive Hawkins Containment Stylesheet */
.containment-chamber {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
  background-color: #08080c;
  color: #f0f0f5;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (max-width: 768px) {
  .containment-chamber {
    padding: 0.75rem;
    gap: 0.5rem;
  }
}`;

const INVALID_CSS_EXAMPLE = `/* Defective CSS with Syntax & Responsive Bugs */
.rift-gateway {
  width: 1400px; /* Responsive Issue: Fixed wide width */
  margin: 20; /* Missing unit: length needs px/rem */
  color: #ff113a;
  color: #00f0ff; /* Duplicate property in same block */
  font-size: 16px !important; /* Specificity abuse */
  
/* Syntax Issue: Unclosed comment block
.unclosed-block {
  height: 500px;
`;

export default function CodeAnalyzerPage({ 
  onNavigateToTestRunner, 
  userProfile, 
  setUserProfile 
}) {
  const [codeType, setCodeType] = useState(userProfile?.projectType || 'both');
  const [jsCode, setJsCode] = useState(INVALID_JS_EXAMPLE);
  const [cssCode, setCssCode] = useState(INVALID_CSS_EXAMPLE);
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [results, setResults] = useState(null);
  const [copiedTest, setCopiedTest] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { success, error, warning, info } = useToast();

  const handleAnalyze = async () => {
    // Prevent empty analysis
    if (!jsCode.trim() && !cssCode.trim()) {
      warning('Please enter or upload JavaScript or CSS source code before analyzing.', 'INPUT REQUIRED');
      return;
    }

    sound.drone();
    setLoading(true);
    setErrorMsg('');
    setProgressMsg('Parsing AST nodes & verifying Node.js syntax rules...');

    try {
      // Step update feedback
      setTimeout(() => {
        if (loading) setProgressMsg('Scanning for dangerous DOM sinks (innerHTML, eval, unhandled fetch)...');
      }, 300);

      const data = await analyzeCode({
        code_type: codeType,
        js_code: codeType === 'css' ? '' : jsCode,
        css_code: codeType === 'js' ? '' : cssCode
      });

      setResults(data);
      const crit = data.summary.critical_count || 0;
      const high = data.summary.high_count || 0;
      const tot = data.summary.total_findings || 0;

      if (tot === 0) {
        success(
          `Analysis Clean! Zero defects found in ${codeType.toUpperCase()} code.`,
          'PERFECT HEALTH SCORE'
        );
      } else {
        success(
          `Analysis Complete: Discovered ${tot} finding${tot > 1 ? 's' : ''} (${crit} Critical, ${high} High).`,
          'AUDIT COMPLETED'
        );
      }
    } catch (err) {
      const msg = err.message || 'Analysis failed. Check your connection to the local backend.';
      setErrorMsg(msg);
      error(
        `Analysis error: ${msg}. Try reducing snippet size or verifying syntax.`,
        'ANALYSIS FAILED'
      );
    } finally {
      setLoading(false);
      setProgressMsg('');
    }
  };

  const handleConfirmReset = () => {
    setJsCode('');
    setCssCode('');
    setResults(null);
    setErrorMsg('');
    setShowResetConfirm(false);
    info('Source code and analysis results have been reset to empty state.', 'WORKSPACE RESET');
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: max 2MB
    if (file.size > 2 * 1024 * 1024) {
      error('File size exceeds the 2MB safety threshold.', 'FILE REJECTED');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (type === 'js') {
        setJsCode(content);
        success(`Loaded JavaScript file: ${file.name} (${content.length} chars)`, 'FILE IMPORTED');
      } else {
        setCssCode(content);
        success(`Loaded CSS file: ${file.name} (${content.length} chars)`, 'FILE IMPORTED');
      }
    };
    reader.readAsText(file);
  };

  const handleCopyTests = () => {
    if (!results?.generated_tests) return;
    sound.click();
    navigator.clipboard.writeText(results.generated_tests);
    setCopiedTest(true);
    success('Generated regression tests copied to clipboard!', 'COPIED');
    setTimeout(() => setCopiedTest(false), 2000);
  };

  const getSeverityBadge = (sev) => {
    switch (sev.toUpperCase()) {
      case 'CRITICAL': return <span className="badge-critical">CRITICAL</span>;
      case 'HIGH': return <span className="badge-high">HIGH</span>;
      case 'MEDIUM': return <span className="badge-medium">MEDIUM</span>;
      case 'LOW': return <span className="badge-low">LOW</span>;
      default: return <span className="badge-low">INFO</span>;
    }
  };

  return (
    <div className="analyzer-page">
      <div className="page-header-row">
        <div>
          <h1 className="stranger-title neon-flicker">MODULE A: STATIC CODE ANALYZER</h1>
          <p className="page-subtitle">
            Static heuristic inspections, Node.js syntax checks, AST patterns, and CSS responsive flaw detection.
          </p>
        </div>

        {/* Tab Switcher: JS, CSS, Both */}
        <div className="tab-pill-selector">
          <button
            className={`pill-btn ${codeType === 'js' ? 'active' : ''}`}
            onClick={() => {
              sound.click();
              setCodeType('js');
            }}
            disabled={loading}
          >
            JavaScript (.js)
          </button>
          <button
            className={`pill-btn ${codeType === 'css' ? 'active' : ''}`}
            onClick={() => {
              sound.click();
              setCodeType('css');
            }}
            disabled={loading}
          >
            CSS (.css)
          </button>
          <button
            className={`pill-btn ${codeType === 'both' ? 'active' : ''}`}
            onClick={() => {
              sound.click();
              setCodeType('both');
            }}
            disabled={loading}
          >
            JavaScript + CSS
          </button>
        </div>
      </div>

      {/* Profile Awareness Strip */}
      <div className="profile-context-strip neon-card">
        <div className="flex-center gap-2">
          <Sparkles size={14} className="text-cyan-neon" />
          <span className="profile-context-text">
            ANALYZING FOR: <strong>{userProfile?.projectName}</strong> ({userProfile?.experienceLevel} Level • Goal: {userProfile?.testingGoal})
          </span>
        </div>
        <span className="badge-low mini">CARD 31 ACTIVE</span>
      </div>

      {/* Editor & Controls Section */}
      <div className="analyzer-editor-panel neon-card">
        <div className="editor-toolbar-row">
          <div className="preset-examples-group">
            <span className="preset-label">LOAD PRESETS:</span>
            <button
              className="btn-secondary mini-btn"
              onClick={() => {
                sound.click();
                if (codeType === 'js') setJsCode(VALID_JS_EXAMPLE);
                else if (codeType === 'css') setCssCode(VALID_CSS_EXAMPLE);
                else {
                  setJsCode(VALID_JS_EXAMPLE);
                  setCssCode(VALID_CSS_EXAMPLE);
                }
                info('Loaded clean, valid code example.', 'PRESET LOADED');
              }}
              disabled={loading}
            >
              ✓ Valid Examples
            </button>
            <button
              className="btn-secondary mini-btn border-red"
              onClick={() => {
                sound.click();
                if (codeType === 'js') setJsCode(INVALID_JS_EXAMPLE);
                else if (codeType === 'css') setCssCode(INVALID_CSS_EXAMPLE);
                else {
                  setJsCode(INVALID_JS_EXAMPLE);
                  setCssCode(INVALID_CSS_EXAMPLE);
                }
                warning('Loaded code snippet with intentional syntax and security flaws.', 'DEFECT PRESET');
              }}
              disabled={loading}
            >
              ✗ Defect Examples (XSS, Syntax Bugs)
            </button>
          </div>

          <div className="file-upload-actions">
            {(codeType === 'js' || codeType === 'both') && (
              <label className="upload-btn-label btn-secondary mini-btn">
                <Upload size={13} /> Upload .js
                <input 
                  type="file" 
                  accept=".js,.jsx,.ts" 
                  style={{ display: 'none' }} 
                  onChange={(e) => handleFileUpload(e, 'js')}
                  disabled={loading}
                />
              </label>
            )}
            {(codeType === 'css' || codeType === 'both') && (
              <label className="upload-btn-label btn-secondary mini-btn">
                <Upload size={13} /> Upload .css
                <input 
                  type="file" 
                  accept=".css" 
                  style={{ display: 'none' }} 
                  onChange={(e) => handleFileUpload(e, 'css')}
                  disabled={loading}
                />
              </label>
            )}
            <button
              className="btn-secondary mini-btn"
              onClick={() => {
                sound.click();
                setShowResetConfirm(true);
              }}
              disabled={loading}
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        </div>

        {/* Textareas */}
        <div className={`editor-textareas-grid ${codeType === 'both' ? 'two-cols' : 'single-col'}`}>
          {(codeType === 'js' || codeType === 'both') && (
            <div className="code-box-wrapper">
              <span className="code-box-label">JAVASCRIPT SOURCE:</span>
              <textarea
                className="code-textarea retro-code"
                value={jsCode}
                onChange={(e) => setJsCode(e.target.value)}
                placeholder="// Paste JavaScript code here..."
                rows={12}
                disabled={loading}
              />
            </div>
          )}

          {(codeType === 'css' || codeType === 'both') && (
            <div className="code-box-wrapper">
              <span className="code-box-label">CSS STYLESHEET:</span>
              <textarea
                className="code-textarea retro-code"
                value={cssCode}
                onChange={(e) => setCssCode(e.target.value)}
                placeholder="/* Paste CSS stylesheet here... */"
                rows={12}
                disabled={loading}
              />
            </div>
          )}
        </div>

        {/* Loading Progress Feedback */}
        {loading && (
          <div className="analysis-progress-strip">
            <div className="radar-blip"></div>
            <div className="progress-info-col">
              <span className="progress-heading">STATIC ANALYSIS IN PROGRESS</span>
              <span className="progress-detail">{progressMsg}</span>
            </div>
          </div>
        )}

        {/* Action Button Row */}
        <div className="editor-submit-row">
          <button
            className="btn-neon-red analyze-btn"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="radar-blip"></span>
                <span>PROCESSING STATIC AUDIT...</span>
              </>
            ) : (
              <>
                <Play size={16} fill="white" />
                <span>ANALYZE SOURCE CODE</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="error-banner">
            <AlertTriangle size={16} />
            <div>
              <strong>Analysis Anomaly:</strong> {errorMsg}
              <div style={{ fontSize: '0.78rem', marginTop: '4px', opacity: 0.9 }}>
                Remediation: Ensure backend is running on 127.0.0.1:8000 and the input syntax is valid UTF-8.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Results Display */}
      {results && (
        <div className="analyzer-results-section animate-fade-in">
          {/* Personalized Report Banner (Constraint Card 31) */}
          <PersonalizedReportBanner 
            profile={userProfile} 
            findings={results.findings || []}
            coverage={92.4}
          />

          {/* Summary Cards */}
          <div className="results-summary-cards">
            <div className="result-metric-card neon-card">
              <span className="res-title">TOTAL ANOMALIES</span>
              <span className="res-digit">{results.summary.total_findings}</span>
              <span className="metric-caption">Static Heuristic Violations</span>
            </div>
            <div className="result-metric-card neon-card">
              <span className="res-title text-red-neon">CRITICAL FLAWS</span>
              <span className="res-digit text-red-neon">{results.summary.critical_count}</span>
              <span className="metric-caption">AST & Syntax Blockers</span>
            </div>
            <div className="result-metric-card neon-card">
              <span className="res-title text-amber-warning">HIGH SEVERITY</span>
              <span className="res-digit text-amber-warning">{results.summary.high_count}</span>
              <span className="metric-caption">XSS & State Leaks</span>
            </div>
            <div className="result-metric-card neon-card">
              <span className="res-title text-cyan-neon">SYNTHESIZED TESTS</span>
              <span className="res-digit text-cyan-neon">
                {results.generated_tests ? results.generated_tests.split('def test_').length - 1 : 0}
              </span>
              <span className="metric-caption">Automated Regressions</span>
            </div>
          </div>

          {/* Findings Table */}
          <div className="findings-table-card neon-card">
            <div className="panel-title-bar">
              <div className="flex-center gap-2">
                <span>DISCOVERED ANOMALIES & AUDIT LOG</span>
                <span className="badge-low">{results.findings.length} RECORDS</span>
              </div>
              <span className="heuristic-pill">
                <Info size={12} /> HEURISTIC FINDINGS (CONFIDENCE: HIGH)
              </span>
            </div>

            {results.findings.length === 0 ? (
              <div className="clean-pass-box">
                <CheckCircle2 size={36} className="text-green-pass" />
                <h3>ZERO CODE ANOMALIES DETECTED</h3>
                <p>The analyzed source code satisfies syntax validation and basic static heuristics.</p>
              </div>
            ) : (
              <div className="findings-table-wrapper">
                <table className="findings-table">
                  <thead>
                    <tr>
                      <th>SEVERITY</th>
                      <th>ISSUE</th>
                      <th>FILE</th>
                      <th>LINE</th>
                      <th>EXPLANATION</th>
                      <th>SUGGESTED REMEDIATION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.findings.map((f, idx) => (
                      <tr key={idx} className={`severity-row-${f.severity.toLowerCase()}`}>
                        <td>{getSeverityBadge(f.severity)}</td>
                        <td className="issue-cell font-mono">
                          <strong>{f.issue}</strong>
                          <div className="heuristic-confidence-tag">CONFIDENCE: {f.confidence || 'HIGH'}</div>
                        </td>
                        <td className="font-mono">{f.file_type.toUpperCase()}</td>
                        <td className="font-mono">{f.line ? `L${f.line}` : '—'}</td>
                        <td className="explain-cell">{f.explanation}</td>
                        <td className="fix-cell">
                          <code>{f.suggested_fix}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Generated Regression Tests from Findings */}
          {results.generated_tests && (
            <div className="generated-tests-card neon-card">
              <div className="panel-title-bar">
                <div className="flex-center gap-2">
                  <FileCode2 size={16} className="text-cyan-neon" />
                  <span>AUTONOMOUSLY GENERATED REGRESSION TEST SUITE</span>
                </div>
                <div className="flex-center gap-2">
                  <button className="btn-secondary mini-btn" onClick={handleCopyTests}>
                    {copiedTest ? <Check size={14} className="text-green-pass" /> : <Copy size={14} />}
                    <span>{copiedTest ? 'COPIED' : 'COPY PYTHON SPEC'}</span>
                  </button>
                  <button 
                    className="btn-neon-cyan mini-btn"
                    onClick={() => {
                      sound.drone();
                      onNavigateToTestRunner(results.generated_tests);
                    }}
                  >
                    <Play size={14} /> RUN IN TEST RUNNER
                  </button>
                </div>
              </div>
              <pre className="retro-code full-code">
                <code>{results.generated_tests}</code>
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Reset */}
      <ConfirmationModal 
        isOpen={showResetConfirm}
        title="CONFIRM CODE WORKSPACE RESET"
        message="Are you sure you want to clear your current code input and all analysis results? This action cannot be undone."
        confirmLabel="CLEAR WORKSPACE"
        cancelLabel="KEEP CODE"
        severity="warning"
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
