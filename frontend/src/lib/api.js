const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const uploadWorkers = async (workers) => {
  const res = await fetch(`${API_URL}/workers/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ batchId: `BATCH_${Date.now()}`, workers }),
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
};

export const getWorkers = async () => {
  const res = await fetch(`${API_URL}/workers`);
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
