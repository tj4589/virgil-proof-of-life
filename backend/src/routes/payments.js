const express = require('express');
const router = express.Router();
const { Worker, AuditEntry, PaymentTransaction } = require('../models');
const squadService = require('../services/squadService');

// Release batch payment
router.post('/release-batch', async (req, res) => {
  try {
    const { forceMock = false } = req.body || {};
    const workers = await Worker.findAll({
      where: { status: 'VERIFIED' }
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
    const total = await Worker.count();
    const flagged = await Worker.count({ where: { status: 'FLAGGED' } });
    const paid = await Worker.count({ where: { status: 'PAID' } });
    
    // Aggregation for amounts
    const stats = await Worker.findAll({
      attributes: [
        'status',
        [Worker.sequelize.fn('SUM', Worker.sequelize.col('salary')), 'totalAmount']
      ],
      group: ['status']
    });
    
    const amountMap = {};
    stats.forEach(s => {
        amountMap[s.status] = parseFloat(s.get('totalAmount'));
    });
    
    res.json({
      totalWorkers: total,
      flaggedCount: flagged,
      paidCount: paid,
      blockedAmount: amountMap['FLAGGED'] || 0,
      releasedAmount: amountMap['PAID'] || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
