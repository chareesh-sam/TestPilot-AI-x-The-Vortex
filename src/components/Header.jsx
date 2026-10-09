import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Volume2, 
  VolumeX, 
  Tv, 
  Skull, 
  ShieldAlert, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { sound } from '../soundEffects';

export default function Header({
  isUpsideDown,
  setIsUpsideDown,
  crtEnabled,
  setCrtEnabled,
  soundMuted,
  setSoundMuted,
  onReplayIntro
}) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(' ')[0]);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    sound.muted = next;
    if (!next) sound.click();
  };

  const handleToggleDimension = () => {
    sound.warp();
    setIsUpsideDown(!isUpsideDown);
  };

  return (
    <header className="app-header neon-card">
      <div className="header-left">
        <div className="logo-container">
          <div className="stranger-logo-wrap">
            <span className="logo-bar-top"></span>
            <h1 className="stranger-title neon-flicker">TESTPILOT</h1>
            <span className="logo-bar-bottom"></span>
          </div>
          <div className="logo-badge-row">
            <span className="logo-sub-badge">AI AGENT</span>
            <span className="dimension-indicator">
              {isUpsideDown ? (
                <span className="badge-critical flex-center gap-1">
                  <Skull size={13} /> UPSIDE DOWN REALM
                </span>
              ) : (
                <span className="badge-low flex-center gap-1">
                  <Radio size={13} /> HAWKINS LAB TERMINAL
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="header-center">
        <div className="lab-clearance-box">
          <ShieldAlert size={14} className="text-red-neon animate-pulse" />
          <span className="clearance-text">CLEARANCE: <strong>LEVEL 5 (RESTRICTED)</strong></span>
          <span className="time-display">{currentTime} EST</span>
        </div>
        <div className="header-dev-badge">
          <span className="badge-low mini font-mono">DEV: CHAREESH K • TEAM VORTEX</span>
        </div>
      </div>

      <div className="header-right">
        {/* Dimension Switcher */}
        <button 
          className={`btn-secondary dimension-btn ${isUpsideDown ? 'active-rift' : ''}`}
          onClick={handleToggleDimension}
          title="Toggle Dimension: Normal Reality vs The Upside Down"
        >
          <Sparkles size={15} color={isUpsideDown ? "#ff113a" : "#00f0ff"} />
          <span>{isUpsideDown ? 'REALM: UPSIDE DOWN' : 'REALM: NORMAL'}</span>
        </button>

        {/* CRT Scanline Toggle */}
        <button 
          className={`btn-secondary icon-btn ${crtEnabled ? 'active-glow' : ''}`}
          onClick={() => {
            sound.click();
            setCrtEnabled(!crtEnabled);
          }}
          title="Toggle CRT Scanline Overlay"
        >
          <Tv size={16} />
        </button>

        {/* Sound Toggle */}
        <button 
          className="btn-secondary icon-btn"
          onClick={toggleSound}
          title={soundMuted ? "Unmute 80s Synth SFX" : "Mute Sound"}
        >
          {soundMuted ? <VolumeX size={16} /> : <Volume2 size={16} className="text-red-neon" />}
        </button>

        {/* Replay Intro */}
        <button 
          className="btn-secondary icon-btn"
          onClick={() => {
            sound.drone();
            onReplayIntro();
          }}
          title="Replay Stranger Things Cinematic Intro"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </header>
  );
}
