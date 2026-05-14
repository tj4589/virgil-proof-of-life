import { useState } from 'react';
import { ThemeToggle } from '../components/ThemeToggle';

const story = [
  {
    eyebrow: 'Step 01',
    headline: 'Every payroll tells a story.',
    desc: 'Set up your workspace so VIRGIL can learn the shape of your payroll operations.',
    badge: 'Org profile',
    stat: '4 min setup',
  },
  {
    eyebrow: 'Step 02',
    headline: 'Intelligence before disbursement.',
    desc: 'Connect records from files, HR systems, or government databases before funds move.',
    badge: 'Data source',
    stat: 'Live checks',
  },
  {
    eyebrow: 'Step 03',
    headline: 'Built for public trust.',
    desc: 'Tune the verification policy that decides what passes, pauses, or needs review.',
    badge: 'Policy guard',
    stat: 'Audit ready',
  },
];

const OnboardingScreen = ({ onComplete, theme, onToggleTheme }) => {
  const [step, setStep] = useState(0);
  const [source, setSource] = useState('excel');
  const logoSrc = theme === 'light' ? '/logo-light.png' : '/logo.png';
  const next = () => step < 2 ? setStep(step + 1) : onComplete();
  const sources = [
    { id: 'excel', ic: 'ti-file-spreadsheet', label: 'Excel / CSV File', sub: 'Upload records manually' },
    { id: 'hr', ic: 'ti-database', label: 'HR Payroll System', sub: 'Connect via secure API' },
    { id: 'gov', ic: 'ti-building-bank', label: 'Government Database', sub: 'Direct database sync' },
  ];
  return (
    <div className="screen on" style={{ background: 'var(--bg)', flexDirection: 'column' }}>
      <div className="ob-topbar">
        <div className="ob-brand">
          <img src={logoSrc} alt="VIRGIL" style={{ height: '28px', width: 'auto' }} />
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text3)' }}>0{step + 1} / 04</div>
        <div className="ob-steps-dots">
          {[0, 1, 2].map(i => <div key={i} className={`ob-dot ${i === step ? 'on' : ''}`} />)}
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} compact />
      </div>
      <div className="ob-body">
        <div className="ob-left-panel">
          <div className="ob-eyebrow">{story[step].eyebrow}</div>
          <div className="ob-headline">
            {story[step].headline}
          </div>
          <div className="ob-desc">
            {story[step].desc}
          </div>
          <div className="ob-left-visual" aria-hidden="true">
            <div className="ob-planet">
              <div className="ob-planet-ring" />
              <div className="ob-orbit orbit-one">
                <span><i className="ti ti-user-check" /></span>
              </div>
              <div className="ob-orbit orbit-two">
                <span><i className="ti ti-file-analytics" /></span>
              </div>
              <div className="ob-orbit orbit-three">
                <span><i className="ti ti-shield-check" /></span>
              </div>
              <div className="ob-core">
                <i className="ti ti-fingerprint" />
              </div>
            </div>
            <div className="ob-floating-card card-a">
              <span>{story[step].badge}</span>
              <strong>Verified</strong>
            </div>
            <div className="ob-floating-card card-b">
              <span>{story[step].stat}</span>
              <strong>Ready</strong>
            </div>
          </div>
        </div>
        <div className="ob-right-panel">
          {step === 0 && <>
            <div className="form-group">
              <div className="form-label">Organisation name</div>
              <input className="form-input" placeholder="e.g. Federal Ministry of Finance" />
            </div>
            <div className="form-group">
              <div className="form-label">Country</div>
              <select className="form-select">
                <option>Nigeria</option><option>Ghana</option><option>Kenya</option>
              </select>
            </div>
            <div className="form-group">
              <div className="form-label">Your role</div>
              <select className="form-select">
                <option>Select your role</option>
                <option>Payroll Officer</option>
                <option>Finance Director</option>
                <option>Auditor</option>
              </select>
            </div>
          </>}
          {step === 1 && <>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>Where do you get your payroll data?</div>
            {sources.map(s => (
              <div key={s.id} className={`source-option ${source === s.id ? 'selected' : ''}`} onClick={() => setSource(s.id)}>
                <div className="source-icon">
                  <i className={`ti ${s.ic}`} style={{ fontSize: '18px', color: 'var(--red)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>{s.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{s.sub}</div>
                </div>
                {source === s.id && <div className="source-selected-dot" />}
              </div>
            ))}
          </>}
          {step === 2 && <>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '8px' }}>Set your default verification policy</div>
            {[
              { label: 'Risk sensitivity', val: 'High (Strict)', def: 85 },
              { label: 'Auto-block threshold', val: '85%', def: 85 },
              { label: 'Required manual review status', val: '90%', def: 90 },
            ].map((p, i) => (
              <div key={i} className="policy-row">
                <div className="policy-label-row">
                  <span className="policy-label">{p.label}</span>
                  <span className="policy-value">{p.val}</span>
                </div>
                <input type="range" className="policy-slider" defaultValue={p.def} min={0} max={100} />
              </div>
            ))}
          </>}
          <button className="ob-continue" onClick={next}>
            Continue <i className="ti ti-arrow-right" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;
