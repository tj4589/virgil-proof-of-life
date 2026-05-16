/**
 * squadService.js
 *
 * VIRGIL uses Squad's Transfer/Disbursement API to release verified salaries.
 * The organization has a funded Squad business account. VIRGIL authorizes
 * and initiates disbursements only for workers that have passed AI verification.
 * It also supports creating Virtual Accounts for verified workers.
 */

const fetch = require('node-fetch');

const SQUAD_BASE = process.env.SQUAD_BASE_URL || 'https://sandbox-api-d.squadco.com';
const SQUAD_KEY  = process.env.SQUAD_SECRET_KEY;
const SQUAD_MODE = process.env.SQUAD_MODE || 'live_sandbox'; // Default to live_sandbox

const headers = {
  'Authorization': `Bearer ${SQUAD_KEY}`,
  'Content-Type':  'application/json',
};

/**
 * Create a virtual account per verified worker.
 * @param {object} worker - Verified worker record
 */
async function createWorkerAccount(worker) {
  if (SQUAD_MODE === 'live_sandbox' && SQUAD_KEY) {
    try {
      const res = await fetch(`${SQUAD_BASE}/virtual-account`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customer_identifier: worker.id || worker._id,
          first_name: worker.firstName || worker.name.split(' ')[0],
          last_name: worker.lastName || worker.name.split(' ').slice(1).join(' '),
          mobile_num: worker.phone || '08000000000',
          email: worker.email || `worker${worker.id}@virgil.local`,
          bvn: worker.bvn || '12345678901',
        })
      });
      return await res.json();
    } catch (error) {
      console.error(`[SQUAD] Virtual account creation failed: ${error.message}`);
      throw new Error(`LIVE_SANDBOX virtual account creation failed: ${error.message}`);
    }
  } else {
    // MOCK_FALLBACK mode
    console.warn(`[SQUAD] Running in MOCK_FALLBACK mode. Simulating virtual account creation for ${worker.id}.`);
    return {
      status: 200,
      success: true,
      message: "Simulated Virtual Account Created (MOCK_FALLBACK mode)",
      data: { virtual_account_number: "0123456789" }
    };
  }
}

/**
 * Initiate a salary disbursement to a verified worker's bank account.
 * Called ONLY after VIRGIL AI confirms the worker is not a ghost.
 *
 * @param {object} worker  - Verified worker record from DB
 * @param {number} amount  - Salary amount in NGN (converted to kobo internally)
 * @param {boolean} forceMock - Used to optionally allow "Run simulated fallback"
 */
async function releaseSalaryPayment(worker, amount, forceMock = false) {
  const transaction_reference = `VIRGIL-SALARY-${worker.id}-${Date.now()}`;

  if (!forceMock && SQUAD_MODE === 'live_sandbox' && SQUAD_KEY) {
    const url = `${SQUAD_BASE}/payout/transfer`; 
    
    const payload = {
      transaction_reference,
      amount:                Math.round(amount * 100), // KOBO
      bank_code:             worker.bankCode || '058',
      account_number:        worker.bankAccount,
      account_name:          worker.name || `${worker.firstName} ${worker.lastName}`,
      narration:             `VIRGIL Salary — ${new Date().toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })}`,
      currency_id:           'NGN',
    };

    try {
      console.log(`[SQUAD] Calling LIVE Payout: ${url}`);
      
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(`[SQUAD] API Error [${res.status}] at ${url}:`, data);
        return { success: false, status: res.status, message: data.message || 'Squad API Error' };
      }

      console.log(`[SQUAD] ✅ Success:`, data.message || 'Payment initiated');
      return { ...data, success: true };
    } catch (error) {
      console.error(`[SQUAD] Network error at ${url}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Only run mock if explicitly requested or no keys present
  console.warn(`[SQUAD] Running in MOCK_FALLBACK mode for worker ${worker.id}.`);
  return {
    status: 200,
    success: true,
    message: "Simulated Success (MOCK_FALLBACK)",
    data: { transaction_reference }
  };
}

/**
 * Verify a transaction reference via Squad webhook or manual lookup.
 * Used for audit confirmation after disbursement.
 *
 * @param {string} reference - The transaction reference returned by Squad
 * @param {boolean} forceMock - Used to optionally allow "Run simulated fallback"
 */
async function verifyTransaction(reference, forceMock = false) {
  if (!forceMock && SQUAD_MODE === 'live_sandbox' && SQUAD_KEY) {
    try {
      const res = await fetch(
        `${SQUAD_BASE}/transaction/verify/${reference}`,
        { headers }
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      return await res.json();
    } catch (error) {
      console.error(`[SQUAD] Live sandbox verification failed: ${error.message}`);
      throw new Error(`LIVE_SANDBOX verification failed: ${error.message}`);
    }
  } else {
    // MOCK_FALLBACK mode
    console.warn(`[SQUAD] Running in MOCK_FALLBACK mode. Simulating verification for ${reference}.`);
    return {
      status: 200,
      success: true,
      message: "Simulated Verification Success (MOCK_FALLBACK mode)",
      data: { 
        id: 'enterprise_stress_test',
        name: 'Enterprise Stress Test (Nigeria-Scale)',
        type: 'Bulk Simulation',
        workers: 5000,
        complexity: 'High',
        density: '~4% Anomaly Density',
        desc: 'Simulates a large government parastatal. Tests chunked AI batch processing (10x sub-batches) and DB performance.',
        csv: null // Simplified for snippet
      }
    };
  }
}

module.exports = { createWorkerAccount, releaseSalaryPayment, verifyTransaction };
