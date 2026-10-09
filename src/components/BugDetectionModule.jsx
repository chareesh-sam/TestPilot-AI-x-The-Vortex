import React, { useState } from 'react';
import { 
  Bug, 
  Search, 
  Filter, 
  Eye, 
  Flame, 
  AlertOctagon, 
  ShieldCheck, 
  Cpu 
} from 'lucide-react';
import { SAMPLE_BUGS } from '../mockData';
import BugModal from './BugModal';
import { sound } from '../soundEffects';

export default function BugDetectionModule({ discoveredBugs = SAMPLE_BUGS }) {
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBug, setSelectedBug] = useState(null);

  const filteredBugs = discoveredBugs.filter((bug) => {
    const matchesSev = filterSeverity === 'ALL' || bug.severity === filterSeverity;
    const matchesSearch = 
      bug.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bug.component.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bug.route.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesSearch;
  });

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL': return <span className="badge-critical">CRITICAL</span>;
      case 'HIGH': return <span className="badge-high">HIGH</span>;
      case 'MEDIUM': return <span className="badge-medium">MEDIUM</span>;
      default: return <span className="badge-low">LOW</span>;
    }
  };

  const criticalCount = discoveredBugs.filter(b => b.severity === 'CRITICAL').length;
  const highCount = discoveredBugs.filter(b => b.severity === 'HIGH').length;

  return (
    <div className="module-container bug-module">
      {/* Module Sub-Header */}
      <div className="module-header-row">
        <div>
          <h2 className="module-title flex-center gap-2">
            <Bug className="text-red-neon" size={20} />
            AUTONOMOUS BUG & ANOMALY DETECTOR
          </h2>
          <p className="module-desc">
            Neural crawler detects race conditions, memory leaks, hydration bugs, and DOM accessibility traps.
          </p>
        </div>

        <div className="bug-stats-chips">
          <span className="badge-critical flex-center gap-1">
            <Flame size={12} /> {criticalCount} CRITICAL
          </span>
          <span className="badge-high flex-center gap-1">
            <AlertOctagon size={12} /> {highCount} HIGH
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-search-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input 
            type="text"
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bugs by route, component, or defect name..."
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        <div className="severity-filter-group">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              className={`filter-btn ${filterSeverity === sev ? 'active' : ''}`}
              onClick={() => {
                sound.click();
                setFilterSeverity(sev);
              }}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Bugs Grid */}
      <div className="bugs-grid">
        {filteredBugs.length === 0 ? (
          <div className="no-bugs-box neon-card">
            <ShieldCheck size={36} className="text-green-pass" />
            <p>No anomalies detected matching the current filters.</p>
          </div>
        ) : (
          filteredBugs.map((bug) => (
            <div 
              key={bug.id} 
              className={`bug-card neon-card ${bug.severity === 'CRITICAL' ? 'border-critical' : ''}`}
            >
              <div className="bug-card-top">
                <div className="flex-center gap-2">
                  {getSeverityBadge(bug.severity)}
                  <span className="bug-id-tag">{bug.id}</span>
                </div>
                <span className="bug-time">{bug.discoveredAt}</span>
              </div>

              <h3 className="bug-title">{bug.title}</h3>

              <div className="bug-location-box">
                <div className="location-item">
                  <span className="loc-label">Route:</span>
                  <code className="loc-value">{bug.route}</code>
                </div>
                <div className="location-item">
                  <span className="loc-label">Component:</span>
                  <code className="loc-value">{bug.component}</code>
                </div>
              </div>

              <p className="bug-summary-text">
                {bug.aiAnalysis.slice(0, 115)}...
              </p>

              <div className="bug-card-actions">
                <button 
                  className="btn-secondary inspect-btn"
                  onClick={() => {
                    sound.drone();
                    setSelectedBug(bug);
                  }}
                >
                  <Eye size={14} className="text-red-neon" />
                  <span>INSPECT ANOMALY</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Selected Bug Modal */}
      {selectedBug && (
        <BugModal 
          bug={selectedBug} 
          onClose={() => setSelectedBug(null)} 
        />
      )}
    </div>
  );
}
