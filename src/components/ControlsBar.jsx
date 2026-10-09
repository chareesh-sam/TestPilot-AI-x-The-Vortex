import React from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  FastForward, 
  CheckCircle2, 
  Activity, 
  Zap, 
  ShieldAlert 
} from 'lucide-react';
import { sound } from '../soundEffects';

export default function ControlsBar({
  isTesting,
  isPaused,
  progressPercent,
  currentPhase,
  testSpeed,
  setTestSpeed,
  onStart,
  onPauseToggle,
  onReset
}) {
  const PHASES = [
    { id: 'INIT', label: '1. Initializing' },
    { id: 'CRAWL', label: '2. DOM Crawl' },
    { id: 'ANOMALY', label: '3. Bug Anomaly' },
    { id: 'SYNTHESIS', label: '4. Test Synthesis' },
    { id: 'REPORTS', label: '5. Reports' }
  ];

  return (
    <div className="controls-bar-card neon-card">
      <div className="controls-top-row">
        {/* Playback Controls */}
        <div className="playback-buttons-group">
          {!isTesting ? (
            <button 
              className="btn-neon-red control-btn"
              onClick={() => {
                sound.click();
                onStart();
              }}
            >
              <Play size={16} fill="white" />
              <span>START TESTING</span>
            </button>
          ) : (
            <button 
              className="btn-secondary control-btn pause-btn"
              onClick={() => {
                sound.click();
                onPauseToggle();
              }}
            >
              {isPaused ? (
                <>
                  <Play size={16} className="text-cyan-neon" />
                  <span>RESUME</span>
                </>
              ) : (
                <>
                  <Pause size={16} className="text-amber-warning" />
                  <span>PAUSE</span>
                </>
              )}
            </button>
          )}

          <button 
            className="btn-secondary control-btn reset-btn"
            onClick={() => {
              sound.warp();
              onReset();
            }}
            title="Reset testing state, logs and anomaly reports"
          >
            <RotateCcw size={16} />
            <span>RESET</span>
          </button>
        </div>

        {/* Speed Toggles */}
        <div className="speed-toggle-group">
          <span className="speed-label flex-center gap-1">
            <Zap size={14} className="text-amber-warning" /> SPEED:
          </span>
          {[1, 2, 5].map((spd) => (
            <button
              key={spd}
              className={`speed-chip ${testSpeed === spd ? 'active' : ''}`}
              onClick={() => {
                sound.click();
                setTestSpeed(spd);
              }}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Status Indicator */}
        <div className="status-pill-wrap">
          {progressPercent === 100 ? (
            <span className="status-pill status-completed">
              <CheckCircle2 size={15} /> RUN COMPLETED
            </span>
          ) : isTesting ? (
            isPaused ? (
              <span className="status-pill status-paused">
                <Pause size={15} /> PAUSED BY OPERATOR
              </span>
            ) : (
              <span className="status-pill status-active animate-pulse">
                <Activity size={15} /> EXPLORING DIMENSION
              </span>
            )
          ) : (
            <span className="status-pill status-idle">
              STANDBY • READY TO ENGAGE
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar & Phase Stepper */}
      <div className="progress-section">
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progressPercent}%` }}
          >
            <span className="progress-flare"></span>
          </div>
        </div>

        <div className="phase-stepper">
          {PHASES.map((p, idx) => {
            const stepThreshold = (idx + 1) * 20;
            const isCompleted = progressPercent >= stepThreshold;
            const isCurrent = progressPercent > (idx * 20) && progressPercent <= stepThreshold;

            return (
              <div 
                key={p.id} 
                className={`phase-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}
              >
                <span className="step-bullet"></span>
                <span className="step-name">{p.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
