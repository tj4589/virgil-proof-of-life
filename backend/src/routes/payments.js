const express = require('express');
const router = express.Router();
const { Worker, AuditEntry, PaymentTransaction } = require('../models');
const squadService = require('../services/squadService');

const getActiveBatch = async () => {
  const latest = await Worker.findOne({ order: [['createdAt', 'DESC']] });
  return latest?.batch || null;
};

// Release batch payment — optimized for LIVE SQUAD with 5000+ workers
router.post('/release-batch', async (req, res) => {
  try {
    const { forceMock = false } = req.body || {}; 
    const activeBatch = await getActiveBatch();
    const where = activeBatch ? { status: 'VERIFIED', batch: activeBatch } : { status: 'VERIFIED' };
    
    const workers = await Worker.findAll({ where });
    if (workers.length === 0) return res.json({ released: 0, results: [] });

    console.log(`[PAYMENTS] Initiating LIVE release for ${workers.length} workers...`);

    const results = [];
    const CHUNK_SIZE = 15; 
    
    for (let i = 0; i < workers.length; i += CHUNK_SIZE) {
      const chunk = workers.slice(i, i + CHUNK_SIZE);
      const chunkPromises = chunk.map(async (worker) => {
        try {
          // CALL REAL SQUAD SERVICE
          const squadResult = await squadService.releaseSalaryPayment(worker, worker.salary, forceMock);
          const reference = squadResult.data?.transaction_reference || squadResult.transaction_reference || `VIRGIL-REF-${Date.now()}-${worker.id}`;

          await worker.update({ status: 'PAID' });
          
          await PaymentTransaction.create({
            workerId: worker.id,
            reference: reference,
            amount: worker.salary,
            status: 'SUCCESS'
          });

          await AuditEntry.create({
            workerId: worker.id,
            action: 'PAYMENT_RELEASED',
            squadReference: reference,
            details: `Salary of ${worker.salary} NGN released via Squad Sandbox.`
          });

          return { id: worker.id, status: 'PAID' };
        } catch (err) {
          console.error(`[PAYMENTS] Failed for worker ${worker.id}:`, err.message);
          return { id: worker.id, status: 'FAILED', error: err.message };
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
      if (i % 100 === 0 && i > 0) console.log(`[PAYMENTS] Progress: ${i}/${workers.length} released...`);
    }

    const releasedCount = results.filter(r => r.status === 'PAID').length;

    await AuditEntry.create({
      action: 'BATCH_PAYMENT_RELEASED',
      details: `Live batch release complete. Total: ${releasedCount}/${workers.length} successful.`
    });

    res.json({ 
      success: true,
      released: releasedCount,
      total: workers.length,
      results: results.slice(0, 10) 
    });
  } catch (error) {
    console.error('[PAYMENTS] Global Release failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stats route
router.get('/stats', async (req, res) => {
  try {
    const activeBatch = await getActiveBatch();
    const where = activeBatch ? { batch: activeBatch } : {};
    const workers = await Worker.findAll({ where });
    const activeWorkerIds = new Set(workers.map(w => w.id));
    const transactions = await PaymentTransaction.findAll();
    const flagged = workers.filter(w => w.status === 'FLAGGED');
    const verified = workers.filter(w => w.status === 'VERIFIED');
    const paid = workers.filter(w => w.status === 'PAID' || w.status === 'CONFIRMED');
    
    res.json({
      batch: activeBatch,
      totalWorkers: workers.length,
      flaggedCount: flagged.length,
      verifiedCount: verified.length,
      paidCount: paid.length,
      blockedAmount: flagged.reduce((sum, w) => sum + Number(w.salary || 0), 0),
      queuedAmount: verified.reduce((sum, w) => sum + Number(w.salary || 0), 0),
      releasedAmount: transactions
        .filter(tx => activeWorkerIds.has(tx.workerId) && (tx.status === 'SUCCESS' || tx.status === 'CONFIRMED'))
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
