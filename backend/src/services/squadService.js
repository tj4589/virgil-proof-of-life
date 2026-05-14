const fetch = require('node-fetch');

const SQUAD_BASE = process.env.SQUAD_BASE_URL || 'https://sandbox-api-d.squadco.com';
const SQUAD_KEY = process.env.SQUAD_SECRET_KEY;

const headers = {
  'Authorization': `Bearer ${SQUAD_KEY}`,
  'Content-Type': 'application/json'
};

// 1. Create a virtual account per verified worker
async function createWorkerAccount(worker) {
  const res = await fetch(`${SQUAD_BASE}/virtual-account`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      customer_identifier: worker.id.toString(),
      first_name: worker.firstName,
      last_name: worker.lastName,
      mobile_num: worker.phone || '08000000000',
      email: worker.email || `${worker.firstName.toLowerCase()}@example.com`,
      bvn: worker.bvn,
      dob: "01/01/1990", // required field
      address: "Lagos", // required field
      gender: "1" // required field
    })
  });
  return res.json();
}

// 2. Initiate salary payment to verified worker
async function releaseSalaryPayment(worker, amount) {
  // CRITICAL RULE: Squad amounts must be in kobo. Multiply Naira by 100.
  const res = await fetch(`${SQUAD_BASE}/disbursement/single`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      transaction_reference: `SALARY-${worker.id}-${Date.now()}`,
      amount: Math.round(amount * 100),  // Squad uses kobo
      bank_code: worker.bankCode,
      account_number: worker.bankAccount,
      account_name: `${worker.firstName} ${worker.lastName}`,
      narration: `Salary payment - ${new Date().toLocaleDateString('en-NG', {month: 'long', year: 'numeric'})}`,
      currency_id: 'NGN'
    })
  });
  return res.json();
}

// 3. Verify a transaction completed
async function verifyTransaction(reference) {
  const res = await fetch(
    `${SQUAD_BASE}/transaction/verify/${reference}`,
    { headers }
  );
  return res.json();
}

module.exports = { createWorkerAccount, releaseSalaryPayment, verifyTransaction };
