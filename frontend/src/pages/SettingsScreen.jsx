import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { ThemeToggle } from '../components/ThemeToggle';

const SettingsScreen = ({ onNav, theme, onToggleTheme }) => {
  const [thresholds, setThresholds] = useState({ detect: 60, block: 80, review: 31 });
  const [polFreq, setPolFreq] = useState('monthly');
  const [sensitivity, setSensitivity] = useState('high');
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
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <button className="btn btn-primary"><i className="ti ti-device-floppy" /> Save changes</button>
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
                { key: 'detect', label: 'Ghost detection threshold', desc: 'Minimum score to flag a worker as suspicious' },
                { key: 'block', label: 'Auto-block payment threshold', desc: 'Payments automatically held above this score' },
                { key: 'review', label: 'Manual review trigger', desc: 'Score range requiring HR review before release' },
              ].map(({ key, label, desc }) => (
                <label key={key} className="setting-row">
                  <span>
                    {label}
                    <small>{thresholds[key]}%</small>
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
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="biannual">Bi-annual</option>
                </select>
              </div>
              <div className="settings-field-row">
                <label className="form-label">AI sensitivity</label>
                <select
                  className="form-select"
                  value={sensitivity}
                  onChange={e => setSensitivity(e.target.value)}
                >
                  <option value="strict">Strict — Flag anything suspicious</option>
                  <option value="high">High — Recommended</option>
                  <option value="balanced">Balanced — Fewer false positives</option>
                  <option value="lenient">Lenient — High confidence only</option>
                </select>
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
                { icon: 'ti-shield-lock', title: 'Sandbox mode', desc: 'https://sandbox-api-d.squadco.com', badge: 'Active', cls: 'badge-green' },
                { icon: 'ti-currency-naira', title: 'Kobo conversion', desc: 'All Naira values × 100 before release', badge: 'Enabled', cls: 'badge-green' },
                { icon: 'ti-key', title: 'Secret key', desc: 'Stored in backend environment only', badge: 'Protected', cls: 'badge-amber' },
                { icon: 'ti-webhook', title: 'Webhook endpoint', desc: '/api/squad/webhook — listening for confirmations', badge: 'Live', cls: 'badge-green' },
              ].map(({ icon, title, desc, badge, cls }) => (
                <div key={title} className="integration-row">
                  <i className={`ti ${icon}`} />
                  <div><strong>{title}</strong><small>{desc}</small></div>
                  <span className={`badge ${cls}`}>{badge}</span>
                </div>
              ))}
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
                { label: 'Webhook received', checked: false },
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
