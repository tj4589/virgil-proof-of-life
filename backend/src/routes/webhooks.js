/**
 * webhooks.js
 *
 * Receives Squad payment confirmation webhooks.
 *
 * Flow:
 *   Squad processes disbursement
 *   -> Squad POSTs to /webhooks/squad
 *   -> VIRGIL finds the transaction by reference
 *   -> Updates PaymentTransaction status to CONFIRMED
 *   -> Updates Worker status from PAID to CONFIRMED
 *   -> Writes a final AuditEntry closing the payment loop
 *
 * Squad webhook signature verification:
 *   Squad sends x-squad-encrypted-body header (SHA512 HMAC of raw body).
 *   We verify it using SQUAD_SECRET_KEY before processing.
 */

const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { Worker, PaymentTransaction, AuditEntry } = require('../models');

/**
 * Verify that the webhook came from Squad and not an external actor.
 * The signature is HMAC-SHA512 over the raw request body.
 */
function verifySquadSignature(rawBody, signatureHeader) {
  const secret = process.env.SQUAD_SECRET_KEY;
  if (!secret) return process.env.NODE_ENV !== 'production';
  if (!signatureHeader) return false;

  const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
  const expected = crypto.createHmac('sha512', secret).update(bodyString).digest('hex');

  try {
    const expectedBuf = Buffer.from(expected, 'hex');
    const receivedBuf = Buffer.from(String(signatureHeader).trim(), 'hex');
    if (expectedBuf.length !== receivedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

/**
 * POST /webhooks/squad
 * Squad calls this after a disbursement settles.
 */
router.post('/squad', async (req, res) => {
  const signature = req.headers['x-squad-encrypted-body'];

  // This route is mounted with express.raw() to preserve exact webhook bytes.
  if (!Buffer.isBuffer(req.body)) {
    console.warn('[WEBHOOK] Expected raw JSON body buffer');
    return res.status(400).json({ error: 'Invalid webhook body format' });
  }

  if (!verifySquadSignature(req.body, signature)) {
    console.warn('[WEBHOOK] Invalid Squad signature -> request rejected');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(req.body.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  const eventType = event?.Event || event?.event;
  const data = event?.Body || event?.data || {};

  console.log(`[WEBHOOK] Squad event received: ${eventType}`);

  // Only process successful transfer events.
  if (eventType !== 'transfer.success' && eventType !== 'Transfer') {
    return res.status(200).json({ message: 'Event acknowledged, not processed' });
  }

  const reference = data.transaction_reference || data.reference;
  if (!reference) {
    return res.status(400).json({ error: 'No transaction reference in payload' });
  }

  try {
    // 1. Find the transaction record.
    const transaction = await PaymentTransaction.findOne({ where: { reference } });
    if (!transaction) {
      console.warn(`[WEBHOOK] No transaction found for reference: ${reference}`);
      return res.status(200).json({ message: 'Reference not found, ignored' });
    }

    // 2. Update transaction to CONFIRMED.
    await transaction.update({ status: 'CONFIRMED' });

    // 3. Find and update the associated worker.
    const worker = await Worker.findByPk(transaction.workerId);
    if (worker) {
      await worker.update({ status: 'CONFIRMED' });
    }

    // 4. Write audit trail entry and close the loop.
    await AuditEntry.create({
      action: 'PAYMENT_CONFIRMED',
      details: `Squad confirmed transfer for worker ${transaction.workerId}. Amount: NGN ${(transaction.amount).toLocaleString()}`,
      squadReference: reference,
    });

    console.log(`[WEBHOOK] Payment CONFIRMED: ${reference}`);
    return res.status(200).json({ message: 'Confirmed', reference });
  } catch (err) {
    console.error('[WEBHOOK] Error processing Squad webhook:', err.message);
    return res.status(500).json({ error: 'Internal error processing webhook' });
  }
});

module.exports = router;
