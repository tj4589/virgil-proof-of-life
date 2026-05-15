import { useState, useEffect } from 'react';
import { getWorkers, releasePayments, getPaymentStats } from '../lib/api';
import { Sidebar } from '../components/Sidebar';
import { formatMoney } from '../lib/workerState';

const PaymentsScreen = ({ onNav, theme, onToggleTheme }) => {
  const [workers, setWorkers] = useState([]);
  const [stats, setStats] = useState(null);
  const [releasing, setReleasing] = useState(false);
  const [toast, setToast] = useState(null); // { text, type }

  const now = new Date();
  const batchLabel = now.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });
  const batchDate = now.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4500);
  };

  const reload = () => Promise.all([
    getWorkers().then(d => setWorkers(d.length ? d : [])).catch(() => {}),
    getPaymentStats().then(d => setStats(d)).catch(() => {}),
  ]);

  useEffect(() => { reload(); }, []);

  const cleared = workers.filter(w => w.status === 'VERIFIED');
  const flagged  = workers.filter(w => w.status === 'FLAGGED');
  const paid     = workers.filter(w => w.status === 'PAID' || w.status === 'CONFIRMED');
  const totalSalary   = stats?.queuedAmount   ?? cleared.reduce((s, w) => s + (w.salary || 0), 0);
  const flaggedSalary = stats?.blockedAmount  ?? flagged.reduce((s, w)  => s + (w.salary || 0), 0);
  const releasedAmount = stats?.releasedAmount ?? paid.reduce((s, w) => s + (w.salary || 0), 0);

  const handleRelease = async () => {
    if (releasing || cleared.length === 0) return;
    setReleasing(true);
    try {
      const result = await releasePayments();
      await reload();
      showToast(`${result.released} payment${result.released !== 1 ? 's' : ''} released via Squad API.`);
    } catch (e) {
      showToast(e.message || 'Payment release failed.', 'error');
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
            <span className="batch-tag">{batchLabel} Batch</span>
            <button
              className="btn btn-primary"
              onClick={handleRelease}
              disabled={releasing || cleared.length === 0}
            >
              <i className="ti ti-send" />
              {releasing ? 'Releasing...' : `Release ${cleared.length} Verified Payments`}
            </button>
          </div>
        </div>

        {toast && (
          <div style={{
            margin: '0 24px',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            background: toast.type === 'error' ? 'rgba(215,38,56,0.12)' : 'rgba(34,197,94,0.12)',
            border: `1px solid ${toast.type === 'error' ? 'rgba(215,38,56,0.3)' : 'rgba(34,197,94,0.3)'}`,
            color: toast.type === 'error' ? 'var(--red-bright)' : 'var(--green)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <i className={`ti ${toast.type === 'error' ? 'ti-alert-circle' : 'ti-circle-check'}`} />
            {toast.text}
          </div>
        )}

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
                  { label: 'Queued for Squad', amt: formatMoney(totalSalary), sub: `${cleared.length} verified worker${cleared.length !== 1 ? 's' : ''} ready`, icon: 'ti-clock', c: 'var(--amber)' },
                  { label: 'Blocked Amount', amt: formatMoney(flaggedSalary), sub: `${flagged.length} high-risk worker${flagged.length !== 1 ? 's' : ''} held`, icon: 'ti-lock-dollar', c: 'var(--red-bright)' },
                  { label: 'Previously Released', amt: releasedAmount > 0 ? formatMoney(releasedAmount) : '—', sub: releasedAmount > 0 ? `${paid.length} worker${paid.length !== 1 ? 's' : ''} paid via Squad` : 'No payments released yet', icon: 'ti-circle-check', c: 'var(--green)' },
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
                      <td>{batchLabel} Batch</td>
                      <td>{cleared.length}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text)' }}>{formatMoney(totalSalary)}</td>
                      <td>
                        {cleared.length === 0
                          ? <span className="badge badge-green">All Released</span>
                          : <span className="badge badge-amber">Awaiting release</span>}
                      </td>
                      <td>{batchDate}</td>
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
