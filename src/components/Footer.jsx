import React from 'react';
import { Radio, Flame, ShieldAlert, Cpu } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-vines"></div>
      
      <div className="footer-content">
        <div className="footer-branding">
          <div className="footer-logo">
            <span className="footer-logo-title">TESTPILOT AI</span>
            <span className="footer-badge">HAWKINS-CLASSIFIED-v2.4</span>
          </div>
          <p className="footer-subtext">
            Autonomous multi-agent testing engine designed for zero-flaky end-to-end regression hunting.
          </p>
          <div className="footer-dev-pill">
            <Cpu size={12} className="text-cyan-neon" />
            <span>DEVELOPER: <strong>CHAREESH K</strong> • TEAM VORTEX</span>
          </div>
        </div>

        <div className="footer-center">
          <div className="team-vortex-seal">
            <span className="seal-line"></span>
            <span className="team-credit">Developed by <strong>TEAM VORTEX</strong></span>
            <span className="seal-line"></span>
          </div>
          <div className="team-lead-credit">
            <span className="credit-label">LEAD DEVELOPER & ARCHITECT:</span>
            <span className="credit-name">CHAREESH K</span>
          </div>
          <span className="copyright-note">
            © 1985–2026 DEPARTMENT OF ENERGY • HAWKINS INDIANA
          </span>
        </div>

        <div className="footer-status">
          <div className="status-indicator-box">
            <span className="status-dot-blink"></span>
            <span>UPSIDE DOWN MONITOR: SYNCHRONIZED</span>
          </div>
          <span className="tech-stack-tag">REACT + VITE + PYTHON FASTAPI</span>
        </div>
      </div>
    </footer>
  );
}
