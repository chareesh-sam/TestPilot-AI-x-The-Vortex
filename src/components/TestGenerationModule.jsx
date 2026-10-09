import React, { useState } from 'react';
import { 
  FileCode2, 
  Play, 
  Copy, 
  Check, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Clock, 
  Tag 
} from 'lucide-react';
import { SYNTHESIZED_TESTS } from '../mockData';
import { sound } from '../soundEffects';

export default function TestGenerationModule() {
  const [tests, setTests] = useState(SYNTHESIZED_TESTS);
  const [selectedTest, setSelectedTest] = useState(SYNTHESIZED_TESTS[0]);
  const [copied, setCopied] = useState(false);
  const [executingId, setExecutingId] = useState(null);
  const [filterFramework, setFilterFramework] = useState('ALL');

  const filteredTests = tests.filter((t) => {
    if (filterFramework === 'ALL') return true;
    return t.framework.toLowerCase().includes(filterFramework.toLowerCase());
  });

  const handleCopyCode = () => {
    sound.click();
    navigator.clipboard.writeText(selectedTest.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunSpec = (testItem) => {
    sound.click();
    setExecutingId(testItem.id);
    setTimeout(() => {
      sound.success();
      setExecutingId(null);
    }, 1200);
  };

  return (
    <div className="module-container test-gen-module">
      <div className="module-header-row">
        <div>
          <h2 className="module-title flex-center gap-2">
            <FileCode2 className="text-cyan-neon" size={20} />
            AI TEST GENERATION & SYNTHESIZER
          </h2>
          <p className="module-desc">
            Production-grade self-healing automation suites dynamically authored from observed user journeys.
          </p>
        </div>

        {/* Framework Filters */}
        <div className="framework-filter-group">
          {['ALL', 'Playwright', 'Jest', 'Cypress'].map((fw) => (
            <button
              key={fw}
              className={`filter-btn ${filterFramework === fw ? 'active' : ''}`}
              onClick={() => {
                sound.click();
                setFilterFramework(fw);
              }}
            >
              {fw}
            </button>
          ))}
        </div>
      </div>

      <div className="test-workspace-grid">
        {/* Left Column: Test Suite List */}
        <div className="test-suite-list-panel neon-card">
          <div className="panel-title-bar">
            <span>SYNTHESIZED TEST SUITES ({filteredTests.length})</span>
            <span className="badge-low">AUTO-GENERATED</span>
          </div>

          <div className="test-items-scroll">
            {filteredTests.map((t) => {
              const isSelected = selectedTest?.id === t.id;
              const isRunning = executingId === t.id;

              return (
                <div
                  key={t.id}
                  className={`test-card-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    sound.click();
                    setSelectedTest(t);
                  }}
                >
                  <div className="test-card-top">
                    <span className="test-framework-badge">{t.framework}</span>
                    <span className="test-id">{t.id}</span>
                    <span className={`test-status-pill ${t.status === 'PASSED' ? 'status-pass' : 'status-fail'}`}>
                      {t.status === 'PASSED' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {t.status}
                    </span>
                  </div>

                  <h4 className="test-name">{t.name}</h4>

                  <div className="test-meta-bar">
                    <span className="flex-center gap-1">
                      <Clock size={12} /> {t.duration}
                    </span>
                    <span>{t.assertions} assertions</span>
                  </div>

                  <div className="test-tags-row">
                    {t.tags.map((tag) => (
                      <span key={tag} className="test-tag">#{tag}</span>
                    ))}
                  </div>

                  <div className="test-card-action">
                    <button
                      className="btn-secondary mini-run-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunSpec(t);
                      }}
                      disabled={isRunning}
                    >
                      {isRunning ? (
                        <>
                          <span className="radar-blip"></span>
                          <span>EXECUTING...</span>
                        </>
                      ) : (
                        <>
                          <Play size={12} fill="currentColor" />
                          <span>RUN SPEC</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Code Viewer & Runner */}
        <div className="test-code-panel neon-card">
          <div className="panel-title-bar">
            <div className="flex-center gap-2">
              <span className="text-cyan-neon font-mono">{selectedTest?.id}</span>
              <span>• {selectedTest?.name}</span>
            </div>
            <button 
              className="btn-secondary copy-btn"
              onClick={handleCopyCode}
            >
              {copied ? <Check size={14} className="text-green-pass" /> : <Copy size={14} />}
              <span>{copied ? 'COPIED' : 'COPY SPEC'}</span>
            </button>
          </div>

          <div className="spec-info-bar">
            <div className="spec-stat">
              <span className="spec-lbl">Target Framework:</span>
              <span className="spec-val text-cyan-neon">{selectedTest?.framework}</span>
            </div>
            <div className="spec-stat">
              <span className="spec-lbl">Assertions:</span>
              <span className="spec-val">{selectedTest?.assertions} Checks</span>
            </div>
            <div className="spec-stat">
              <span className="spec-lbl">Execution Time:</span>
              <span className="spec-val">{selectedTest?.duration}</span>
            </div>
            <button 
              className="btn-neon-red run-large-btn"
              onClick={() => handleRunSpec(selectedTest)}
              disabled={executingId === selectedTest?.id}
            >
              <Play size={14} fill="white" />
              <span>{executingId === selectedTest?.id ? 'RUNNING TEST...' : 'RUN LIVE IN SANDBOX'}</span>
            </button>
          </div>

          <div className="code-viewer-container">
            <pre className="retro-code full-code">
              <code>{selectedTest?.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
