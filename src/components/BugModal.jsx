import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  Copy, 
  Check, 
  Terminal, 
  Camera, 
  Flame, 
  Cpu, 
  ExternalLink 
} from 'lucide-react';
import { sound } from '../soundEffects';

export default function BugModal({ bug, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!bug) return null;

  const handleCopyCode = () => {
    sound.click();
    navigator.clipboard.writeText(bug.codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityBadgeClass = (sev) => {
    switch (sev) {
      case 'CRITICAL': return 'badge-critical';
      case 'HIGH': return 'badge-high';
      case 'MEDIUM': return 'badge-medium';
      default: return 'badge-low';
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-container neon-card active-rift"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-row">
            <span className={getSeverityBadgeClass(bug.severity)}>{bug.severity}</span>
            <span className="modal-id">{bug.id}</span>
            <span className="modal-timestamp">LOGGED AT {bug.discoveredAt}</span>
          </div>
          <button 
            className="modal-close-btn" 
            onClick={() => {
              sound.click();
              onClose();
            }}
          >
            <X size={20} />
          </button>
        </div>

        <h2 className="modal-bug-title">{bug.title}</h2>
        <div className="modal-meta-row">
          <span>Target Route: <code>{bug.route}</code></span>
          <span>Component: <code>{bug.component}</code></span>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Mock Screenshot Placeholder with Red Glowing Highlight */}
          <div className="screenshot-section">
            <div className="screenshot-header">
              <Camera size={15} className="text-red-neon" />
              <span>DEFECT SNAPSHOT (HAWKINS LAB OCR CAPTURE)</span>
              <span className="screenshot-tag">{bug.screenshot.tag}</span>
            </div>

            <div className="mock-browser-window">
              <div className="browser-toolbar">
                <span className="browser-dot red"></span>
                <span className="browser-dot yellow"></span>
                <span className="browser-dot green"></span>
                <span className="browser-url-bar">{bug.route}</span>
              </div>
              <div className="browser-viewport">
                {/* Simulated UI Content */}
                <div className="viewport-wireframe">
                  <div className="mock-nav-bar"></div>
                  <div className="mock-hero-bar"></div>
                  <div className="mock-content-grid">
                    <div className="mock-panel"></div>
                    <div className="mock-panel"></div>
                  </div>
                  {/* Glowing Defect Box */}
                  <div 
                    className="defect-bounding-box"
                    style={{
                      top: bug.screenshot.highlightBox.y,
                      left: bug.screenshot.highlightBox.x,
                      width: bug.screenshot.highlightBox.width,
                      height: bug.screenshot.highlightBox.height
                    }}
                  >
                    <span className="bounding-label">
                      <Flame size={12} /> {bug.severity} ANOMALY DETECTED
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reproduction Steps */}
          <div className="repro-section">
            <h3 className="section-sub-title flex-center gap-2">
              <Terminal size={16} className="text-cyan-neon" /> 
              AUTONOMOUS REPRODUCTION STEPS
            </h3>
            <ol className="repro-steps-list">
              {bug.reproductionSteps.map((step, idx) => (
                <li key={idx} className="repro-step-item">
                  <span className="step-num">{idx + 1}</span>
                  <span className="step-text">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* AI Root-Cause Analysis */}
          <div className="analysis-section">
            <h3 className="section-sub-title flex-center gap-2">
              <Cpu size={16} className="text-amber-warning" /> 
              TESTPILOT AI ROOT-CAUSE DIAGNOSTIC
            </h3>
            <div className="analysis-box">
              <p>{bug.aiAnalysis}</p>
              <div className="remediation-box">
                <strong>Recommended Fix:</strong> {bug.remediation}
              </div>
            </div>
          </div>

          {/* Suggested Code Fix */}
          <div className="code-fix-section">
            <div className="code-header">
              <span>PATCH RECOMMENDATION</span>
              <button 
                className="btn-secondary copy-btn"
                onClick={handleCopyCode}
              >
                {copied ? <Check size={14} className="text-green-pass" /> : <Copy size={14} />}
                <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY PATCH'}</span>
              </button>
            </div>
            <pre className="retro-code">
              <code>{bug.codeSnippet}</code>
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button 
            className="btn-secondary"
            onClick={onClose}
          >
            DISMISS
          </button>
          <button 
            className="btn-neon-red"
            onClick={() => {
              sound.click();
              alert(`Synthesized regression test for ${bug.id} has been added to the test queue!`);
              onClose();
            }}
          >
            AUTONOMOUSLY GENERATE REGRESSION SPEC
          </button>
        </div>
      </div>
    </div>
  );
}
