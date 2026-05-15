export const demoWorkers = [
  {
    id: 'VIR-100001',
    name: 'Amina Bello',
    department: 'Finance',
    nin: '10000000001',
    bankAccount: '0081234501',
    salary: 180000,
    status: 'VERIFIED',
    score: 18,
    reasons: [],
    squadRef: 'SQD-SAL-240514-001',
  },
  {
    id: 'VIR-100002',
    name: 'Chinedu Okafor',
    department: 'Health',
    nin: '10000000002',
    bankAccount: '0081234502',
    salary: 205000,
    status: 'VERIFIED',
    score: 22,
    reasons: [],
    squadRef: 'SQD-SAL-240514-002',
  },
  {
    id: 'VIR-100003',
    name: 'Ghost Worker 3',
    department: 'Unassigned',
    nin: '10000000019',
    bankAccount: '0123456789',
    salary: 999999,
    status: 'FLAGGED',
    score: 93,
    reasons: [
      { flag: 'Duplicate bank account', detail: 'Account 0123456789 is linked to 4 workers', severity: 'high', contribution: 32 },
      { flag: 'Salary mismatch', detail: 'Salary is 4.8x above department average', severity: 'high', contribution: 28 },
      { flag: 'Inactive biometric history', detail: 'No biometric verification in 210 days', severity: 'medium', contribution: 18 },
    ],
    squadRef: null,
  },
  {
    id: 'VIR-100004',
    name: 'Maryam Yusuf',
    department: 'Education',
    nin: '10000000004',
    bankAccount: '0081234504',
    salary: 164000,
    status: 'VERIFIED',
    score: 12,
    reasons: [],
    squadRef: 'SQD-SAL-240514-004',
  },
  {
    id: 'VIR-100005',
    name: 'Ghost Worker 5',
    department: 'Unassigned',
    nin: '10000000019',
    bankAccount: '0123456789',
    salary: 999999,
    status: 'FLAGGED',
    score: 91,
    reasons: [
      { flag: 'Duplicate NIN', detail: 'NIN appears on 3 separate payroll records', severity: 'high', contribution: 30 },
      { flag: 'Duplicate bank account', detail: 'Account 0123456789 is linked to 4 workers', severity: 'high', contribution: 31 },
      { flag: 'Missing critical fields', detail: 'Department and verification history are absent', severity: 'medium', contribution: 15 },
    ],
    squadRef: null,
  },
  {
    id: 'VIR-100006',
    name: 'Tunde Adeyemi',
    department: 'Works',
    nin: '10000000006',
    bankAccount: '0081234506',
    salary: 158000,
    status: 'VERIFIED',
    score: 25,
    reasons: [],
    squadRef: 'SQD-SAL-240514-006',
  },
  {
    id: 'VIR-100007',
    name: 'Ghost Worker 7',
    department: 'Executive Council',
    nin: '10000000007',
    bankAccount: '0123456789',
    salary: 850000,
    status: 'FLAGGED',
    score: 86,
    reasons: [
      { flag: 'Attendance anomaly', detail: 'No attendance record for 8 months', severity: 'high', contribution: 27 },
      { flag: 'Duplicate bank account', detail: 'Account 0123456789 is linked to 4 workers', severity: 'high', contribution: 29 },
      { flag: 'Payroll tenure anomaly', detail: 'New record with top 15% salary pattern', severity: 'medium', contribution: 14 },
    ],
    squadRef: null,
  },
  {
    id: 'VIR-100008',
    name: 'Ngozi Eze',
    department: 'Justice',
    nin: '10000000008',
    bankAccount: '0081234508',
    salary: 198000,
    status: 'VERIFIED',
    score: 28,
    reasons: [],
    squadRef: 'SQD-SAL-240514-008',
  },
  {
    id: 'VIR-100009',
    name: 'Ghost Worker 9',
    department: 'Transport',
    nin: '10000000009',
    bankAccount: '0123456789',
    salary: 0,
    status: 'FLAGGED',
    score: 82,
    reasons: [
      { flag: 'Duplicate bank account', detail: 'Account 0123456789 is linked to 4 workers', severity: 'high', contribution: 30 },
      { flag: 'Missing critical fields', detail: 'Salary, attendance, and biometric records are incomplete', severity: 'medium', contribution: 24 },
      { flag: 'Inactive biometric history', detail: 'No biometric verification in 365 days', severity: 'high', contribution: 20 },
    ],
    squadRef: null,
  },
  {
    id: 'VIR-100010',
    name: 'Kemi Lawal',
    department: 'Agriculture',
    nin: '10000000010',
    bankAccount: '0081234510',
    salary: 148000,
    status: 'VERIFIED',
    score: 16,
    reasons: [],
    squadRef: 'SQD-SAL-240514-010',
  },
];

export const aiSignals = [
  { label: 'Graph/Syndicate Link', value: 244, severity: 'high', detail: 'Shared bank account links across worker clusters' },
  { label: 'Attendance anomaly', value: 176, severity: 'high', detail: 'No attendance signal for 6+ months' },
  { label: 'Salary mismatch', value: 212, severity: 'medium', detail: 'Salary outside department grade band' },
  { label: 'Inactive biometric history', value: 380, severity: 'medium', detail: 'No biometric scan in 90+ days' },
];

export const auditEntries = [
  { actor: 'HR Officer', action: 'Payroll batch uploaded', detail: 'May 2026 payroll, 24,532 records', time: '10:24 AM', status: 'info' },
  { actor: 'AI Engine', action: 'AI detection scan started', detail: 'RandomForest model evaluated 8 fraud features per worker', time: '10:25 AM', status: 'ai' },
  { actor: 'AI Engine', action: 'Worker flagged as ghost', detail: 'Ghost Worker 3: 93% probability, 3 reasons', time: '10:31 AM', status: 'blocked' },
  { actor: 'Squad Gate', action: 'Salary payment blocked', detail: 'NGN 999,999 held before disbursement', time: '10:32 AM', status: 'blocked' },
  { actor: 'Squad API', action: 'Salary payment released via Squad', detail: 'Amina Bello, ref SQD-SAL-240514-001', time: '10:35 AM', status: 'paid' },
  { actor: 'Document AI', action: 'Worker ID document scanned', detail: 'NIN extracted, issuing authority matched', time: '10:38 AM', status: 'ai' },
];

export const formatMoney = (value) => `NGN ${Math.round(value).toLocaleString()}`;

export const getDemoMetrics = (workers = demoWorkers) => {
  const total = workers.length || demoWorkers.length;
  const flagged = workers.filter(worker => worker.status === 'FLAGGED');
  const verified = workers.filter(worker => worker.status !== 'FLAGGED');
  const blockedAmount = flagged.reduce((sum, worker) => sum + (worker.salary || 0), 0);
  const releaseAmount = verified.reduce((sum, worker) => sum + (worker.salary || 0), 0);

  return {
    total,
    flagged: flagged.length,
    verified: verified.length,
    blockedAmount,
    releaseAmount,
    integrity: Math.round((verified.length / total) * 100),
  };
};
