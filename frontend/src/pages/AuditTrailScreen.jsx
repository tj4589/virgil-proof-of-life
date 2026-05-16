import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';
import { getAuditLog } from '../lib/api';

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
  const [entries, setEntries] = useState([]);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  useEffect(() => {
    getAuditLog()
      .then(data => setEntries(data))
      .catch(() => setEntries([]));
  }, []);

  const filtered = filter === 'all' ? entries : entries.filter(e => e.status === filter);
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page on filter change
  useEffect(() => { setPage(0); }, [filter]);

  return (
    <div className="screen on" style={{ flexDirection: 'row' }}>
      <Sidebar active="audit" onNav={onNav} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="main-area" style={{ flex: 1 }}>
        <div className="topbar">
          <div>
            <div className="topbar-title">Audit Trail</div>
            <div className="topbar-sub">Immutable record of AI decisions, Squad events, and manual actions</div>
          </div>
          <div className="topbar-right">
            {entries.length > 0 && <span className="batch-tag">{entries.length} events</span>}
            {entries.length > 0 && <button className="btn btn-ghost"><i className="ti ti-download" /> Export log</button>}
          </div>
        </div>

        <div className="page-pad">
          {entries.length === 0 ? (
            <div style={{ width: '100%', textAlign: 'center', padding: '80px 20px', background: 'var(--surface)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
              <i className="ti ti-clipboard-list" style={{ fontSize: '40px', color: 'var(--text3)', marginBottom: '16px', display: 'block' }} />
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>No operational alerts</div>
              <div style={{ fontSize: '14px', marginTop: '8px', color: 'var(--text3)' }}>Audit events will appear here after payroll analysis begins.</div>
            </div>
          ) : (
            <>
              <div className="tab-summary-grid audit-summary" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 16 }}>
                <div className="tab-summary-card"><span>Total events</span><strong>{entries.length}</strong></div>
                <div className="tab-summary-card"><span>AI decisions</span><strong className="red">{entries.filter(e => e.status === 'ai' || e.status === 'blocked').length}</strong></div>
                <div className="tab-summary-card"><span>Squad payments</span><strong className="green">{entries.filter(e => e.status === 'paid').length}</strong></div>
                <div className="tab-summary-card"><span>Blocked actions</span><strong className="red">{entries.filter(e => e.status === 'blocked').length}</strong></div>
              </div>

              <div className="filter-tabs" style={{ marginBottom: 14 }}>
                {FILTERS.map(f => (
                  <div key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                    {f === 'all' ? 'All events' : STATUS_LABELS[f]?.label || f}
                    <span className="filter-count">{f === 'all' ? entries.length : entries.filter(e => e.status === f).length}</span>
                  </div>
                ))}
              </div>

              <div className="audit-rail">
                {visible.map((entry, i) => (
                  <motion.div
                    key={entry.id || `${entry.time}-${entry.action}-${i}`}
                    className={`audit-row ${entry.status}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className={`audit-dot audit-dot-${entry.status}`}>
                      <i className={`ti ${STATUS_ICONS[entry.status] || 'ti-file'}`} />
                    </div>
                    <div className="audit-content">
                      <div className="audit-row-top">
                        <strong>{entry.action}</strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className={`badge ${STATUS_LABELS[entry.status]?.cls || 'badge-gray'}`}>{STATUS_LABELS[entry.status]?.label}</span>
                          <span>{new Date(entry.time).toLocaleString()}</span>
                        </div>
                      </div>
                      <p>{entry.detail}</p>
                      <small>Actor: {entry.actor}</small>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filtered.length > PAGE_SIZE && (
                <div className="pagination-bar" style={{ marginTop: 12 }}>
                  <div className="pagination-info">Showing events {(page * PAGE_SIZE) + 1}–{Math.min(filtered.length, (page + 1) * PAGE_SIZE)}</div>
                  <div className="pagination-btns">
                    <button className="btn-pagi" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</button>
                    <span className="page-indicator">Page {page + 1}</span>
                    <button className="btn-pagi" disabled={(page + 1) * PAGE_SIZE >= filtered.length} onClick={() => setPage(p => p + 1)}>Next</button>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="card audit-policy-card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <span className="card-title">Audit Integrity Guarantee</span>
              <i className="ti ti-shield-lock" style={{ color: 'var(--accent)', fontSize: 14 }} />
            </div>
            <div className="card-body">
              <p className="muted-copy">
                Every AI verdict, Squad disbursement, and manual override is recorded with backend timestamps and transaction references where available.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditTrailScreen;
