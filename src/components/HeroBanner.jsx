import React from 'react';
import { 
  Globe, 
  Play, 
  Flame, 
  AlertTriangle, 
  Radio, 
  Cpu, 
  Zap, 
  Compass 
} from 'lucide-react';
import { PRESET_TARGETS } from '../mockData';
import { sound } from '../soundEffects';

export default function HeroBanner({
  targetUrl,
  setTargetUrl,
  isTesting,
  isPaused,
  onStartTesting,
  currentPhase,
  progressPercent
}) {
  const handlePresetClick = (preset) => {
    sound.click();
    setTargetUrl(preset.url);
  };

  return (
    <section className="hero-banner-section">
      {/* Dramatic Upside Down Testing Active Alert Banner */}
      {isTesting && (
        <div className="upside-down-alert-banner animate-rift">
          <div className="alert-content">
            <Flame className="alert-flame animate-bounce" size={24} />
            <div className="alert-text-block">
              <span className="alert-badge">DIMENSIONAL INTRUSION</span>
              <h3 className="alert-heading">THE UPSIDE DOWN: TESTING IN PROGRESS</h3>
              <p className="alert-sub">
                AI Agent crawling shadow DOM tree • Penetrating dimensional security layers • Phase: <strong>{currentPhase}</strong>
              </p>
            </div>
            <div className="alert-radar">
              <span className="radar-blip"></span>
              <span className="radar-text">{progressPercent}% SYNC</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Target URL Entry Panel */}
      <div className={`url-entry-card neon-card ${isTesting ? 'active-rift' : ''}`}>
        <div className="url-card-header">
          <div className="flex-center gap-2">
            <Compass size={18} className="text-red-neon" />
            <h2 className="section-title">TARGET EXPLORATION MATRIX</h2>
          </div>
          <span className="neural-mode-badge">
            <Cpu size={14} className="text-cyan-neon" />
            NEURAL PROBE ENGINE ACTIVE
          </span>
        </div>

        <p className="url-card-sub">
          Deploy TestPilot's autonomous browser agent to explore UI routes, discover hidden edge cases, capture regressions, and synthesize self-healing test specs.
        </p>

        <form 
          className="url-input-form" 
          onSubmit={(e) => {
            e.preventDefault();
            if (!isTesting) onStartTesting();
          }}
        >
          <div className="url-input-wrapper">
            <Globe className="url-icon" size={20} />
            <input 
              type="url" 
              className="url-input" 
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="Enter target website URL (e.g. https://your-app.com)..."
              required
              disabled={isTesting && !isPaused}
            />
            {targetUrl && (
              <button 
                type="button" 
                className="clear-url-btn" 
                onClick={() => setTargetUrl('')}
                disabled={isTesting && !isPaused}
              >
                ✕
              </button>
            )}
          </div>

          <button 
            type="submit" 
            className="btn-neon-red start-test-btn"
            disabled={isTesting && !isPaused}
          >
            <Play size={18} fill="white" />
            <span>START AI TESTING</span>
          </button>
        </form>

        {/* Preset Target Quick Pickers */}
        <div className="presets-container">
          <span className="presets-label">
            <Radio size={13} /> CLASSIFIED TARGET PRESETS:
          </span>
          <div className="preset-chips">
            {PRESET_TARGETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                className={`preset-chip ${targetUrl === preset.url ? 'active' : ''}`}
                onClick={() => handlePresetClick(preset)}
                disabled={isTesting && !isPaused}
                title={preset.description}
              >
                <span className="preset-name">{preset.name}</span>
                <span className="preset-domain">{new URL(preset.url).pathname}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
