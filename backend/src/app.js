require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { bootAuthGuard, requireAdminAuth } = require('./middleware/auth');

// Connect to DB
connectDB();
bootAuthGuard();

const app = express();

// Middleware
app.use(cors());
// Webhooks must receive the exact raw body for signature validation.
app.use('/webhooks', express.raw({ type: '*/*', limit: '2mb' }), require('./routes/webhooks'));
// Handle large JSON payloads (up to 10mb) as specified
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/workers', requireAdminAuth, require('./routes/workers'));
app.use('/payments', requireAdminAuth, require('./routes/payments'));
app.use('/attendance', requireAdminAuth, require('./routes/attendance'));
app.use('/payroll', requireAdminAuth, require('./routes/payroll'));
app.use('/settings', requireAdminAuth, require('./routes/settings'));


const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
