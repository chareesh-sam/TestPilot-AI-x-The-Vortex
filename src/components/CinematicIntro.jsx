import React, { useEffect, useState } from 'react';
import { sound } from '../soundEffects';
import { Skull, Play } from 'lucide-react';

export default function CinematicIntro({ onComplete }) {
  const [fadedIn, setFadedIn] = useState(false);

  useEffect(() => {
    // Play sound intro drone
    sound.drone();
    const timer = setTimeout(() => {
      setFadedIn(true);
    }, 200);

    const autoClose = setTimeout(() => {
      onComplete();
    }, 5500);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoClose);
    };
  }, [onComplete]);

  return (
    <div className={`cinematic-intro-overlay ${fadedIn ? 'visible' : ''}`}>
      <div className="cinematic-backdrop"></div>
      <div className="cinematic-vines"></div>

      <div className="cinematic-content">
        <p className="cinematic-season">HAWKINS NATIONAL LABORATORY • TEAM VORTEX • DEV: CHAREESH K</p>

        <div className="cinematic-title-box">
          <div className="title-rule-top"></div>
          <h1 className="cinematic-main-title">TESTPILOT</h1>
          <div className="title-rule-bottom"></div>
        </div>

        <h2 className="cinematic-sub-title">AI AUTONOMOUS AGENT</h2>

        <p className="cinematic-tagline">
          DEEP SCANNING BEYOND THE SURFACE • INTO THE UPSIDE DOWN
        </p>

        <div className="cinematic-actions">
          <button 
            className="btn-neon-red cinematic-btn"
            onClick={() => {
              sound.click();
              onComplete();
            }}
          >
            <Play size={16} fill="white" /> ENTER DASHBOARD
          </button>
          
          <button 
            className="btn-secondary"
            onClick={() => {
              sound.click();
              onComplete();
            }}
          >
            SKIP INTRO [ESC]
          </button>
        </div>
      </div>
    </div>
  );
}
