const express = require('express');
const router = express.Router();
const { Worker, AuditEntry, PaymentTransaction } = require('../models');
const squadService = require('../services/squadService');

const getActiveBatch = async () => {
  const latest = await Worker.findOne({ order: [['createdAt', 'DESC']] });
  return latest?.batch || null;
};

// Release batch payment — optimized for large-scale (5000+ workers)
router.post('/release-batch', async (req, res) => {
  try {
    const { forceMock = true } = req.body || {}; // Default to mock for demo stability
    const activeBatch = await getActiveBatch();
    const where = activeBatch ? { status: 'VERIFIED', batch: activeBatch } : { status: 'VERIFIED' };
    
    // 1. Get IDs and total amount for the audit trail
    const workers = await Worker.findAll({ where, attributes: ['id', 'salary', 'staffId'] });
    if (workers.length === 0) {
      return res.json({ released: 0, results: [] });
    }

    const totalAmount = workers.reduce((sum, w) => sum + Number(w.salary || 0), 0);
    const workerIds = workers.map(w => w.id);

    // 2. Perform bulk update in database
    await Worker.update({ status: 'PAID' }, { where: { id: workerIds } });

    // 3. Create bulk payment transactions & audit logs
    const reference = `BATCH-RELEASE-${Date.now()}`;
    const transactions = workers.map(w => ({
      workerId: w.id,
      reference: `${reference}-${w.staffId}`,
      amount: w.salary,
      status: 'SUCCESS'
    }));
    await PaymentTransaction.bulkCreate(transactions);

    const auditEntries = workers.map(w => ({
      workerId: w.id,
      action: 'PAYMENT_RELEASED',
      squadReference: `${reference}-${w.staffId}`,
      details: `Bulk release of ${w.salary} NGN.`
    }));
    await AuditEntry.bulkCreate(auditEntries);

    // 4. Global audit entry for the batch
    await AuditEntry.create({
      action: 'BATCH_PAYMENT_RELEASED',
      details: `Released payments for ${workers.length} workers. Total: ${totalAmount} NGN.`
    });

    res.json({ 
      success: true,
      released: workers.length, 
      totalAmount,
      reference
    });
  } catch (error) {
    console.error('[PAYMENTS] Release failed:', error);
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
