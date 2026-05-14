import { useEffect, useState } from 'react';
import { getWorkers } from '../lib/api';
import { Sidebar } from '../components/Sidebar';
import { demoWorkers, formatMoney } from '../lib/demoData';

const fallbackScore = (index) => 55 + ((index * 17) % 41);

const normalizeWorker = (worker, index) => ({
  id: worker.id || worker.staffId || `VIR-${100000 + index}`,
  name: worker.name || `${worker.firstName || 'Worker'} ${worker.lastName || index + 1}`,
  department: worker.department || 'Unassigned',
  nin: worker.nin,
  salary: worker.salary || 0,
  status: worker.status || 'VERIFIED',
  score: worker.score || worker.aiConfidence || fallbackScore(index),
  reasons: worker.reasons || (worker.status === 'FLAGGED' ? demoWorkers[2].reasons : []),
});

const ResultsScreen = ({ onDashboard, onNav, theme, onToggleTheme }) => {
  const [workers, setWorkers] = useState(demoWorkers);
  const [filter, setFilter] = useState('flagged');

  useEffect(() => {
    getWorkers()
      .then(data => setWorkers(data.length ? data.map(normalizeWorker) : demoWorkers))
      .catch(() => setWorkers(demoWorkers));
  }, []);

  const flagged = workers.filter(worker => worker.status === 'FLAGGED');
  const selected = flagged[0] || demoWorkers[2];
  const display = filter === 'flagged' ? flagged
    : filter === 'cleared' ? workers.filter(worker => worker.status !== 'FLAGGED')
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
            <span className="batch-tag">May 2026 Batch</span>
            <button className="btn btn-ghost">Export Report</button>
            <button className="btn btn-primary" onClick={onDashboard}>Go to Dashboard</button>
          </div>
        </div>

        <div className="page-pad detection-layout">
          <div className="card ai-detail-card">
            <div className="card-header"><span className="card-title">Flagged Worker Explanation</span><span className="badge badge-red">Payment blocked</span></div>
            <div className="ai-detail-body">
              <div className="worker-focus-head">
                <div>
                  <strong>{selected.name}</strong>
                  <span>{selected.id} - NIN {selected.nin} - {formatMoney(selected.salary)}</span>
                </div>
                <div className="confidence-pill">{selected.score}%</div>
              </div>
              <div className="confidence-track large"><div style={{ width: `${selected.score}%` }} /></div>
              <div className="reason-list expanded">
                {selected.reasons.map(reason => (
                  <div key={reason.flag} className={`reason-row ${reason.severity}`}>
                    <div><span>{reason.flag}</span><small>{reason.detail}</small></div>
                    <b>{reason.severity}</b>
                    <em>{reason.contribution}%</em>
                  </div>
                ))}
              </div>
              <div className="decision-actions">
                <button className="btn btn-ghost">Override and verify</button>
                <button className="btn btn-primary">Confirm ghost and block pay</button>
              </div>
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
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
