const express = require('express');
const router = express.Router();
const { Worker, PayrollRecord } = require('../models');

// Generate payroll record
router.post('/', async (req, res) => {
  try {
    const { workerId, month, year, deductions } = req.body;
    
    const worker = await Worker.findByPk(workerId);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    
    const netSalary = worker.salary - (deductions || 0);
    
    const payroll = await PayrollRecord.create({
      workerId,
      month: month || new Date().getMonth() + 1,
      year: year || new Date().getFullYear(),
      baseSalary: worker.salary,
      deductions: deductions || 0,
      netSalary,
      status: 'PENDING'
    });
    
    res.json(payroll);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payroll history
router.get('/:workerId', async (req, res) => {
  try {
    const { workerId } = req.params;
    const history = await PayrollRecord.findAll({
      where: { workerId },
      order: [['createdAt', 'DESC']]
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
