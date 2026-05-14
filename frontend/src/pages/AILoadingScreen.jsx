import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';

const AILoadingScreen = ({ onComplete, theme, onToggleTheme }) => {
  const [pct, setPct] = useState(0);

  const steps = [
    'Validating identities...',
    'Analyzing salary patterns...',
    'Verifying bank accounts...',
    'Cross-checking biometrics...',
  ];

  useEffect(() => {
    const t = setInterval(() => {
      setPct(p => {
        if (p >= 100) { clearInterval(t); setTimeout(onComplete, 600); return 100; }
        return p + 2;
      });
    }, 60);
    return () => clearInterval(t);
  }, [onComplete]);

  const step = Math.min(3, Math.floor(pct / 26));

  return (
    <div className="screen on" style={{ flexDirection: 'row' }}>
      <Sidebar active="overview" theme={theme} onToggleTheme={onToggleTheme} />
      <div className="main-area" style={{ flex: 1 }}>
        <div className="topbar">
          <div>
            <div className="topbar-title">AI Analysis</div>
            <div className="topbar-sub">Our AI is analyzing your payroll records</div>
          </div>
          <span className="batch-tag">May 2026 Batch</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '24px' }}>
          {/* Sphere + progress */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px', gap: '20px' }}>
            <div className="ai-sphere">{pct}%</div>
            <div style={{ fontSize: '13px', color: 'var(--text2)' }}>Analyzing 24,532 records...</div>
            <div style={{ width: '100%' }}>
              <div className="prog-track">
                <div className="prog-fill" style={{ width: `${pct}%` }} />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '6px', textAlign: 'right' }}>{pct}% complete</div>
            </div>
          </div>

          {/* Steps */}
          <div className="card">
            <div className="card-header"><span className="card-title">Processing Steps</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {steps.map((s, i) => (
                <div key={i} className={`step-row ${i < step ? 'done' : i === step ? 'active' : 'pending'}`}>
                  <i
                    className={`ti ${i < step ? 'ti-circle-check' : 'ti-circle-dotted'}`}
                    style={{ color: i < step ? 'var(--green)' : i === step ? 'var(--red)' : 'var(--text3)', fontSize: '16px' }}
                  />
                  <span>{s}</span>
                  {i < step && <i className="ti ti-check" style={{ marginLeft: 'auto', color: 'var(--green)', fontSize: '13px' }} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AILoadingScreen;
