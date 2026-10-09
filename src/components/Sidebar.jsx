import React from 'react';
import { 
  LayoutDashboard, 
  Code2, 
  Globe2, 
  FileCode2, 
  PlaySquare, 
  FileText, 
  ShieldAlert, 
  Radio, 
  Flame,
  CheckCircle2,
  XCircle,
  Skull
} from 'lucide-react';
import { sound } from '../soundEffects';

export default function Sidebar({ 
  currentPage, 
  setCurrentPage, 
  backendStatus, 
  isUpsideDown 
}) {
  const navItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard, badge: null },
    { id: 'analyzer', label: 'CODE ANALYZER', icon: Code2, badge: 'MOD A' },
    { id: 'explorer', label: 'WEBSITE EXPLORER', icon: Globe2, badge: 'MOD B' },
    { id: 'generator', label: 'TEST GENERATOR', icon: FileCode2, badge: 'MOD C' },
    { id: 'runner', label: 'TEST RUNNER', icon: PlaySquare, badge: 'MOD D' },
    { id: 'reports', label: 'BUG REPORTS', icon: FileText, badge: 'MOD E' },
  ];

  const isConnected = backendStatus?.status === 'healthy';

  return (
    <aside className="app-sidebar neon-card">
      <div className="sidebar-brand">
        <div className="sidebar-logo-mark">
          <span className="brand-icon-flare"></span>
          <span className="brand-main">TESTPILOT</span>
        </div>
        <div className="sidebar-badge-row">
          <span className="sidebar-ai-tag">AI TESTING AGENT</span>
          <span className="sidebar-version">v2.4-HAWKINS</span>
        </div>
      </div>

      {/* Backend Connectivity Status Pill */}
      <div className={`backend-status-card ${isConnected ? 'status-online' : 'status-offline'}`}>
        <div className="status-header">
          {isConnected ? (
            <CheckCircle2 size={14} className="text-green-pass" />
          ) : (
            <XCircle size={14} className="text-amber-warning" />
          )}
          <span className="status-label">
            {isConnected ? 'BACKEND CONNECTED' : 'DEMO MODE (STANDBY)'}
          </span>
        </div>
        <div className="status-meta">
          <span>PORT: 8000</span>
          <span>•</span>
          <span>{isConnected ? 'SQLITE LIVE' : 'OFFLINE'}</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <span className="nav-group-label">MISSION MODULES</span>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              className={`nav-item-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                sound.click();
                setCurrentPage(item.id);
              }}
            >
              <div className="nav-item-left">
                <Icon size={18} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </div>
              {item.badge && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Hawkins Lab Authorization */}
      <div className="sidebar-footer">
        <div className="containment-box">
          <div className="flex-center gap-1 text-red-neon">
            <Skull size={13} />
            <span className="containment-title">CLEARANCE LEVEL 5</span>
          </div>
          <p className="containment-desc">
            Autonomous DOM probe & static heuristics active.
          </p>
        </div>
        <div className="sidebar-vortex-tag">
          TEAM VORTEX • CHAREESH K
        </div>
        <div className="sidebar-dev-role font-mono">
          LEAD DEVELOPER
        </div>
      </div>
    </aside>
  );
}
