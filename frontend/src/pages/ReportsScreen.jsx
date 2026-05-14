import { Sidebar } from '../components/Sidebar';
import { demoWorkers, formatMoney, getDemoMetrics } from '../lib/demoData';

const ReportsScreen = ({ onNav, theme, onToggleTheme }) => {
  const metrics = getDemoMetrics(demoWorkers);

  return (
    <div className="screen on" style={{ flexDirection: 'row' }}>
      <Sidebar active="reports" onNav={onNav} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="main-area" style={{ flex: 1 }}>
        <div className="topbar">
          <div>
            <div className="topbar-title">Reports</div>
            <div className="topbar-sub">Judge-ready impact summary and exportable fraud report</div>
          </div>
          <div className="topbar-right">
            <button className="btn btn-ghost">Download PDF</button>
            <button className="btn btn-primary" onClick={() => onNav('payments')}>Open payment gate</button>
          </div>
        </div>

        <div className="page-pad">
          <div className="tab-summary-grid">
            <div className="tab-summary-card"><span>Ghost records</span><strong className="red">{metrics.flagged}</strong></div>
            <div className="tab-summary-card"><span>Verified workers</span><strong className="green">{metrics.verified}</strong></div>
            <div className="tab-summary-card"><span>Funds blocked</span><strong>{formatMoney(metrics.blockedAmount)}</strong></div>
            <div className="tab-summary-card"><span>Integrity score</span><strong>{metrics.integrity}%</strong></div>
          </div>
          <div className="report-grid">
            <section className="report-hero card">
              <span className="eyebrow">May 2026 Proof of Life Report</span>
              <h2>{metrics.flagged} ghost records blocked before payout</h2>
              <p>VIRGIL detected duplicate identity and payment patterns, then prevented {formatMoney(metrics.blockedAmount)} from reaching unverified records through Squad payment gating.</p>
            </section>
            {[
              ['AI Technical Depth', 'RandomForest anomaly detection across identity, attendance, salary, and biometric signals'],
              ['Squad API Integration', 'Verified workers are released, flagged workers are held with payment references logged'],
              ['Use of Data', 'Every risk score includes evidence, severity, and confidence contribution'],
              ['Impact Potential', 'Designed for ministries, agencies, NGOs, and private HR payrolls'],
            ].map(([title, body]) => (
              <div key={title} className="card report-card">
                <strong>{title}</strong>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsScreen;
