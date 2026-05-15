const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Worker, AuditEntry, PaymentTransaction } = require('../models');
const aiService = require('../services/aiService');

const upload = multer({ dest: 'uploads/' });

const normalizeReason = (reason) => {
  if (typeof reason !== 'string') return reason;
  const lower = reason.toLowerCase();
  const severity = lower.includes('critical') || lower.includes('duplicated') || lower.includes('shared')
    ? 'high'
    : lower.includes('missing') ? 'medium' : 'low';
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
  if (action.includes('BLOCK') || action.includes('FLAG')) return 'blocked';
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
    const salaries = workers.map(w => Number(w.salary || w.monthly_pay || 0)).filter(n => Number.isFinite(n));
    const avgSalary = salaries.length ? salaries.reduce((acc, curr) => acc + curr, 0) / salaries.length : 0;
    const variance = salaries.length > 1
      ? salaries.reduce((acc, curr) => acc + Math.pow(curr - avgSalary, 2), 0) / (salaries.length - 1)
      : 0;
    const stdSalary = Math.sqrt(variance) || 1;
    
    const results = [];
    
    // Pre-calculate batch frequencies for accurate relationship mapping during parallel AI processing
    const batchNinFreq = {};
    const batchAcctFreq = {};
    workers.forEach(w => {
      const acct = w.bankAccount || w.bank_account || '';
      if (w.nin) batchNinFreq[w.nin] = (batchNinFreq[w.nin] || 0) + 1;
      if (acct) batchAcctFreq[acct] = (batchAcctFreq[acct] || 0) + 1;
    });

    const BATCH_SIZE = 50;
    for (let i = 0; i < workers.length; i += BATCH_SIZE) {
      const chunk = workers.slice(i, i + BATCH_SIZE);
      
      const chunkPromises = chunk.map(async (w, localIndex) => {
        const absoluteIndex = i + localIndex;
        const acct = w.bankAccount || w.bank_account || '';
        const salary = Number(w.salary || 0);
        const ninCount = w.nin ? (batchNinFreq[w.nin] || 1) : 1;
        const accountCount = acct ? (batchAcctFreq[acct] || 1) : 1;
        const salaryZscore = (salary - avgSalary) / stdSalary;
        
        let missingScore = 0;
        if (!w.department) missingScore++;
        if (!w.lastVerified) missingScore++; 
        if (w.salary === 0) missingScore++;

        const score = await aiService.scoreWorker({
          nin_count: ninCount,
          account_count: accountCount,
          salary_zscore: salaryZscore,
          missing_score: missingScore
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
          bankAccount: w.bankAccount || w.bank_account || '',
          bankCode: '000000',
          salary,
          department: w.department,
          status: score.label === 'GHOST' ? 'FLAGGED' : score.label === 'ERROR' ? 'NEEDS REVIEW' : 'VERIFIED',
          aiConfidence: score.confidence,
          aiReasons: (score.reasons || []).map(normalizeReason),
          lastVerified: w.lastVerified ? new Date(w.lastVerified) : null
        };
      });

      const processedChunk = await Promise.all(chunkPromises);
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
        details: `AI scored worker with ${cw.aiConfidence}% ghost probability`
      }));
      await AuditEntry.bulkCreate(auditEntries);

      results.push(...createdWorkers);
    }

    await AuditEntry.create({
      action: 'PAYROLL_BATCH_UPLOADED',
      details: `${results.length} workers imported into ${activeBatch}`
    });

    res.json({ success: true, count: results.length, batchId: activeBatch });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const where = await buildWorkerWhere(req.query);
    const workers = await Worker.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats/summary', async (req, res) => {
  try {
    const where = await buildWorkerWhere(req.query);
    const workers = await Worker.findAll({ where });
    const totalWorkers = workers.length;
    const flagged = workers.filter(w => w.status === 'FLAGGED');
    const verified = workers.filter(w => w.status === 'VERIFIED');
    const paid = workers.filter(w => w.status === 'PAID' || w.status === 'CONFIRMED');
    const cleared = workers.filter(w => ['VERIFIED', 'PAID', 'CONFIRMED'].includes(w.status));
    const blockedAmount = flagged.reduce((sum, w) => sum + Number(w.salary || 0), 0);
    const queuedAmount = verified.reduce((sum, w) => sum + Number(w.salary || 0), 0);
    const releasedAmount = paid.reduce((sum, w) => sum + Number(w.salary || 0), 0);

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
      totalWorkers,
      flaggedCount: flagged.length,
      verifiedCount: verified.length,
      paidCount: paid.length,
      clearedCount: cleared.length,
      blockedAmount,
      queuedAmount,
      releasedAmount,
      integrity: totalWorkers ? Math.round((cleared.length / totalWorkers) * 100) : 0,
      anomalyDensity: totalWorkers ? Number(((flagged.length / totalWorkers) * 100).toFixed(1)) : 0,
      signalCounts: Object.entries(signalCounts).map(([label, count]) => ({ label, count })),
      departmentRisk: Object.values(departmentMap).map(item => ({
        dept: item.dept,
        workers: item.workers,
        flagged: item.flagged,
        risk: item.workers ? Math.round(item.riskTotal / item.workers) : 0
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/audit/log', async (req, res) => {
  try {
    const entries = await AuditEntry.findAll({
      order: [['createdAt', 'DESC']],
      limit: Number(req.query.limit || 100)
    });
    res.json(entries.map(entry => ({
      id: entry.id,
      actor: entry.action.includes('PAYMENT') ? 'Squad Gateway' : entry.action.includes('EVALUATED') ? 'AI Engine' : 'VIRGIL System',
      action: entry.action,
      detail: entry.details || entry.squadReference || 'Operational event recorded',
      time: entry.createdAt,
      status: mapAuditStatus(entry.action),
      squadReference: entry.squadReference
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process Proof of Life
router.post('/verify-pol', async (req, res) => {
  try {
    const { staffId, livenessPassed } = req.body;
    
    const worker = await Worker.findOne({ where: { staffId } });
    if (!worker) {
      return res.status(404).json({ success: false, error: 'Worker not found' });
    }

    const confidence = livenessPassed ? 96 : 42;
    const newStatus = livenessPassed ? 'VERIFIED' : 'NEEDS REVIEW';

    await worker.update({
      status: newStatus,
      lastVerified: new Date(),
      aiConfidence: confidence
    });

    await AuditEntry.create({
      workerId: worker.id,
      action: 'PROOF_OF_LIFE_COMPLETED',
      details: `Worker completed Liveness Check. Confidence: ${confidence}%. Status updated to ${newStatus}.`
    });

    res.json({ success: true, status: newStatus, worker });
  } catch (error) {
    console.error('POL Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
