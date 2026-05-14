import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadWorkers } from '../lib/api';
import { Sidebar } from '../components/Sidebar';

const SAMPLE_CSV = `worker_id,full_name,department,salary,account_number,attendance_score,last_verification
VIR-100001,Amina Bello,Finance,180000,0081234501,98,2026-04-30
VIR-100002,Chinedu Okafor,Health,205000,0081234502,95,2026-04-28
VIR-100003,Ghost Worker 3,Unassigned,999999,0123456789,0,2025-10-01
VIR-100004,Maryam Yusuf,Education,164000,0081234504,91,2026-04-29
VIR-100005,Ghost Worker 5,Unassigned,999999,0123456789,12,2025-09-15
VIR-100006,Tunde Adeyemi,Works,158000,0081234506,88,2026-04-27`;

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map((line, i) => {
    const vals = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = vals[idx] || ''; });
    return {
      staffId: obj.worker_id || `VIR-AUTO-${i}`,
      name: obj.full_name || 'Unknown',
      firstName: (obj.full_name || 'Unknown').split(' ')[0],
      lastName: (obj.full_name || 'Unknown').split(' ').slice(1).join(' ') || String(i + 1),
      department: obj.department || null,
      salary: parseFloat(obj.salary) || 0,
      bankAccount: obj.account_number || '',
      nin: `10000000${String(i).padStart(2, '0')}`,
      attendanceScore: parseFloat(obj.attendance_score) || 0,
      lastVerified: obj.last_verification || null,
    };
  });
}

const UploadScreen = ({ onUpload, onNav, theme, onToggleTheme }) => {
  const [phase, setPhase] = useState('idle'); // idle | preview | uploading | done
  const [workers, setWorkers] = useState([]);
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseCSV(e.target.result);
        setWorkers(parsed);
        setPhase('preview');
      } catch {
        alert('Could not parse CSV. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleDemo = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    handleFile(new File([blob], 'sample-payroll-may-2026.csv', { type: 'text/csv' }));
  };

  const handleUpload = async () => {
    setPhase('uploading');
    try {
      await uploadWorkers(workers);
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
            <button className="btn btn-ghost" onClick={handleDemo}>Load demo data</button>
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
                    accept=".csv,.xlsx,.xls"
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
                  <div className="upload-drop-sub">or click to browse — CSV, Excel supported</div>
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
                          {['worker_id', 'full_name', 'department', 'salary', 'account_number', 'attendance_score', 'last_verification'].map(col => (
                            <th key={col}>{col}</th>
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
                            <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{w.bankAccount}</td>
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
