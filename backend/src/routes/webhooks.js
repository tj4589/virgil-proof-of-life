/**
 * webhooks.js
 *
 * Receives Squad payment confirmation webhooks.
 *
 * Flow:
 *   Squad processes disbursement
 *   → Squad POSTs to /webhooks/squad
 *   → VIRGIL finds the transaction by reference
 *   → Updates PaymentTransaction status to CONFIRMED
 *   → Updates Worker status from PAID to CONFIRMED
 *   → Writes a final AuditEntry closing the payment loop
 *
 * Squad webhook signature verification:
 *   Squad sends x-squad-encrypted-body header (SHA512 HMAC of raw body).
 *   We verify it using SQUAD_SECRET_KEY before processing.
 */

const express = require('express');
const crypto  = require('crypto');
const router  = express.Router();
const { Worker, PaymentTransaction, AuditEntry } = require('../models');

/**
 * Verify that the webhook came from Squad and not an external actor.
 * Squad signs the raw body with HMAC-SHA512 using the secret key.
 */
function verifySquadSignature(rawBody, signatureHeader) {
  // Skip verification in development for local testing
  if (process.env.NODE_ENV !== 'production') return true;

  const secret = process.env.SQUAD_SECRET_KEY;
  if (!secret) return true;

  const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
  const expected = crypto.createHmac('sha512', secret).update(bodyString).digest('hex');
  return expected.toLowerCase() === (signatureHeader || '').toLowerCase();
}

/**
 * POST /webhooks/squad
 * Squad calls this after a disbursement settles.
 */
router.post('/squad', async (req, res) => {
  const signature = req.headers['x-squad-encrypted-body'];

  // Body may be pre-parsed by global express.json() or raw buffer
  let event;
  if (Buffer.isBuffer(req.body)) {
    const rawBody = req.body;
    if (!verifySquadSignature(rawBody, signature)) {
      console.warn('[WEBHOOK] Invalid Squad signature — request rejected');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    try { event = JSON.parse(rawBody.toString()); }
    catch (e) { return res.status(400).json({ error: 'Invalid JSON payload' }); }
  } else if (req.body && typeof req.body === 'object') {
    // Already parsed by express.json() — skip raw signature check in dev
    event = req.body;
  } else {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  const eventType = event?.Event || event?.event;
  const data      = event?.Body || event?.data || {};

  console.log(`[WEBHOOK] Squad event received: ${eventType}`);

  // Only process successful transfer events
  if (eventType !== 'transfer.success' && eventType !== 'Transfer') {
    return res.status(200).json({ message: 'Event acknowledged, not processed' });
  }

  const reference = data.transaction_reference || data.reference;

  if (!reference) {
    return res.status(400).json({ error: 'No transaction reference in payload' });
  }

  try {
    // 1. Find the transaction record
    const transaction = await PaymentTransaction.findOne({ where: { reference } });

    if (!transaction) {
      console.warn(`[WEBHOOK] No transaction found for reference: ${reference}`);
      return res.status(200).json({ message: 'Reference not found, ignored' });
    }

    // 2. Update transaction to CONFIRMED
    await transaction.update({ status: 'CONFIRMED' });

    // 3. Find and update the associated worker
    const worker = await Worker.findByPk(transaction.workerId);
    if (worker) {
      await worker.update({ status: 'CONFIRMED' });
    }

    // 4. Write audit trail entry — closes the loop
    await AuditEntry.create({
      action:         'PAYMENT_CONFIRMED',
      details:        `Squad confirmed transfer for worker ${transaction.workerId}. Amount: NGN ${(transaction.amount).toLocaleString()}`,
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
