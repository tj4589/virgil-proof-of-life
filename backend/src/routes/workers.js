const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Worker, AuditEntry, PaymentTransaction } = require('../models');
const aiService = require('../services/aiService');

const upload = multer({ dest: 'uploads/' });

const normalizeReason = (reason) => {
  if (typeof reason !== 'string') return reason;
  const lower = reason.toLowerCase();
  const severity = lower.includes('critical') || lower.includes('duplicated') || lower.includes('shared') || lower.includes('bank account')
    ? 'high'
    : lower.includes('missing') || lower.includes('absent') ? 'medium' : 'low';
  const flag = reason.split('(')[0].replace(/:$/, '').trim();
  return {
    flag: flag || 'AI anomaly signal',
    detail: reason,
    severity,
    contribution: severity === 'high' ? 30 : severity === 'medium' ? 18 : 8
  };
};

const getActiveBatch = async () => {
  const latest = await Worker.findOne({ order: [['createdAt', 'DESC']] });
  return latest?.batch || null;
};

const buildWorkerWhere = async (query = {}) => {
  if (query.all === 'true') return {};
  const batch = query.batch || await getActiveBatch();
  return batch ? { batch } : {};
};

const mapAuditStatus = (action = '') => {
  if (action.includes('PAYMENT')) return 'paid';
  if (action.includes('EVALUATED')) return 'ai';
  if (action.includes('BLOCK') || action.includes('FLAG') || action.includes('CONFIRMED')) return 'blocked';
  if (action.includes('VERIFIED') || action.includes('PROOF')) return 'info';
  return 'info';
};

// Upload batch of workers
router.post('/upload', async (req, res) => {
  try {
    const { batchId, workers } = req.body;

    if (!Array.isArray(workers) || workers.length === 0) {
      return res.status(400).json({ success: false, error: 'No workers supplied' });
    }

    const activeBatch = batchId || `BATCH_${Date.now()}`;
    const salaries = workers.map(w => Number(w.salary || w.monthly_pay || 0)).filter(n => Number.isFinite(n) && n > 0);
    const avgSalary = salaries.length ? salaries.reduce((a, c) => a + c, 0) / salaries.length : 0;
    const variance = salaries.length > 1
      ? salaries.reduce((a, c) => a + Math.pow(c - avgSalary, 2), 0) / (salaries.length - 1)
      : 0;
    const stdSalary = Math.sqrt(variance) || 1;

    const results = [];
    console.log(`[UPLOAD DEBUG] received dataset batch=${activeBatch} records=${workers.length} salary_avg=${avgSalary.toFixed(2)} salary_std=${stdSalary.toFixed(2)}`);

    // Pre-calculate batch-wide frequencies for concurrent processing
    const batchNinFreq = {};
    const batchAcctFreq = {};
    workers.forEach(w => {
      const acct = w.bankAccount || w.bank_account || '';
      if (w.nin) batchNinFreq[w.nin] = (batchNinFreq[w.nin] || 0) + 1;
      if (acct) batchAcctFreq[acct] = (batchAcctFreq[acct] || 0) + 1;
    });

    const today = new Date();

    // 1. Prepare all features for the batch AI request
    const workerFeatures = workers.map((w) => {
      const acct = w.bankAccount || w.bank_account || '';
      const salary = Number(w.salary || 0);
      const ninCount = w.nin ? (batchNinFreq[w.nin] || 1) : 1;
      const accountCount = acct ? (batchAcctFreq[acct] || 1) : 1;
      const salaryZscore = salary > 0 ? (salary - avgSalary) / stdSalary : 0;

      let missingScore = 0;
      if (!w.department) missingScore++;
      if (!w.lastVerified) missingScore++;
      if (!salary || salary === 0) missingScore++;

      const attendanceScore = (w.attendanceScore != null && w.attendanceScore !== '')
        ? Math.max(0, Math.min(100, Number(w.attendanceScore)))
        : 90;

      let daysSinceVerification = 365;
      if (w.lastVerified) {
        const verifiedDate = new Date(w.lastVerified);
        if (!isNaN(verifiedDate)) {
          daysSinceVerification = Math.max(0, Math.floor((today - verifiedDate) / 86400000));
        }
      }

      return {
        nin_count: ninCount,
        account_count: accountCount,
        salary_zscore: salaryZscore,
        missing_score: missingScore,
        attendance_score: attendanceScore,
        days_since_verification: daysSinceVerification,
      };
    });

    // 2. Score all workers in one massively fast vectorized batch request
    const aiScores = await aiService.scoreWorkersBatch(workerFeatures);
    const scoredFlagged = aiScores.filter(score => (score.status === 'FLAGGED') || (score.label === 'GHOST'));
    const anomalyScores = aiScores.map(score => Number(score.anomaly_score ?? score.isolation_score ?? score.risk_score ?? score.confidence ?? 0));
    
    console.log('[UPLOAD DEBUG] feature_names: ["nin_count", "account_count", "salary_zscore", "missing_score", "attendance_score", "days_since_verification"]');
    if (workerFeatures.length > 0) {
      console.log(`[UPLOAD DEBUG] first_worker_features: ${JSON.stringify(workerFeatures[0])}`);
    }
    console.log(
      `[UPLOAD DEBUG] AI returned records=${aiScores.length} flagged=${scoredFlagged.length} ` +
      `anomaly_score_range=${anomalyScores.length ? Math.min(...anomalyScores).toFixed(1) : 'n/a'}..${anomalyScores.length ? Math.max(...anomalyScores).toFixed(1) : 'n/a'}`
    );
    if (scoredFlagged[0]) {
      console.log('[UPLOAD DEBUG] sample flagged AI result:', JSON.stringify(scoredFlagged[0]));
    } else {
      const topScore = aiScores.reduce((best, item) => (
        Number(item.risk_score ?? item.confidence ?? 0) > Number(best?.risk_score ?? best?.confidence ?? -1) ? item : best
      ), null);
      console.warn('[UPLOAD DEBUG] no flagged workers from AI. Top score:', JSON.stringify(topScore));
      console.warn('[UPLOAD DEBUG] sample features:', JSON.stringify(workerFeatures.slice(0, 3)));
    }

    // 3. Chunk DB inserts to prevent SQLite locking
    const BATCH_SIZE = 100;
    for (let i = 0; i < workers.length; i += BATCH_SIZE) {
      const chunk = workers.slice(i, i + BATCH_SIZE);
      const scoreChunk = aiScores.slice(i, i + BATCH_SIZE);

      const processedChunk = chunk.map((w, localIndex) => {
        const absoluteIndex = i + localIndex;
        const acct = w.bankAccount || w.bank_account || w.account_number || '';
        const salary = Number(w.salary || 0);
        const score = scoreChunk[localIndex] || { label: 'ERROR', status: 'NEEDS REVIEW', confidence: 0, reasons: [{ flag: 'AI score missing for worker', severity: 'high', contribution: 0 }] };
        const status = score.status || (score.label === 'GHOST' ? 'FLAGGED' : score.label === 'ERROR' ? 'NEEDS REVIEW' : 'VERIFIED');
        const riskScore = Number(score.risk_score ?? score.confidence ?? 0);

        return {
          batch: activeBatch,
          staffId: w.staffId || `STF-${activeBatch}-${absoluteIndex + 1}`,
          firstName: w.firstName || w.name?.split(' ')[0] || 'Unknown',
          lastName: w.lastName || w.name?.split(' ').slice(1).join(' ') || 'Unknown',
          email: w.email || '',
          phone: w.phone || '',
          nin: w.nin,
          bvn: w.bvn,
          bankAccount: acct,
          bankCode: w.bankCode || w.bank_code || w.bank_id || '058',
          salary,
          department: w.department || null,
          status,
          aiConfidence: riskScore,
          trustScore: Number(score.trust_score ?? Math.max(0, 100 - riskScore)),
          riskLevel: score.risk_level || (riskScore >= 70 ? 'HIGH' : riskScore >= 50 ? 'MEDIUM' : 'LOW'),
          anomalyScore: Number(score.anomaly_score ?? score.isolation_score ?? riskScore),
          aiReasons: (score.reasons || []).map(normalizeReason),
          lastVerified: w.lastVerified || w.last_verification || null,
        };
      });

      // Deduplicate: delete any existing records with the same staffIds
      const staffIds = processedChunk.map(w => w.staffId).filter(Boolean);
      const existingWorkers = await Worker.findAll({ where: { staffId: staffIds } });
      const existingIds = existingWorkers.map(worker => worker.id);
      if (existingIds.length) {
        await PaymentTransaction.destroy({ where: { workerId: existingIds } });
        await AuditEntry.destroy({ where: { workerId: existingIds } });
        await Worker.destroy({ where: { id: existingIds } });
      }

      const createdWorkers = await Worker.bulkCreate(processedChunk);

      const auditEntries = createdWorkers.map(cw => ({
        workerId: cw.id,
        action: 'WORKER_EVALUATED',
        details: `AI scored worker — ${cw.aiConfidence}% ghost probability. Status: ${cw.status}.`,
      }));
      await AuditEntry.bulkCreate(auditEntries);

      results.push(...createdWorkers);
    }

    const persistedFlagged = results.filter(worker => worker.status === 'FLAGGED');
    console.log(`[UPLOAD DEBUG] persisted records=${results.length} flagged=${persistedFlagged.length}`);
    if (persistedFlagged[0]) {
      console.log('[UPLOAD DEBUG] sample persisted flagged worker:', JSON.stringify({
        staffId: persistedFlagged[0].staffId,
        status: persistedFlagged[0].status,
        aiConfidence: persistedFlagged[0].aiConfidence,
        trustScore: persistedFlagged[0].trustScore,
        riskLevel: persistedFlagged[0].riskLevel,
        anomalyScore: persistedFlagged[0].anomalyScore,
        reasons: persistedFlagged[0].aiReasons
      }));
    }

    await AuditEntry.create({
      action: 'PAYROLL_BATCH_UPLOADED',
      details: `${results.length} workers imported into ${activeBatch}. Flagged: ${results.filter(r => r.status === 'FLAGGED').length}.`,
    });

    res.json({ success: true, count: results.length, batchId: activeBatch });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get workers (current batch by default) — paginated
router.get('/', async (req, res) => {
  try {
    const where = await buildWorkerWhere(req.query);
    const limit = Math.min(parseInt(req.query.limit || '200', 10), 5000);
    const offset = parseInt(req.query.offset || '0', 10);
    
    const { count, rows: workers } = await Worker.findAndCountAll({ 
      where, 
      order: [['createdAt', 'DESC']], 
      limit, 
      offset 
    });

    // Also get quick stats for the UI tabs
    const stats = await getQuickStats(where);

    res.json({ workers, total: count, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function getQuickStats(where) {
  const [total, flagged, verified, paid] = await Promise.all([
    Worker.count({ where }),
    Worker.count({ where: { ...where, status: 'FLAGGED' } }),
    Worker.count({ where: { ...where, status: 'VERIFIED' } }),
    Worker.count({ where: { ...where, status: { [require('sequelize').Op.in]: ['PAID', 'CONFIRMED'] } } })
  ]);
  return { total, flagged, verified, paid };
}

// Aggregate stats for dashboard
router.get('/stats/summary', async (req, res) => {
  try {
    const { Sequelize, Op } = require('sequelize');
    const where = await buildWorkerWhere(req.query);
    
    // Use DB-side aggregation for speed with 5000+ records
    const counts = await Worker.findAll({
      where,
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('salary')), 'totalSalary']
      ],
      group: ['status']
    });

    const stats = {
      total: 0,
      flagged: 0,
      verified: 0,
      paid: 0,
      cleared: 0,
      blockedAmount: 0,
      queuedAmount: 0,
      releasedAmount: 0,
      departmentStats: [],
      signals: []
    };

    counts.forEach(c => {
      const count = parseInt(c.get('count'), 10);
      const salary = parseFloat(c.get('totalSalary') || 0);
      stats.total += count;
      if (c.status === 'FLAGGED') {
        stats.flagged = count;
        stats.blockedAmount = salary;
      } else if (c.status === 'VERIFIED') {
        stats.verified = count;
        stats.queuedAmount = salary;
        stats.cleared += count;
      } else if (c.status === 'PAID' || c.status === 'CONFIRMED') {
        stats.paid = count;
        stats.releasedAmount += salary;
        stats.cleared += count;
      }
    });

    // Get department breakdown
    const deptStats = await Worker.findAll({
      where,
      attributes: [
        'department',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['department']
    });
    stats.departmentStats = deptStats.map(d => ({ 
      label: d.department || 'Unassigned', 
      count: parseInt(d.get('count'), 10) 
    }));

    // Get signals (reasons) — this still requires some memory work but we can optimize
    // For large scale, we only sample or aggregate the most common ones
    const workersWithReasons = await Worker.findAll({
      where: { ...where, status: 'FLAGGED' },
      attributes: ['aiReasons'],
      limit: 200 // Sample for speed
    });

    const signalMap = {};
    workersWithReasons.forEach(w => {
      const reasons = Array.isArray(w.aiReasons) ? w.aiReasons : [];
      reasons.forEach(r => {
        const key = r.flag || 'AI anomaly signal';
        signalMap[key] = (signalMap[key] || 0) + 1;
      });
    });
    stats.signals = Object.entries(signalMap)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
      const dept = worker.department || 'Unassigned';
      if (!departmentMap[dept]) departmentMap[dept] = { dept, workers: 0, flagged: 0, riskTotal: 0 };
      departmentMap[dept].workers += 1;
      departmentMap[dept].flagged += worker.status === 'FLAGGED' ? 1 : 0;
      departmentMap[dept].riskTotal += Number(worker.aiConfidence || 0);
    });

    res.json({
      batch: workers[0]?.batch || await getActiveBatch(),
      totalWorkers: workers.length,
      flaggedCount: flagged.length,
      verifiedCount: verified.length,
      paidCount: paid.length,
      clearedCount: cleared.length,
      blockedAmount: flagged.reduce((s, w) => s + Number(w.salary || 0), 0),
      queuedAmount: verified.reduce((s, w) => s + Number(w.salary || 0), 0),
      releasedAmount: paid.reduce((s, w) => s + Number(w.salary || 0), 0),
      integrity: workers.length ? Math.round((cleared.length / workers.length) * 100) : 0,
      anomalyDensity: workers.length ? Number(((flagged.length / workers.length) * 100).toFixed(1)) : 0,
      signalCounts: Object.entries(signalCounts).map(([label, count]) => ({ label, count })),
      departmentRisk: Object.values(departmentMap).map(item => ({
        dept: item.dept,
        workers: item.workers,
        flagged: item.flagged,
        risk: item.workers ? Math.round(item.riskTotal / item.workers) : 0,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Audit log
router.get('/audit/log', async (req, res) => {
  try {
    const entries = await AuditEntry.findAll({
      order: [['createdAt', 'DESC']],
      limit: Number(req.query.limit || 100),
    });
    res.json(entries.map(entry => ({
      id: entry.id,
      actor: entry.action.includes('PAYMENT') ? 'Squad Gateway'
        : entry.action.includes('EVALUATED') ? 'AI Engine'
        : (entry.action.includes('MANUALLY') || entry.action.includes('GHOST_CONFIRMED') || entry.action.includes('PROOF')) ? 'VIRGIL Admin'
        : 'VIRGIL System',
      action: entry.action,
      detail: entry.details || entry.squadReference || 'Operational event recorded',
      time: entry.createdAt,
      status: mapAuditStatus(entry.action),
      squadReference: entry.squadReference,
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manual status override (Override & Verify / Confirm Ghost)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const VALID = ['VERIFIED', 'FLAGGED', 'NEEDS REVIEW'];
    if (!VALID.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID.join(', ')}` });
    }

    const worker = await Worker.findByPk(req.params.id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    const prevStatus = worker.status;
    await worker.update({ status });

    const action = status === 'VERIFIED' ? 'WORKER_MANUALLY_VERIFIED' : 'WORKER_GHOST_CONFIRMED';
    await AuditEntry.create({
      workerId: worker.id,
      action,
      details: `Worker status changed from ${prevStatus} to ${status} by VIRGIL administrator.`,
    });

    res.json({ success: true, worker });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Proof of Life completion
router.post('/verify-pol', async (req, res) => {
  try {
    const { staffId, livenessPassed } = req.body;

    const worker = await Worker.findOne({ where: { staffId } });
    if (!worker) return res.status(404).json({ success: false, error: 'Worker not found' });

    const confidence = livenessPassed ? 96 : 42;
    const newStatus = livenessPassed ? 'VERIFIED' : 'NEEDS REVIEW';

    await worker.update({ status: newStatus, lastVerified: new Date(), aiConfidence: confidence });

    await AuditEntry.create({
      workerId: worker.id,
      action: 'PROOF_OF_LIFE_COMPLETED',
      details: `Worker completed Liveness Check. Confidence: ${confidence}%. Status: ${newStatus}.`,
    });

    res.json({ success: true, status: newStatus, worker });
  } catch (error) {
    console.error('POL Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
