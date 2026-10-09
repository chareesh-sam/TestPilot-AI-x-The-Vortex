import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  CheckCircle, 
  Flame, 
  Activity 
} from 'lucide-react';
import { sound } from '../soundEffects';

export default function ReportsModule({ metrics, targetUrl }) {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const coverageItems = [
    { name: 'E2E Critical User Journeys', value: 96.4, color: '#00f0ff' },
    { name: 'REST & GraphQL API Contracts', value: 92.1, color: '#00ff88' },
    { name: 'Component Shadow DOM States', value: 88.5, color: '#ffaa00' },
    { name: 'WCAG 2.1 A11y Compliance', value: 94.8, color: '#ff1744' }
  ];

  const handleExportJSON = () => {
    sound.click();
    const reportData = {
      product: 'TestPilot AI Autonomous Agent',
      version: '2.4-UPSIDEDOWN',
      timestamp: new Date().toISOString(),
      targetUrl: targetUrl || 'https://hawkins-lab.doe.gov/portal',
      metrics: {
        testsRun: metrics.testsRun,
        bugsFound: metrics.bugsFound,
        passRate: `${metrics.passRate.toFixed(1)}%`,
        coverage: `${metrics.coverage.toFixed(1)}%`
      },
      verdict: metrics.passRate >= 90 ? 'PASSED_WITH_CONDITIONS' : 'CONTAINS_CRITICAL_ANOMALIES',
      generatedBy: 'TEAM VORTEX'
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TestPilot-Audit-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="module-container reports-module">
      <div className="module-header-row">
        <div>
          <h2 className="module-title flex-center gap-2">
            <BarChart3 className="text-red-neon" size={20} />
            EXECUTIVE AUDIT & COVERAGE REPORTS
          </h2>
          <p className="module-desc">
            Dimensional penetration metrics, regression pass-rates, and autonomous certification sign-off.
          </p>
        </div>

        <div className="report-action-buttons">
          <button 
            className="btn-neon-cyan download-btn"
            onClick={handleExportJSON}
          >
            <Download size={15} />
            <span>{downloadSuccess ? 'REPORT EXPORTED!' : 'EXPORT JSON AUDIT'}</span>
          </button>
        </div>
      </div>

      <div className="reports-grid">
        {/* Pass / Fail Donut & Results Card */}
        <div className="report-card neon-card">
          <div className="panel-title-bar">
            <span>TEST SUITE EXECUTION BREAKDOWN</span>
            <span className="badge-low">84 SPECS</span>
          </div>

          <div className="chart-flex-box">
            {/* SVG Donut Visualizer */}
            <div className="donut-chart-wrap">
              <svg viewBox="0 0 100 100" className="donut-svg">
                {/* Background Ring */}
                <circle 
                  cx="50" cy="50" r="38" 
                  fill="transparent" 
                  stroke="rgba(255, 255, 255, 0.08)" 
                  strokeWidth="12" 
                />
                {/* Failed Arc (8.4%) */}
                <circle 
                  cx="50" cy="50" r="38" 
                  fill="transparent" 
                  stroke="#ff113a" 
                  strokeWidth="12" 
                  strokeDasharray="20 218"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
                {/* Passed Arc (91.6%) */}
                <circle 
                  cx="50" cy="50" r="38" 
                  fill="transparent" 
                  stroke="#00ff88" 
                  strokeWidth="12" 
                  strokeDasharray="218 20"
                  strokeDashoffset="-25"
                  strokeLinecap="round"
                />
              </svg>
              <div className="donut-center-label">
                <span className="donut-percentage">{metrics.passRate.toFixed(1)}%</span>
                <span className="donut-sub">PASS RATE</span>
              </div>
            </div>

            {/* Breakdown Legend */}
            <div className="donut-legend">
              <div className="legend-row">
                <span className="legend-bullet pass"></span>
                <span className="legend-name">Passed Specs:</span>
                <span className="legend-value text-green-pass">77 (91.6%)</span>
              </div>
              <div className="legend-row">
                <span className="legend-bullet fail"></span>
                <span className="legend-name">Failed / Anomalies:</span>
                <span className="legend-value text-red-neon">7 (8.4%)</span>
              </div>
              <div className="legend-row">
                <span className="legend-bullet skip"></span>
                <span className="legend-name">Flaky / Skipped:</span>
                <span className="legend-value text-text-dim">0 (0.0%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coverage Spectrum Bars */}
        <div className="report-card neon-card">
          <div className="panel-title-bar">
            <span>SURFACE PENETRATION COVERAGE</span>
            <span className="badge-medium">94.2% OVERALL</span>
          </div>

          <div className="coverage-bars-container">
            {coverageItems.map((cov) => (
              <div key={cov.name} className="cov-bar-row">
                <div className="cov-label-row">
                  <span className="cov-name">{cov.name}</span>
                  <span className="cov-val" style={{ color: cov.color }}>{cov.value}%</span>
                </div>
                <div className="cov-track">
                  <div 
                    className="cov-fill" 
                    style={{ 
                      width: `${cov.value}%`, 
                      backgroundColor: cov.color,
                      boxShadow: `0 0 10px ${cov.color}88`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hawkins Laboratory Threat Matrix */}
        <div className="report-card neon-card full-width-card">
          <div className="panel-title-bar">
            <span>HAWKINS LAB DIMENSIONAL THREAT ASSESSMENT</span>
            <span className="badge-critical">RESTRICTED DOSSIER</span>
          </div>

          <div className="threat-matrix-grid">
            <div className="threat-item">
              <span className="threat-title">CONTAINMENT SHIELD INTEGRITY</span>
              <div className="threat-status-row">
                <span className="threat-metric text-green-pass">98.9% STABLE</span>
                <span className="threat-tag tag-safe">SECURE</span>
              </div>
              <p className="threat-desc">No anomalous breaches detected in production deployment pipelines.</p>
            </div>

            <div className="threat-item">
              <span className="threat-title">MEMORY SPORE CONTAMINATION</span>
              <div className="threat-status-row">
                <span className="threat-metric text-red-neon">ELEVATED</span>
                <span className="threat-tag tag-danger">DEFECT #4091</span>
              </div>
              <p className="threat-desc">Reactor monitor DOM heap overflow requires emergency patch cycle.</p>
            </div>

            <div className="threat-item">
              <span className="threat-title">BIOMETRIC REPLAY VULNERABILITY</span>
              <div className="threat-status-row">
                <span className="threat-metric text-amber-warning">LEVEL 5 RISK</span>
                <span className="threat-tag tag-warn">DEFECT #4092</span>
              </div>
              <p className="threat-desc">Redis distributed lock remediation mandated prior to prod sign-off.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
