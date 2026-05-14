import { Sidebar } from '../components/Sidebar';
import { auditEntries } from '../lib/demoData';

const AuditTrailScreen = ({ onNav, theme, onToggleTheme }) => (
  <div className="screen on" style={{ flexDirection: 'row' }}>
    <Sidebar active="audit" onNav={onNav} theme={theme} onToggleTheme={onToggleTheme} />
    <div className="main-area" style={{ flex: 1 }}>
      <div className="topbar">
        <div>
          <div className="topbar-title">Audit Trail</div>
          <div className="topbar-sub">Immutable proof of AI decisions, manual actions, and Squad events</div>
        </div>
        <div className="topbar-right">
          <span className="batch-tag">6 critical events</span>
          <button className="btn btn-ghost">Export log</button>
        </div>
      </div>

      <div className="page-pad audit-page">
        <div className="tab-summary-grid audit-summary">
          <div className="tab-summary-card"><span>AI events</span><strong>3</strong></div>
          <div className="tab-summary-card"><span>Squad events</span><strong className="green">2</strong></div>
          <div className="tab-summary-card"><span>Blocked actions</span><strong className="red">2</strong></div>
        </div>
        <div className="audit-rail">
          {auditEntries.map(entry => (
            <div key={`${entry.time}-${entry.action}`} className={`audit-row ${entry.status}`}>
              <div className="audit-dot"><i className={`ti ${entry.status === 'paid' ? 'ti-check' : entry.status === 'blocked' ? 'ti-lock' : entry.status === 'ai' ? 'ti-brain' : 'ti-file'}`} /></div>
              <div className="audit-content">
                <div className="audit-row-top"><strong>{entry.action}</strong><span>{entry.time}</span></div>
                <p>{entry.detail}</p>
                <small>Actor: {entry.actor}</small>
              </div>
            </div>
          ))}
        </div>
        <div className="card audit-policy-card">
          <div className="card-header"><span className="card-title">Why this matters to judges</span></div>
          <div className="card-body">
            <p className="muted-copy">Every detection, hold, override, and Squad payment reference is recorded. This proves the product can survive real payroll governance, not just a clean demo.</p>
            <div className="policy-chip">Never delete records</div>
            <div className="policy-chip">Store Squad references</div>
            <div className="policy-chip">Explain every AI verdict</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default AuditTrailScreen;
