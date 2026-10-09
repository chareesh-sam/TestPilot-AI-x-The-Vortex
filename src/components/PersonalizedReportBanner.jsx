import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  ListChecks, 
  UserCheck, 
  Info,
  Radar
} from 'lucide-react';
import { generatePersonalizedReport } from '../services/personalization';

export default function PersonalizedReportBanner({ profile, findings = [], coverage = null }) {
  const report = generatePersonalizedReport(profile, findings, coverage);

  return (
    <div className={`personalized-banner-card neon-card tone-${report.statusTone} animate-fade-in`}>
      <div className="banner-top-row">
        <div className="flex-center gap-2">
          <Sparkles size={18} className="text-cyan-neon" />
          <span className="banner-meta-tag">
            PERSONALIZED REPORT • {profile.projectName.toUpperCase()}
          </span>
          <span className="badge-low mini">
            {profile.experienceLevel.toUpperCase()} LEVEL
          </span>
        </div>

        <div className="flex-center gap-2">
          <span className="heuristic-pill" title="Static Heuristic Verification">
            <Info size={12} /> HEURISTIC VERIFICATION
          </span>
          <span className="coverage-pill">
            <Radar size={12} /> COVERAGE: {report.estimatedCoverage}
          </span>
        </div>
      </div>

      {/* Main Dynamic Headline */}
      <h2 className="banner-headline">
        {report.headline}
      </h2>

      {/* Level-specific overview text */}
      <p className="banner-guidance">
        {report.guidanceOverview}
      </p>

      {/* Goal-oriented Next Steps Checklist */}
      {report.nextSteps.length > 0 && (
        <div className="banner-next-steps-box">
          <div className="next-steps-title flex-center gap-1">
            <ListChecks size={15} className="text-cyan-neon" />
            <span>ACTIONABLE NEXT STEPS FOR YOUR GOAL ({profile.testingGoal.toUpperCase()}):</span>
          </div>
          <ul className="next-steps-list">
            {report.nextSteps.map((step, idx) => (
              <li key={idx} className="next-step-item">
                <span className="step-bullet-num">{idx + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
