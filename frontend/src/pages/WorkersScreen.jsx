import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';
import { formatMoney, normalizeReason } from '../lib/workerState';
import { getWorkers } from '../lib/api';
import { useEffect } from 'react';

const normalizeWorker = (w, i) => ({
  id: w.id || w.staffId || `VIR-${100000 + i}`,
  name: w.name || `${w.firstName || 'Worker'} ${w.lastName || i + 1}`,
  department: w.department || 'Unassigned',
  nin: w.nin || '—',
  salary: Number(w.salary || 0),
  status: w.status || 'VERIFIED',
  score: Number(w.aiConfidence ?? w.score ?? 0),
  reasons: Array.isArray(w.aiReasons) ? w.aiReasons.map(normalizeReason).filter(Boolean) : [],
  squadRef: w.squadRef || null,
  bankAccount: w.bankAccount || w.bank_account || '—',
});

const RISK_LEVELS = [
  { id: 'all', label: 'All' },
  { id: 'FLAGGED', label: 'Flagged' },
  { id: 'VERIFIED', label: 'Verified' },
  { id: 'PAID', label: 'Paid' },
];

const WorkerModal = ({ worker, onClose }) => (
  <motion.div
    className="modal-backdrop"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
  >
    <motion.div
      className="worker-modal"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      onClick={e => e.stopPropagation()}
    >
      <div className="worker-modal-header">
        <div>
          <div className="worker-modal-name">{worker.name}</div>
          <div className="worker-modal-id">{worker.id} · {worker.department}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className={`badge ${worker.status === 'FLAGGED' ? 'badge-red' : 'badge-green'}`}>
            {worker.status === 'FLAGGED' ? 'Ghost Risk' : worker.status}
          </span>
          <button className="modal-close" onClick={onClose}><i className="ti ti-x" /></button>
        </div>
      </div>

      <div className="worker-modal-body">
        <div className="worker-modal-score-row">
          <div className="worker-modal-score-panel">
            <div className="modal-score-label">AI Trust Score</div>
            <div className={`modal-score-val ${worker.score >= 60 ? 'danger' : 'safe'}`}>{worker.score}%</div>
            <div className="modal-score-bar">
              <div style={{ width: `${worker.score}%`, background: worker.score >= 60 ? 'var(--accent)' : 'var(--success)' }} />
            </div>
            <div className="modal-score-verdict">
              {worker.score >= 80 ? 'HIGH RISK - Payment blocked' : worker.score >= 60 ? 'ELEVATED - Needs review' : 'LOW RISK - Payment cleared'}
            </div>
          </div>
          <div className="worker-modal-meta">
            {[
              { label: 'NIN', val: worker.nin },
              { label: 'Salary', val: formatMoney(worker.salary) },
              { label: 'Bank Account', val: worker.bankAccount },
              { label: 'Squad Ref', val: worker.squadRef || (worker.status === 'PAID' || worker.status === 'CONFIRMED' ? 'Recorded in payment ledger' : 'Not released') },
            ].map(({ label, val }) => (
              <div key={label} className="worker-modal-field">
                <span>{label}</span>
                <strong style={{ fontFamily: label === 'NIN' || label === 'Bank Account' ? 'monospace' : undefined }}>{val}</strong>
              </div>
            ))}
          </div>
        </div>

        {worker.reasons?.length > 0 && (
          <div className="worker-modal-reasons">
            <div className="modal-section-label">AI Fraud Signals</div>
            {worker.reasons.map((r, i) => (
              <div key={i} className={`reason-row ${r.severity || 'medium'}`} style={{ marginBottom: 8 }}>
                <span>{r.flag}</span>
                <small>{r.detail}</small>
              </div>
            ))}
          </div>
        )}

        <div className="worker-modal-timeline">
          <div className="modal-section-label">Activity Timeline</div>
          {[
            { time: '10:31 AM', action: 'AI evaluation completed', status: 'ai' },
            { time: '10:25 AM', action: 'Payroll batch uploaded', status: 'info' },
            { time: '09:14 AM', action: 'Last biometric check recorded', status: 'info' },
          ].map((entry, i) => (
            <div key={i} className="modal-timeline-row">
              <span>{entry.time}</span>
              <div>{entry.action}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  </motion.div>
);

const WorkersScreen = ({ onNav, theme, onToggleTheme }) => {
  const [workers, setWorkers] = useState([]);
  const [query, setQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getWorkers()
      .then(data => setWorkers(data.length ? data.map(normalizeWorker) : []))
      .catch(() => setWorkers([]));
  }, []);

  const departments = ['all', ...new Set(workers.map(w => w.department).filter(Boolean))];

  const visible = workers.filter(w => {
    const matchQuery = `${w.name} ${w.department} ${w.nin}`.toLowerCase().includes(query.toLowerCase());
    const matchRisk = riskFilter === 'all' || w.status === riskFilter;
    const matchDept = deptFilter === 'all' || w.department === deptFilter;
    return matchQuery && matchRisk && matchDept;
  });

  const flagged = workers.filter(w => w.status === 'FLAGGED');
  const verified = workers.filter(w => w.status === 'VERIFIED');
  const blockedAmount = flagged.reduce((s, w) => s + w.salary, 0);

  return (
    <div className="screen on" style={{ flexDirection: 'row' }}>
      <Sidebar active="workers" onNav={onNav} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="main-area" style={{ flex: 1 }}>
        <div className="topbar">
          <div>
            <div className="topbar-title">Workers</div>
            <div className="topbar-sub">Identity records, AI risk scores, and payment eligibility</div>
          </div>
          <div className="topbar-right">
            <input
              className="search-input"
              placeholder="Search name, NIN, department…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button className="btn btn-ghost" onClick={() => onNav('detection')}>
              <i className="ti ti-shield-search" /> View flags
            </button>
          </div>
        </div>

        <div className="page-pad">
          {/* Summary row */}
          <div className="tab-summary-grid" style={{ marginBottom: 16 }}>
            <div className="tab-summary-card">
              <span>Total workers</span><strong>{workers.length}</strong>
            </div>
            <div className="tab-summary-card">
              <span>Verified</span><strong className="green">{verified.length}</strong>
            </div>
            <div className="tab-summary-card">
              <span>Flagged</span><strong className="red">{flagged.length}</strong>
            </div>
            <div className="tab-summary-card">
              <span>Funds held</span><strong>{formatMoney(blockedAmount)}</strong>
            </div>
          </div>

          {/* Filter bar */}
          <div className="workers-filter-bar">
            <div className="filter-tabs">
              {RISK_LEVELS.map(lvl => (
                <div
                  key={lvl.id}
                  className={`filter-tab ${riskFilter === lvl.id ? 'active' : ''}`}
                  onClick={() => setRiskFilter(lvl.id)}
                >
                  {lvl.label}
                  <span className="filter-count">
                    {lvl.id === 'all' ? workers.length : workers.filter(w => w.status === lvl.id).length}
                  </span>
                </div>
              ))}
            </div>
            <select
              className="workers-dept-select"
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
            >
              {departments.map(d => (
                <option key={d} value={d}>{d === 'all' ? 'All departments' : d}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="card" style={{ marginTop: 12 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Department</th>
                  <th>NIN</th>
                  <th>AI Score</th>
                  <th>Salary</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((worker, i) => (
                  <tr key={worker.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(worker)}>
                    <td>
                      <div className="worker-cell">
                        <span>{worker.name.split(' ').map(p => p[0]).slice(0, 2).join('')}</span>
                        <div>
                          <strong>{worker.name}</strong>
                          <small>{worker.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>{worker.department}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{worker.nin}</td>
                    <td>
                      <div className="risk-bar-wrap">
                        <span style={{ color: worker.score >= 60 ? 'var(--accent)' : 'var(--success)', fontWeight: 700 }}>
                          {worker.score}%
                        </span>
                        <div className="risk-bar">
                          <div className="risk-bar-fill" style={{ width: `${worker.score}%`, background: worker.score >= 60 ? 'var(--accent)' : 'var(--success)' }} />
                        </div>
                      </div>
                    </td>
                    <td>{formatMoney(worker.salary)}</td>
                    <td>
                      <span className={`badge ${worker.status === 'FLAGGED' ? 'badge-red' : 'badge-green'}`}>
                        {worker.status === 'FLAGGED' ? 'Flagged' : worker.status}
                      </span>
                    </td>
                    <td>
                      {worker.status === 'FLAGGED'
                        ? <span className="badge badge-red">Blocked</span>
                        : worker.status === 'VERIFIED'
                          ? <span className="badge badge-amber">Queued</span>
                          : <span className="badge badge-green">Released</span>
                      }
                    </td>
                    <td>
                      <button className="btn-review" onClick={e => { e.stopPropagation(); setSelected(worker); }}>
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)' }}>
                      No workers match your search
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selected && <WorkerModal worker={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default WorkersScreen;
