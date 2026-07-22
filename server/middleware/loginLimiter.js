import rateLimit from 'express-rate-limit';
import AuditLog from '../models/AuditLog.js';

const isDev = process.env.NODE_ENV !== 'production';

// In development, be lenient to avoid blocking developers during testing.
// In production, apply strict limits.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 50 : 10,      // 50 attempts in dev, 10 in production
  skipSuccessfulRequests: true, // Don't count successful logins against the limit
  keyGenerator: (req) => req.ip,
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.'
  },
  handler: (req, res, next, options) => {
    // Log the potential brute-force attempt (only in production)
    if (!isDev) {
      AuditLog.create({
        action: 'OTHER',
        entity: 'Security',
        description: `Rate limit exceeded for login/reset from IP ${req.ip}`,
        metadata: { ip: req.ip, path: req.originalUrl },
        status: 'failed'
      }).catch(() => {});
    }
    res.status(429).json(options.message);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 2000 : 500, // Very generous in dev; 500 in production
  skipSuccessfulRequests: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
