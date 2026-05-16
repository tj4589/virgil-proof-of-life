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
          
          if (squadResult.success === false) {
            console.error(`[PAYMENTS] Squad rejected worker ${worker.id}: ${squadResult.message}`);
            
            await PaymentTransaction.create({
              workerId: worker.id,
              reference: `FAIL-${Date.now()}-${worker.id}`,
              amount: worker.salary,
              status: 'FAILED'
            });

            await AuditEntry.create({
              workerId: worker.id,
              action: 'PAYMENT_FAILED',
              details: `Squad API Error: ${squadResult.message || 'Not Found (404)'}`
            });

            return { id: worker.id, status: 'FAILED', error: squadResult.message };
          }

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
          console.error(`[PAYMENTS] Critical error for worker ${worker.id}:`, err.message);
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
