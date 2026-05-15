import { useState, useEffect } from 'react';
import { getWorkers, releasePayments, getPaymentStats } from '../lib/api';
import { Sidebar } from '../components/Sidebar';
import { formatMoney } from '../lib/workerState';

const PaymentsScreen = ({ onNav, theme, onToggleTheme }) => {
  const [workers, setWorkers] = useState([]);
  const [stats, setStats] = useState(null);
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    getWorkers()
      .then(data => setWorkers(data.length ? data : []))
      .catch(() => setWorkers([]));
    getPaymentStats()
      .then(data => setStats(data))
      .catch(() => setStats(null));
  }, []);

  const cleared = workers.filter(worker => worker.status === 'VERIFIED');
  const flagged = workers.filter(worker => worker.status === 'FLAGGED');
  const totalSalary = stats?.queuedAmount ?? cleared.reduce((sum, worker) => sum + (worker.salary || 0), 0);
  const flaggedSalary = stats?.blockedAmount ?? flagged.reduce((sum, worker) => sum + (worker.salary || 0), 0);
  const releasedAmount = stats?.releasedAmount ?? 0;

  const handleRelease = async () => {
    setReleasing(true);
    try {
      await releasePayments();
      const [nextWorkers, nextStats] = await Promise.all([getWorkers(), getPaymentStats()]);
      setWorkers(nextWorkers.length ? nextWorkers : []);
      setStats(nextStats);
      alert('Payments released via Squad API');
    } catch (e) {
      alert(e.message);
    }
    setReleasing(false);
  };

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
          {workers.length === 0 ? (
            <div style={{ width: '100%', textAlign: 'center', padding: '80px 20px', background: 'var(--surface)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
              <i className="ti ti-credit-card" style={{ fontSize: '40px', color: 'var(--text3)', marginBottom: '16px', display: 'block' }} />
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>No payment batches queued</div>
              <div style={{ fontSize: '14px', marginTop: '8px', color: 'var(--text3)' }}>Analyze payroll records to release funds via Squad API.</div>
            </div>
          ) : (
            <>
              <div className="payment-summary">
                {[
                  { label: 'Queued for Squad', amt: formatMoney(totalSalary), sub: `For ${cleared.length} verified workers`, icon: 'ti-clock', c: 'var(--amber)' },
                  { label: 'Blocked Amount', amt: formatMoney(flaggedSalary), sub: `${flagged.length} high-risk workers held`, icon: 'ti-lock-dollar', c: 'var(--red-bright)' },
                  { label: 'Previously Released', amt: releasedAmount > 0 ? formatMoney(releasedAmount) : '—', sub: releasedAmount > 0 ? 'With Squad transaction references' : 'No payments released yet', icon: 'ti-circle-check', c: 'var(--green)' },
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
                    <tr>
                      <td>May 2026 Batch</td>
                      <td>{cleared.length}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text)' }}>{formatMoney(totalSalary)}</td>
                      <td><span className="badge badge-amber">Awaiting release</span></td>
                      <td>May 14, 2026</td>
                    </tr>
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

export default PaymentsScreen;
