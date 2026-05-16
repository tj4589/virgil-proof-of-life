const fetch = require('node-fetch');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_TIMEOUT_MS = 10000;
const AI_BATCH_CHUNK = 500; // Max records per AI batch call

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
    const contrib = Math.min(40, 20 + (d.account_count - 2) * 8);
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
    const contrib = d.attendance_score < 10 ? 30 : 22;
    reasons.push({ flag: `Attendance critically low at ${d.attendance_score.toFixed(1)}%`, severity: 'high', contribution: contrib });
    score += contrib;
  } else if (d.attendance_score < 40) {
    reasons.push({ flag: `Below-average attendance (${d.attendance_score.toFixed(1)}%) recorded`, severity: 'medium', contribution: 8 });
    score += 8;
  }
  if (d.days_since_verification > 180) {
    reasons.push({ flag: `Biometric verification not updated in ${Math.floor(d.days_since_verification)} days`, severity: 'high', contribution: 25 });
    score += 25;
  } else if (d.days_since_verification > 90) {
    reasons.push({ flag: `Last verified ${Math.floor(d.days_since_verification)} days ago — verification overdue`, severity: 'medium', contribution: 8 });
    score += 8;
  }

  const confidence = Math.min(99.9, score);
  const riskScore = Math.round(confidence * 10) / 10;
  const status = riskScore >= 35 ? 'FLAGGED' : 'VERIFIED';
  return {
    label: status === 'FLAGGED' ? 'GHOST' : 'VERIFIED',
    status,
    risk_level: riskScore >= 70 ? 'HIGH' : riskScore >= 35 ? 'MEDIUM' : 'LOW',
    confidence: riskScore,
    risk_score: riskScore,
    trust_score: Math.round((100 - riskScore) * 10) / 10,
    anomaly_score: riskScore,
    isolation_score: riskScore,
    reasons
  };
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
    const data = await res.json();
    console.log(`[AI DEBUG] single worker scored status=${data.status || data.label} risk=${data.risk_score ?? data.confidence} reasons=${(data.reasons || []).length}`);
    return data;
  } catch (error) {
    console.warn(`[AI] Service unreachable (${error.message}). Using rule-based fallback.`);
    return ruleFallback(workerData);
  }
}

async function scoreWorkersBatch(workersData) {
  console.log(`[AI DEBUG] sending batch to AI service records=${workersData.length}`);
  // Chunk large batches to avoid payload/timeout issues
  const chunks = [];
  for (let i = 0; i < workersData.length; i += AI_BATCH_CHUNK) {
    chunks.push(workersData.slice(i, i + AI_BATCH_CHUNK));
  }

  const results = [];
  for (const chunk of chunks) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 60000); // 60s per chunk
      const res = await fetch(`${AI_URL}/predict/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`AI service returned HTTP ${res.status}`);
      const data = await res.json();
      const flagged = data.filter(score => (score.status === 'FLAGGED') || (score.label === 'GHOST'));
      const anomalyScores = data.map(score => Number(score.anomaly_score ?? score.isolation_score ?? score.risk_score ?? score.confidence ?? 0));
      const minAnomaly = anomalyScores.length ? Math.min(...anomalyScores) : 0;
      const maxAnomaly = anomalyScores.length ? Math.max(...anomalyScores) : 0;
      console.log(`[AI DEBUG] received AI chunk records=${data.length} flagged=${flagged.length} anomaly_score_range=${minAnomaly.toFixed(1)}..${maxAnomaly.toFixed(1)}`);
      if (flagged[0]) {
        console.log('[AI DEBUG] sample flagged worker score:', JSON.stringify({
          status: flagged[0].status,
          risk_score: flagged[0].risk_score ?? flagged[0].confidence,
          trust_score: flagged[0].trust_score,
          risk_level: flagged[0].risk_level,
          reasons: flagged[0].reasons
        }));
      } else {
        const top = data.reduce((best, item) => (
          Number(item.risk_score ?? item.confidence ?? 0) > Number(best?.risk_score ?? best?.confidence ?? -1) ? item : best
        ), null);
        console.warn('[AI DEBUG] AI chunk returned zero flagged workers. Top score:', JSON.stringify(top));
      }
      results.push(...data);
    } catch (error) {
      console.warn(`[AI] Batch chunk failed (${error.message}). Using rule-based fallback for ${chunk.length} records.`);
      results.push(...chunk.map(ruleFallback));
    }
  }
  return results;
}

module.exports = { scoreWorker, scoreWorkersBatch };
