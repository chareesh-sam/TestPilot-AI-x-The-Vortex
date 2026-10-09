import React, { useState } from 'react';
import { 
  Compass, 
  Layers, 
  Activity, 
  Server, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle, 
  Zap, 
  Eye 
} from 'lucide-react';
import { EXPLORATION_NODES } from '../mockData';
import { sound } from '../soundEffects';

export default function ExplorationModule({ isTesting, targetUrl }) {
  const [selectedNode, setSelectedNode] = useState(EXPLORATION_NODES[1]);

  return (
    <div className="module-container exploration-module">
      <div className="module-header-row">
        <div>
          <h2 className="module-title flex-center gap-2">
            <Compass className="text-cyan-neon" size={20} />
            AI AUTONOMOUS EXPLORATION MATRIX
          </h2>
          <p className="module-desc">
            Continuous DOM graph traversal, shadow element extraction, and headless interaction fuzzing.
          </p>
        </div>

        <div className="telemetry-pill-group">
          <span className="badge-low flex-center gap-1">
            <Layers size={13} /> 8 NODES MAPPED
          </span>
          <span className="badge-medium flex-center gap-1">
            <Activity size={13} /> DEPTH: 3 LEVELS
          </span>
        </div>
      </div>

      {/* Explorer Live Stats Banner */}
      <div className="exploration-stats-bar neon-card">
        <div className="stat-col">
          <span className="stat-label">EXPLORED URL</span>
          <span className="stat-val highlight-url">{targetUrl || 'https://hawkins-lab.doe.gov/portal'}</span>
        </div>
        <div className="stat-col">
          <span className="stat-label">DOM ELEMENTS PARSED</span>
          <span className="stat-val text-cyan-neon">515 NODES</span>
        </div>
        <div className="stat-col">
          <span className="stat-label">INTERACTION FUZZES</span>
          <span className="stat-val text-green-pass">1,420 EVENTS</span>
        </div>
        <div className="stat-col">
          <span className="stat-label">MEAN LATENCY</span>
          <span className="stat-val text-amber-warning">58.4ms</span>
        </div>
      </div>

      {/* Interactive Exploration Graph & Inspector */}
      <div className="exploration-workspace-grid">
        {/* Left: Interactive Node Tree Map */}
        <div className="node-tree-panel neon-card">
          <div className="panel-title-bar">
            <span>CRAWL TOPOLOGY & TARGET GRAPH</span>
            <span className="badge-low">CLICK NODE TO AUDIT</span>
          </div>

          <div className="nodes-list">
            {EXPLORATION_NODES.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const hasCritical = node.risk === 'critical';
              const hasHigh = node.risk === 'high';

              return (
                <div
                  key={node.id}
                  className={`node-item ${isSelected ? 'selected' : ''} ${hasCritical ? 'node-critical' : (hasHigh ? 'node-high' : '')}`}
                  style={{ paddingLeft: `${16 + node.depth * 22}px` }}
                  onClick={() => {
                    sound.click();
                    setSelectedNode(node);
                  }}
                >
                  <div className="node-line-indicator"></div>
                  <div className="node-content">
                    <span className="node-name">{node.name}</span>
                    <div className="node-chips">
                      <span className="node-elements">{node.elements} els</span>
                      <span className="node-time">{node.responseTime}</span>
                      {hasCritical && <span className="badge-critical mini">RISK</span>}
                      {hasHigh && <span className="badge-high mini">WARN</span>}
                      {!hasCritical && !hasHigh && <span className="badge-low mini">CLEAN</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Node Telemetry Inspector */}
        <div className="node-inspector-panel neon-card">
          <div className="panel-title-bar">
            <span>NODE TELEMETRY INSPECTOR</span>
            <span className="node-badge-id">{selectedNode.id}</span>
          </div>

          <div className="inspector-content">
            <div className="inspector-route-header">
              <h3 className="route-name text-cyan-neon">{selectedNode.name}</h3>
              <span className={`badge-${selectedNode.risk === 'critical' ? 'critical' : selectedNode.risk === 'high' ? 'high' : 'low'}`}>
                {selectedNode.risk.toUpperCase()} SEVERITY
              </span>
            </div>

            <div className="inspector-details-table">
              <div className="detail-row">
                <span className="label">Graph Traversal Depth:</span>
                <span className="value">Level {selectedNode.depth} from Root</span>
              </div>
              <div className="detail-row">
                <span className="label">Interactive Elements Scanned:</span>
                <span className="value">{selectedNode.elements} clickable DOM elements</span>
              </div>
              <div className="detail-row">
                <span className="label">TTFB Server Response:</span>
                <span className="value">{selectedNode.responseTime}</span>
              </div>
              <div className="detail-row">
                <span className="label">Shadow DOM Attachments:</span>
                <span className="value">{selectedNode.risk === 'critical' ? 'Detected 3 Closed Roots' : 'Standard Virtual DOM'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Security Sandboxing:</span>
                <span className="value">Content-Security-Policy Strict Nonce</span>
              </div>
            </div>

            <div className="simulated-fuzz-box">
              <span className="fuzz-title flex-center gap-1">
                <Zap size={14} className="text-amber-warning" />
                SIMULATED TESTPILOT BEHAVIOR TRACE
              </span>
              <ul className="fuzz-actions-list">
                <li>✓ Dispatched synthetic mousemove & scroll sequences (120fps)</li>
                <li>✓ Dispatched rapid concurrent form keystrokes and emoji payloads</li>
                <li>✓ Simulated network degradation down to 2G / 450ms packet loss</li>
                {selectedNode.risk === 'critical' && (
                  <li className="text-red-neon">
                    ✗ Replay vulnerability detected: Session token duplicate accepted
                  </li>
                )}
                {selectedNode.risk === 'high' && (
                  <li className="text-amber-warning">
                    ! Hydration delay: Render pass delayed by 180ms
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
