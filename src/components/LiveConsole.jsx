import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Trash2, 
  Pause, 
  Play, 
  Download, 
  Maximize2, 
  ShieldAlert 
} from 'lucide-react';
import { sound } from '../soundEffects';

export default function LiveConsole({ logs, onClearLogs, isTesting }) {
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    if (filterLevel === 'ALL') return true;
    return log.level === filterLevel;
  });

  const getLogColorClass = (level) => {
    switch (level) {
      case 'BUG': return 'log-bug';
      case 'WARN': return 'log-warn';
      case 'SUCCESS': return 'log-success';
      case 'TRACE': return 'log-trace';
      default: return 'log-info';
    }
  };

  const handleCopyLogs = () => {
    sound.click();
    const text = logs.map(l => `[${l.timestamp}] [${l.level}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(text);
    alert('Live activity logs copied to clipboard!');
  };

  return (
    <div className="live-console-card neon-card">
      <div className="console-header-bar">
        <div className="terminal-title-group">
          <Terminal size={16} className="text-cyan-neon" />
          <span className="terminal-title">LIVE TELEMETRY & ACTIVITY STREAM</span>
          <span className="log-counter-badge">{logs.length} EVENTS</span>
          {isTesting && <span className="streaming-indicator">STREAMING LIVE</span>}
        </div>

        <div className="console-controls-group">
          {/* Level Filter */}
          <div className="log-level-filters">
            {['ALL', 'INFO', 'WARN', 'BUG'].map((lvl) => (
              <button
                key={lvl}
                className={`log-filter-chip ${filterLevel === lvl ? 'active' : ''}`}
                onClick={() => {
                  sound.click();
                  setFilterLevel(lvl);
                }}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Autoscroll toggle */}
          <button 
            className={`btn-secondary mini-icon-btn ${!autoScroll ? 'active-warn' : ''}`}
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? "Pause auto-scroll" : "Resume auto-scroll"}
          >
            {autoScroll ? <Pause size={13} /> : <Play size={13} />}
          </button>

          {/* Copy Logs */}
          <button 
            className="btn-secondary mini-icon-btn"
            onClick={handleCopyLogs}
            title="Copy logs to clipboard"
          >
            <Download size={13} />
          </button>

          {/* Clear Logs */}
          <button 
            className="btn-secondary mini-icon-btn"
            onClick={() => {
              sound.click();
              onClearLogs();
            }}
            title="Clear terminal logs"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="terminal-body">
        <div className="terminal-log-list">
          {filteredLogs.length === 0 ? (
            <div className="terminal-empty">
              <span>// Standby. Activity stream will initialize upon starting AI testing.</span>
            </div>
          ) : (
            filteredLogs.map((log, idx) => (
              <div key={idx} className={`terminal-log-row ${getLogColorClass(log.level)}`}>
                <span className="log-time">[{log.timestamp}]</span>
                <span className={`log-badge log-badge-${log.level.toLowerCase()}`}>{log.level}</span>
                <span className="log-phase">[{log.phase || 'AGENT'}]</span>
                <span className="log-msg">{log.text}</span>
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>

        <div className="terminal-prompt-line">
          <span className="prompt-user">testpilot@hawkins-lab:~$</span>
          <span className="prompt-cursor">█</span>
        </div>
      </div>
    </div>
  );
}
