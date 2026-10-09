import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Trash2, 
  Download, 
  Camera, 
  FileCode2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  Flame, 
  RotateCcw,
  ShieldAlert,
  ExternalLink
} from 'lucide-react';
import { fetchReports, fetchReportDetails, deleteReportApi, getScreenshotUrl } from '../services/api';
import { sound } from '../soundEffects';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [deleteModalReport, setDeleteModalReport] = useState(null);
  const [previewScreenshot, setPreviewScreenshot] = useState(null);

  const { success, error, info } = useToast();

  useEffect(() => {
    loadReports(false);
  }, [filterSeverity]);

  const loadReports = async (isManual = false) => {
    setLoading(true);
    try {
      const data = await fetchReports({
        search: searchQuery,
        severity: filterSeverity
      });
      setReports(data || []);
      if (data && data.length > 0 && !selectedReport) {
        loadDetail(data[0].id);
      }
      if (isManual) {
        info(`Synchronized ${data?.length || 0} audit report(s) from SQLite database.`, 'DATABASE SYNCED');
      }
    } catch (err) {
      if (isManual) {
        error(`Failed to refresh reports: ${err.message}`, 'SYNC FAILED');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id) => {
    try {
      const det = await fetchReportDetails(id);
      setSelectedReport(det);
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id) => {
    sound.warp();
    try {
      await deleteReportApi(id);
      setReports(reports.filter(r => r.id !== id));
      if (selectedReport?.id === id) {
        setSelectedReport(null);
      }
      setDeleteModalReport(null);
      success(`Audit report ${id} has been permanently purged from SQLite.`, 'REPORT PURGED');
    } catch (err) {
      error(`Deletion failed: ${err.message}`, 'PURGE FAILED');
    }
  };

  const handleExportJSON = (report) => {
    sound.click();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TestPilot_Report_${report.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
    info(`Audit report ${report.id} exported as JSON dossier.`, 'DOSSIER EXPORTED');
  };

  const handleDownloadTestFile = (report) => {
    if (!report?.generated_tests) return;
    sound.click();
    const blob = new Blob([report.generated_tests], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test_suite_${report.id}.py`;
    link.click();
    URL.revokeObjectURL(url);
    success(`Playwright Python test suite for ${report.id} downloaded successfully.`, 'SPEC DOWNLOADED');
  };

  const getSeverityBadge = (sev) => {
    switch ((sev || '').toUpperCase()) {
      case 'CRITICAL': return <span className="badge-critical">CRITICAL</span>;
      case 'HIGH': return <span className="badge-high">HIGH</span>;
      case 'MEDIUM': return <span className="badge-medium">MEDIUM</span>;
      case 'LOW': return <span className="badge-low">LOW</span>;
      default: return <span className="badge-low">INFO</span>;
    }
  };

  return (
    <div className="reports-page">
      <div className="page-header-row">
        <div>
          <h1 className="stranger-title neon-flicker">MODULE E: BUG REPORTS & EVIDENCE DOSSIER</h1>
          <p className="page-subtitle">
            Permanent SQLite audit log with screenshot evidence, reproduction steps, confidence metrics, and JSON export.
          </p>
        </div>

        <button className="btn-secondary" onClick={() => loadReports(true)}>
          <RotateCcw size={14} /> REFRESH REPORTS
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="reports-filter-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search report by URL, target or report ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadReports()}
          />
        </div>

        <div className="severity-filter-group">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
            <button
              key={s}
              className={`filter-btn ${filterSeverity === s ? 'active' : ''}`}
              onClick={() => {
                sound.click();
                setFilterSeverity(s);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Main Dual Grid: List on Left, Detail on Right */}
      <div className="reports-dual-layout">
        {/* Reports List */}
        <div className="reports-list-panel neon-card">
          <div className="panel-title-bar">
            <span>SAVED AUDIT REPORTS ({reports.length})</span>
            <span className="badge-low">SQLITE</span>
          </div>

          <div className="reports-scroll-container">
            {reports.length === 0 ? (
              <div className="empty-panel-box">
                <FileText size={32} className="text-text-dim" />
                <p>No audit reports found. Run an exploration or analysis scan to save evidence.</p>
              </div>
            ) : (
              reports.map((r) => {
                const isSelected = selectedReport?.id === r.id;
                return (
                  <div 
                    key={r.id} 
                    className={`report-list-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      sound.click();
                      loadDetail(r.id);
                    }}
                  >
                    <div className="report-item-header">
                      <span className="report-id-pill font-mono">{r.id}</span>
                      <span className="report-source-pill">{r.source_type?.toUpperCase()}</span>
                      <span className="report-time font-mono">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="report-item-target">{r.target}</h4>

                    <div className="report-item-footer">
                      <span className="badge-critical mini">
                        {r.findings_count || 0} ANOMALIES
                      </span>
                      <button 
                        className="delete-report-mini"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModalReport(r);
                        }}
                        title="Delete report"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Report Detail View */}
        <div className="report-detail-panel neon-card">
          {!selectedReport ? (
            <div className="empty-panel-box">
              <Eye size={36} className="text-text-dim" />
              <h3>SELECT A REPORT TO INSPECT EVIDENCE</h3>
              <p>Choose an audit record from the left list to review detailed findings, screenshots, and test scripts.</p>
            </div>
          ) : (
            <div className="detail-content-wrapper">
              <div className="detail-top-bar">
                <div>
                  <div className="flex-center gap-2">
                    <span className="report-big-id font-mono text-cyan-neon">{selectedReport.id}</span>
                    <span className="badge-low">{selectedReport.source_type.toUpperCase()}</span>
                  </div>
                  <h2 className="detail-target-title">{selectedReport.target}</h2>
                  <span className="detail-timestamp font-mono">
                    LOGGED AT: {selectedReport.created_at}
                  </span>
                </div>

                <div className="detail-actions-group">
                  <button 
                    className="btn-secondary mini-btn"
                    onClick={() => handleExportJSON(selectedReport)}
                  >
                    <Download size={13} /> EXPORT JSON
                  </button>
                  {selectedReport.generated_tests && (
                    <button 
                      className="btn-neon-cyan mini-btn"
                      onClick={() => handleDownloadTestFile(selectedReport)}
                    >
                      <FileCode2 size={13} /> DOWNLOAD .PY TEST
                    </button>
                  )}
                  <button 
                    className="btn-secondary mini-btn border-red"
                    onClick={() => setDeleteModalReport(selectedReport)}
                  >
                    <Trash2 size={13} /> DELETE
                  </button>
                </div>
              </div>

              {/* Screenshots preview strip if any */}
              {selectedReport.evidence?.screenshots && selectedReport.evidence.screenshots.length > 0 && (
                <div className="screenshots-strip-card">
                  <span className="strip-title flex-center gap-1 text-red-neon">
                    <Camera size={14} /> CAPTURED SCREENSHOT EVIDENCE:
                  </span>
                  <div className="screenshots-row">
                    {selectedReport.evidence.screenshots.map((sc, scIdx) => (
                      <div 
                        key={scIdx} 
                        className="screenshot-thumb-wrap"
                        onClick={() => setPreviewScreenshot(sc.path)}
                      >
                        <img 
                          src={getScreenshotUrl(sc.path)} 
                          alt="Screenshot" 
                          className="screenshot-thumb"
                        />
                        <span className="thumb-label">PAGE {scIdx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Findings List */}
              <div className="detail-findings-section">
                <span className="findings-section-title">
                  ISOLATED DEFECTS & VULNERABILITIES ({selectedReport.findings?.length || 0})
                </span>

                <div className="findings-cards-list">
                  {selectedReport.findings?.map((f, fIdx) => (
                    <div key={fIdx} className="finding-detail-card">
                      <div className="finding-card-header">
                        <div className="flex-center gap-2">
                          {getSeverityBadge(f.severity)}
                          <span className="finding-id font-mono">{f.id}</span>
                          <span className="confidence-tag">CONFIDENCE: {f.confidence || 'HIGH'}</span>
                        </div>
                        {f.line && <span className="font-mono text-cyan-neon">LINE {f.line}</span>}
                      </div>

                      <h4 className="finding-issue-title">{f.issue}</h4>
                      <p className="finding-explanation">{f.explanation}</p>

                      <div className="finding-remediation-box">
                        <strong>Remediation:</strong> {f.suggested_fix}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generated Test Spec preview */}
              {selectedReport.generated_tests && (
                <div className="detail-tests-section">
                  <span className="findings-section-title">ASSOCIATED PLAYWRIGHT TEST SUITE</span>
                  <pre className="retro-code detail-code">
                    <code>{selectedReport.generated_tests}</code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal 
        isOpen={Boolean(deleteModalReport)}
        title="CONFIRM REPORT PERMANENT PURGE"
        message={`Are you sure you want to permanently delete audit report "${deleteModalReport?.id}" (${deleteModalReport?.target})? All stored screenshot evidence and findings will also be purged from the SQLite database.`}
        confirmLabel="YES, PERMANENTLY PURGE REPORT"
        cancelLabel="CANCEL"
        onConfirm={() => deleteModalReport && handleDelete(deleteModalReport.id)}
        onCancel={() => setDeleteModalReport(null)}
        severity="danger"
      />

      {/* Screenshot Preview Modal */}
      {previewScreenshot && (
        <div className="modal-backdrop" onClick={() => setPreviewScreenshot(null)}>
          <div className="modal-container neon-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="section-title">AUDIT SCREENSHOT CAPTURE</span>
              <button className="modal-close-btn" onClick={() => setPreviewScreenshot(null)}>✕</button>
            </div>
            <div className="screenshot-img-wrap">
              <img 
                src={getScreenshotUrl(previewScreenshot)} 
                alt="Audit Evidence" 
                className="full-screenshot-img"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
