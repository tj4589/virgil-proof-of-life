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

    // Pre-calculate batch-wide frequencies for concurrent processing
    const batchNinFreq = {};
    const batchAcctFreq = {};
    workers.forEach(w => {
      const acct = w.bankAccount || w.bank_account || '';
      if (w.nin) batchNinFreq[w.nin] = (batchNinFreq[w.nin] || 0) + 1;
      if (acct) batchAcctFreq[acct] = (batchAcctFreq[acct] || 0) + 1;
    });

    const today = new Date();

    const BATCH_SIZE = 50;
    for (let i = 0; i < workers.length; i += BATCH_SIZE) {
      const chunk = workers.slice(i, i + BATCH_SIZE);

      const chunkPromises = chunk.map(async (w, localIndex) => {
        const absoluteIndex = i + localIndex;
        const acct = w.bankAccount || w.bank_account || '';
        const salary = Number(w.salary || 0);
        const ninCount = w.nin ? (batchNinFreq[w.nin] || 1) : 1;
        const accountCount = acct ? (batchAcctFreq[acct] || 1) : 1;
        const salaryZscore = salary > 0 ? (salary - avgSalary) / stdSalary : 0;

        let missingScore = 0;
        if (!w.department) missingScore++;
        if (!w.lastVerified) missingScore++;
        if (!salary || salary === 0) missingScore++;

        // Attendance score: 0-100. Default 90 (neutral) when not supplied.
        const attendanceScore = (w.attendanceScore != null && w.attendanceScore !== '')
          ? Math.max(0, Math.min(100, Number(w.attendanceScore)))
          : 90;

        // Days since last verification. Default 365 when never verified.
        let daysSinceVerification = 365;
        if (w.lastVerified) {
          const verifiedDate = new Date(w.lastVerified);
          if (!isNaN(verifiedDate)) {
            daysSinceVerification = Math.max(0, Math.floor((today - verifiedDate) / 86400000));
          }
        }

        const score = await aiService.scoreWorker({
          nin_count: ninCount,
          account_count: accountCount,
          salary_zscore: salaryZscore,
          missing_score: missingScore,
          attendance_score: attendanceScore,
          days_since_verification: daysSinceVerification,
        });

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
          bankCode: '000000',
          salary,
          department: w.department || null,
          status: score.label === 'GHOST' ? 'FLAGGED' : score.label === 'ERROR' ? 'NEEDS REVIEW' : 'VERIFIED',
          aiConfidence: score.confidence,
          aiReasons: (score.reasons || []).map(normalizeReason),
          lastVerified: w.lastVerified ? new Date(w.lastVerified) : null,
        };
      });

      const processedChunk = await Promise.all(chunkPromises);

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

// Get all workers (current batch by default)
router.get('/', async (req, res) => {
  try {
    const where = await buildWorkerWhere(req.query);
    const workers = await Worker.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Aggregate stats for dashboard
router.get('/stats/summary', async (req, res) => {
  try {
    const where = await buildWorkerWhere(req.query);
    const workers = await Worker.findAll({ where });
    const flagged = workers.filter(w => w.status === 'FLAGGED');
    const verified = workers.filter(w => w.status === 'VERIFIED');
    const paid = workers.filter(w => w.status === 'PAID' || w.status === 'CONFIRMED');
    const cleared = workers.filter(w => ['VERIFIED', 'PAID', 'CONFIRMED'].includes(w.status));

    const signalCounts = {};
    workers.forEach(worker => {
      const reasons = Array.isArray(worker.aiReasons) ? worker.aiReasons : [];
      reasons.forEach(reason => {
        const key = reason.flag || reason.detail || 'AI anomaly signal';
        signalCounts[key] = (signalCounts[key] || 0) + 1;
      });
    });

    const departmentMap = {};
    workers.forEach(worker => {
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
