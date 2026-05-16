const fetch = require('node-fetch');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_TIMEOUT_MS = 5000;

// Pure rule-based fallback — mirrors the AI service logic so the demo
// continues to score workers correctly if Python is unreachable.
function ruleFallback(d) {
  let score = 0;
  const reasons = [];

  if (d.nin_count > 1) {
    const contrib = Math.min(18, 10 + (d.nin_count - 2) * 4);
    reasons.push({ flag: `NIN shared by ${d.nin_count} payroll profiles`, severity: 'high', contribution: contrib });
    score += contrib;
  }
  if (d.account_count > 1) {
    const contrib = Math.min(25, 15 + (d.account_count - 2) * 4);
    reasons.push({ flag: `Bank account linked to ${d.account_count} separate employees`, severity: 'high', contribution: contrib });
    score += contrib;
  }
  if (Math.abs(d.salary_zscore) > 2.0) {
    const contrib = Math.min(18, Math.floor(Math.abs(d.salary_zscore) * 4));
    reasons.push({ flag: `Salary anomaly detected — Z-score ${d.salary_zscore.toFixed(2)} vs workforce mean`, severity: Math.abs(d.salary_zscore) < 3.0 ? 'medium' : 'high', contribution: contrib });
    score += contrib;
  }
  if (d.missing_score > 0) {
    const contrib = d.missing_score * 6;
    reasons.push({ flag: `${d.missing_score} mandatory HR field${d.missing_score > 1 ? 's' : ''} absent from profile`, severity: 'medium', contribution: contrib });
    score += contrib;
  }
  if (d.attendance_score < 20) {
    const contrib = d.attendance_score < 10 ? 20 : 14;
    reasons.push({ flag: `Attendance critically low at ${d.attendance_score.toFixed(1)}%`, severity: 'high', contribution: contrib });
    score += contrib;
  } else if (d.attendance_score < 40) {
    reasons.push({ flag: `Below-average attendance (${d.attendance_score.toFixed(1)}%) recorded`, severity: 'medium', contribution: 8 });
    score += 8;
  }
  if (d.days_since_verification > 180) {
    reasons.push({ flag: `Biometric verification not updated in ${Math.floor(d.days_since_verification)} days`, severity: 'high', contribution: 15 });
    score += 15;
  } else if (d.days_since_verification > 90) {
    reasons.push({ flag: `Last verified ${Math.floor(d.days_since_verification)} days ago — verification overdue`, severity: 'medium', contribution: 8 });
    score += 8;
  }

  const confidence = Math.min(99.9, score);
  return { label: confidence >= 60 ? 'GHOST' : 'VERIFIED', confidence: Math.round(confidence * 10) / 10, reasons };
}

async function scoreWorker(workerData) {
  try {
    const res = await fetch(`${AI_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workerData),
      timeout: AI_TIMEOUT_MS,
    });

    if (!res.ok) throw new Error(`AI service returned HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn(`[AI] Service unreachable (${error.message}). Using rule-based fallback.`);
    return ruleFallback(workerData);
  }
}

async function scoreWorkersBatch(workersData) {
  try {
    const res = await fetch(`${AI_URL}/predict/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workersData),
      timeout: AI_TIMEOUT_MS * 5, // Give batch requests more time
    });

    if (!res.ok) throw new Error(`AI service returned HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn(`[AI] Batch service unreachable (${error.message}). Using rule-based fallback.`);
    return workersData.map(ruleFallback);
  }
}

module.exports = { scoreWorker, scoreWorkersBatch };
