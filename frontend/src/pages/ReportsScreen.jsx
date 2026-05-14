import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';
import { demoWorkers, formatMoney, getDemoMetrics } from '../lib/demoData';

const DEPT_DATA = [
  { dept: 'Finance', workers: 3, flagged: 0, risk: 12 },
  { dept: 'Health', workers: 4, flagged: 1, risk: 28 },
  { dept: 'Education', workers: 5, flagged: 0, risk: 9 },
  { dept: 'Works', workers: 3, flagged: 0, risk: 15 },
  { dept: 'Executive Council', workers: 2, flagged: 1, risk: 72 },
  { dept: 'Transport', workers: 2, flagged: 1, risk: 64 },
  { dept: 'Unassigned', workers: 2, flagged: 2, risk: 92 },
];

const SIGNAL_TRENDS = [
  { label: 'Duplicate bank account', count: 244, delta: '+18%', severity: 'high' },
  { label: 'Salary mismatch', count: 212, delta: '+5%', severity: 'medium' },
  { label: 'Attendance anomaly', count: 176, delta: '-3%', severity: 'high' },
  { label: 'Inactive biometrics', count: 380, delta: '+12%', severity: 'medium' },
  { label: 'Missing critical fields', count: 91, delta: '-8%', severity: 'medium' },
  { label: 'Duplicate NIN', count: 64, delta: '+2%', severity: 'high' },
];

const ReportsScreen = ({ onNav, theme, onToggleTheme }) => {
  const metrics = getDemoMetrics(demoWorkers);

  return (
    <div className="screen on" style={{ flexDirection: 'row' }}>
      <Sidebar active="reports" onNav={onNav} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="main-area" style={{ flex: 1 }}>
        <div className="topbar">
          <div>
            <div className="topbar-title">Reports</div>
            <div className="topbar-sub">Executive payroll integrity summary — May 2026</div>
          </div>
          <div className="topbar-right">
            <span className="batch-tag">May 2026 Batch</span>
            <button className="btn btn-ghost"><i className="ti ti-download" /> Export PDF</button>
            <button className="btn btn-primary" onClick={() => onNav('payments')}>
              <i className="ti ti-send" /> Release payments
            </button>
          </div>
        </div>

        <div className="page-pad">
          {/* KPI strip */}
          <div className="tab-summary-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
            <div className="tab-summary-card">
              <span>Ghost records</span><strong className="red">{metrics.flagged}</strong>
            </div>
            <div className="tab-summary-card">
              <span>Verified workers</span><strong className="green">{metrics.verified}</strong>
            </div>
            <div className="tab-summary-card">
              <span>Funds protected</span><strong>{formatMoney(metrics.blockedAmount)}</strong>
            </div>
            <div className="tab-summary-card">
              <span>Integrity score</span><strong>{metrics.integrity}%</strong>
            </div>
          </div>

          <div className="report-grid">
            {/* Hero */}
            <section className="report-hero card">
              <span className="eyebrow">Proof of Life — May 2026</span>
              <h2>{metrics.flagged} ghost records blocked before payout</h2>
              <p>
                VIRGIL detected duplicate identity and payment patterns across the May 2026 payroll batch,
                then prevented <strong>{formatMoney(metrics.blockedAmount)}</strong> from reaching
                unverified records through the Squad payment gate.
              </p>
              <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { label: 'AI Model', val: 'RandomForest' },
                  { label: 'Fraud Signals', val: '8 dimensions' },
                  { label: 'Processing Time', val: '< 3 minutes' },
                  { label: 'Payment Gate', val: 'Squad API' },
                ].map(({ label, val }) => (
                  <div key={label} className="report-kv-chip">
                    <span>{label}</span>
                    <strong>{val}</strong>
                  </div>
                ))}
              </div>
            </section>

            {/* Department Risk */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Department Risk Comparison</span>
              </div>
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {DEPT_DATA.sort((a, b) => b.risk - a.risk).map(d => (
                  <div key={d.dept} className="dept-risk-row">
                    <div className="dept-risk-meta">
                      <span>{d.dept}</span>
                      <small>{d.flagged} flagged / {d.workers}</small>
                    </div>
                    <div className="dept-risk-bar-wrap">
                      <div className="dept-risk-bar">
                        <motion.div
                          className="dept-risk-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${d.risk}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          style={{ background: d.risk > 60 ? 'var(--accent)' : d.risk > 30 ? 'var(--warning)' : 'var(--success)' }}
                        />
                      </div>
                      <span className="dept-risk-pct" style={{ color: d.risk > 60 ? 'var(--accent)' : d.risk > 30 ? 'var(--warning)' : 'var(--success)' }}>
                        {d.risk}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fraud Signal Trends */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Fraud Signal Frequency</span>
                <span className="mini-link">This batch</span>
              </div>
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SIGNAL_TRENDS.map(sig => (
                  <div key={sig.label} className={`signal-card ${sig.severity}`}>
                    <div>
                      <strong>{sig.label}</strong>
                      <span>{sig.count} occurrences</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                      <b style={{ fontSize: 18 }}>{sig.count}</b>
                      <small style={{ color: sig.delta.startsWith('+') ? 'var(--accent)' : 'var(--success)', fontSize: 10, fontWeight: 700 }}>
                        {sig.delta} vs last batch
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Qualitative cards */}
            {[
              { title: 'AI Technical Depth', body: 'RandomForest anomaly detection across 8 fraud signals: identity, attendance, salary, biometric, bank account, and payroll tenure patterns.' },
              { title: 'Squad API Integration', body: 'Verified workers are released via Squad Transfer API with transaction references logged. Flagged workers receive a BLOCKED status before any funds move.' },
              { title: 'Explainability First', body: 'Every risk score includes human-readable evidence with severity and confidence contribution. No black-box decisions.' },
              { title: 'Impact Potential', body: 'Designed for Nigerian ministries, federal agencies, state payrolls, NGOs, and private HR payrolls processing thousands of workers per cycle.' },
            ].map(({ title, body }) => (
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
