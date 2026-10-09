import React from 'react';
import { 
  CheckCircle, 
  Bug, 
  Percent, 
  ShieldCheck, 
  TrendingUp, 
  Flame, 
  Radar 
} from 'lucide-react';

export default function SummaryMetrics({ metrics, isTesting }) {
  return (
    <div className="metrics-grid">
      {/* Metric 1: Tests Run */}
      <div className={`metric-card neon-card ${isTesting ? 'pulse-border' : ''}`}>
        <div className="metric-header">
          <span className="metric-title">TESTS EXECUTED</span>
          <div className="metric-icon-wrap text-cyan-neon">
            <CheckCircle size={20} />
          </div>
        </div>
        <div className="metric-value-wrap">
          <span className="metric-value">{metrics.testsRun}</span>
          <span className="metric-sub">/ 84 PLANNED</span>
        </div>
        <div className="metric-footer">
          <span className="metric-trend text-cyan-neon flex-center gap-1">
            <TrendingUp size={13} /> Autonomous suites active
          </span>
          <span className="metric-pulse-tag">LIVE</span>
        </div>
      </div>

      {/* Metric 2: Bugs Found */}
      <div className="metric-card neon-card bug-metric-card">
        <div className="metric-header">
          <span className="metric-title">BUGS & ANOMALIES</span>
          <div className="metric-icon-wrap text-red-neon">
            <Bug size={20} />
          </div>
        </div>
        <div className="metric-value-wrap">
          <span className="metric-value text-red-neon">{metrics.bugsFound}</span>
          <span className="metric-sub text-red-glow">FLAW DETECTIONS</span>
        </div>
        <div className="metric-footer">
          <span className="metric-trend text-red-neon flex-center gap-1">
            <Flame size={13} /> 2 Critical vulnerabilities
          </span>
          <span className="badge-critical">ISOLATED</span>
        </div>
      </div>

      {/* Metric 3: Pass Rate */}
      <div className="metric-card neon-card">
        <div className="metric-header">
          <span className="metric-title">PASS RATE</span>
          <div className="metric-icon-wrap text-green-pass">
            <Percent size={20} />
          </div>
        </div>
        <div className="metric-value-wrap">
          <span className="metric-value">{metrics.passRate.toFixed(1)}%</span>
          <span className="metric-sub">STABILITY QUOTIENT</span>
        </div>
        <div className="metric-footer">
          <span className="metric-trend text-green-pass flex-center gap-1">
            <ShieldCheck size={13} /> Verified across 4 browsers
          </span>
          <span className="metric-pulse-tag">TARGET &gt;90%</span>
        </div>
      </div>

      {/* Metric 4: Code & Surface Coverage */}
      <div className="metric-card neon-card">
        <div className="metric-header">
          <span className="metric-title">SURFACE COVERAGE</span>
          <div className="metric-icon-wrap text-amber-warning">
            <Radar size={20} />
          </div>
        </div>
        <div className="metric-value-wrap">
          <span className="metric-value">{metrics.coverage.toFixed(1)}%</span>
          <span className="metric-sub">DOM & API REACH</span>
        </div>
        <div className="metric-footer">
          <span className="metric-trend text-amber-warning flex-center gap-1">
            <TrendingUp size={13} /> 38 Interactive routes mapped
          </span>
          <span className="metric-pulse-tag">AUDITED</span>
        </div>
      </div>
    </div>
  );
}
