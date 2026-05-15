import { useEffect, useState } from 'react';
import { getWorkers, updateWorkerStatus } from '../lib/api';
import { Sidebar } from '../components/Sidebar';
import { formatMoney, normalizeWorker } from '../lib/workerState';

const ResultsScreen = ({ onDashboard, onNav, theme, onToggleTheme }) => {
  const [workers, setWorkers] = useState([]);
  const [filter, setFilter] = useState('flagged');
  const [actionMsg, setActionMsg] = useState(null); // { text, type }
  const [acting, setActing] = useState(false);

  const loadWorkers = () =>
    getWorkers()
      .then(data => setWorkers(data.length ? data.map(normalizeWorker) : []))
      .catch(() => setWorkers([]));

  useEffect(() => { loadWorkers(); }, []);

  const showMsg = (text, type = 'success') => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg(null), 3500);
  };

  const handleOverride = async () => {
    if (!selected || acting) return;
    setActing(true);
    try {
      await updateWorkerStatus(selected.id, 'VERIFIED');
      showMsg(`${selected.name} overridden — marked as VERIFIED and queued for payment.`);
      await loadWorkers();
    } catch (e) {
      showMsg(e.message, 'error');
    }
    setActing(false);
  };

  const handleConfirmGhost = async () => {
    if (!selected || acting) return;
    setActing(true);
    try {
      await updateWorkerStatus(selected.id, 'FLAGGED');
      showMsg(`${selected.name} confirmed as ghost worker — payment permanently blocked.`, 'error');
      await loadWorkers();
    } catch (e) {
      showMsg(e.message, 'error');
    }
    setActing(false);
  };

  const flagged = workers.filter(worker => worker.status === 'FLAGGED');
  const selected = flagged.sort((a, b) => b.score - a.score)[0];
  const display = filter === 'flagged' ? flagged
    : filter === 'cleared' ? workers.filter(worker => ['VERIFIED', 'PAID', 'CONFIRMED'].includes(worker.status))
    : workers;

  return (
    <div className="screen on" style={{ flexDirection: 'row' }}>
      <Sidebar active="detection" onNav={onNav} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="main-area" style={{ flex: 1 }}>
        <div className="topbar">
          <div>
            <div className="topbar-title">Detection Results</div>
            <div className="topbar-sub">Interpretable AI output with payment impact</div>
          </div>
          <div className="topbar-right">
            <span className="batch-tag">Active Batch</span>
            <button className="btn btn-ghost">Export Report</button>
            <button className="btn btn-primary" onClick={onDashboard}>Go to Dashboard</button>
          </div>
        </div>

        {actionMsg && (
          <div style={{
            margin: '0 24px',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            background: actionMsg.type === 'error' ? 'rgba(215,38,56,0.12)' : 'rgba(34,197,94,0.12)',
            border: `1px solid ${actionMsg.type === 'error' ? 'rgba(215,38,56,0.3)' : 'rgba(34,197,94,0.3)'}`,
            color: actionMsg.type === 'error' ? 'var(--red-bright)' : 'var(--green)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <i className={`ti ${actionMsg.type === 'error' ? 'ti-alert-circle' : 'ti-circle-check'}`} />
            {actionMsg.text}
          </div>
        )}

        <div className="page-pad detection-layout">
          {workers.length === 0 ? (
            <div style={{ width: '100%', textAlign: 'center', padding: '80px 20px', background: 'var(--surface)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
              <i className="ti ti-shield-search" style={{ fontSize: '40px', color: 'var(--text3)', marginBottom: '16px', display: 'block' }} />
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>No anomalies detected yet</div>
              <div style={{ fontSize: '14px', marginTop: '8px', color: 'var(--text3)' }}>Upload a payroll dataset to begin AI fraud analysis.</div>
            </div>
          ) : (
            <>
              <div className="card ai-detail-card">
                <div className="card-header"><span className="card-title">Flagged Worker Explanation</span><span className="badge badge-red">Payment blocked</span></div>
                <div className="ai-detail-body">
                  {selected ? (
                    <div className="worker-focus-head">
                      <div>
                        <strong>{selected.name}</strong>
                        <span>{selected.id} · NIN {selected.nin} · {formatMoney(selected.salary)}</span>
                      </div>
                      <div className="confidence-pill">{selected.score}%</div>
                    </div>
                  ) : (
                    <div className="muted-copy">No flagged workers in the active dataset.</div>
                  )}
                  <div className="confidence-track large"><div style={{ width: `${selected?.score || 0}%` }} /></div>
                  <div className="reason-list expanded">
                    {(selected?.reasons || []).map((reason, i) => (
                      <div key={`${reason.flag}-${i}`} className={`reason-row ${reason.severity}`}>
                        <div><span>{reason.flag}</span><small>{reason.detail}</small></div>
                        <b>{reason.severity}</b>
                        <em>{reason.contribution}%</em>
                      </div>
                    ))}
                  </div>
                  {selected && (
                    <div className="decision-actions">
                      <button
                        className="btn btn-ghost"
                        onClick={handleOverride}
                        disabled={acting}
                        title="Remove ghost flag and queue for payment"
                      >
                        {acting ? <i className="ti ti-loader" style={{ animation: 'spin 1s linear infinite' }} /> : <i className="ti ti-circle-check" />}
                        Override and verify
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={handleConfirmGhost}
                        disabled={acting}
                        title="Confirm as ghost — permanently block payment"
                      >
                        <i className="ti ti-ban" />
                        Confirm ghost and block pay
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <span className="card-title">Worker Scores</span>
                  <div className="filter-tabs compact-tabs">
                    {[
                      { id: 'all', label: 'All', count: workers.length },
                      { id: 'flagged', label: 'Flagged', count: flagged.length },
                      { id: 'cleared', label: 'Cleared', count: workers.length - flagged.length },
                    ].map(item => (
                      <div key={item.id} className={`filter-tab ${filter === item.id ? 'active' : ''}`} onClick={() => setFilter(item.id)}>
                        {item.label}<span className="filter-count">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <table className="tbl">
                  <thead>
                    <tr><th>Worker</th><th>AI score</th><th>Top reason</th><th>Payment</th></tr>
                  </thead>
                  <tbody>
                    {display.map(worker => (
                      <tr key={worker.id}>
                        <td>{worker.name}</td>
                        <td><span style={{ color: worker.score >= 60 ? 'var(--red-bright)' : 'var(--green)', fontWeight: 700 }}>{worker.score}%</span></td>
                        <td>{worker.reasons[0]?.flag || 'Low risk pattern'}</td>
                        <td>{worker.status === 'FLAGGED' ? <span className="badge badge-red">Blocked</span> : <span className="badge badge-green">Queued</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
