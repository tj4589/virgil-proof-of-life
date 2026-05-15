import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadWorkers } from '../lib/api';
import { Sidebar } from '../components/Sidebar';

function generateHRDataset(count) {
  let csv = 'emp_id,employee_name,dept,monthly_pay,acct_num,days_present,last_check\n';
  const depts = ['Sanitation', 'Transport', 'Education', 'Health', 'Works', 'Finance'];
  let anomalies = 0;
  for (let i = 1; i <= count; i++) {
    const isGhost = Math.random() < 0.08;
    const name = isGhost ? `Ghost Record ${i}` : `Public Worker ${i}`;
    const dept = depts[i % depts.length];
    const pay = 120000 + (i % 5) * 15000;
    const acct = isGhost ? '0099992222' : `009999${String(1000 + i).padStart(4, '0')}`;
    const days = isGhost ? Math.floor(Math.random() * 5) : 20 + Math.floor(Math.random() * 3);
    const date = isGhost ? '2025-01-12' : '2026-05-10';
    if (isGhost) anomalies++;
    csv += `HR-${900 + i},${name},${dept},${pay},${acct},${days},${date}\n`;
  }
  return { csv, count, anomalies };
}

function generatePayrollDataset(count, anomalyRate) {
  let csv = 'worker_id,full_name,department,salary,account_number,attendance_score,last_verification\n';
  const depts = ['Sanitation', 'Transport', 'Education', 'Health', 'Works', 'Finance'];
  let anomalies = 0;
  for (let i = 1; i <= count; i++) {
    const isGhost = Math.random() < anomalyRate;
    const name = isGhost ? `Ghost Record ${i}` : `Payroll Worker ${i}`;
    const dept = isGhost ? '' : depts[i % depts.length];
    const pay = isGhost ? 999999 : 140000 + (i % 5) * 15000;
    const acct = isGhost ? '0123456789' : `008123${String(1000 + i).padStart(4, '0')}`;
    const score = isGhost ? Math.floor(Math.random() * 15) : 85 + Math.floor(Math.random() * 15);
    const date = isGhost ? '2025-10-01' : '2026-05-01';
    if (isGhost) anomalies++;
    csv += `VIR-${100000 + i},${name},${dept},${pay},${acct},${score},${date}\n`;
  }
  return { csv, count, anomalies };
}

const publicHR = generateHRDataset(212);
const ghostPayroll = generatePayrollDataset(250, 0.12);
const cleanPayroll = generatePayrollDataset(120, 0);
const largeScale = generatePayrollDataset(1500, 0.08); // Kept reasonable to prevent browser hanging

const DEMO_DATASETS = [
  {
    id: 'demo_ghost_workers',
    name: 'Ghost Worker Simulation Dataset',
    type: 'Generated Synthetic',
    workers: ghostPayroll.count,
    complexity: 'High',
    density: ((ghostPayroll.anomalies / ghostPayroll.count) * 100).toFixed(1) + '% Anomaly Density',
    desc: 'Includes duplicate accounts, inactive workers, and salary mismatches.',
    csv: ghostPayroll.csv
  },
  {
    id: 'chicago_salaries_export',
    name: 'External Workforce Records Sample',
    type: 'Simulated External Source',
    workers: publicHR.count,
    complexity: 'Medium',
    density: '~8% Anomaly Density',
    desc: 'Simulated external HR export with non-standard column names. Triggers field-mapping UI.',
    csv: publicHR.csv
  },
  {
    id: 'demo_clean_payroll',
    name: 'Clean Payroll Baseline',
    type: 'Generated Synthetic',
    workers: cleanPayroll.count,
    complexity: 'Low',
    density: '0% Anomaly Density',
    desc: 'Perfectly verified baseline dataset for calibration testing.',
    csv: cleanPayroll.csv
  },
  {
    id: 'demo_large_scale',
    name: 'Large-Scale Stress Test',
    type: 'Generated Synthetic',
    workers: largeScale.count,
    complexity: 'Extreme',
    density: ((largeScale.anomalies / largeScale.count) * 100).toFixed(1) + '% Anomaly Density',
    desc: 'Heavy adversarial payload to test VIRGIL throughput limits.',
    csv: largeScale.csv
  }
];

const EXPECTED_FIELDS = [
  { id: 'worker_id', label: 'Worker ID' },
  { id: 'full_name', label: 'Full Name' },
  { id: 'department', label: 'Department' },
  { id: 'salary', label: 'Salary (NGN)' },
  { id: 'account_number', label: 'Account Number' },
  { id: 'attendance_score', label: 'Attendance Score' },
  { id: 'last_verification', label: 'Last Verification Date' }
];

function rawParseCSV(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => line.split(',').map(v => v.trim()));
  return { headers, rows };
}

function applyMappingAndFormat(headers, rows, mapping) {
  const colIndices = {};
  for (const [expId, csvHead] of Object.entries(mapping)) {
    colIndices[expId] = headers.indexOf(csvHead);
  }

  return rows.map((vals, i) => {
    const getVal = (id) => colIndices[id] >= 0 ? vals[colIndices[id]] : '';

    const fullName = getVal('full_name') || 'Unknown';

    return {
      staffId: getVal('worker_id') || `VIR-AUTO-${i}`,
      name: fullName,
      firstName: fullName.split(' ')[0],
      lastName: fullName.split(' ').slice(1).join(' ') || String(i + 1),
      department: getVal('department') || null,
      salary: parseFloat(getVal('salary')) || 0,
      bankAccount: getVal('account_number') || '',
      nin: `10000000${String(i).padStart(2, '0')}`,
      attendanceScore: (() => { const v = getVal('attendance_score'); return v !== '' && v != null ? (parseFloat(v) || 0) : 90; })(),
      lastVerified: getVal('last_verification') || null,
    };
  });
}

const UploadScreen = ({ onUpload, onNav, theme, onToggleTheme }) => {
  const [phase, setPhase] = useState('idle'); // idle | mapping | preview | uploading | done
  const [tab, setTab] = useState('upload'); // upload | library
  const [workers, setWorkers] = useState([]);
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const [rawHeaders, setRawHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [mapping, setMapping] = useState({});

  const processRawData = (name, text) => {
    try {
      setFileName(name);
      const { headers, rows } = rawParseCSV(text);
      setRawHeaders(headers);
      setRawRows(rows);

      const exactMatch = EXPECTED_FIELDS.every(f => headers.includes(f.id));
      if (exactMatch) {
        const initialMapping = {};
        EXPECTED_FIELDS.forEach(f => initialMapping[f.id] = f.id);
        const parsed = applyMappingAndFormat(headers, rows, initialMapping);
        setWorkers(parsed);
        setPhase('preview');
      } else {
        const initialMapping = {};
        EXPECTED_FIELDS.forEach(f => {
          const match = headers.find(h => h.toLowerCase() === f.id.toLowerCase() || h.toLowerCase() === f.label.toLowerCase() || h.includes(f.id.split('_')[0]));
          initialMapping[f.id] = match || '';
        });
        setMapping(initialMapping);
        setPhase('mapping');
      }
    } catch {
      alert('Could not parse CSV. Please check the format.');
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    if (fileRef.current) fileRef.current.value = ''; // Reset input so same file can be selected again
    const reader = new FileReader();
    reader.onload = (e) => processRawData(file.name, e.target.result);
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleDemo = () => {
    processRawData('sample-payroll-may-2026.csv', ghostPayroll.csv);
  };

  const handleLoadDataset = (ds) => {
    processRawData(ds.id + '.csv', ds.csv);
  };

  const confirmMapping = () => {
    const parsed = applyMappingAndFormat(rawHeaders, rawRows, mapping);
    setWorkers(parsed);
    setPhase('preview');
  };

  const handleUpload = async () => {
    setPhase('uploading');
    try {
      await uploadWorkers(workers);
      localStorage.setItem('virgil_last_upload_count', String(workers.length));
      setPhase('done');
      setTimeout(onUpload, 1200);
    } catch (e) {
      alert(e.message);
      setPhase('preview');
    }
  };

  return (
    <div className="screen on" style={{ flexDirection: 'row' }}>
      <Sidebar active="overview" onNav={onNav} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="main-area" style={{ flex: 1 }}>
        <div className="topbar">
          <div>
            <div className="topbar-title">Upload Payroll Batch</div>
            <div className="topbar-sub">Upload your payroll CSV to begin AI integrity verification</div>
          </div>
          <div className="topbar-right">
            <span className="batch-tag">May 2026</span>
            <button className="btn btn-ghost" onClick={handleDemo}>Use Demo Dataset</button>
          </div>
        </div>

        <div className="upload-shell">
          <AnimatePresence mode="wait">
            {phase === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="upload-idle-layout"
              >
                <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '0px' }}>
                  <button
                    onClick={() => setTab('upload')}
                    style={{ background: 'none', border: 'none', fontSize: '14px', fontWeight: tab === 'upload' ? 600 : 400, color: tab === 'upload' ? 'var(--text)' : 'var(--text2)', cursor: 'pointer', borderBottom: tab === 'upload' ? '2px solid var(--red)' : '2px solid transparent', paddingBottom: '12px', marginBottom: '-1px' }}
                  >
                    Upload Dataset
                  </button>
                  <button
                    onClick={() => setTab('library')}
                    style={{ background: 'none', border: 'none', fontSize: '14px', fontWeight: tab === 'library' ? 600 : 400, color: tab === 'library' ? 'var(--text)' : 'var(--text2)', cursor: 'pointer', borderBottom: tab === 'library' ? '2px solid var(--red)' : '2px solid transparent', paddingBottom: '12px', marginBottom: '-1px' }}
                  >
                    Dataset Library
                  </button>
                </div>

                {tab === 'upload' ? (
                  <>
                    <div
                      className={`upload-drop-zone ${dragOver ? 'drag-active' : ''}`}
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileRef.current?.click()}
                    >
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".csv"
                        style={{ display: 'none' }}
                        onChange={e => handleFile(e.target.files[0])}
                      />
                      <motion.div
                        className="upload-drop-icon"
                        animate={{ y: dragOver ? -6 : 0 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                      >
                        <i className="ti ti-cloud-upload" />
                      </motion.div>
                      <div className="upload-drop-title">
                        {dragOver ? 'Release to upload' : 'Drag and drop your payroll file'}
                      </div>
                      <div className="upload-drop-sub">or click to browse - CSV supported</div>
                      <button className="btn btn-primary" onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
                        <i className="ti ti-file-upload" /> Choose file
                      </button>
                    </div>

                    <div className="upload-format-guide">
                      <div className="card-header">
                        <span className="card-title">Expected CSV format</span>
                        <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }} onClick={handleDemo}>
                          <i className="ti ti-download" /> Download sample
                        </button>
                      </div>
                      <div style={{ padding: '14px 16px', overflowX: 'auto' }}>
                        <table className="tbl">
                          <thead>
                            <tr>
                              {EXPECTED_FIELDS.map(col => (
                                <th key={col.id}>{col.id}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ fontFamily: 'monospace', fontSize: 11 }}>VIR-100001</td>
                              <td>Amina Bello</td><td>Finance</td><td>180,000</td>
                              <td style={{ fontFamily: 'monospace' }}>0081234501</td>
                              <td>98</td><td>2026-04-30</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="upload-security-note">
                        <i className="ti ti-lock" style={{ color: 'var(--accent)', fontSize: 12 }} />
                        <span>Files are processed locally and never transmitted to external servers</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {DEMO_DATASETS.map(ds => (
                      <div key={ds.id} className="card" style={{ padding: '20px', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border)' }} onClick={() => handleLoadDataset(ds)} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--red)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 600 }}>{ds.name}</span>
                          <span className={`badge ${ds.complexity === 'High' || ds.complexity === 'Extreme' ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: '10px' }}>{ds.complexity} Risk</span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '16px', minHeight: '38px', lineHeight: 1.5 }}>
                          {ds.desc}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text2)', borderTop: '1px solid var(--border2)', paddingTop: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span><i className="ti ti-database" style={{ marginRight: '6px' }} />Type</span>
                            <strong style={{ color: 'var(--text)' }}>{ds.type}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span><i className="ti ti-users" style={{ marginRight: '6px' }} />Workers</span>
                            <strong style={{ color: 'var(--text)' }}>{ds.workers.toLocaleString()}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span><i className="ti ti-alert-triangle" style={{ marginRight: '6px' }} />Density</span>
                            <strong style={{ color: 'var(--text)' }}>{ds.density}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {phase === 'mapping' && (
              <motion.div
                key="mapping"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="upload-preview-layout"
              >
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Dataset Field Mapping</span>
                    <span className="mini-link">Map custom fields to VIRGIL format</span>
                  </div>
                  <div className="card-body">
                    <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
                      VIRGIL detected {rawHeaders.length} columns in <strong style={{ color: 'var(--text)' }}>{fileName}</strong>. Please map them to the expected operational schema before analysis.
                    </p>

                    <div style={{ display: 'grid', gap: 12 }}>
                      {EXPECTED_FIELDS.map(f => (
                        <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--surface2)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                          <div style={{ flex: 1, fontWeight: 500, fontSize: 13 }}>{f.label}</div>
                          <i className="ti ti-arrow-right" style={{ color: 'var(--muted)' }} />
                          <div style={{ flex: 1 }}>
                            <select
                              className="form-select"
                              style={{ minHeight: '36px', fontSize: '12px', backgroundPosition: 'calc(100% - 14px) 15px, calc(100% - 8px) 15px' }}
                              value={mapping[f.id] || ''}
                              onChange={e => setMapping({ ...mapping, [f.id]: e.target.value })}
                            >
                              <option value="">-- Ignore / Not Present --</option>
                              {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--border2)', paddingTop: 16 }}>
                      <button className="btn btn-ghost" onClick={() => setPhase('idle')}>Cancel</button>
                      <button className="btn btn-primary" onClick={confirmMapping}>Confirm Mapping & Preview</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {phase === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="upload-preview-layout"
              >
                <div className="upload-preview-bar">
                  <div className="upload-file-tag">
                    <i className="ti ti-file-spreadsheet" style={{ color: 'var(--accent)' }} />
                    <span>{fileName}</span>
                    <strong>{workers.length} workers loaded</strong>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost" onClick={() => { setPhase('idle'); setWorkers([]); }}>
                      <i className="ti ti-arrow-left" /> Replace file
                    </button>
                    <button className="btn btn-primary" onClick={handleUpload}>
                      <i className="ti ti-brain" /> Run AI Analysis
                    </button>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Payroll Preview</span>
                    <span className="mini-link">{workers.length} records — Review before analysis</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Worker ID</th><th>Full Name</th><th>Department</th>
                          <th>Salary (NGN)</th><th>Account</th><th>Attendance</th><th>Last Verified</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workers.slice(0, 12).map((w, i) => (
                          <tr key={w.staffId || i}>
                            <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{w.staffId}</td>
                            <td>{w.name}</td>
                            <td>{w.department || <span className="badge badge-amber">Unassigned</span>}</td>
                            <td style={{ fontWeight: 600 }}>{Number(w.salary).toLocaleString()}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{w.bankAccount || '—'}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ color: w.attendanceScore < 30 ? 'var(--accent)' : w.attendanceScore < 70 ? 'var(--amber)' : 'var(--success)' }}>
                                  {w.attendanceScore}%
                                </span>
                              </div>
                            </td>
                            <td style={{ fontSize: 11, color: 'var(--muted)' }}>{w.lastVerified || '—'}</td>
                          </tr>
                        ))}
                        {workers.length > 12 && (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: '12px' }}>
                              + {workers.length - 12} more records
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {(phase === 'uploading' || phase === 'done') && (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="upload-processing-state"
              >
                <motion.div
                  className="upload-processing-orb"
                  animate={phase === 'done'
                    ? { background: 'radial-gradient(circle at 40% 35%, rgba(34,197,94,0.6), rgba(15,100,40,0.5) 60%)', boxShadow: '0 0 60px rgba(34,197,94,0.35)' }
                    : { boxShadow: ['0 0 30px rgba(215,38,56,0.25)', '0 0 70px rgba(215,38,56,0.5)', '0 0 30px rgba(215,38,56,0.25)'] }
                  }
                  transition={{ duration: 2, repeat: phase === 'uploading' ? Infinity : 0 }}
                >
                  <i className={`ti ${phase === 'done' ? 'ti-circle-check' : 'ti-brain'}`} style={{ fontSize: 38 }} />
                </motion.div>
                <div className="upload-processing-text">
                  <strong>{phase === 'done' ? 'Analysis Complete' : 'Uploading to VIRGIL...'}</strong>
                  <span>{phase === 'done' ? 'Routing to AI results' : `Processing ${workers.length} payroll records`}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default UploadScreen;
