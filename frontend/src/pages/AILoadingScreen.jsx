import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';

const processingSteps = [
  { icon: 'ti-file-analytics', label: 'Detecting duplicate payroll signatures...', detail: 'Cross-referencing NIN, BVN and bank account clusters' },
  { icon: 'ti-calendar-stats', label: 'Cross-checking attendance anomalies...', detail: 'Scanning for inactive biometric and absence patterns' },
  { icon: 'ti-shield-search', label: 'Verifying payment integrity...', detail: 'Checking salary bands, grade levels and outliers' },
  { icon: 'ti-brain', label: 'Building trust profiles...', detail: 'Assigning multi-signal composite risk scores' },
  { icon: 'ti-lock-dollar', label: 'Risk scoring workers...', detail: 'RandomForest model evaluating 8 fraud dimensions' },
];

const AILoadingScreen = ({ onComplete, theme, onToggleTheme }) => {
  const [pct, setPct] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setPct(p => {
        const next = p + 1.6;
        if (next >= 100) {
          clearInterval(t);
          setTimeout(onComplete, 800);
          return 100;
        }
        setCurrentStep(Math.min(processingSteps.length - 1, Math.floor((next / 100) * processingSteps.length)));
        return next;
      });
    }, 60);
    return () => clearInterval(t);
  }, [onComplete]);

  return (
    <div className="screen on" style={{ flexDirection: 'row' }}>
      <Sidebar active="overview" theme={theme} onToggleTheme={onToggleTheme} />
      <div className="main-area" style={{ flex: 1 }}>
        <div className="topbar">
          <div>
            <div className="topbar-title">AI Analysis Running</div>
            <div className="topbar-sub">VIRGIL is evaluating payroll integrity — this may take a moment</div>
          </div>
          <span className="batch-tag">May 2026 Batch</span>
        </div>

        <div className="ai-loading-layout">
          {/* Left: Orb + Progress */}
          <div className="ai-loading-orb-panel">
            <motion.div
              animate={{ boxShadow: ['0 0 40px rgba(215,38,56,0.2)', '0 0 80px rgba(215,38,56,0.45)', '0 0 40px rgba(215,38,56,0.2)'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="ai-loading-orb"
            >
              <span className="ai-loading-pct">{Math.round(pct)}%</span>
              <span className="ai-loading-label">analyzing</span>
              <div className="ai-loading-ring" />
              <div className="ai-loading-ring ring-2" />
            </motion.div>

            <div className="ai-loading-progress-wrap">
              <div className="ai-loading-meta">
                <span>24,532 records</span>
                <span>{Math.round(pct)}% complete</span>
              </div>
              <div className="ai-prog-track">
                <motion.div
                  className="ai-prog-fill"
                  animate={{ width: `${pct}%` }}
                  transition={{ ease: 'linear', duration: 0.06 }}
                />
              </div>
            </div>
          </div>

          {/* Right: Steps */}
          <div className="ai-loading-steps-panel">
            <div className="card-header" style={{ padding: '16px 20px' }}>
              <span className="card-title">Intelligence Pipeline</span>
              <span className="batch-tag">Live</span>
            </div>
            <div className="ai-steps-list">
              {processingSteps.map((step, i) => {
                const isDone = i < currentStep;
                const isActive = i === currentStep;
                return (
                  <motion.div
                    key={step.label}
                    className={`ai-step-row ${isDone ? 'done' : isActive ? 'active' : 'pending'}`}
                    initial={false}
                    animate={{ opacity: isActive || isDone ? 1 : 0.38 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="ai-step-icon">
                      <i className={`ti ${isDone ? 'ti-circle-check' : step.icon}`} />
                    </div>
                    <div className="ai-step-text">
                      <AnimatePresence mode="wait">
                        <motion.strong
                          key={`${step.label}-${isActive}`}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.25 }}
                        >
                          {step.label}
                        </motion.strong>
                      </AnimatePresence>
                      <span>{step.detail}</span>
                    </div>
                    {isDone && <i className="ti ti-check ai-step-check" />}
                    {isActive && (
                      <motion.div
                        className="ai-step-pulse"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="ai-loading-footer">
              <i className="ti ti-shield-lock" style={{ color: 'var(--accent)', fontSize: 13 }} />
              <span>All analysis is performed locally. No payroll data leaves your environment.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AILoadingScreen;
