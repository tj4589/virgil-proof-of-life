require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

// Connect to DB
connectDB();

const app = express();

// Middleware
app.use(cors());
// Handle large CSV uploads (up to 10mb) as specified
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/workers', require('./routes/workers'));
app.use('/payments', require('./routes/payments'));
app.use('/attendance', require('./routes/attendance'));
app.use('/payroll', require('./routes/payroll'));


const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
