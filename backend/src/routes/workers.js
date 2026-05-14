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
    
    for (let w of workers) {
      // Calculate features
      const ninCount = allWorkers.filter(x => x.nin === w.nin).length + 1;
      const accountCount = allWorkers.filter(x => x.bankAccount === w.bankAccount).length + 1;
      
      const avgSalary = allWorkers.length ? allWorkers.reduce((acc, curr) => acc + curr.salary, 0) / allWorkers.length : 150000;
      const stdSalary = 50000; 
      const salaryZscore = (w.salary - avgSalary) / stdSalary;
      
      let missingScore = 0;
      if (!w.department) missingScore++;
      if (!w.lastVerified) missingScore++; 
      if (w.salary === 0) missingScore++;

      // Score worker
      const score = await aiService.scoreWorker({
        nin_count: ninCount,
        account_count: accountCount,
        salary_zscore: salaryZscore,
        missing_score: missingScore
      });

      // Save worker to PostgreSQL via Sequelize
      const newWorker = await Worker.create({
        batch: batchId || 'BATCH_1',
        staffId: w.staff_id || `STF-${Math.floor(Math.random() * 1000000)}`,
        firstName: w.name ? w.name.split(' ')[0] : 'Unknown',
        lastName: w.name ? w.name.split(' ').slice(1).join(' ') : 'Unknown',
        email: w.email || '',
        phone: w.phone || '',
        nin: w.nin,
        bvn: w.bvn,
        bankAccount: w.bank_account,
        bankCode: '000000',
        salary: w.salary,
        department: w.department,
        status: score.label === 'GHOST' ? 'FLAGGED' : 'VERIFIED',
        aiConfidence: score.confidence,
        aiReasons: score.reasons, // Sequelize handles JSONB automatically
        lastVerified: w.lastVerified ? new Date(w.lastVerified) : null
      });

      await AuditEntry.create({
        workerId: newWorker.id,
        action: 'WORKER_EVALUATED',
        details: `AI scored worker with ${score.confidence}% ghost probability`
      });

      results.push(newWorker);
      allWorkers.push(newWorker); 
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
