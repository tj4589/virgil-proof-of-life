const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '../../settings.json');

// Default settings
const defaultSettings = {
  sensitivity: 85,
  autoBlock: 85,
  manualReview: 90
};

// Get settings
router.get('/', (req, res) => {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      res.json(JSON.parse(data));
    } else {
      res.json(defaultSettings);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

// Update settings
router.post('/', (req, res) => {
  try {
    const newSettings = req.body;
    fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2));
    res.json({ success: true, settings: newSettings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

module.exports = router;
