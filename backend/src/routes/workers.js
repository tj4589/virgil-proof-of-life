const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Worker, AuditEntry } = require('../models');
const aiService = require('../services/aiService');

const upload = multer({ dest: 'uploads/' });

// Upload batch of workers
router.post('/upload', async (req, res) => {
  try {
    const { batchId, workers } = req.body;
    
    // Get all workers for feature calculations
    const allWorkers = await Worker.findAll();
    
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
      
      const chunkPromises = chunk.map(async (w) => {
        const acct = w.bankAccount || w.bank_account || '';
        const historicalNin = allWorkers.filter(x => x.nin === w.nin).length;
        const historicalAcct = allWorkers.filter(x => x.bankAccount === acct).length;
        
        const ninCount = historicalNin + (batchNinFreq[w.nin] || 1);
        const accountCount = historicalAcct + (batchAcctFreq[acct] || 1);
        
        const avgSalary = allWorkers.length ? allWorkers.reduce((acc, curr) => acc + curr.salary, 0) / allWorkers.length : 150000;
        const stdSalary = 50000; 
        const salaryZscore = (w.salary - avgSalary) / stdSalary;
        
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
          batch: batchId || 'BATCH_1',
          staffId: w.staffId || `STF-${Math.floor(Math.random() * 1000000)}`,
          firstName: w.firstName || w.name?.split(' ')[0] || 'Unknown',
          lastName: w.lastName || w.name?.split(' ').slice(1).join(' ') || 'Unknown',
          email: w.email || '',
          phone: w.phone || '',
          nin: w.nin,
          bvn: w.bvn,
          bankAccount: w.bankAccount || w.bank_account || '',
          bankCode: '000000',
          salary: w.salary,
          department: w.department,
          status: score.label === 'GHOST' ? 'FLAGGED' : 'VERIFIED',
          aiConfidence: score.confidence,
          aiReasons: score.reasons, 
          lastVerified: w.lastVerified ? new Date(w.lastVerified) : null
        };
      });

      const processedChunk = await Promise.all(chunkPromises);
      const createdWorkers = await Worker.bulkCreate(processedChunk);
      
      const auditEntries = createdWorkers.map(cw => ({
        workerId: cw.id,
        action: 'WORKER_EVALUATED',
        details: `AI scored worker with ${cw.aiConfidence}% ghost probability`
      }));
      await AuditEntry.bulkCreate(auditEntries);

      results.push(...createdWorkers);
      allWorkers.push(...createdWorkers); 
    }

    res.json({ success: true, count: results.length, batchId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const workers = await Worker.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process Proof of Life
router.post('/verify-pol', async (req, res) => {
  try {
    const { staffId, confidence, livenessPassed } = req.body;
    
    const worker = await Worker.findOne({ where: { staffId } });
    if (!worker) {
      return res.status(404).json({ success: false, error: 'Worker not found' });
    }

    let newStatus = 'FLAGGED';
    if (livenessPassed && confidence > 85) {
      newStatus = 'VERIFIED';
    } else if (livenessPassed && confidence > 60) {
      newStatus = 'NEEDS REVIEW';
    }

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
