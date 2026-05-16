export const formatMoney = (value) => `NGN ${Math.round(Number(value || 0)).toLocaleString()}`;

export const normalizeReason = (reason) => {
  if (!reason) return null;
  if (typeof reason === 'object') {
    return {
      flag: reason.flag || reason.label || 'AI anomaly signal',
      detail: reason.detail || reason.reason || reason.flag || 'Anomaly evidence recorded by AI service',
      severity: reason.severity || 'medium',
      contribution: reason.contribution || (reason.severity === 'high' ? 30 : 15)
    };
  }
  const lower = String(reason).toLowerCase();
  const severity = lower.includes('critical') || lower.includes('duplicated') || lower.includes('shared')
    ? 'high'
    : lower.includes('missing') ? 'medium' : 'low';
  return {
    flag: String(reason).split('(')[0].trim() || 'AI anomaly signal',
    detail: String(reason),
    severity,
    contribution: severity === 'high' ? 30 : severity === 'medium' ? 18 : 8
  };
};

export const normalizeWorker = (worker, index = 0) => {
  const reasons = Array.isArray(worker.aiReasons)
    ? worker.aiReasons.map(normalizeReason).filter(Boolean)
    : Array.isArray(worker.reasons) ? worker.reasons.map(normalizeReason).filter(Boolean) : [];
  const score = Number(worker.aiConfidence ?? worker.score ?? 0);
  return {
    id: worker.id || worker.staffId || `VIR-${100000 + index}`,
    staffId: worker.staffId || worker.id || `VIR-${100000 + index}`,
    name: worker.name || `${worker.firstName || 'Worker'} ${worker.lastName || index + 1}`,
    department: worker.department || 'Unassigned',
    nin: worker.nin || '-',
    salary: Number(worker.salary || 0),
    status: worker.status || 'PENDING',
    score,
    trustScore: Number(worker.trustScore ?? Math.max(0, 100 - score)),
    riskLevel: worker.riskLevel || (score >= 70 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'LOW'),
    anomalyScore: Number(worker.anomalyScore ?? score),
    reasons,
    squadRef: worker.squadRef || null,
    bankAccount: worker.bankAccount || worker.bank_account || '-',
    batch: worker.batch,
    lastVerified: worker.lastVerified,
    createdAt: worker.createdAt
  };
};

export const computeMetrics = (workers = []) => {
  const total = workers.length;
  const flagged = workers.filter(worker => worker.status === 'FLAGGED');
  const verified = workers.filter(worker => worker.status === 'VERIFIED');
  const paid = workers.filter(worker => worker.status === 'PAID' || worker.status === 'CONFIRMED');
  const cleared = workers.filter(worker => ['VERIFIED', 'PAID', 'CONFIRMED'].includes(worker.status));
  return {
    total,
    flagged: flagged.length,
    verified: verified.length,
    paid: paid.length,
    cleared: cleared.length,
    blockedAmount: flagged.reduce((sum, worker) => sum + worker.salary, 0),
    queuedAmount: verified.reduce((sum, worker) => sum + worker.salary, 0),
    releasedAmount: paid.reduce((sum, worker) => sum + worker.salary, 0),
    integrity: total ? Math.round((cleared.length / total) * 100) : 0,
    anomalyDensity: total ? Number(((flagged.length / total) * 100).toFixed(1)) : 0
  };
};

export const signalCountsFromWorkers = (workers = []) => {
  const counts = {};
  workers.forEach(worker => {
    worker.reasons.forEach(reason => {
      counts[reason.flag] = (counts[reason.flag] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count, severity: count > 1 ? 'high' : 'medium', detail: `${count} worker${count === 1 ? '' : 's'} affected in active dataset` }))
    .sort((a, b) => b.count - a.count);
};
