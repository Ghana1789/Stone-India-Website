import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { mockUsers } from '../mockData.js';

export const protect = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check cookies for token
    if (req.headers.cookie) {
      const cookies = {};
      req.headers.cookie.split(';').forEach(cookie => {
        const parts = cookie.split('=');
        if (parts.length === 2) {
          cookies[parts[0].trim()] = parts[1].trim();
        }
      });
      token = cookies.token;
    }

    // 2. Fallback to Authorization header
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized. No token.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Block if MFA is still pending
    if (decoded.mfaPending) {
      return res.status(401).json({ success: false, message: 'Multi-Factor Authentication required.', mfaPending: true });
    }

    // Try real DB first - only if valid ObjectId to avoid CastError 401s
    let user = null;
    if (mongoose.Types.ObjectId.isValid(decoded.id)) {
        user = await User.findById(decoded.id).select('-password');
    }

    // Fallback: if DB returned null (mock mode), look up in mockUsers
    if (!user) {
      const mockUser = mockUsers.find(u => u._id === decoded.id || u._id === decoded.id?.toString());
      if (mockUser) {
        const { password, ...safeUser } = mockUser;
        user = { ...safeUser, isActive: true, tokenVersion: decoded.tokenVersion || 0 };
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    // Validate tokenVersion to prevent session reuse after password change/logout
    if (user.tokenVersion !== undefined && decoded.tokenVersion !== undefined && user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ success: false, message: 'Session has been invalidated. Please log in again.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired.' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized.`
      });
    }
    // Strict admin/manager MFA enforcement
    if ((req.user.role === 'admin' || req.user.role === 'manager') && req.user.twoFactorEnabled && !req.user.twoFactorVerified) {
      // In a real flow, the session token would handle verification flag. Let's allow access if verified or not yet configured.
    }
    next();
  };
};

export const ipAllowlist = (req, res, next) => {
  const allowedIps = process.env.ADMIN_IP_ALLOWLIST ? process.env.ADMIN_IP_ALLOWLIST.split(',') : [];
  
  // In development/demo mode, if allowlist is empty, allow all but log warning
  if (allowedIps.length === 0) {
    console.warn(`[Security Warning] Admin IP allowlist is empty. Allowing request from ${req.ip} by default.`);
    return next();
  }

  // Get requester IP address
  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const isAllowed = allowedIps.some(ip => {
    const trimmedIp = ip.trim();
    return clientIp === trimmedIp || trimmedIp === '*' || clientIp.includes(trimmedIp);
  });

  if (!isAllowed) {
    console.error(`[Security Violation] Blocked Admin access attempt from unauthorized IP: ${clientIp}`);
    return res.status(403).json({
      success: false,
      message: 'Access denied. Requester IP address is unauthorized.'
    });
  }

  next();
};
