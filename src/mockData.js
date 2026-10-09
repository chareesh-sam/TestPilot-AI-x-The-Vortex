export const PRESET_TARGETS = [
  {
    name: 'Hawkins Lab Central Terminal',
    url: 'https://hawkins-lab.doe.gov/portal',
    description: 'High-security government portal with biometric gates & classified test suites'
  },
  {
    name: 'Starcourt Mall E-Commerce',
    url: 'https://starcourt-mall.shop/checkout',
    description: 'Multi-vendor 1985 shopping checkout with Soviet secret underground radio API'
  },
  {
    name: 'Palace Arcade Leaderboard',
    url: 'https://palace-arcade.games/madmax',
    description: 'Retro 8-bit web application with high score persistence & canvas render loops'
  },
  {
    name: 'Byers Christmas Light Network',
    url: 'https://byers-livingroom.iot/r-u-n',
    description: '50-bulb ASCII IoT interface transmitting signals across the dimensional barrier'
  }
];

export const INITIAL_METRICS = {
  testsRun: 0,
  bugsFound: 0,
  passRate: 0,
  coverage: 0
};

export const TARGET_METRICS = {
  testsRun: 84,
  bugsFound: 7,
  passRate: 91.6,
  coverage: 94.2
};

export const SAMPLE_BUGS = [
  {
    id: 'BUG-4091',
    title: 'Shadow DOM Memory Leak under Rapid State Mutation',
    severity: 'CRITICAL',
    module: 'AI Exploration',
    route: '/portal/reactor-controls',
    component: '<MagneticCoreMonitor />',
    discoveredAt: '16:42:01',
    reproductionSteps: [
      'Navigate to /portal/reactor-controls with auth role: "CHIEF_SCIENTIST"',
      'Trigger 12 consecutive emergency magnetic purge cycles within 400ms',
      'Observe DOM node retention counter climbing to 18,400 detached elements',
      'Browser UI thread locks for 3.2s, causing heartbeat monitor desync'
    ],
    aiAnalysis: 'The MutationObserver on the magnetic flux meter fails to unbind on component unmount during emergency state dispatches, resulting in 14.8MB/sec memory leak and eventual browser tab termination.',
    remediation: 'Implement AbortController signal on all active subscriptions inside useEffect cleanup hook and wrap state dispatch in requestAnimationFrame debounce.',
    codeSnippet: `// Suggested Fix in ReactorMonitor.tsx
useEffect(() => {
  const controller = new AbortController();
  const sub = magneticFlux$.subscribe({
    next: (val) => safeDispatch({ type: 'FLUX_UPDATE', payload: val }),
    signal: controller.signal
  });
  return () => controller.abort(); // Prevents memory vortex
}, []);`,
    screenshot: {
      type: 'critical',
      highlightBox: { x: '18%', y: '32%', width: '64%', height: '38%' },
      tag: 'Detached DOM Heap Overflow: 18,400 Nodes'
    }
  },
  {
    id: 'BUG-4092',
    title: 'Race Condition in 2FA Biometric Handshake Token',
    severity: 'CRITICAL',
    module: 'Bug Detection',
    route: '/api/v1/auth/clearance-gate',
    component: '<BiometricScanner />',
    discoveredAt: '16:42:15',
    reproductionSteps: [
      'Send simultaneous duplicate POST requests to /auth/gate with identical session nonce',
      'First request returns HTTP 200 with JWT',
      'Second request races before Redis lock and generates secondary elevated token without salt',
      'Elevation grants unauthorized level-5 clearance bypass'
    ],
    aiAnalysis: 'Non-atomic token verification allows duplicate concurrent requests to bypass strict clearance validation before Redis mutex lock settles.',
    remediation: 'Introduce Redlock distributed mutex or database row-level locking on clearance verification transactions.',
    codeSnippet: `// Fix in ClearanceService.ts
await redis.set(\`lock:auth:\${userId}\`, nonce, { NX: true, EX: 5 });
if (!acquired) {
  throw new RateLimitException('Concurrent clearance request blocked');
}`,
    screenshot: {
      type: 'critical',
      highlightBox: { x: '24%', y: '20%', width: '52%', height: '45%' },
      tag: 'Race Condition: Duplicate Nonce Accepted'
    }
  },
  {
    id: 'BUG-3814',
    title: 'Hydration Mismatch on Dimensional Time Sync Widget',
    severity: 'HIGH',
    module: 'AI Exploration',
    route: '/dashboard/telemetry',
    component: '<UpsideDownClock />',
    discoveredAt: '16:42:32',
    reproductionSteps: [
      'Load /dashboard/telemetry in timezone UTC-5 (Hawkins, Indiana)',
      'SSR server renders timestamp formatted as 1983-11-06T22:53:00Z',
      'Client executes new Date().toLocaleTimeString() before hydration completion',
      'Client displays flicker and drops interactive listener for grandfather clock chime'
    ],
    aiAnalysis: 'Server timestamp formatting differs from local browser locale, triggering React warning #418 and tearing down client event listeners.',
    remediation: 'Use suppressHydrationWarning or defer local clock calculations to post-mount useEffect hook.',
    codeSnippet: `// Fix in UpsideDownClock.tsx
const [time, setTime] = useState<string | null>(null);
useEffect(() => {
  setTime(formatHawkinsTime(new Date()));
}, []);
if (!time) return <ClockSkeleton />;`,
    screenshot: {
      type: 'high',
      highlightBox: { x: '60%', y: '15%', width: '35%', height: '25%' },
      tag: 'React Hydration Text Mismatch (#418)'
    }
  },
  {
    id: 'BUG-3709',
    title: 'Z-Index Collision Traps Focus in Rift Portal Modal',
    severity: 'HIGH',
    module: 'Bug Detection',
    route: '/rift-containment',
    component: '<ContainmentFieldModal />',
    discoveredAt: '16:42:48',
    reproductionSteps: [
      'Trigger "Containment Breach" alarm modal',
      'Press TAB key to navigate to "ENGAGE EMERGENCY SHIELD"',
      'Focus shifts behind canvas background element due to stacking context z-index: 999 vs 99999',
      'Keyboard accessibility trap prevents keyboard-only users from engaging shield'
    ],
    aiAnalysis: 'Stray CSS isolation property on parent container forced modal into lower stacking context, causing focus ring invisibility and trapped tab-order.',
    remediation: 'Render modal through React Portal directly to document.body and manage focus lock via a11y trap library.',
    codeSnippet: `// Fix in ModalPortal.tsx
return ReactDOM.createPortal(
  <FocusTrap>
    <div className="z-modal-upsidedown" role="dialog" aria-modal="true">
      {children}
    </div>
  </FocusTrap>,
  document.body
);`,
    screenshot: {
      type: 'high',
      highlightBox: { x: '15%', y: '50%', width: '70%', height: '35%' },
      tag: 'Focus Trapped Behind Canvas Layer'
    }
  },
  {
    id: 'BUG-2951',
    title: 'Flaky CSS Transition Causes Click Interception on Mobile',
    severity: 'MEDIUM',
    module: 'AI Exploration',
    route: '/sensors/rf-signal',
    component: '<SignalFrequencySlider />',
    discoveredAt: '16:43:02',
    reproductionSteps: [
      'Viewport width set to 375px (iPhone SE)',
      'Swipe frequency knob from 11.2MHz to 40.5MHz',
      'CSS transition: all 0.6s ease-in-out creates temporary 300ms overlay that intercepts tap',
      'User must double-tap to register tune confirm'
    ],
    aiAnalysis: 'Unconstrained transition on "all" styles properties triggers layout reflow and mouse-event ghost click masking.',
    remediation: 'Scope transition strictly to transform and opacity with will-change: transform hint.',
    codeSnippet: `/* Fix in slider.css */
.radio-knob {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}`,
    screenshot: {
      type: 'medium',
      highlightBox: { x: '35%', y: '65%', width: '30%', height: '20%' },
      tag: 'Pointer Event Masked by Transition Overlay'
    }
  },
  {
    id: 'BUG-2804',
    title: 'Missing Fallback on Corrupted Telemetry WebSocket Frames',
    severity: 'MEDIUM',
    module: 'Bug Detection',
    route: '/telemetry/stream',
    component: '<WebSocketClient />',
    discoveredAt: '16:43:18',
    reproductionSteps: [
      'Inject malformed binary packet simulating dimensional electromagnetic interference',
      'Socket parser throws unhandled SyntaxError JSON.parse',
      'WebSocket disconnects without automatic exponential backoff retry'
    ],
    aiAnalysis: 'Socket message receiver lacks try/catch JSON decoding guard and retry heartbeat listener.',
    remediation: 'Add safe JSON decoder with fallback heartbeat reconnect.',
    codeSnippet: `// Fix in TelemetryClient.ts
socket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    onPacket(data);
  } catch (err) {
    logger.warn('Corrupted RF packet ignored', err);
  }
};`,
    screenshot: {
      type: 'medium',
      highlightBox: { x: '5%', y: '10%', width: '90%', height: '22%' },
      tag: 'Unhandled WebSocket Protocol Desync'
    }
  },
  {
    id: 'BUG-1902',
    title: 'Contrast Ratio Below WCAG AA on Secondary Telemetry Labels',
    severity: 'LOW',
    module: 'AI Exploration',
    route: '/system/settings',
    component: '<TerminalLabel />',
    discoveredAt: '16:43:30',
    reproductionSteps: [
      'Inspect secondary text class .text-retro-subtle on dark background #080808',
      'Calculated contrast ratio is 2.8:1, violating minimum 4.5:1 threshold'
    ],
    aiAnalysis: 'Dim red font color #701018 provides insufficient readability for low-vision technicians in dark containment control rooms.',
    remediation: 'Brighten label foreground color to #ff5e6c to reach 5.4:1 contrast.',
    codeSnippet: `/* Fix in retro-theme.css */
.text-retro-subtle {
  color: #ff5e6c; /* Contrast ratio: 5.4:1 (Passes WCAG AA) */
}`,
    screenshot: {
      type: 'low',
      highlightBox: { x: '70%', y: '80%', width: '25%', height: '12%' },
      tag: 'WCAG 2.1 Contrast Violation (2.8:1 < 4.5:1)'
    }
  }
];

export const SYNTHESIZED_TESTS = [
  {
    id: 'TEST-101',
    name: 'E2E: Quantum Gate Lockdown Sequence Under High Concurrency',
    framework: 'Playwright',
    status: 'PASSED',
    duration: '1.24s',
    assertions: 14,
    tags: ['Security', 'Stress', 'P0'],
    code: `import { test, expect } from '@playwright/test';

test.describe('Upside Down Containment Protocol', () => {
  test('verifies emergency gate locks within 200ms of rift expansion', async ({ page }) => {
    await page.goto('/rift-containment');
    await page.fill('[data-testid="auth-code"]', '011-HAWKINS-OVERRIDE');
    await page.click('button:has-text("ENGAGE BLAST SHUTTER")');

    const shutter = page.locator('.blast-shutter-seal');
    await expect(shutter).toHaveAttribute('data-sealed', 'true', { timeout: 300 });

    const containmentLevel = await page.textContent('.containment-metric');
    expect(parseFloat(containmentLevel)).toBeGreaterThanOrEqual(99.98);
  });
});`
  },
  {
    id: 'TEST-102',
    name: 'Anomaly Test: Shadow DOM Race Mutation Guard',
    framework: 'Playwright',
    status: 'FAILED',
    duration: '3.82s',
    assertions: 6,
    tags: ['Performance', 'Memory', 'Regression'],
    code: `import { test, expect } from '@playwright/test';

test('asserts detached DOM nodes stay under 250 elements during rapid purges', async ({ page }) => {
  await page.goto('/portal/reactor-controls');
  const purgeButton = page.locator('[data-testid="purge-btn"]');

  for (let i = 0; i < 12; i++) {
    await purgeButton.click();
  }

  const heapMetrics = await page.evaluate(() => (window as any).performance.memory?.totalJSHeapSize);
  expect(heapMetrics).toBeLessThan(65 * 1024 * 1024); // FAILED: Exceeded 128MB
});`
  },
  {
    id: 'TEST-103',
    name: 'Integration: Biometric Clearance Mutex Verification',
    framework: 'Jest / Supertest',
    status: 'PASSED',
    duration: '0.68s',
    assertions: 9,
    tags: ['Auth', 'Concurrency'],
    code: `describe('Clearance Gate Mutex', () => {
  it('rejects duplicate concurrent clearance token requests', async () => {
    const payload = { clearanceId: 'LEVEL_5_CLASSIFIED', nonce: 'HAWKINS-011' };
    
    const [res1, res2] = await Promise.all([
      request(app).post('/api/v1/auth/clearance-gate').send(payload),
      request(app).post('/api/v1/auth/clearance-gate').send(payload)
    ]);

    expect([res1.status, res2.status]).toContain(200);
    expect([res1.status, res2.status]).toContain(429);
  });
});`
  },
  {
    id: 'TEST-104',
    name: 'Visual Regression: Upside Down Spore Density Canvas',
    framework: 'Cypress',
    status: 'PASSED',
    duration: '2.11s',
    assertions: 8,
    tags: ['UI', 'A11y', 'Canvas'],
    code: `describe('Spore Atmosphere Renderer', () => {
  it('matches pixel threshold across dimensional phase change', () => {
    cy.visit('/dashboard/telemetry');
    cy.get('[data-testid="dimension-toggle"]').click();
    cy.get('.upside-down-overlay').should('be.visible');
    cy.matchImageSnapshot('upside-down-rift-active', {
      threshold: 0.02,
      thresholdType: 'percent'
    });
  });
});`
  },
  {
    id: 'TEST-105',
    name: 'Contract: IoT Christmas Light String Baud Rate Stability',
    framework: 'Playwright',
    status: 'PASSED',
    duration: '0.94s',
    assertions: 12,
    tags: ['IoT', 'WebSocket', 'Stability'],
    code: `test('verifies RF Morse decoder catches 100% of wall light pulses', async ({ page }) => {
  await page.goto('/byers-livingroom/r-u-n');
  const letters = ['R', 'U', 'N'];
  for (const letter of letters) {
    const bulb = page.locator(\`[data-letter="\${letter}"]\`);
    await expect(bulb).toHaveClass(/active-flicker/, { timeout: 1500 });
  }
});`
  }
];

export const EXPLORATION_NODES = [
  { id: 'node-root', name: 'ROOT: /', depth: 0, status: 'scanned', elements: 84, responseTime: '34ms', risk: 'low' },
  { id: 'node-auth', name: '/auth/clearance', depth: 1, status: 'vulnerability-found', elements: 26, responseTime: '182ms', risk: 'critical' },
  { id: 'node-portal', name: '/portal/reactor', depth: 1, status: 'anomaly-flagged', elements: 112, responseTime: '310ms', risk: 'high' },
  { id: 'node-containment', name: '/rift-containment', depth: 2, status: 'anomaly-flagged', elements: 78, responseTime: '98ms', risk: 'high' },
  { id: 'node-telemetry', name: '/telemetry/stream', depth: 2, status: 'scanned', elements: 45, responseTime: '42ms', risk: 'medium' },
  { id: 'node-sensors', name: '/sensors/rf-signal', depth: 3, status: 'scanned', elements: 63, responseTime: '55ms', risk: 'low' },
  { id: 'node-byers', name: '/byers-livingroom', depth: 2, status: 'scanned', elements: 50, responseTime: '29ms', risk: 'low' },
  { id: 'node-arcade', name: '/arcade/leaderboard', depth: 3, status: 'scanned', elements: 94, responseTime: '76ms', risk: 'low' }
];

export const ACTIVITY_LOG_TEMPLATES = [
  { phase: 'INIT', level: 'INFO', text: 'Initializing TestPilot autonomous neural core v2.4...' },
  { phase: 'INIT', level: 'INFO', text: 'Connecting to target endpoint: {URL}' },
  { phase: 'CRAWL', level: 'INFO', text: 'Autonomous DOM crawler launched: Headless Chromium cluster initialized' },
  { phase: 'CRAWL', level: 'INFO', text: 'Discovered root layout tree (84 interactive interactive elements, 12 form inputs)' },
  { phase: 'CRAWL', level: 'WARN', text: 'Unregistered mutation observer detected at /portal/reactor-controls' },
  { phase: 'ANOMALY', level: 'BUG', text: 'ANOMALY DETECTED: Rapid state dispatch locks UI thread (Detached DOM overflow)' },
  { phase: 'CRAWL', level: 'INFO', text: 'Synthesizing state graph across dynamic client routes...' },
  { phase: 'ANOMALY', level: 'BUG', text: 'CONCURRENCY ANOMALY: Nonce replay accepted in /auth/clearance-gate' },
  { phase: 'SYNTHESIS', level: 'INFO', text: 'Generating self-healing Playwright & Jest test suites...' },
  { phase: 'SYNTHESIS', level: 'INFO', text: 'Synthesized TEST-101: Quantum Gate Lockdown Protocol (14 assertions)' },
  { phase: 'SYNTHESIS', level: 'WARN', text: 'Hydration mismatch flagged on /dashboard/telemetry (<UpsideDownClock />)' },
  { phase: 'ANOMALY', level: 'BUG', text: 'FOCUS TRAP IDENTIFIED: Modal z-index collision isolates keyboard navigation' },
  { phase: 'REPORTS', level: 'INFO', text: 'Executing test runner across 4 simulated dimensional environments...' },
  { phase: 'REPORTS', level: 'WARN', text: 'TEST-102 failed: Heap boundary threshold exceeded (128MB > 65MB)' },
  { phase: 'REPORTS', level: 'INFO', text: 'Computing code coverage and attack surface penetration metrics...' },
  { phase: 'COMPLETE', level: 'SUCCESS', text: 'TESTING RUN COMPLETE: 84 tests synthesized, 7 anomalies isolated, 94.2% surface coverage' }
];
