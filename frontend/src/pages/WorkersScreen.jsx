import { useEffect, useState } from 'react';
import { getWorkers } from '../lib/api';
import { Sidebar } from '../components/Sidebar';
import { demoWorkers, formatMoney, getDemoMetrics } from '../lib/demoData';

const normalizeWorker = (worker, index) => ({
  id: worker.id || worker.staffId || `VIR-${100000 + index}`,
  name: worker.name || `${worker.firstName || 'Worker'} ${worker.lastName || index + 1}`,
  department: worker.department || 'Unassigned',
  nin: worker.nin || 'Pending',
  salary: Number(worker.salary || 0),
  status: worker.status || 'VERIFIED',
  score: worker.score || worker.aiConfidence || (worker.status === 'FLAGGED' ? 86 : 18),
});

const WorkersScreen = ({ onNav, theme, onToggleTheme }) => {
  const [workers, setWorkers] = useState(demoWorkers);
  const [query, setQuery] = useState('');

  useEffect(() => {
    getWorkers()
      .then(data => setWorkers(data.length ? data.map(normalizeWorker) : demoWorkers))
      .catch(() => setWorkers(demoWorkers));
  }, []);

  const visible = workers.filter(worker =>
    `${worker.name || ''} ${worker.department || ''} ${worker.nin || ''}`.toLowerCase().includes(query.toLowerCase())
  );
  const metrics = getDemoMetrics(workers);

  return (
    <div className="screen on" style={{ flexDirection: 'row' }}>
      <Sidebar active="workers" onNav={onNav} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="main-area" style={{ flex: 1 }}>
        <div className="topbar">
          <div>
            <div className="topbar-title">Workers</div>
            <div className="topbar-sub">Worker identity records, AI score, and payment status</div>
          </div>
          <div className="topbar-right">
            <input className="search-input" placeholder="Search worker, NIN, department" value={query} onChange={event => setQuery(event.target.value)} />
            <button className="btn btn-primary" onClick={() => onNav('detection')}>Review flags</button>
          </div>
        </div>

        <div className="page-pad">
          <div className="tab-summary-grid">
            <div className="tab-summary-card"><span>Total workers</span><strong>{metrics.total}</strong></div>
            <div className="tab-summary-card"><span>Verified</span><strong className="green">{metrics.verified}</strong></div>
            <div className="tab-summary-card"><span>Flagged</span><strong className="red">{metrics.flagged}</strong></div>
            <div className="tab-summary-card"><span>Funds held</span><strong>{formatMoney(metrics.blockedAmount)}</strong></div>
          </div>
          <div className="card">
            <table className="tbl">
              <thead>
                <tr><th>Worker</th><th>Department</th><th>NIN</th><th>AI Score</th><th>Salary</th><th>Status</th><th>Payment</th></tr>
              </thead>
              <tbody>
                {visible.map(worker => (
                  <tr key={worker.id}>
                    <td>
                      <div className="worker-cell">
                        <span>{worker.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</span>
                        <div><strong>{worker.name}</strong><small>{worker.id}</small></div>
                      </div>
                    </td>
                    <td>{worker.department}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{worker.nin}</td>
                    <td>
                      <div className="risk-bar-wrap">
                        <span style={{ color: worker.score >= 60 ? 'var(--red-bright)' : 'var(--green)', fontWeight: 700 }}>{worker.score}%</span>
                        <div className="risk-bar"><div className="risk-bar-fill" style={{ width: `${worker.score}%`, background: worker.score >= 60 ? 'var(--red-bright)' : 'var(--green)' }} /></div>
                      </div>
                    </td>
                    <td>{formatMoney(worker.salary || 0)}</td>
                    <td><span className={`badge ${worker.status === 'FLAGGED' ? 'badge-red' : 'badge-green'}`}>{worker.status}</span></td>
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

export default WorkersScreen;
