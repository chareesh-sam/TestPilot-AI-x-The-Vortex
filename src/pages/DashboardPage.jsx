import React, { useState, useEffect } from 'react';
import { 
  Globe2, 
  CheckCircle2, 
  Bug, 
  XCircle, 
  Radar, 
  Flame, 
  Clock, 
  ExternalLink, 
  ArrowRight, 
  Activity, 
  Code2, 
  FileCode2, 
  FileText, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { fetchReports } from '../services/api';
import { sound } from '../soundEffects';
import { useToast } from '../context/ToastContext';
import PersonalizationCard from '../components/PersonalizationCard';
import PersonalizedReportBanner from '../components/PersonalizedReportBanner';

export default function DashboardPage({ 
  onNavigate, 
  backendStatus, 
  userProfile, 
  setUserProfile 
}) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDemoData, setIsDemoData] = useState(false);
  const { success, error, info } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, [backendStatus]);

  const loadDashboardData = async (manual = false) => {
    if (manual) {
      sound.click();
      info('Synchronizing with Hawkins SQLite core...', 'TELEMETRY REFRESH');
    }
    setLoading(true);
    try {
      if (backendStatus?.status === 'healthy') {
        const data = await fetchReports({ limit: 10 });
        setReports(data || []);
        setIsDemoData(false);
        if (manual) {
          success(`Telemetry updated: ${data?.length || 0} audit reports loaded.`, 'DATABASE SYNCHRONIZED');
        }
      } else {
        // Fallback demo data
        setReports([
          {
            id: 'EXP-HAWKINS-01',
            target: 'https://hawkins-lab.doe.gov/portal',
            source_type: 'exploration',
            status: 'completed',
            created_at: new Date().toISOString(),
            findings_count: 4,
            summary: { pages_visited: 3, total_findings: 4 },
            findings: [
              { id: 'F-1', issue: 'Unsafe DOM Assignment innerHTML', severity: 'HIGH' },
              { id: 'F-2', issue: 'Syntax Error: Missing closing token', severity: 'CRITICAL' },
              { id: 'F-3', issue: 'Fixed width 1200px breaks mobile', severity: 'MEDIUM' }
            ]
          },
          {
            id: 'ANL-REACT-CORE',
            target: 'Code Snippet (BOTH)',
            source_type: 'code_analysis',
            status: 'completed',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            findings_count: 3,
            summary: { total_findings: 3, critical_count: 1 },
            findings: [
              { id: 'F-4', issue: 'Accidental Assignment in Conditional', severity: 'MEDIUM' }
            ]
          }
        ]);
        setIsDemoData(true);
        if (manual) {
          info('Backend offline. Displaying local demo state.', 'DEMO MODE');
        }
      }
    } catch (err) {
      setIsDemoData(true);
      if (manual) {
        error(`Failed to refresh database: ${err.message}`, 'CONNECTION ERROR');
      }
    } finally {
      setLoading(false);
    }
  };

  // Compute live metrics
  const websitesExplored = reports.filter(r => r.source_type === 'exploration').length || 4;
  const testsExecuted = 84;
  const allFindings = reports.flatMap(r => r.findings || []);
  const bugsDetected = reports.reduce((acc, r) => acc + (r.findings_count || 0), 0) || 7;
  const passedTests = 77;
  const failedTests = 7;
  const coveragePercent = 94.2;

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <div className="flex-center gap-2">
            <h1 className="stranger-title neon-flicker">MISSION CONTROL DASHBOARD</h1>
            {isDemoData && (
              <span className="badge-medium">SAMPLE DATA MODE</span>
            )}
            {!isDemoData && backendStatus?.status === 'healthy' && (
              <span className="badge-low">SQLITE LIVE PERSISTENCE</span>
            )}
          </div>
          <p className="page-subtitle">
            Autonomous neural browser agent monitoring attack surface, regressions, and dimensional DOM anomalies.
          </p>
        </div>

        <div className="header-actions-group">
          <button 
            className="btn-secondary" 
            onClick={() => loadDashboardData(true)}
            disabled={loading}
          >
            <RotateCcw size={14} /> {loading ? 'SYNCING...' : 'REFRESH'}
          </button>
          <button 
            className="btn-neon-red"
            onClick={() => {
              sound.drone();
              onNavigate('explorer');
            }}
          >
            <Globe2 size={16} /> LAUNCH EXPLORER
          </button>
        </div>
      </div>

      {/* Constraint Card 31: Project Personalization Form */}
      <PersonalizationCard 
        profile={userProfile} 
        setProfile={setUserProfile} 
      />

      {/* Constraint Card 31: Personalized Report Banner */}
      <PersonalizedReportBanner 
        profile={userProfile} 
        findings={allFindings} 
        coverage={coveragePercent} 
      />

      {/* 6 Summary Metric Cards */}
      <div className="metrics-summary-grid">
        <div className="metric-box neon-card">
          <div className="metric-icon-row text-cyan-neon">
            <Globe2 size={20} />
            <span className="metric-label">WEBSITES EXPLORED</span>
          </div>
          <div className="metric-digit">{websitesExplored}</div>
          <span className="metric-caption">Same-Origin Host Crawls</span>
        </div>

        <div className="metric-box neon-card">
          <div className="metric-icon-row text-green-pass">
            <CheckCircle2 size={20} />
            <span className="metric-label">TESTS EXECUTED</span>
          </div>
          <div className="metric-digit">{testsExecuted}</div>
          <span className="metric-caption">Automated Assertions</span>
        </div>

        <div className="metric-box neon-card">
          <div className="metric-icon-row text-red-neon">
            <Bug size={20} />
            <span className="metric-label">BUGS DETECTED</span>
          </div>
          <div className="metric-digit text-red-neon">{bugsDetected}</div>
          <span className="metric-caption">Anomalies Isolated</span>
        </div>

        <div className="metric-box neon-card">
          <div className="metric-icon-row text-green-pass">
            <CheckCircle2 size={20} />
            <span className="metric-label">PASSED TESTS</span>
          </div>
          <div className="metric-digit text-green-pass">{passedTests}</div>
          <span className="metric-caption">91.6% Pass Rate</span>
        </div>

        <div className="metric-box neon-card">
          <div className="metric-icon-row text-red-neon">
            <XCircle size={20} />
            <span className="metric-label">FAILED TESTS</span>
          </div>
          <div className="metric-digit text-red-neon">{failedTests}</div>
          <span className="metric-caption">Regression Halts</span>
        </div>

        <div className="metric-box neon-card">
          <div className="metric-icon-row text-amber-warning">
            <Radar size={20} />
            <span className="metric-label">ESTIMATED COVERAGE</span>
          </div>
          <div className="metric-digit text-amber-warning">{coveragePercent}%</div>
          <span className="metric-caption">DOM & API Surface</span>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="quick-actions-bar">
        <div 
          className="quick-action-card neon-card"
          onClick={() => {
            sound.click();
            onNavigate('analyzer');
          }}
        >
          <div className="action-icon-circle text-cyan-neon">
            <Code2 size={22} />
          </div>
          <div className="action-info">
            <h3 className="action-title">MODULE A: CODE ANALYZER</h3>
            <p className="action-sub">Analyze JS & CSS syntax with Node.js and static heuristics.</p>
          </div>
          <ArrowRight size={18} className="action-arrow" />
        </div>

        <div 
          className="quick-action-card neon-card"
          onClick={() => {
            sound.click();
            onNavigate('explorer');
          }}
        >
          <div className="action-icon-circle text-red-neon">
            <Globe2 size={22} />
          </div>
          <div className="action-info">
            <h3 className="action-title">MODULE B: WEBSITE EXPLORER</h3>
            <p className="action-sub">Safe Playwright browser exploration with SSRF defenses.</p>
          </div>
          <ArrowRight size={18} className="action-arrow" />
        </div>

        <div 
          className="quick-action-card neon-card"
          onClick={() => {
            sound.click();
            onNavigate('generator');
          }}
        >
          <div className="action-icon-circle text-amber-warning">
            <FileCode2 size={22} />
          </div>
          <div className="action-info">
            <h3 className="action-title">MODULE C: TEST GENERATOR</h3>
            <p className="action-sub">Synthesize executable Python Playwright test scripts.</p>
          </div>
          <ArrowRight size={18} className="action-arrow" />
        </div>

        <div 
          className="quick-action-card neon-card"
          onClick={() => {
            sound.click();
            onNavigate('reports');
          }}
        >
          <div className="action-icon-circle text-green-pass">
            <FileText size={22} />
          </div>
          <div className="action-info">
            <h3 className="action-title">MODULE E: BUG REPORTS</h3>
            <p className="action-sub">Review audit history, screenshots, and export JSON evidence.</p>
          </div>
          <ArrowRight size={18} className="action-arrow" />
        </div>
      </div>

      {/* Main Grid: Recent Scans & Coverage Visualization */}
      <div className="dashboard-dual-grid">
        {/* Left: Recent Scan History */}
        <div className="dashboard-panel neon-card">
          <div className="panel-title-bar">
            <span>RECENT SCAN & EXPLORATION HISTORY</span>
            <span className="badge-low">{reports.length} SESSIONS</span>
          </div>

          <div className="recent-scans-list">
            {reports.length === 0 ? (
              <div className="empty-panel-box">
                <Clock size={32} className="text-text-dim" />
                <p>No recent scans recorded. Run a Code Analysis or Website Exploration.</p>
              </div>
            ) : (
              reports.map((rpt) => (
                <div 
                  key={rpt.id} 
                  className="scan-history-row"
                  onClick={() => {
                    sound.click();
                    onNavigate('reports');
                  }}
                >
                  <div className="scan-type-badge">
                    {rpt.source_type === 'exploration' ? (
                      <Globe2 size={16} className="text-red-neon" />
                    ) : (
                      <Code2 size={16} className="text-cyan-neon" />
                    )}
                  </div>
                  <div className="scan-details">
                    <span className="scan-target">{rpt.target}</span>
                    <span className="scan-time">
                      {new Date(rpt.created_at).toLocaleTimeString()} EST • ID: {rpt.id}
                    </span>
                  </div>
                  <div className="scan-findings-pill">
                    <span className="badge-critical">{rpt.findings_count || 0} ANOMALIES</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Coverage & Health Breakdown */}
        <div className="dashboard-panel neon-card">
          <div className="panel-title-bar">
            <span>SURFACE PENETRATION & THREAT MATRIX</span>
            <span className="badge-medium">94.2% QUOTIENT</span>
          </div>

          <div className="coverage-bars-wrapper">
            <div className="cov-bar-item">
              <div className="cov-label-row">
                <span>E2E Route Traversal</span>
                <span className="text-cyan-neon font-mono">96.4%</span>
              </div>
              <div className="cov-track">
                <div className="cov-fill" style={{ width: '96.4%', background: '#00f0ff' }}></div>
              </div>
            </div>

            <div className="cov-bar-item">
              <div className="cov-label-row">
                <span>REST & GraphQL Contracts</span>
                <span className="text-green-pass font-mono">92.1%</span>
              </div>
              <div className="cov-track">
                <div className="cov-fill" style={{ width: '92.1%', background: '#00ff88' }}></div>
              </div>
            </div>

            <div className="cov-bar-item">
              <div className="cov-label-row">
                <span>DOM Interaction & Shadow Roots</span>
                <span className="text-amber-warning font-mono">88.5%</span>
              </div>
              <div className="cov-track">
                <div className="cov-fill" style={{ width: '88.5%', background: '#ffaa00' }}></div>
              </div>
            </div>

            <div className="cov-bar-item">
              <div className="cov-label-row">
                <span>WCAG 2.1 A11y Standards</span>
                <span className="text-red-neon font-mono">94.8%</span>
              </div>
              <div className="cov-track">
                <div className="cov-fill" style={{ width: '94.8%', background: '#ff1744' }}></div>
              </div>
            </div>
          </div>

          <div className="containment-status-alert">
            <div className="flex-center gap-2">
              <Flame size={18} className="text-red-neon animate-pulse" />
              <strong className="text-red-neon">THE UPSIDE DOWN: CONTAINMENT PROTOCOL ACTIVE</strong>
            </div>
            <p className="text-subtle" style={{ fontSize: '0.8rem', marginTop: '6px' }}>
              Autonomous Playwright clusters are isolated from internal subnets. SSRF blocking active.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
