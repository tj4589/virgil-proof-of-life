const express = require('express');
const router = express.Router();
const { AttendanceRecord } = require('../models');

// Record attendance
router.post('/', async (req, res) => {
  try {
    const { workerId, status, date } = req.body;
    
    const attendance = await AttendanceRecord.create({
      workerId,
      status: status || 'PRESENT',
      date: date ? new Date(date) : new Date()
    });
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance history
router.get('/:workerId', async (req, res) => {
  try {
    const { workerId } = req.params;
    const history = await AttendanceRecord.findAll({
      where: { workerId },
      order: [['date', 'DESC']]
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
