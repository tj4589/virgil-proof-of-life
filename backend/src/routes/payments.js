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
    const MAX_LIVE_CALLS = 5; // Demo safety cap
    const CONCURRENCY = 2;    // Calm queue
    
    // Process in small batches to avoid overloading Squad
    for (let i = 0; i < workers.length; i += CONCURRENCY) {
      const batch = workers.slice(i, i + CONCURRENCY);
      
      const batchPromises = batch.map(async (worker, indexInBatch) => {
        const globalIndex = i + indexInBatch;
        
        try {
          // 1. STRICT VALIDATION
          if (!worker.bankAccount || worker.bankAccount.length < 10) {
            await AuditEntry.create({
              workerId: worker.id,
              action: 'PAYMENT_FAILED_VALIDATION',
              details: `Invalid bank details: ${worker.bankAccount || 'Missing'}`
            });
            return { id: worker.id, status: 'FAILED_VALIDATION', error: 'Invalid account number' };
          }

          // 2. DEMO SAFETY CAP
          const isDemoSimulated = globalIndex >= MAX_LIVE_CALLS;
          const shouldCallSquad = !forceMock && !isDemoSimulated && process.env.SQUAD_MODE === 'live_sandbox';

          // CALL SQUAD SERVICE
          const squadResult = await squadService.releaseSalaryPayment(worker, worker.salary, !shouldCallSquad);
          
          if (squadResult.success === false) {
            await PaymentTransaction.create({
              workerId: worker.id,
              reference: `FAIL-${Date.now()}-${worker.id}`,
              amount: worker.salary,
              status: 'FAILED'
            });

            await AuditEntry.create({
              workerId: worker.id,
              action: 'PAYMENT_FAILED',
              details: `Squad Error: ${squadResult.message}`
            });

            return { id: worker.id, status: 'FAILED', error: squadResult.message };
          }

          // 3. RECORD SUCCESS (LIVE OR SIMULATED)
          const reference = squadResult.data?.transaction_reference || squadResult.transaction_reference || `VIRGIL-REF-${Date.now()}-${worker.id}`;
          const finalStatus = isDemoSimulated ? 'SIMULATED' : 'PAID';

          await worker.update({ status: 'PAID' });
          
          await PaymentTransaction.create({
            workerId: worker.id,
            reference,
            amount: worker.salary,
            status: finalStatus === 'PAID' ? 'SUCCESS' : 'SIMULATED'
          });

          await AuditEntry.create({
            workerId: worker.id,
            action: isDemoSimulated ? 'PAYMENT_SIMULATED' : 'PAYMENT_RELEASED',
            squadReference: reference,
            details: isDemoSimulated ? `Demo limit reached: Payment simulated for ${worker.id}` : `Salary released via Squad: ${reference}`
          });

          return { id: worker.id, status: 'PAID', reference };
        } catch (err) {
          console.error(`[PAYMENTS] Critical error for worker ${worker.id}:`, err.message);
          return { id: worker.id, status: 'FAILED', error: err.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
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
    const { Sequelize } = require('sequelize');
    const activeBatch = await getActiveBatch();
    const where = activeBatch ? { batch: activeBatch } : {};
    
    const stats = await Worker.findAll({
      where,
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('salary')), 'totalSalary']
      ],
      group: ['status']
    });

    const result = {
      batch: activeBatch,
      totalWorkers: 0,
      flaggedCount: 0,
      verifiedCount: 0,
      paidCount: 0,
      blockedAmount: 0,
      queuedAmount: 0,
      releasedAmount: 0
    };

    stats.forEach(s => {
      const count = parseInt(s.get('count'), 10);
      const salary = parseFloat(s.get('totalSalary') || 0);
      result.totalWorkers += count;
      if (s.status === 'FLAGGED') {
        result.flaggedCount = count;
        result.blockedAmount = salary;
      } else if (s.status === 'VERIFIED') {
        result.verifiedCount = count;
        result.queuedAmount = salary;
      } else if (s.status === 'PAID' || s.status === 'CONFIRMED') {
        result.paidCount = count;
        result.releasedAmount = salary;
      }
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
