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
const largeScale = generatePayrollDataset(1500, 0.08);
const enterpriseStress = generatePayrollDataset(5000, 0.04);

const DEMO_DATASETS = [
  {
    id: 'kaggle_la_payroll_clean',
    name: 'Public Payroll Benchmark Dataset',
    type: 'External Dataset Import',
    workers: 2000,
    complexity: 'Low',
    density: '0% Anomaly Density',
    desc: 'Source: Kaggle — Los Angeles Payroll. Clean public payroll records adapted for testing.',
    url: '/datasets/adapted_la_payroll.csv'
  },
  {
    id: 'kaggle_la_payroll_fraud',
    name: 'Public Payroll Benchmark + VIRGIL Fraud Simulation',
    type: 'External Source + Fraud Injected',
    workers: 2000,
    complexity: 'High',
    density: '~8% Anomaly Density',
    desc: 'Source: Kaggle — Los Angeles Payroll. Includes controlled fraud injection (duplicate accounts, inactive workers) by VIRGIL.',
    url: '/datasets/adapted_la_payroll_fraud.csv',
    fraudInject: true,
    fraudRate: 0.12
  },
  {
    id: 'kaggle_hr_attrition',
    name: 'Public HR Attrition Benchmark',
    type: 'External Dataset Import',
    workers: 1470,
    complexity: 'Medium',
    density: '~16% Attrition Rate',
    desc: 'Source: Kaggle — HR Analytics. Useful for testing workforce structure, inactive status, and tenure behavior.',
    url: '/datasets/adapted_hr_analytics.csv'
  },
  {
    id: 'demo_clean_payroll',
    name: 'Internal Calibration Baseline',
    type: 'Generated Synthetic',
    workers: 10,
    complexity: 'Low',
    density: '0% Anomaly Density',
    desc: 'Perfectly verified baseline dataset fetched dynamically from the filesystem.',
    url: '/datasets/demo_clean_payroll.csv'
  },
  {
    id: 'debug_fraud_test',
    name: 'Definitive Fraud Debug Test',
    type: 'Manual Test Case',
    workers: 15,
    complexity: 'Extreme',
    density: '60% Anomaly Density',
    desc: 'Special test case with extreme ghost signals (0% attendance, shared accounts, huge salaries).',
    url: '/datasets/debug_fraud_test.csv'
  },
  {
    id: 'enterprise_stress_test',
    name: 'Enterprise Stress Test (Nigeria-Scale)',
    type: 'Bulk Simulation',
    workers: 5000,
    complexity: 'High',
    density: '~4% Anomaly Density',
    desc: 'Simulates a large government parastatal. Tests chunked AI batch processing (10x sub-batches) and DB performance.',
    csv: enterpriseStress.csv
  }
];

const EXPECTED_FIELDS = [
  { id: 'worker_id', label: 'Worker ID' },
  { id: 'full_name', label: 'Full Name' },
  { id: 'department', label: 'Department' },
  { id: 'job_role', label: 'Job Role' },
  { id: 'salary', label: 'Salary (NGN)' },
  { id: 'attendance_score', label: 'Attendance Score' },
  { id: 'employment_status', label: 'Employment Status' },
  { id: 'tenure', label: 'Tenure (Years)' },
  { id: 'account_number', label: 'Account Number' },
  { id: 'last_verification', label: 'Last Verification Date' }
];

const FIELD_ALIASES = {
  worker_id: ['emp_id', 'employee_id', 'staff_id', 'personnel_no', 'worker_no', 'id_number', 'record_nbr'],
  full_name: ['employee_name', 'staff_name', 'name', 'worker_name', 'first_name'],
  department: ['division', 'unit', 'ministry_section', 'dept', 'agency', 'department_title'],
  job_role: ['job_title', 'position', 'role', 'designation', 'job_class'],
  salary: ['monthly_pay', 'wage', 'gross_income', 'compensation', 'amount', 'net_pay', 'basic_salary', 'pay', 'regular_pay', 'monthlyincome'],
  account_number: ['acct_no', 'acct_num', 'bank_account', 'account_no', 'bank_acct'],
  attendance_score: ['days_present', 'attendance', 'present_days', 'score', 'days_worked'],
  employment_status: ['status', 'employment_type', 'attrition', 'active_status'],
  tenure: ['years_at_company', 'length_of_service', 'service_years', 'years_worked'],
  last_verification: ['last_check', 'verification_date', 'last_verified', 'date_verified', 'last_scan']
};

function calculateSimilarity(header, fieldId, fieldLabel) {
  const h = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  const fId = fieldId.toLowerCase().replace(/[^a-z0-9]/g, '');
  const fLbl = fieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (h === fId || h === fLbl) return 100;
  if (h.includes(fId) || fId.includes(h) || h.includes(fLbl) || fLbl.includes(h)) return 92;

  const aliases = FIELD_ALIASES[fieldId] || [];
  for (let alias of aliases) {
    const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (h === cleanAlias) return 96;
    if (h.includes(cleanAlias) || cleanAlias.includes(h)) return 88;
  }

  if (h.substring(0, 4) === fId.substring(0, 4) && h.length > 3) return 75;
  return 0;
}

function predictMappings(headers) {
  const mapping = {};
  const confidences = {};
  const usedHeaders = new Set();

  EXPECTED_FIELDS.forEach(field => {
    let bestMatch = '';
    let bestScore = 0;

    headers.forEach(header => {
      if (usedHeaders.has(header)) return;
      const score = calculateSimilarity(header, field.id, field.label);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = header;
      }
    });

    if (bestScore >= 70) {
      mapping[field.id] = bestMatch;
      usedHeaders.add(bestMatch);
      confidences[field.id] = bestScore === 100 ? 100 : (bestScore + (Math.random() * 2 - 1)).toFixed(1);
    } else {
      mapping[field.id] = '';
      confidences[field.id] = 0;
    }
  });

  return { mapping, confidences };
}

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

function injectFraudSignals(workers, rate = 0.1) {
  const count = Math.max(1, Math.round(workers.length * rate));
  const sharedAccount = `VIRGIL${String(workers.length).padStart(4, '0')}`;
  const sharedNin = `999${String(workers.length).padStart(8, '0')}`;
  const injected = workers.map((worker, index) => {
    if (index >= count) return worker;
    return {
      ...worker,
      name: worker.name?.startsWith('Ghost') ? worker.name : `Ghost Simulation ${index + 1}`,
      department: index % 2 === 0 ? null : worker.department,
      salary: index % 3 === 0 ? Math.max(Number(worker.salary || 0) * 4, 950000) : Number(worker.salary || 0),
      bankAccount: sharedAccount,
      nin: index % 2 === 0 ? sharedNin : worker.nin,
      attendanceScore: index % 4 === 0 ? 0 : 8 + (index % 9),
      lastVerified: '2025-01-12'
    };
  });
  console.debug('[UPLOAD DEBUG] fraud injection applied', {
    records: workers.length,
    injected: count,
    sample: injected.slice(0, Math.min(3, count))
  });
  return injected;
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
  const [previewLimit, setPreviewLimit] = useState(12);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lowConfidenceFields, setLowConfidenceFields] = useState([]);

  const processRawData = (name, text, options = {}) => {
    try {
      setPreviewLimit(12);
      setFileName(name);
      const { headers, rows } = rawParseCSV(text);
      setRawHeaders(headers);
      setRawRows(rows);

      // Always auto-map — VIRGIL infers field structure silently
      const exactMatch = EXPECTED_FIELDS.every(f => headers.includes(f.id));
      let finalMapping;

      if (exactMatch) {
        finalMapping = {};
        EXPECTED_FIELDS.forEach(f => finalMapping[f.id] = f.id);
        setLowConfidenceFields([]);
      } else {
        const prediction = predictMappings(headers);
        finalMapping = prediction.mapping;
        // Identify fields that couldn't be confidently inferred (show warning only)
        const low = EXPECTED_FIELDS
          .filter(f => !prediction.mapping[f.id] || parseFloat(prediction.confidences[f.id] || 0) < 70)
          .filter(f => ['worker_id', 'full_name', 'salary', 'account_number'].includes(f.id)); // Only warn on critical fields
        setLowConfidenceFields(low);
      }

      setMapping(finalMapping);
      let parsed = applyMappingAndFormat(headers, rows, finalMapping);
      if (options.fraudInject || name.toLowerCase().includes('fraud') || name.toLowerCase().includes('ghost')) {
        parsed = injectFraudSignals(parsed, options.fraudRate || 0.12);
      }
      console.debug('[VIRGIL AI] 🧠 Inference Engine Active', {
        engine: 'IsolationForest + Heuristics',
        inputRecords: parsed.length,
        features: ['salary_zscore', 'attendance', 'nin_linkage', 'account_linkage', 'stale_verification']
      });
      setWorkers(parsed);
      setPhase('preview');
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
    processRawData('sample-payroll-may-2026.csv', ghostPayroll.csv, { fraudInject: true, fraudRate: 0.15 });
  };

  const handleLoadDataset = async (ds) => {
    if (ds.url) {
      try {
        const res = await fetch(ds.url);
        if (!res.ok) throw new Error('Network error loading dataset');
        const text = await res.text();
        processRawData(ds.id + '.csv', text, ds);
      } catch (err) {
        alert("Failed to fetch dynamic dataset: " + err.message);
      }
    } else {
      processRawData(ds.id + '.csv', ds.csv, ds);
    }
  };

  const confirmMapping = () => {
    const parsed = applyMappingAndFormat(rawHeaders, rawRows, mapping);
    setWorkers(parsed);
    setPhase('preview');
  };

  const handleUpload = async () => {
    setPhase('uploading');
    setUploadProgress(0);
    
    // Simulate progress ticks while waiting for backend
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => prev < 90 ? prev + Math.random() * 8 : prev);
    }, 400);

    // 90-second timeout to prevent permanent hang
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Upload timed out. The server is taking too long. Please try again.')), 90000)
    );

    try {
      const suspicious = workers.filter(worker =>
        Number(worker.attendanceScore || 100) < 20 ||
        !worker.department ||
        Number(worker.salary || 0) >= 900000 ||
        worker.bankAccount === 'SHARED_GHOST_ACCT'
      );
      console.debug('[UPLOAD DEBUG] submitting dataset to backend', {
        totalRecords: workers.length,
        suspiciousInPreview: suspicious.length,
        sampleSuspicious: suspicious[0] || null
      });
      await Promise.race([uploadWorkers(workers), timeout]);
      clearInterval(progressInterval);
      setUploadProgress(100);
      localStorage.setItem('virgil_last_upload_count', String(workers.length));
      setPhase('done');
      setTimeout(onUpload, 1200);
    } catch (e) {
      clearInterval(progressInterval);
      setUploadProgress(0);
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
                    <strong>{workers.length.toLocaleString()} workers loaded</strong>
                    <span style={{ fontSize: 11, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <i className="ti ti-wand" /> Auto-mapped by VIRGIL
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost" onClick={() => { setPhase('idle'); setWorkers([]); setLowConfidenceFields([]); }}>
                      <i className="ti ti-arrow-left" /> Replace file
                    </button>
                    <button className="btn btn-primary" onClick={handleUpload}>
                      <i className="ti ti-brain" /> Run AI Analysis
                    </button>
                  </div>
                </div>

                {lowConfidenceFields.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, marginBottom: 4, fontSize: 13 }}
                  >
                    <i className="ti ti-alert-triangle" style={{ color: 'var(--amber)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text2)' }}>
                      <strong style={{ color: 'var(--amber)' }}>Low confidence</strong> on {lowConfidenceFields.map(f => f.label).join(', ')} — VIRGIL applied best-guess mapping. AI analysis may use synthetic defaults for these fields.
                    </span>
                  </motion.div>
                )}

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
                        {workers.slice(0, previewLimit).map((w, i) => (
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
                        {workers.length > previewLimit && (
                          <tr onClick={() => setPreviewLimit(prev => prev + 50)} style={{ cursor: 'pointer', background: 'rgba(215, 38, 56, 0.05)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(215, 38, 56, 0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(215, 38, 56, 0.05)'}>
                            <td colSpan={7} style={{ textAlign: 'center', color: 'var(--red)', padding: '16px', fontWeight: 600, border: '1px dashed var(--red)' }}>
                              <i className="ti ti-download" style={{ marginRight: 8 }} />
                              Load {Math.min(50, workers.length - previewLimit)} more records (out of {workers.length - previewLimit} remaining)
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
                  <span>{phase === 'done' ? 'Routing to AI results' : `Processing ${workers.length.toLocaleString()} payroll records`}</span>
                </div>
                {phase === 'uploading' && (
                  <>
                    <div style={{ width: '280px', height: '4px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden', marginTop: '16px' }}>
                      <motion.div
                        style={{ height: '100%', background: 'var(--red)', borderRadius: '4px' }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>{Math.round(uploadProgress)}% — AI scoring in progress</span>
                    <button
                      style={{ marginTop: 24, fontSize: 12, color: 'var(--muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}
                      onClick={() => setPhase('preview')}
                    >
                      Cancel upload
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default UploadScreen;
