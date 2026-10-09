import React, { useState } from 'react';
import { 
  Globe2, 
  Play, 
  Square, 
  RotateCcw, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  Camera, 
  FileCode2, 
  Eye, 
  Radio, 
  Compass,
  XCircle,
  ShieldAlert,
  Layers,
  Sparkles
} from 'lucide-react';
import { exploreWebsite, getScreenshotUrl } from '../services/api';
import { PRESET_TARGETS } from '../mockData';
import { sound } from '../soundEffects';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';

export default function ExplorerPage({ onNavigateToTestGen, userProfile, setUserProfile }) {
  const [targetUrl, setTargetUrl] = useState(userProfile?.targetUrl || 'https://hawkins-lab.doe.gov/portal');
  const [maxPages, setMaxPages] = useState(3);
  const [maxDuration, setMaxDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [results, setResults] = useState(null);
  const [previewScreenshot, setPreviewScreenshot] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const { success, error, warning, info } = useToast();

  const handleStartExploration = async () => {
    if (!targetUrl.trim()) {
      warning('Please enter a target website URL to begin exploration.', 'URL MISSING');
      return;
    }

    sound.drone();
    setLoading(true);
    setErrorMsg('');
    info(`Launching headless Playwright browser to crawl ${targetUrl}...`, 'EXPLORATION DISPATCHED');

    try {
      const data = await exploreWebsite({
        url: targetUrl,
        max_pages: maxPages,
        max_duration_seconds: maxDuration
      });

      setResults(data);
      const pagesCount = data.pages_explored || 0;
      const findingsCount = data.findings?.length || 0;

      success(
        `Exploration complete! Visited ${pagesCount} page${pagesCount > 1 ? 's' : ''} in ${data.duration_seconds}s with ${findingsCount} anomalies logged.`,
        'EXPLORATION SUCCESSFUL'
      );
    } catch (err) {
      const msg = err.message || 'Exploration failed.';
      setErrorMsg(msg);
      error(
        `Exploration failure: ${msg}`,
        'EXPLORATION HALTED'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    sound.warp();
    setLoading(false);
    warning('Autonomous exploration aborted by user operator.', 'EXPLORATION HALTED');
  };

  const handleConfirmClear = () => {
    setResults(null);
    setErrorMsg('');
    setShowClearConfirm(false);
    info('Exploration results and captured page elements cleared.', 'WORKSPACE CLEARED');
  };

  return (
    <div className="explorer-page">
      <div className="page-header-row">
        <div>
          <h1 className="stranger-title neon-flicker">MODULE B: AUTONOMOUS WEBSITE EXPLORER</h1>
          <p className="page-subtitle">
            Playwright-powered headless DOM exploration, state graph discovery, SSRF defense validation, and defect isolation.
          </p>
        </div>

        <div className="security-shield-badge">
          <ShieldAlert size={15} className="text-cyan-neon" />
          <span>SSRF GUARD: ACTIVE (LOCALHOST & PRIVATE SUBNETS BLOCKED)</span>
        </div>
      </div>

      {/* Explorer Controls Card */}
      <div className="explorer-config-card neon-card">
        <div className="config-form-grid">
          <div className="url-field-col">
            <label className="field-label flex-center gap-1">
              <Globe2 size={14} className="text-red-neon" /> TARGET WEBSITE URL:
            </label>
            <div className="url-input-wrap">
              <input 
                type="url" 
                className="url-input" 
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com"
                disabled={loading}
              />
            </div>

            {/* Presets */}
            <div className="preset-quick-row">
              <span className="preset-lbl">CLASSIFIED PRESETS:</span>
              {PRESET_TARGETS.map((p, idx) => (
                <button
                  key={idx}
                  className={`preset-pill ${targetUrl === p.url ? 'active' : ''}`}
                  onClick={() => {
                    sound.click();
                    setTargetUrl(p.url);
                    info(`Selected preset target: ${p.name}`, 'PRESET APPLIED');
                  }}
                  disabled={loading}
                >
                  {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="numeric-field-col">
            <label className="field-label">MAX PAGES (1-10):</label>
            <input 
              type="number" 
              className="number-input" 
              min={1} 
              max={10} 
              value={maxPages}
              onChange={(e) => setMaxPages(parseInt(e.target.value) || 1)}
              disabled={loading}
            />
          </div>

          <div className="numeric-field-col">
            <label className="field-label">TIMEOUT (SEC):</label>
            <input 
              type="number" 
              className="number-input" 
              min={5} 
              max={120} 
              value={maxDuration}
              onChange={(e) => setMaxDuration(parseInt(e.target.value) || 30)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="explorer-actions-bar">
          {!loading ? (
            <button 
              className="btn-neon-red"
              onClick={handleStartExploration}
            >
              <Play size={16} fill="white" />
              <span>START PLAYWRIGHT EXPLORATION</span>
            </button>
          ) : (
            <button 
              className="btn-secondary pause-btn"
              onClick={handleStop}
            >
              <Square size={16} className="text-red-neon" />
              <span>STOP EXPLORATION</span>
            </button>
          )}

          <button 
            className="btn-secondary"
            onClick={() => {
              sound.click();
              if (results) setShowClearConfirm(true);
              else setErrorMsg('');
            }}
            disabled={loading}
          >
            <RotateCcw size={14} /> CLEAR RESULTS
          </button>
        </div>

        {loading && (
          <div className="exploration-loading-banner">
            <div className="radar-blip"></div>
            <div>
              <strong>EXPLORING TARGET WITH HEADLESS CHROMIUM CLUSTER</strong>
              <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '2px' }}>
                Following same-origin links, checking console logs, evaluating accessibility, capturing viewport screenshots...
              </div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="error-banner">
            <AlertTriangle size={16} />
            <div>
              <strong>Exploration Blocked:</strong> {errorMsg}
              <div style={{ fontSize: '0.78rem', marginTop: '4px', opacity: 0.9 }}>
                Remediation: Target URL must be an accessible, public HTTP/HTTPS endpoint. Private IPs (127.0.0.1, 192.168.x, 10.x) and metadata endpoints are strictly rejected by SSRF filters.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exploration Results */}
      {results && (
        <div className="explorer-results-area animate-fade-in">
          {/* Summary Strip */}
          <div className="results-summary-cards">
            <div className="result-metric-card neon-card">
              <span className="res-title">PAGES CRAWLED</span>
              <span className="res-digit text-cyan-neon">{results.pages_explored}</span>
            </div>
            <div className="result-metric-card neon-card">
              <span className="res-title">DURATION</span>
              <span className="res-digit">{results.duration_seconds}s</span>
            </div>
            <div className="result-metric-card neon-card">
              <span className="res-title text-red-neon">ANOMALIES FOUND</span>
              <span className="res-digit text-red-neon">{results.findings.length}</span>
            </div>
            <div className="result-metric-card neon-card">
              <span className="res-title text-green-pass">ACTION</span>
              <button 
                className="btn-neon-cyan mini-btn" 
                style={{ marginTop: '4px' }}
                onClick={() => {
                  sound.drone();
                  onNavigateToTestGen(results);
                }}
              >
                <FileCode2 size={13} /> GENERATE TESTS
              </button>
            </div>
          </div>

          {/* Observations List */}
          <div className="observations-panel neon-card">
            <div className="panel-title-bar">
              <span>EXPLORATION OBSERVATIONS & ELEMENT MAP</span>
              <span className="badge-low">{results.observations.length} PAGES VISITED</span>
            </div>

            <div className="observations-list">
              {results.observations.map((obs, idx) => (
                <div key={idx} className="observation-card">
                  <div className="obs-header">
                    <div className="obs-title-wrap">
                      <span className="obs-status-code">{obs.status_code || 200}</span>
                      <h3 className="obs-title">{obs.title}</h3>
                      <code className="obs-url">{obs.url}</code>
                    </div>

                    {obs.screenshot_url && (
                      <button 
                        className="btn-secondary mini-btn"
                        onClick={() => {
                          sound.click();
                          setPreviewScreenshot(obs.screenshot_url);
                        }}
                      >
                        <Camera size={14} className="text-red-neon" />
                        <span>VIEW SCREENSHOT</span>
                      </button>
                    )}
                  </div>

                  <div className="obs-metrics-grid">
                    <div className="obs-metric-chip">
                      <span>Links:</span>
                      <strong>{obs.links?.length || 0}</strong>
                    </div>
                    <div className="obs-metric-chip">
                      <span>Buttons:</span>
                      <strong>{obs.buttons?.length || 0}</strong>
                    </div>
                    <div className="obs-metric-chip">
                      <span>Inputs:</span>
                      <strong>{obs.inputs?.length || 0}</strong>
                    </div>
                    <div className="obs-metric-chip">
                      <span>Forms:</span>
                      <strong>{obs.forms?.length || 0}</strong>
                    </div>
                    <div className="obs-metric-chip">
                      <span>Console Errors:</span>
                      <strong className={obs.console_errors?.length ? 'text-red-neon' : ''}>
                        {obs.console_errors?.length || 0}
                      </strong>
                    </div>
                  </div>

                  {/* Discovered interactive buttons preview */}
                  {obs.buttons?.length > 0 && (
                    <div className="obs-elements-preview">
                      <span className="preview-lbl">Visible Buttons:</span>
                      <div className="preview-tags">
                        {obs.buttons.slice(0, 8).map((b, bIdx) => (
                          <span key={bIdx} className="element-tag">{b}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Console Errors if any */}
                  {obs.console_errors?.length > 0 && (
                    <div className="console-errors-alert">
                      <span className="alert-title flex-center gap-1 text-red-neon">
                        <Flame size={13} /> CLIENT CONSOLE EXCEPTIONS:
                      </span>
                      {obs.console_errors.map((err, eIdx) => (
                        <div key={eIdx} className="console-err-row font-mono">{err}</div>
                      ))}
                    </div>
                  )}

                  {/* A11y Observations */}
                  {obs.a11y_issues?.length > 0 && (
                    <div className="a11y-notes-box">
                      <span className="a11y-title">Accessibility Observations:</span>
                      <ul>
                        {obs.a11y_issues.map((a11y, aIdx) => (
                          <li key={aIdx}>{a11y}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Preview Modal */}
      {previewScreenshot && (
        <div className="modal-backdrop" onClick={() => setPreviewScreenshot(null)}>
          <div className="modal-container neon-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="section-title">HEADLESS BROWSER SCREENSHOT CAPTURE</span>
              <button className="modal-close-btn" onClick={() => setPreviewScreenshot(null)}>✕</button>
            </div>
            <div className="screenshot-img-wrap">
              <img 
                src={getScreenshotUrl(previewScreenshot)} 
                alt="Exploration Screenshot" 
                className="full-screenshot-img"
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clear */}
      <ConfirmationModal 
        isOpen={showClearConfirm}
        title="CLEAR EXPLORATION RESULTS"
        message="Are you sure you want to clear current exploration observations and screenshot evidence from view?"
        confirmLabel="CLEAR RESULTS"
        cancelLabel="CANCEL"
        severity="warning"
        onConfirm={handleConfirmClear}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}
