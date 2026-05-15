import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { ThemeToggle } from '../components/ThemeToggle';
import { getSettings, saveSettings } from '../lib/api';

const SettingsScreen = ({ onNav, theme, onToggleTheme }) => {
  const [thresholds, setThresholds] = useState({ sensitivity: 85, autoBlock: 85, manualReview: 90 });
  const [isSaving, setIsSaving] = useState(false);
  const [polFreq, setPolFreq] = useState('monthly');
  const [signals, setSignals] = useState({
    'Duplicate NIN': true,
    'Duplicate bank account': true,
    'Salary mismatch': true,
    'Attendance anomaly': true,
    'Inactive biometric history': true,
    'Missing critical fields': true,
    'Payroll tenure anomaly': true,
    'Name duplication': false,
  });

  const toggleSignal = (key) => setSignals(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    getSettings().then(data => {
      if (data) setThresholds(data);
    }).catch(console.error);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings(thresholds);
      setTimeout(() => setIsSaving(false), 800);
    } catch (e) {
      console.error(e);
      setIsSaving(false);
    }
  };

  return (
    <div className="screen on" style={{ flexDirection: 'row' }}>
      <Sidebar active="settings" onNav={onNav} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="main-area" style={{ flex: 1 }}>
        <div className="topbar">
          <div>
            <div className="topbar-title">Settings</div>
            <div className="topbar-sub">Verification policy, AI configuration, and Squad API gateway</div>
          </div>
          <div className="topbar-right">
            <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <><i className="ti ti-loader" style={{ animation: 'spin 1s linear infinite' }} /> Saving</> : <><i className="ti ti-device-floppy" /> Save changes</>}
            </button>
          </div>
        </div>

        <div className="page-pad settings-grid">
          {/* Verification Policy */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Verification Policy</span>
              <span className="batch-tag">Thresholds</span>
            </div>
            <div className="card-body settings-stack">
              {[
                { key: 'sensitivity', label: 'Risk Sensitivity Base Threshold', desc: 'Minimum AI confidence score required to flag a worker as a potential anomaly.' },
                { key: 'autoBlock', label: 'Auto-Block Payment Threshold', desc: 'Disbursements are automatically frozen if the fraud score exceeds this limit.' },
                { key: 'manualReview', label: 'Mandatory Human Review Trigger', desc: 'Scores above this threshold strictly mandate an HR officer override before payment.' },
              ].map(({ key, label, desc }) => (
                <label key={key} className="setting-row">
                  <span>
                    {label}
                    <small>{thresholds[key]}{key !== 'sensitivity' && '%'}</small>
                  </span>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>{desc}</div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={thresholds[key]}
                    onChange={e => setThresholds(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Organization */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Organization Settings</span>
            </div>
            <div className="card-body settings-stack">
              <div className="settings-field-row">
                <label className="form-label">Organization name</label>
                <input className="form-input" defaultValue="Federal Ministry of Finance" />
              </div>
              <div className="settings-field-row">
                <label className="form-label">Proof-of-life frequency</label>
                <select
                  className="form-select"
                  value={polFreq}
                  onChange={e => setPolFreq(e.target.value)}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="randomized">Randomized</option>
                </select>
              </div>
              <div className="settings-field-row" style={{ alignItems: 'center' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Appearance Theme</label>
                <div style={{ background: 'var(--surface2)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <ThemeToggle theme={theme} onToggle={onToggleTheme} compact={false} />
                </div>
              </div>
            </div>
          </div>

          {/* Squad API */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Squad API Gateway</span>
              <span className="badge badge-green">Connected</span>
            </div>
            <div className="card-body settings-stack">
              {[
                { icon: 'ti-shield-lock', title: 'Sandbox Mode', desc: 'Operating safely in pre-production environment', badge: 'Active', cls: 'badge-green' },
                { icon: 'ti-plug-connected', title: 'API Connection Status', desc: 'Securely authenticated with Squad backend', badge: 'Verified', cls: 'badge-green' },
                { icon: 'ti-webhook', title: 'Webhook Endpoint', desc: 'Listening for live payment confirmations', badge: 'Live', cls: 'badge-green' },
              ].map(({ icon, title, desc, badge, cls }) => (
                <div key={title} className="integration-row">
                  <i className={`ti ${icon}`} />
                  <div><strong>{title}</strong><small>{desc}</small></div>
                  <span className={`badge ${cls}`}>{badge}</span>
                </div>
              ))}
              
              <details className="developer-diagnostics" style={{ marginTop: '16px', fontSize: '13px' }}>
                <summary style={{ cursor: 'pointer', color: 'var(--muted)', padding: '8px 0', borderTop: '1px dashed var(--border)', userSelect: 'none' }}>
                  <i className="ti ti-settings" style={{ marginRight: '6px' }} />
                  Advanced Diagnostics
                </summary>
                <div className="integration-row" style={{ background: 'var(--surface2)', opacity: 0.8, marginTop: '8px', border: '1px solid var(--border)' }}>
                  <i className="ti ti-currency-naira" />
                  <div><strong>Kobo Conversion</strong><small>All Naira values × 100 before payload transmission</small></div>
                  <span className="badge badge-amber">Enabled</span>
                </div>
              </details>
            </div>
          </div>

          {/* Notifications */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Notification Preferences</span>
            </div>
            <div className="card-body settings-stack">
              {[
                { label: 'Ghost worker detected', checked: true },
                { label: 'Payment blocked', checked: true },
                { label: 'Payment released via Squad', checked: true },
                { label: 'Manual review required', checked: true },
                { label: 'Payroll batch uploaded', checked: false },
              ].map(({ label, checked }) => (
                <label key={label} className="signal-toggle" style={{ cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked={checked} style={{ accentColor: 'var(--accent)' }} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* AI Signals - full width */}
          <div className="card settings-wide">
            <div className="card-header">
              <span className="card-title">Active AI Fraud Signals</span>
              <span className="mini-link">
                {Object.values(signals).filter(Boolean).length} / {Object.keys(signals).length} active
              </span>
            </div>
            <div className="card-body signal-toggle-grid">
              {Object.entries(signals).map(([sig, active]) => (
                <label key={sig} className={`signal-toggle ${active ? 'signal-toggle-active' : ''}`} style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleSignal(sig)}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  {sig}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
