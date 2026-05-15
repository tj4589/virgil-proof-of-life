const express = require('express');
const router = express.Router();
const { Worker, AuditEntry, PaymentTransaction } = require('../models');
const squadService = require('../services/squadService');

const getActiveBatch = async () => {
  const latest = await Worker.findOne({ order: [['createdAt', 'DESC']] });
  return latest?.batch || null;
};

// Release batch payment
router.post('/release-batch', async (req, res) => {
  try {
    const { forceMock = false } = req.body || {};
    const activeBatch = await getActiveBatch();
    const workers = await Worker.findAll({
      where: activeBatch ? { status: 'VERIFIED', batch: activeBatch } : { status: 'VERIFIED' }
    });

    const results = [];
    for (const worker of workers) {
      try {
        const squadResult = await squadService.releaseSalaryPayment(
          worker,
          worker.salary,
          forceMock
        );
        
        const reference = squadResult.data?.transaction_reference || squadResult.transaction_reference || `MOCK-${Date.now()}`;

        await worker.update({
          status: 'PAID'
        });

        await PaymentTransaction.create({
          workerId: worker.id,
          reference: reference,
          amount: worker.salary,
          status: 'SUCCESS'
        });

        await AuditEntry.create({
          workerId: worker.id,
          action: 'PAYMENT_RELEASED',
          squadReference: reference
        });
        
        results.push({ worker: worker.id, status: 'PAID', ref: reference });
      } catch (err) {
        results.push({ worker: worker.id, status: 'FAILED', error: err.message });
      }
    }
    res.json({ released: results.filter(r => r.status === 'PAID').length, results });
  } catch (error) {
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
