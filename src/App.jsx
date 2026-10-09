import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import CinematicIntro from './components/CinematicIntro';
import SporesCanvas from './components/SporesCanvas';
import Footer from './components/Footer';

// Pages
import DashboardPage from './pages/DashboardPage';
import CodeAnalyzerPage from './pages/CodeAnalyzerPage';
import ExplorerPage from './pages/ExplorerPage';
import TestGeneratorPage from './pages/TestGeneratorPage';
import TestRunnerPage from './pages/TestRunnerPage';
import ReportsPage from './pages/ReportsPage';

import { checkBackendHealth } from './services/api';
import { ToastProvider } from './context/ToastContext';
import { INITIAL_USER_PROFILE } from './services/personalization';
import './App.css';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showIntro, setShowIntro] = useState(false);
  const [isUpsideDown, setIsUpsideDown] = useState(true);
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [soundMuted, setSoundMuted] = useState(false);
  const [backendStatus, setBackendStatus] = useState(null);

  // Personalized Profile State (Constraint Card 31)
  const [userProfile, setUserProfile] = useState(INITIAL_USER_PROFILE);

  // Transient data passed between modules
  const [transientData, setTransientData] = useState(null);
  const [runnerInitialCode, setRunnerInitialCode] = useState(null);

  // Check Backend Health on mount and periodically
  useEffect(() => {
    const checkHealth = async () => {
      const status = await checkBackendHealth();
      setBackendStatus(status);
    };
    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigateToTestGen = (explorationResults) => {
    setTransientData(explorationResults);
    setCurrentPage('generator');
  };

  const handleNavigateToTestRunner = (code) => {
    setRunnerInitialCode(code);
    setCurrentPage('runner');
  };

  return (
    <ToastProvider>
      <div className={`app-root ${isUpsideDown ? 'realm-upside-down' : 'realm-hawkins'}`}>
        {/* Floating Spores Canvas */}
        <SporesCanvas isTesting={false} isUpsideDown={isUpsideDown} />

        {/* Atmospheric Ambient Fog */}
        <div className="fog-layer"></div>

        {/* CRT Scanline Overlay */}
        {crtEnabled && <div className="crt-overlay"></div>}

        {/* Cinematic Intro (can be replayed from header) */}
        {showIntro && (
          <CinematicIntro onComplete={() => setShowIntro(false)} />
        )}

        {/* Top Header */}
        <Header 
          isUpsideDown={isUpsideDown}
          setIsUpsideDown={setIsUpsideDown}
          crtEnabled={crtEnabled}
          setCrtEnabled={setCrtEnabled}
          soundMuted={soundMuted}
          setSoundMuted={setSoundMuted}
          onReplayIntro={() => setShowIntro(true)}
        />

        {/* Main Layout: Sidebar on left + Page content on right */}
        <div className="app-workspace-body">
          <Sidebar 
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            backendStatus={backendStatus}
            isUpsideDown={isUpsideDown}
          />

          <main className="workspace-main-panel">
            {currentPage === 'dashboard' && (
              <DashboardPage 
                onNavigate={setCurrentPage}
                backendStatus={backendStatus}
                userProfile={userProfile}
                setUserProfile={setUserProfile}
              />
            )}

            {currentPage === 'analyzer' && (
              <CodeAnalyzerPage 
                onNavigateToTestRunner={handleNavigateToTestRunner}
                userProfile={userProfile}
                setUserProfile={setUserProfile}
              />
            )}

            {currentPage === 'explorer' && (
              <ExplorerPage 
                onNavigateToTestGen={handleNavigateToTestGen}
                userProfile={userProfile}
                setUserProfile={setUserProfile}
              />
            )}

            {currentPage === 'generator' && (
              <TestGeneratorPage 
                preloadedData={transientData}
                onNavigateToRunner={handleNavigateToTestRunner}
                userProfile={userProfile}
                setUserProfile={setUserProfile}
              />
            )}

            {currentPage === 'runner' && (
              <TestRunnerPage 
                initialCode={runnerInitialCode}
                userProfile={userProfile}
              />
            )}

            {currentPage === 'reports' && (
              <ReportsPage />
            )}
          </main>
        </div>

        {/* Retro Hawkins Footer */}
        <Footer />
      </div>
    </ToastProvider>
  );
}
