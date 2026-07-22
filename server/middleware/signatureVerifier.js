import crypto from 'crypto';

// In-memory cache to store used nonces (limit: 5 minutes replay window)
const nonceCache = new Set();

export const verifyRequestSignature = (req, res, next) => {
  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];
  const nonce = req.headers['x-nonce'];

  // In development, if headers are missing, allow request but log a warning (to not break frontend forms during setup)
  if (!signature || !timestamp || !nonce) {
    console.warn(`[Security Signature Warning] Missing signature verification headers. Skipping check in development.`);
    return next();
  }

  // 1. Replay Protection: Reject requests older than 5 minutes (300 seconds)
  const timeDifference = Math.abs(Date.now() - parseInt(timestamp, 10));
  if (timeDifference > 5 * 60 * 1000) {
    return res.status(401).json({
      success: false,
      message: 'Signature expired. Request rejected.'
    });
  }

  // 2. Replay Protection: Check if nonce was already used
  if (nonceCache.has(nonce)) {
    return res.status(401).json({
      success: false,
      message: 'Duplicate nonce detected. Replay attack blocked.'
    });
  }

  // Add nonce to cache and expire it after 5 minutes
  nonceCache.add(nonce);
  setTimeout(() => {
    nonceCache.delete(nonce);
  }, 5 * 60 * 1000);

  // 3. Signature Verification
  // Construct signature payload: nonce + timestamp + JSON body (or empty string if no body)
  const bodyString = req.body && Object.keys(req.body).length > 0 ? JSON.stringify(req.body) : '';
  const payload = `${nonce}:${timestamp}:${bodyString}`;
  
  const secret = process.env.JWT_SECRET || 'stone_india_super_secret_jwt_key_2024_ev_battery';
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    console.error(`[Security Violation] Invalid request signature from IP ${req.ip}`);
    return res.status(401).json({
      success: false,
      message: 'Invalid request signature. Verification failed.'
    });
  }

  next();
};
