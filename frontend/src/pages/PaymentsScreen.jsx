import { useState, useEffect } from 'react';
import { getWorkers, releasePayments } from '../lib/api';
import { Sidebar } from '../components/Sidebar';
import { demoWorkers, formatMoney } from '../lib/demoData';

const PaymentsScreen = ({ onNav, theme, onToggleTheme }) => {
  const [workers, setWorkers] = useState(demoWorkers);
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    getWorkers()
      .then(data => setWorkers(data.length ? data : demoWorkers))
      .catch(() => setWorkers(demoWorkers));
  }, []);

  const cleared = workers.filter(worker => worker.status !== 'FLAGGED');
  const flagged = workers.filter(worker => worker.status === 'FLAGGED');
  const totalSalary = cleared.reduce((sum, worker) => sum + (worker.salary || 0), 0);
  const flaggedSalary = flagged.reduce((sum, worker) => sum + (worker.salary || 0), 0);

  const handleRelease = async () => {
    setReleasing(true);
    try {
      await releasePayments();
      getWorkers()
        .then(data => setWorkers(data.length ? data : demoWorkers))
        .catch(() => setWorkers(demoWorkers));
      alert('Payments released via Squad API');
    } catch (e) {
      alert(e.message);
    }
    setReleasing(false);
  };

  const batches = [
    { name: 'May 2026 Batch', workers: cleared.length, amount: formatMoney(totalSalary), status: 'on-hold', date: 'May 14, 2026' },
    { name: 'Apr 2026 Batch', workers: 22100, amount: 'NGN 251.7M', status: 'completed', date: 'Apr 14, 2026' },
    { name: 'Mar 2026 Batch', workers: 21800, amount: 'NGN 245.7M', status: 'completed', date: 'Mar 14, 2026' },
  ];

  return (
    <div className="screen on" style={{ flexDirection: 'row' }}>
      <Sidebar active="payments" onNav={onNav} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="main-area" style={{ flex: 1 }}>
        <div className="topbar">
          <div>
            <div className="topbar-title">Payments</div>
            <div className="topbar-sub">Squad releases verified salaries and holds flagged records</div>
          </div>
          <div className="topbar-right">
            <span className="batch-tag">May 2026 Batch</span>
            <button className="btn btn-primary" onClick={handleRelease} disabled={releasing}>
              <i className="ti ti-send" />{releasing ? 'Releasing...' : 'Release Verified Payments'}
            </button>
          </div>
        </div>

        <div className="page-pad">
          <div className="payment-summary">
            {[
              { label: 'Queued for Squad', amt: formatMoney(totalSalary), sub: `For ${cleared.length} verified workers`, icon: 'ti-clock', c: 'var(--amber)' },
              { label: 'Blocked Amount', amt: formatMoney(flaggedSalary), sub: `${flagged.length} high-risk workers held`, icon: 'ti-lock-dollar', c: 'var(--red-bright)' },
              { label: 'Previously Released', amt: 'NGN 1.4B', sub: 'With transaction references', icon: 'ti-circle-check', c: 'var(--green)' },
            ].map((item, i) => (
              <div key={i} className="pay-card">
                <div className="pay-card-top">
                  <span className="pay-card-label">{item.label}</span>
                  <i className={`ti ${item.icon}`} style={{ fontSize: '16px', color: item.c }} />
                </div>
                <div className="pay-card-amt" style={{ color: item.c }}>{item.amt}</div>
                <div className="pay-card-sub">{item.sub}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Squad Payment Gate</span><span className="mini-link">Verified records only</span></div>
            <table className="tbl">
              <thead>
                <tr><th>Batch</th><th>Workers</th><th>Amount</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {batches.map(batch => (
                  <tr key={batch.name}>
                    <td>{batch.name}</td>
                    <td>{batch.workers.toLocaleString()}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{batch.amount}</td>
                    <td>{batch.status === 'on-hold' ? <span className="badge badge-amber">Awaiting release</span> : <span className="badge badge-green">Completed</span>}</td>
                    <td>{batch.date}</td>
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

export default PaymentsScreen;
