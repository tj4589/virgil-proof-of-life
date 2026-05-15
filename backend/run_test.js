require('dotenv').config();
const { connectDB } = require('./src/config/db');
const { Worker, PaymentTransaction, AuditEntry } = require('./src/models');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/workers',   require('./src/routes/workers'));
app.use('/payments',  require('./src/routes/payments'));
app.use('/attendance',require('./src/routes/attendance'));
app.use('/payroll',   require('./src/routes/payroll'));
app.use('/settings',  require('./src/routes/settings'));
app.use('/webhooks',  require('./src/routes/webhooks'));

const PORT = 3005;

async function runTests() {
  console.log('--- Starting Backend Webhook & Flow Test ---');
  await connectDB();

  const server = app.listen(PORT, async () => {
    console.log(`[TEST] Test Server running on port ${PORT}\n`);
    
    try {
      console.log('[TEST] Cleaning up previous test data...');
      const oldWorker = await Worker.findOne({ where: { staffId: 'TEST-WEBHOOK-001' } });
      if (oldWorker) {
        await AuditEntry.destroy({ where: { workerId: oldWorker.id } });
        await PaymentTransaction.destroy({ where: { workerId: oldWorker.id } });
        await oldWorker.destroy();
      }

      console.log('[TEST] Creating mock verified worker...');
      const worker = await Worker.create({
        batch: 'TEST_BATCH',
        staffId: 'TEST-WEBHOOK-001',
        firstName: 'Test',
        lastName: 'Worker',
        email: 'test@worker.com',
        phone: '08000000000',
        nin: '12345678901',
        bvn: '22222222222',
        bankAccount: '1234567890',
        bankCode: '058',
        salary: 50000,
        department: 'Test Dept',
        status: 'VERIFIED',
        aiConfidence: 95
      });
      console.log(`[TEST] Worker Created: ID: ${worker.id}`);

      // --- TEST 1: LIVE_SANDBOX MODE (Expected to Fail if key is invalid) ---
      console.log('\n[TEST 1] Testing LIVE_SANDBOX Mode (/payments/release-batch)...');
      console.log('[TEST 1] Note: Using real Squad endpoint. Will fail if key is invalid/missing.');
      const releaseResLive = await fetch(`http://localhost:${PORT}/payments/release-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceMock: false })
      });
      const releaseDataLive = await releaseResLive.json();
      console.log(`[TEST 1] Response:`, JSON.stringify(releaseDataLive, null, 2));

      // --- TEST 2: MOCK_FALLBACK MODE ---
      console.log('\n[TEST 2] Testing MOCK_FALLBACK Mode (/payments/release-batch with forceMock=true)...');
      const releaseResMock = await fetch(`http://localhost:${PORT}/payments/release-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceMock: true })
      });
      const releaseDataMock = await releaseResMock.json();
      console.log(`[TEST 2] Response:`, JSON.stringify(releaseDataMock, null, 2));
      
      const paymentRef = releaseDataMock.results.find(r => r.worker === worker.id)?.ref;
      console.log(`[TEST 2] Mock Transaction Reference created: ${paymentRef}`);

      // --- TEST 3: WEBHOOK TEST ---
      console.log('\n[TEST 3] Simulating Squad Webhook (/webhooks/squad)...');
      const webhookPayload = {
        Event: "transfer.success",
        Body: {
          transaction_reference: paymentRef,
          status: "success",
          amount: 50000
        }
      };

      const webhookRes = await fetch(`http://localhost:${PORT}/webhooks/squad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });
      const webhookData = await webhookRes.json();
      console.log(`[TEST 3] Webhook Response Status: ${webhookRes.status}`);
      console.log(`[TEST 3] Webhook Response Body:`, webhookData);

      // --- TEST 4: VERIFY FINAL STATE ---
      console.log('\n[TEST 4] Verifying Final Database State...');
      const finalWorker = await Worker.findByPk(worker.id);
      const transaction = await PaymentTransaction.findOne({ where: { reference: paymentRef } });
      const audit = await AuditEntry.findAll({ where: { workerId: worker.id } });

      console.log(`[TEST 4] Final Worker Status: ${finalWorker.status}`);
      console.log(`[TEST 4] Final Transaction Status: ${transaction.status}`);
      console.log(`[TEST 4] Final Audit Entries:`);
      audit.forEach(a => {
        console.log(`       - ${a.action}: ${a.details || a.squadReference}`);
      });

      console.log('\n--- Test Completed Successfully ---');
      
      console.log('[TEST] Cleaning up mock data...');
      await AuditEntry.destroy({ where: { workerId: worker.id } });
      await PaymentTransaction.destroy({ where: { workerId: worker.id } });
      await worker.destroy();
      console.log('[TEST] Cleanup finished.');
      
    } catch (err) {
      console.error('\n[TEST] Error occurred during testing:', err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

runTests();
