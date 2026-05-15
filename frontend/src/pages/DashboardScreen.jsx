import { useEffect, useState } from 'react';
import { getWorkers } from '../lib/api';
import { Sidebar } from '../components/Sidebar';
import { aiSignals, auditEntries, demoWorkers, formatMoney, getDemoMetrics } from '../lib/demoData';

const fallbackScore = (index) => 55 + ((index * 17) % 41);

const normalizeWorker = (worker, index) => ({
  id: worker.id || worker.staffId || `VIR-${100000 + index}`,
  name: worker.name || `${worker.firstName || 'Worker'} ${worker.lastName || index + 1}`,
  department: worker.department || 'Unassigned',
  nin: worker.nin,
  salary: worker.salary || 0,
  status: worker.status || 'VERIFIED',
  score: worker.score || worker.aiConfidence || fallbackScore(index),
  reasons: worker.reasons || (worker.aiReasons ? (Array.isArray(worker.aiReasons) ? worker.aiReasons : []) : (worker.status === 'FLAGGED' ? demoWorkers[2].reasons : [])),
  squadRef: worker.squadRef || null,
});

const DashboardScreen = ({ onNav, onUpload, theme, onToggleTheme }) => {
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getWorkers()
      .then(data => {
        setWorkers(data.length ? data.map(normalizeWorker) : []);
        setIsLoading(false);
      })
      .catch(() => {
        setWorkers([]);
        setIsLoading(false);
      });
  }, []);

  const handleLoadDemo = () => {
    localStorage.setItem('virgil_demo_mode', 'true');
    window.location.reload();
  };

  const metrics = getDemoMetrics(workers);
  const topFlagged = workers.filter(worker => worker.status === 'FLAGGED')[0] || demoWorkers[2];

  const aiStages = [
    { icon: 'ti-file-upload', label: 'Batch intake', detail: 'CSV payroll records normalized' },
    { icon: 'ti-brain', label: 'AI scoring', detail: '8 fraud signals scored per worker' },
    { icon: 'ti-shield-search', label: 'Explainability', detail: 'Confidence, evidence, severity' },
    { icon: 'ti-lock-dollar', label: 'Squad gate', detail: 'Verified paid, ghosts held' },
  ];

  return (
    <div className="screen on" style={{ flexDirection: 'row' }}>
      <Sidebar active="overview" onNav={onNav} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="main-area" style={{ flex: 1 }}>
        <div className="topbar">
          <div>
            <div className="topbar-title">Overview</div>
            <div className="topbar-sub">AI payroll verification and Squad payment gating</div>
          </div>
          <div className="topbar-right">
            <span className="batch-tag">System Ready</span>
            {workers.length > 0 && (
              <button className="btn-icon" onClick={onUpload} title="Upload payroll"><i className="ti ti-upload" /></button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-loader" style={{ fontSize: '24px', color: 'var(--red)', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : workers.length === 0 ? (
          <div className="empty-dashboard" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(215,38,56,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <i className="ti ti-file-analytics" style={{ fontSize: '32px', color: 'var(--red)' }} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px', letterSpacing: '-0.5px' }}>No payroll datasets have been analyzed yet.</h2>
            <p style={{ fontSize: '15px', color: 'var(--text3)', maxWidth: '400px', lineHeight: 1.6, marginBottom: '32px' }}>
              Upload a payroll dataset to begin workforce verification and payroll integrity analysis.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="btn btn-primary" onClick={onUpload}><i className="ti ti-upload" /> Upload Payroll Dataset</button>
              <button className="btn" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }} onClick={handleLoadDemo}>View Demo Dataset</button>
            </div>
            
            <div style={{ marginTop: '80px', padding: '24px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', maxWidth: '500px', width: '100%', textAlign: 'left' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>System Readiness</div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '20px' }}>
                <i className="ti ti-brain" style={{ color: 'var(--red)', fontSize: '20px', padding: '8px', background: 'rgba(215,38,56,0.1)', borderRadius: '8px' }} />
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>AI Analysis Engine: Standby</div>
                  <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '4px' }}>Ready to ingest and score CSV records.</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <i className="ti ti-lock-dollar" style={{ color: 'var(--green)', fontSize: '20px', padding: '8px', background: 'rgba(34,197,94,0.1)', borderRadius: '8px' }} />
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>Squad API Gateway: Connected</div>
                  <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '4px' }}>Awaiting verification signals to release funds.</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="overview-shell">
          <section className="ai-hero">
            <div className="ai-hero-copy">
              <span className="eyebrow">Proof of Life Engine</span>
              <h1>Fraud is stopped before a single kobo leaves.</h1>
              <p>VIRGIL scans payroll records for ghost-worker patterns, explains every high-risk verdict, then uses Squad as the payment gate.</p>
              <div className="hero-actions">
                <button className="btn btn-primary" onClick={onUpload}><i className="ti ti-file-upload" /> Upload payroll</button>
                <button className="btn btn-ghost" onClick={() => onNav('detection')}>Review flagged workers</button>
              </div>
            </div>
            <div className="ai-orb-card">
              <div className="ai-orb">
                <i className="ti ti-brain" />
                <span>{topFlagged.score}%</span>
              </div>
              <div className="ai-orb-meta">
                <strong>Ghost probability</strong>
                <span>{topFlagged.name} blocked by Squad gate</span>
              </div>
            </div>
          </section>

          <div className="stat-row overview-stats">
            {[
              { label: 'Payroll Records', num: metrics.total.toLocaleString(), ic: 'ti-users', sub: 'Current batch records' },
              { label: 'Verified', num: metrics.verified.toLocaleString(), ic: 'ti-circle-check', cls: 'green', sub: 'Queued for Squad payout' },
              { label: 'Flagged', num: metrics.flagged.toLocaleString(), ic: 'ti-flag', cls: 'red', sub: 'Payment blocked' },
              { label: 'Funds Held', num: formatMoney(metrics.blockedAmount), ic: 'ti-lock-dollar', cls: 'red', sub: 'Stopped before disbursement' },
              { label: 'Integrity', num: `${metrics.integrity}%`, ic: 'ti-shield-check', cls: 'green', sub: 'Batch trust score' },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-label"><i className={`ti ${s.ic}`} /> {s.label}</div>
                <div className={`stat-num ${s.cls || ''}`}>{s.num}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="overview-grid">
            <div className="card ai-pipeline-card">
              <div className="card-header"><span className="card-title">AI Workflow</span><span className="mini-link">Live demo path</span></div>
              <div className="ai-pipeline">
                {aiStages.map((stage, i) => (
                  <div key={stage.label} className="ai-stage">
                    <div className="stage-icon"><i className={`ti ${stage.icon}`} /></div>
                    <div>
                      <strong>{stage.label}</strong>
                      <span>{stage.detail}</span>
                    </div>
                    {i < aiStages.length - 1 && <i className="ti ti-arrow-right stage-arrow" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">Fraud Signals</span><button className="text-button" onClick={() => onNav('detection')}>Open AI results</button></div>
              <div className="signal-stack">
                {aiSignals.map(signal => (
                  <div key={signal.label} className={`signal-card ${signal.severity}`}>
                    <div>
                      <strong>{signal.label}</strong>
                      <span>{signal.detail}</span>
                    </div>
                    <b>{signal.value}</b>
                  </div>
                ))}
              </div>
            </div>

            <div className="card flagged-focus">
              <div className="card-header"><span className="card-title">AI Explanation Focus</span><span className="badge badge-red">Blocked</span></div>
              <div className="worker-focus-head">
                <div>
                  <strong>{topFlagged.name}</strong>
                  <span>{topFlagged.id} - {topFlagged.department}</span>
                </div>
                <div className="confidence-pill">{topFlagged.score}%</div>
              </div>
              <div className="confidence-track"><div style={{ width: `${topFlagged.score}%` }} /></div>
              <div className="reason-list">
                {(topFlagged.reasons || []).map(reason => (
                  <div key={reason.flag} className={`reason-row ${reason.severity}`}>
                    <span>{reason.flag}</span>
                    <small>{reason.detail}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">Audit Pulse</span><button className="text-button" onClick={() => onNav('audit')}>View audit</button></div>
              <div className="audit-mini">
                {auditEntries.slice(0, 5).map(entry => (
                  <div key={`${entry.time}-${entry.action}`} className={`audit-mini-row ${entry.status}`}>
                    <span>{entry.time}</span>
                    <div>
                      <strong>{entry.action}</strong>
                      <small>{entry.detail}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default DashboardScreen;
