import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';
import { getStats, getWorkers } from '../lib/api';
import { computeMetrics, formatMoney, normalizeWorker, signalCountsFromWorkers } from '../lib/workerState';

const ReportsScreen = ({ onNav, theme, onToggleTheme }) => {
  const [workers, setWorkers] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([getWorkers({ limit: 500 }), getStats().catch(() => null)])
      .then(([res, summary]) => {
        setWorkers(res.workers?.length ? res.workers.map(normalizeWorker) : []);
        setStats(summary);
      })
      .catch(() => {
        setWorkers([]);
        setStats(null);
      });
  }, []);

  const localMetrics = computeMetrics(workers);
  const metrics = {
    flagged: stats?.flaggedCount ?? localMetrics.flagged,
    verified: stats?.verifiedCount ?? localMetrics.verified,
    blockedAmount: stats?.blockedAmount ?? localMetrics.blockedAmount,
    integrity: stats?.integrity ?? localMetrics.integrity,
    anomalyDensity: stats?.anomalyDensity ?? localMetrics.anomalyDensity,
  };
  const departments = stats?.departmentRisk?.length ? stats.departmentRisk : [];
  const signals = stats?.signalCounts?.length
    ? stats.signalCounts.map(s => ({ label: s.label, count: s.count, severity: s.count > 1 ? 'high' : 'medium' }))
    : signalCountsFromWorkers(workers);

  return (
    <div className="screen on" style={{ flexDirection: 'row' }}>
      <Sidebar active="reports" onNav={onNav} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="main-area" style={{ flex: 1 }}>
        <div className="topbar">
          <div>
            <div className="topbar-title">Reports</div>
            <div className="topbar-sub">Executive payroll integrity summary for the active dataset</div>
          </div>
          <div className="topbar-right">
            <span className="batch-tag">{stats?.batch || 'No active batch'}</span>
            {workers.length > 0 && <button className="btn btn-ghost"><i className="ti ti-download" /> Export PDF</button>}
            {workers.length > 0 && <button className="btn btn-primary" onClick={() => onNav('payments')}><i className="ti ti-send" /> Release payments</button>}
          </div>
        </div>

        <div className="page-pad">
          {workers.length === 0 ? (
            <div style={{ width: '100%', textAlign: 'center', padding: '80px 20px', background: 'var(--surface)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
              <i className="ti ti-chart-bar" style={{ fontSize: '40px', color: 'var(--text3)', marginBottom: '16px', display: 'block' }} />
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>No reports generated yet</div>
              <div style={{ fontSize: '14px', marginTop: '8px', color: 'var(--text3)' }}>Reports will appear here after payroll analysis is complete.</div>
            </div>
          ) : (
            <>
              <div className="tab-summary-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
                <div className="tab-summary-card"><span>Ghost records</span><strong className="red">{metrics.flagged}</strong></div>
                <div className="tab-summary-card"><span>Verified workers</span><strong className="green">{metrics.verified}</strong></div>
                <div className="tab-summary-card"><span>Funds protected</span><strong>{formatMoney(metrics.blockedAmount)}</strong></div>
                <div className="tab-summary-card"><span>Anomaly density</span><strong>{metrics.anomalyDensity}%</strong></div>
              </div>

              <div className="report-grid">
                <section className="report-hero card">
                  <span className="eyebrow">Proof of Life</span>
                  <h2>{metrics.flagged} ghost records blocked before payout</h2>
                  <p>VIRGIL detected active payroll anomalies and prevented <strong>{formatMoney(metrics.blockedAmount)}</strong> from reaching unverified records through the Squad payment gate.</p>
                  <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[
                      { label: 'AI Model', val: 'Isolation Forest' },
                      { label: 'Integrity', val: `${metrics.integrity}%` },
                      { label: 'Workers', val: workers.length.toLocaleString() },
                      { label: 'Payment Gate', val: 'Squad API' },
                    ].map(({ label, val }) => (
                      <div key={label} className="report-kv-chip"><span>{label}</span><strong>{val}</strong></div>
                    ))}
                  </div>
                </section>

                <div className="card">
                  <div className="card-header"><span className="card-title">Department Risk Comparison</span></div>
                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {departments.sort((a, b) => b.risk - a.risk).map(d => (
                      <div key={d.dept} className="dept-risk-row">
                        <div className="dept-risk-meta"><span>{d.dept}</span><small>{d.flagged} flagged / {d.workers}</small></div>
                        <div className="dept-risk-bar-wrap">
                          <div className="dept-risk-bar">
                            <motion.div className="dept-risk-fill" initial={{ width: 0 }} animate={{ width: `${d.risk}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} style={{ background: d.risk > 60 ? 'var(--accent)' : d.risk > 30 ? 'var(--warning)' : 'var(--success)' }} />
                          </div>
                          <span className="dept-risk-pct" style={{ color: d.risk > 60 ? 'var(--accent)' : d.risk > 30 ? 'var(--warning)' : 'var(--success)' }}>{d.risk}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header"><span className="card-title">Fraud Signal Frequency</span><span className="mini-link">Active dataset</span></div>
                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {signals.length ? signals.map(sig => (
                      <div key={sig.label} className={`signal-card ${sig.severity}`}>
                        <div><strong>{sig.label}</strong><span>{sig.count} occurrence{sig.count === 1 ? '' : 's'}</span></div>
                        <b style={{ fontSize: 18 }}>{sig.count}</b>
                      </div>
                    )) : <p className="muted-copy">No fraud signals were recorded for this dataset.</p>}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsScreen;
