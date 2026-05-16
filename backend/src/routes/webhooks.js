/**
 * Receives Squad payment confirmation webhooks.
 * Requires raw request body for signature verification.
 */

const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { Worker, PaymentTransaction, AuditEntry } = require('../models');

function getSignatureHeader(req) {
  return req.headers['x-squad-encrypted-body'] || req.headers['x-squad-signature'] || '';
}

function verifySquadSignature(rawBody, signatureHeader) {
  const secret = process.env.SQUAD_SECRET_KEY;
  if (!secret || typeof secret !== 'string') return false;
  if (!signatureHeader || typeof signatureHeader !== 'string') return false;

  const expected = crypto
    .createHmac('sha512', secret)
    .update(rawBody)
    .digest('hex')
    .toUpperCase();

  const provided = signatureHeader.trim().toUpperCase();
  if (provided.length !== expected.length) return false;

  try {
    return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch (_err) {
    return false;
  }
}

router.post('/squad', async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const allowInsecureWebhook = process.env.ALLOW_INSECURE_WEBHOOKS === 'true';

  if (!Buffer.isBuffer(req.body)) {
    return res.status(400).json({ error: 'Webhook body must be raw bytes.' });
  }

  const signature = getSignatureHeader(req);
  const signatureOk = verifySquadSignature(req.body, signature);

  if (!signatureOk) {
    if (!(allowInsecureWebhook && !isProduction)) {
      return res.status(401).json({ error: 'Invalid webhook signature.' });
    }
    console.warn('[WEBHOOK] Insecure webhook acceptance enabled for non-production.');
  }

  let event;
  try {
    event = JSON.parse(req.body.toString('utf8'));
  } catch (_err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  const eventType = event?.Event || event?.event;
  const data = event?.Body || event?.data || {};

  if (eventType !== 'transfer.success' && eventType !== 'Transfer') {
    return res.status(200).json({ message: 'Event acknowledged, not processed' });
  }

  const reference = data.transaction_reference || data.reference;
  if (!reference) {
    return res.status(400).json({ error: 'No transaction reference in payload' });
  }

  try {
    const transaction = await PaymentTransaction.findOne({ where: { reference } });
    if (!transaction) {
      return res.status(200).json({ message: 'Reference not found, ignored' });
    }

    await transaction.update({ status: 'CONFIRMED' });

    const worker = await Worker.findByPk(transaction.workerId);
    if (worker) {
      await worker.update({ status: 'CONFIRMED' });
    }

    await AuditEntry.create({
      workerId: transaction.workerId || null,
      action: 'PAYMENT_CONFIRMED',
      details: `Squad confirmed transfer for worker ${transaction.workerId}. Amount: NGN ${(transaction.amount).toLocaleString()}`,
      squadReference: reference,
    });

    return res.status(200).json({ message: 'Confirmed', reference });
  } catch (err) {
    console.error('[WEBHOOK] Error processing Squad webhook:', err.message);
    return res.status(500).json({ error: 'Internal error processing webhook' });
  }
});

module.exports = router;
