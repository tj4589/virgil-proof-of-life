import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';
import { auditEntries } from '../lib/demoData';
import { getWorkers } from '../lib/api';

const EXTRA_ENTRIES = [
  { actor: 'VIRGIL System', action: 'Payroll anomaly detected', detail: 'Ghost Worker 5: NIN 10000000019 appears on 3 separate records', time: '10:29 AM', status: 'blocked' },
  { actor: 'VIRGIL System', action: 'Identity collision flagged', detail: 'Bank account 0123456789 shared across 4 worker records', time: '10:28 AM', status: 'blocked' },
  { actor: 'HR Officer', action: 'Manual review initiated', detail: 'Worker VIR-100007 escalated to compliance team', time: '10:40 AM', status: 'info' },
  { actor: 'Squad Gateway', action: 'Disbursement webhook received', detail: 'ref SQD-SAL-240514-002 — Chinedu Okafor confirmed', time: '10:36 AM', status: 'paid' },
  { actor: 'Document AI', action: 'NIN verification passed', detail: 'Maryam Yusuf — NIMC record matched with 98.4% confidence', time: '10:39 AM', status: 'ai' },
  { actor: 'VIRGIL System', action: 'High-risk disbursement blocked', detail: 'NGN 850,000 held — Ghost Worker 7, Executive Council', time: '10:33 AM', status: 'blocked' },
];

const ALL_ENTRIES = [...auditEntries, ...EXTRA_ENTRIES].sort((a, b) => {
  const toMin = t => {
    const [h, m] = t.replace(' AM', '').replace(' PM', '').split(':').map(Number);
    return h * 60 + m;
  };
  return toMin(b.time) - toMin(a.time);
});

const STATUS_ICONS = {
  paid: 'ti-circle-check',
  blocked: 'ti-lock',
  ai: 'ti-brain',
  info: 'ti-file-analytics',
};

const STATUS_LABELS = {
  paid: { label: 'Payment', cls: 'badge-green' },
  blocked: { label: 'Blocked', cls: 'badge-red' },
  ai: { label: 'AI', cls: 'badge-amber' },
  info: { label: 'System', cls: 'badge-gray' },
};

const FILTERS = ['all', 'blocked', 'paid', 'ai', 'info'];

const AuditTrailScreen = ({ onNav, theme, onToggleTheme }) => {
  const [filter, setFilter] = useState('all');
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    getWorkers()
      .then(data => setHasData(data.length > 0))
      .catch(() => setHasData(false));
  }, []);

  const visible = filter === 'all' ? ALL_ENTRIES : ALL_ENTRIES.filter(e => e.status === filter);

  return (
    <div className="screen on" style={{ flexDirection: 'row' }}>
      <Sidebar active="audit" onNav={onNav} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="main-area" style={{ flex: 1 }}>
        <div className="topbar">
          <div>
            <div className="topbar-title">Audit Trail</div>
            <div className="topbar-sub">Immutable record of all AI decisions, Squad events, and manual actions</div>
          </div>
          <div className="topbar-right">
            {hasData && <span className="batch-tag">{ALL_ENTRIES.length} events</span>}
            {hasData && <button className="btn btn-ghost"><i className="ti ti-download" /> Export log</button>}
          </div>
        </div>

        <div className="page-pad">
          {!hasData ? (
            <div style={{ width: '100%', textAlign: 'center', padding: '80px 20px', background: 'var(--surface)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
              <i className="ti ti-clipboard-list" style={{ fontSize: '40px', color: 'var(--text3)', marginBottom: '16px', display: 'block' }} />
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>No operational alerts</div>
              <div style={{ fontSize: '14px', marginTop: '8px', color: 'var(--text3)' }}>Audit events will appear here after payroll analysis begins.</div>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="tab-summary-grid audit-summary" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 16 }}>
                <div className="tab-summary-card"><span>Total events</span><strong>{ALL_ENTRIES.length}</strong></div>
                <div className="tab-summary-card"><span>AI decisions</span><strong className="red">{ALL_ENTRIES.filter(e => e.status === 'ai' || e.status === 'blocked').length}</strong></div>
                <div className="tab-summary-card"><span>Squad payments</span><strong className="green">{ALL_ENTRIES.filter(e => e.status === 'paid').length}</strong></div>
                <div className="tab-summary-card"><span>Blocked actions</span><strong className="red">{ALL_ENTRIES.filter(e => e.status === 'blocked').length}</strong></div>
              </div>

              {/* Filter tabs */}
              <div className="filter-tabs" style={{ marginBottom: 14 }}>
                {FILTERS.map(f => (
                  <div key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                    {f === 'all' ? 'All events' : STATUS_LABELS[f]?.label || f}
                    <span className="filter-count">{f === 'all' ? ALL_ENTRIES.length : ALL_ENTRIES.filter(e => e.status === f).length}</span>
                  </div>
                ))}
              </div>

              {/* Timeline */}
              <div className="audit-rail">
                {visible.map((entry, i) => (
                  <motion.div
                    key={`${entry.time}-${entry.action}-${i}`}
                    className={`audit-row ${entry.status}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                  >
                    <div className={`audit-dot audit-dot-${entry.status}`}>
                      <i className={`ti ${STATUS_ICONS[entry.status] || 'ti-file'}`} />
                    </div>
                    <div className="audit-content">
                      <div className="audit-row-top">
                        <strong>{entry.action}</strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className={`badge ${STATUS_LABELS[entry.status]?.cls || 'badge-gray'}`}>{STATUS_LABELS[entry.status]?.label}</span>
                          <span>{entry.time}</span>
                        </div>
                      </div>
                      <p>{entry.detail}</p>
                      <small>Actor: {entry.actor}</small>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {/* Policy note */}
          <div className="card audit-policy-card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <span className="card-title">Audit Integrity Guarantee</span>
              <i className="ti ti-shield-lock" style={{ color: 'var(--accent)', fontSize: 14 }} />
            </div>
            <div className="card-body">
              <p className="muted-copy">
                Every AI verdict, Squad disbursement, and manual override is permanently recorded.
                Records cannot be modified retroactively — ensuring full regulatory accountability.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {['Never delete records', 'Store Squad references', 'Explain every AI verdict', 'Timestamp all actions'].map(chip => (
                  <span key={chip} className="policy-chip">{chip}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditTrailScreen;
