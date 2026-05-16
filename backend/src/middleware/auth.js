const warnedMessages = new Set();

function logOnce(msg) {
  if (warnedMessages.has(msg)) return;
  warnedMessages.add(msg);
  console.warn(msg);
}

function isAuthEnforced() {
  if (process.env.ENFORCE_AUTH === 'true') return true;
  if (process.env.ENFORCE_AUTH === 'false') return false;
  return process.env.NODE_ENV === 'production';
}

function getConfiguredAdminKey() {
  const raw = process.env.ADMIN_API_KEY || '';
  return raw.trim();
}

function bootAuthGuard() {
  const enforce = isAuthEnforced();
  const key = getConfiguredAdminKey();

  if (enforce && !key) {
    throw new Error('AUTH_MISCONFIG: ADMIN_API_KEY is required when auth enforcement is enabled.');
  }

  if (!enforce) {
    logOnce('[AUTH] Admin auth enforcement is disabled. Set ENFORCE_AUTH=true to enable in non-production.');
    return;
  }

  logOnce('[AUTH] Admin auth enforcement is enabled.');
}

function extractToken(req) {
  const bearer = req.headers.authorization || '';
  if (bearer.toLowerCase().startsWith('bearer ')) {
    return bearer.slice(7).trim();
  }

  const apiKey = req.headers['x-api-key'];
  if (typeof apiKey === 'string' && apiKey.trim()) {
    return apiKey.trim();
  }

  return '';
}

function requireAdminAuth(req, res, next) {
  if (!isAuthEnforced()) return next();

  const configured = getConfiguredAdminKey();
  if (!configured) {
    return res.status(500).json({ error: 'Server auth is not configured.' });
  }

  const incoming = extractToken(req);
  if (!incoming || incoming !== configured) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return next();
}

module.exports = {
  bootAuthGuard,
  requireAdminAuth,
};
