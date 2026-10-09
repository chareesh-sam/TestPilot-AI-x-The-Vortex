import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  User, 
  Target, 
  Code2, 
  Globe2, 
  Zap 
} from 'lucide-react';
import { sound } from '../soundEffects';
import { useToast } from '../context/ToastContext';

export default function PersonalizationCard({ profile, setProfile, onProfileChange }) {
  const [isOpen, setIsOpen] = useState(true);
  const { success } = useToast();

  const handleUpdate = (field, value) => {
    sound.click();
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    if (onProfileChange) onProfileChange(updated);
  };

  const handleApply = () => {
    sound.success();
    success(
      `Personalized settings active: ${profile.projectName} (${profile.experienceLevel} • ${profile.testingGoal})`,
      'PROFILE SYNCHRONIZED'
    );
  };

  return (
    <div className="personalization-card neon-card">
      <div 
        className="personalization-header" 
        onClick={() => {
          sound.click();
          setIsOpen(!isOpen);
        }}
        role="button"
        tabIndex={0}
      >
        <div className="flex-center gap-2">
          <SlidersHorizontal size={16} className="text-cyan-neon" />
          <span className="personalization-title">
            PROJECT PROFILE & PERSONALIZATION MATRIX
          </span>
          <span className="badge-low mini">
            {profile.experienceLevel.toUpperCase()} • {profile.testingGoal.toUpperCase()}
          </span>
        </div>

        <div className="flex-center gap-2">
          <span className="profile-active-name font-mono text-dim">
            [{profile.projectName || 'Untitled Project'}]
          </span>
          <button className="toggle-collapse-btn" aria-label="Toggle profile form">
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="personalization-form-grid animate-fade-in">
          {/* 1. Project Name */}
          <div className="form-group">
            <label className="input-label flex-center gap-1">
              <Zap size={13} className="text-red-neon" /> PROJECT NAME:
            </label>
            <input 
              type="text" 
              className="text-field"
              value={profile.projectName}
              onChange={(e) => handleUpdate('projectName', e.target.value)}
              placeholder="e.g. Hawkins Terminal Gateway"
            />
          </div>

          {/* 2. Project Type */}
          <div className="form-group">
            <label className="input-label flex-center gap-1">
              <Code2 size={13} className="text-cyan-neon" /> PROJECT TYPE:
            </label>
            <select
              className="select-field"
              value={profile.projectType}
              onChange={(e) => handleUpdate('projectType', e.target.value)}
            >
              <option value="js">JavaScript (.js)</option>
              <option value="css">CSS (.css)</option>
              <option value="both">JavaScript + CSS</option>
            </select>
          </div>

          {/* 3. Target Website URL (Optional) */}
          <div className="form-group">
            <label className="input-label flex-center gap-1">
              <Globe2 size={13} className="text-dim" /> TARGET URL (OPTIONAL):
            </label>
            <input 
              type="url" 
              className="text-field"
              value={profile.targetUrl || ''}
              onChange={(e) => handleUpdate('targetUrl', e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          {/* 4. Testing Goal */}
          <div className="form-group">
            <label className="input-label flex-center gap-1">
              <Target size={13} className="text-amber-warning" /> TESTING GOAL:
            </label>
            <select
              className="select-field"
              value={profile.testingGoal}
              onChange={(e) => handleUpdate('testingGoal', e.target.value)}
            >
              <option value="syntax errors">Syntax Errors & Parsing Defenses</option>
              <option value="UI bugs">UI Bugs & DOM Manipulation Flaws</option>
              <option value="responsiveness">Responsiveness & Viewport Scalability</option>
              <option value="navigation">Navigation & Anchor Link Targets</option>
              <option value="comprehensive testing">Comprehensive End-to-End Suite</option>
            </select>
          </div>

          {/* 5. Experience Level */}
          <div className="form-group">
            <label className="input-label flex-center gap-1">
              <User size={13} className="text-green-pass" /> EXPERIENCE LEVEL:
            </label>
            <div className="experience-toggle-group">
              <button
                type="button"
                className={`exp-pill ${profile.experienceLevel === 'Beginner' ? 'active' : ''}`}
                onClick={() => handleUpdate('experienceLevel', 'Beginner')}
              >
                Beginner (Guided)
              </button>
              <button
                type="button"
                className={`exp-pill ${profile.experienceLevel === 'Advanced' ? 'active' : ''}`}
                onClick={() => handleUpdate('experienceLevel', 'Advanced')}
              >
                Advanced (Engineering)
              </button>
            </div>
          </div>

          {/* Apply Pill */}
          <div className="form-group action-group">
            <button
              type="button"
              className="btn-neon-cyan full-width-btn apply-profile-btn"
              onClick={handleApply}
            >
              <Sparkles size={14} />
              <span>APPLY PROFILE MATRIX</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
