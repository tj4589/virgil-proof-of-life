const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const uploadWorkers = async (workers) => {
  // Chunk large uploads — avoid 413 and backend timeouts
  const CHUNK = 500;
  let lastResult;
  const batchId = `BATCH_${Date.now()}`;

  for (let i = 0; i < workers.length; i += CHUNK) {
    const chunk = workers.slice(i, i + CHUNK);
    const res = await fetch(`${API_URL}/workers/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchId, workers: chunk }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => 'Unknown error');
      throw new Error(`Upload failed (chunk ${Math.floor(i / CHUNK) + 1}): ${text}`);
    }
    lastResult = await res.json();
  }
  return lastResult;
};

export const getWorkers = async ({ limit = 200, offset = 0 } = {}) => {
  const res = await fetch(`${API_URL}/workers?limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error('Failed to fetch workers');
  return res.json();
};

export const updateWorkerStatus = async (id, status) => {
  const res = await fetch(`${API_URL}/workers/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update worker status');
  return res.json();
};

export const releasePayments = async () => {
  const res = await fetch(`${API_URL}/payments/release-batch`, { method: 'POST' });
  if (!res.ok) throw new Error('Release failed');
  return res.json();
};

export const getPaymentStats = async () => {
  const res = await fetch(`${API_URL}/payments/stats`);
  if (!res.ok) throw new Error('Failed to fetch payment stats');
  return res.json();
};

export const getStats = async () => {
  const res = await fetch(`${API_URL}/workers/stats/summary`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
};

export const getAuditLog = async () => {
  const res = await fetch(`${API_URL}/workers/audit/log`);
  if (!res.ok) throw new Error('Failed to fetch audit log');
  return res.json();
};

export const verifyPol = async (data) => {
  const res = await fetch(`${API_URL}/workers/verify-pol`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Verification failed');
  return res.json();
};

export const getSettings = async () => {
  const res = await fetch(`${API_URL}/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
};

export const saveSettings = async (settings) => {
  const res = await fetch(`${API_URL}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to save settings');
  return res.json();
};
