import { Sidebar } from '../components/Sidebar';
import { ThemeToggle } from '../components/ThemeToggle';

const SettingsScreen = ({ onNav, theme, onToggleTheme }) => (
  <div className="screen on" style={{ flexDirection: 'row' }}>
    <Sidebar active="settings" onNav={onNav} theme={theme} onToggleTheme={onToggleTheme} />
    <div className="main-area" style={{ flex: 1 }}>
      <div className="topbar">
        <div>
          <div className="topbar-title">Settings</div>
          <div className="topbar-sub">Verification policy, Squad sandbox, and AI signal configuration</div>
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <div className="page-pad settings-grid">
        <div className="card">
          <div className="card-header"><span className="card-title">Verification Policy</span></div>
          <div className="card-body settings-stack">
            {[
              ['Ghost detection threshold', 60],
              ['Auto-block payment threshold', 80],
              ['Manual review threshold', 31],
            ].map(([label, value]) => (
              <label key={label} className="setting-row">
                <span>{label}<small>{value}%</small></span>
                <input type="range" min="0" max="100" defaultValue={value} />
              </label>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Squad API Gate</span></div>
          <div className="card-body settings-stack">
            <div className="integration-row"><i className="ti ti-shield-lock" /><div><strong>Sandbox mode</strong><small>https://sandbox-api-d.squadco.com</small></div><span className="badge badge-green">Active</span></div>
            <div className="integration-row"><i className="ti ti-currency-naira" /><div><strong>Kobo conversion</strong><small>All Naira values multiplied by 100 before release</small></div><span className="badge badge-green">Enabled</span></div>
            <div className="integration-row"><i className="ti ti-key" /><div><strong>Secret key</strong><small>Backend environment only</small></div><span className="badge badge-amber">Protected</span></div>
          </div>
        </div>
        <div className="card settings-wide">
          <div className="card-header"><span className="card-title">AI Signals</span></div>
          <div className="card-body signal-toggle-grid">
            {['Duplicate NIN', 'Duplicate bank account', 'Salary mismatch', 'Attendance anomaly', 'Inactive biometric history', 'Missing critical fields', 'Payroll tenure anomaly', 'Name duplication'].map(signal => (
              <label key={signal} className="signal-toggle"><input type="checkbox" defaultChecked /> {signal}</label>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SettingsScreen;
