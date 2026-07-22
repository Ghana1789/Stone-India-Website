import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { protect } from '../middleware/auth.js';
import { mockUsers } from '../mockData.js';
import { registerValidator, loginValidator } from '../middleware/validators.js';
import { loginLimiter } from '../middleware/loginLimiter.js';
import { generateSecret, verifyTOTP, generateBackupCodes, encryptSecret, decryptSecret } from '../services/totp.js';
import { generateCaptcha, verifyCaptcha } from '../services/captcha.js';

const router = express.Router();

const generateToken = (id, version = 0) => {
  return jwt.sign({ id, tokenVersion: version }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

const findUserById = async (id, selectPassword = false) => {
  let user = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    let query = User.findById(id);
    if (selectPassword) query = query.select('+password');
    user = await query;
  }
  if (!user) {
    const mockUser = mockUsers.find(u => u._id === id || u._id === id?.toString());
    if (mockUser) {
      user = {
        ...mockUser,
        comparePassword: async function(candidatePassword) {
          return candidatePassword === this.password;
        },
        save: async function() {
          return this;
        },
        toObject: function() {
          return { ...this };
        },
        toJSON: function() {
          return { ...this };
        }
      };
    }
  }
  return user;
};

// @POST /api/auth/register
router.post('/register', registerValidator, async (req, res) => {
  try {
    const { name, email, password, phone, role, company, gstNumber, address, department, designation, captchaAnswer, captchaToken } = req.body;

    // Validate CAPTCHA
    if (!verifyCaptcha(captchaAnswer, captchaToken)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired CAPTCHA. Please try again.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // Email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.create({
      name, email, password, phone, role: role || 'client',
      company, gstNumber, address, department, designation,
      isVerified: false,
      verificationToken,
      verificationTokenExpire
    });

    // In a real application, send verification email
    console.log(`[Verification Email Sent to ${email}] Link: http://localhost:5000/api/auth/verify-email/${verificationToken}`);

    // Create Audit Log
    await AuditLog.create({
      action: 'CREATE',
      entity: 'User',
      entityId: user._id,
      description: `New user registered: ${user.name} (${user.email})`,
      status: 'success'
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email/console to verify your account before logging in.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/auth/login
router.post('/login', loginLimiter, loginValidator, async (req, res) => {
  try {
    const { email, password, captchaAnswer, captchaToken } = req.body;

    let user = await User.findOne({ email }).select('+password');
    let isMockUser = false;

    // Fallback to mock users if DB returns null
    if (!user) {
      const mockUser = mockUsers.find(u => u.email === email && u.password === password);
      if (mockUser) {
        // Use plain object so the mock _id string is preserved (not cast to ObjectId)
        user = { ...mockUser, isVerified: true, isActive: true };
        isMockUser = true;
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      return res.status(403).json({
        success: false,
        message: `Account is temporarily locked due to repeated failed login attempts. Try again in ${remainingMinutes} minutes.`
      });
    }

    // Require CAPTCHA if login attempts >= 3
    if (user.loginAttempts >= 3) {
      if (!captchaAnswer || !captchaToken) {
        return res.status(400).json({
          success: false,
          captchaRequired: true,
          message: 'CAPTCHA verification required.'
        });
      }
      if (!verifyCaptcha(captchaAnswer, captchaToken)) {
        return res.status(400).json({
          success: false,
          captchaRequired: true,
          message: 'Invalid or expired CAPTCHA.'
        });
      }
    }

    // Check password
    const isMatch = isMockUser ? (password === user.password) : await user.comparePassword(password);
    if (!isMatch) {
      if (!isMockUser) {
        user.loginAttempts += 1;
        if (user.loginAttempts >= 5) {
          user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lockout
          await user.save({ validateBeforeSave: false });

          // Log brute force incident
          await AuditLog.create({
            action: 'LOGIN',
            entity: 'User',
            entityId: user._id,
            description: `Brute force alert: Account locked for ${email} due to 5 consecutive failures`,
            ip: req.ip || '',
            status: 'failed'
          });
        } else {
          await user.save({ validateBeforeSave: false });
        }
      }

      const captchaRequired = user.loginAttempts >= 3;
      return res.status(401).json({
        success: false,
        captchaRequired,
        message: 'Invalid email or password.'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact admin.' });
    }

    // Check if email is verified (allow seeded/demo users to bypass)
    const isSeededUser = user.email && user.email.endsWith('@stoneindia.com');
    if (!user.isVerified && !isMockUser && !isSeededUser) {
      return res.status(403).json({ success: false, message: 'Please verify your email address before logging in.' });
    }

    // Reset login attempts
    if (!isMockUser) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });
    }

    // Device Fingerprinting & Alerting
    const userAgent = req.headers['user-agent'] || 'unknown';
    const currentFingerprint = crypto.createHash('sha256').update(`${userAgent}:${req.ip}`).digest('hex');

    // Retrieve previous login log to check device change
    const validObjectId = mongoose.Types.ObjectId.isValid(user._id) ? user._id : null;

    let lastLoginLog = null;
    if (validObjectId) {
      lastLoginLog = await AuditLog.findOne({
        action: 'LOGIN',
        'performedBy.userId': validObjectId,
        status: 'success'
      }).sort({ createdAt: -1 });
    }

    if (lastLoginLog && lastLoginLog.metadata && lastLoginLog.metadata.fingerprint) {
      if (lastLoginLog.metadata.fingerprint !== currentFingerprint) {
        console.warn(`⚠️ [Security Alert] Suspicious Device Login detected for ${user.email} from IP ${req.ip}`);
        await AuditLog.create({
          action: 'OTHER',
          entity: 'Security',
          description: `Device alert: Unrecognized login device for ${user.email}`,
          ip: req.ip || '',
          metadata: { userAgent, originalIp: req.ip },
          status: 'success'
        });
      }
    }

    // Audit login
    await AuditLog.create({
      action: 'LOGIN',
      entity: 'User',
      entityId: validObjectId,
      description: `${user.name} logged in`,
      performedBy: { userId: validObjectId, name: user.name, email: user.email, role: user.role },
      ip: req.ip || '',
      metadata: { fingerprint: currentFingerprint, userAgent },
      status: 'success'
    });

    // Check if MFA (TOTP) is enabled
    if (user.twoFactorEnabled && !isMockUser) {
      // Issue a temporary token indicating MFA is pending
      const mfaToken = jwt.sign(
        { id: user._id, mfaPending: true },
        process.env.JWT_SECRET,
        { expiresIn: '5m' } // Very short expiration
      );

      return res.json({
        success: true,
        mfaRequired: true,
        mfaToken,
        message: 'Multi-Factor Authentication required.'
      });
    }

    // Issue standard cookie and token
    const token = generateToken(user._id, user.tokenVersion || 0);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const safeUser = typeof user.toJSON === 'function' ? user.toJSON() : { ...user, password: undefined };
    res.json({
      success: true,
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('❌ Login Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    let user = null;
    if (mongoose.Types.ObjectId.isValid(req.user._id)) {
      user = await User.findById(req.user._id);
    }
    if (!user) {
      user = req.user;
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/auth/verify-email/:token
router.get('/verify-email/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      verificationToken: req.params.token,
      verificationTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).send(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding-top: 100px; background-color: #f7fafc;">
            <h1 style="color: #e53e3e;">Verification Failed</h1>
            <p>Invalid or expired email verification link.</p>
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="display: inline-block; padding: 10px 20px; background-color: #e53e3e; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">Back to Portal</a>
          </body>
        </html>
      `);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    await AuditLog.create({
      action: 'UPDATE',
      entity: 'User',
      entityId: user._id,
      description: `Email verified successfully for ${user.email}`,
      status: 'success'
    });

    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding-top: 100px; background-color: #f7fafc;">
          <h1 style="color: #2b6cb0;">Email Verified!</h1>
          <p>Your email has been verified successfully. You can now close this tab and log in to the portal.</p>
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="display: inline-block; padding: 10px 20px; background-color: #3182ce; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">Go to Login</a>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/auth/forgot-password
router.post('/forgot-password', loginLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Generic response regardless of whether the email exists or not to prevent user enumeration
    const successResponse = {
      success: true,
      message: 'If a matching account exists, a secure password reset link has been sent to the email address.'
    };

    if (!user) {
      console.log(`[Forgot Password request] Email ${email} not found.`);
      return res.json(successResponse);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetOTP = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetOTPExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 mins validity
    await user.save({ validateBeforeSave: false });

    // Print link to console for verification / use
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}&email=${email}`;
    console.log(`[Password Reset Link for ${email}]: ${resetUrl}`);

    await AuditLog.create({
      action: 'RESET_PASSWORD',
      entity: 'User',
      entityId: user._id,
      description: `Password reset link requested for ${email}`,
      ip: req.ip || '',
      status: 'success'
    });

    res.json(successResponse);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/auth/reset-password
router.post('/reset-password', loginLimiter, async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      email,
      resetOTP: hashedToken,
      resetOTPExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
    }

    // Invalidate existing sessions by incrementing token version
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.password = newPassword;
    user.resetOTP = undefined;
    user.resetOTPExpire = undefined;
    await user.save();

    await AuditLog.create({
      action: 'RESET_PASSWORD',
      entity: 'User',
      entityId: user._id,
      description: `Password reset successfully completed for ${email}`,
      status: 'success'
    });

    res.json({ success: true, message: 'Password has been reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/auth/update-profile
router.put('/update-profile', protect, async (req, res) => {
  try {
    const { name, phone, company, address, avatar, shift, designation } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, company, address, avatar, shift, designation },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/auth/change-password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await findUserById(req.user._id, true);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password incorrect.' });
    }

    // Invalidate all active sessions on password change
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.password = newPassword;
    await user.save();

    await AuditLog.create({
      action: 'RESET_PASSWORD',
      entity: 'User',
      entityId: user._id,
      description: `Password updated via change-password for ${user.email}`,
      performedBy: { userId: user._id, name: user.name, email: user.email, role: user.role },
      status: 'success'
    });

    res.clearCookie('token');
    res.json({ success: true, message: 'Password updated successfully. Please log in again.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/auth/logout
router.post('/logout', protect, async (req, res) => {
  try {
    if (req.user) {
      const user = await findUserById(req.user._id);
      if (user) {
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();
      }

      await AuditLog.create({
        action: 'LOGOUT',
        entity: 'User',
        entityId: req.user._id,
        description: `${req.user.name} logged out`,
        performedBy: { userId: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role },
        status: 'success'
      });
    }

    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/auth/captcha
router.get('/captcha', (req, res) => {
  const captcha = generateCaptcha();
  res.json({ success: true, data: captcha });
});

// @POST /api/auth/mfa/setup
router.post('/mfa/setup', protect, async (req, res) => {
  try {
    const user = await findUserById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const secret = generateSecret();
    const encryptedSecret = encryptSecret(secret);

    const qrCodeUrl = `otpauth://totp/StoneIndia:${user.email}?secret=${secret}&issuer=StoneIndia`;

    res.json({
      success: true,
      secret,
      qrCodeUrl,
      mfaSetupToken: encryptedSecret
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/auth/mfa/enable
router.post('/mfa/enable', protect, async (req, res) => {
  try {
    const { code, mfaSetupToken } = req.body;
    if (!code || !mfaSetupToken) {
      return res.status(400).json({ success: false, message: 'TOTP code and setup token are required.' });
    }

    const secret = decryptSecret(mfaSetupToken);
    if (!secret) {
      return res.status(400).json({ success: false, message: 'Invalid or expired setup token.' });
    }

    const isVerified = verifyTOTP(secret, code);
    if (!isVerified) {
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }

    const user = await findUserById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.twoFactorSecret = encryptSecret(secret);
    user.twoFactorEnabled = true;

    const rawBackupCodes = generateBackupCodes();
    const salt = await bcrypt.genSalt(10);
    user.twoFactorBackupCodes = await Promise.all(
      rawBackupCodes.map(code => bcrypt.hash(code, salt))
    );

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    await AuditLog.create({
      action: 'UPDATE',
      entity: 'User',
      entityId: user._id,
      description: `MFA enabled for ${user.email}`,
      performedBy: { userId: user._id, name: user.name, email: user.email, role: user.role },
      status: 'success'
    });

    res.json({
      success: true,
      message: 'MFA enabled successfully.',
      backupCodes: rawBackupCodes
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/auth/mfa/verify
router.post('/mfa/verify', async (req, res) => {
  try {
    const { mfaToken, code } = req.body;
    if (!mfaToken || !code) {
      return res.status(400).json({ success: false, message: 'MFA session token and verification code are required.' });
    }

    const decoded = jwt.verify(mfaToken, process.env.JWT_SECRET);
    if (!decoded.mfaPending) {
      return res.status(400).json({ success: false, message: 'Invalid MFA session.' });
    }

    const user = await User.findById(decoded.id).select('+twoFactorSecret +twoFactorBackupCodes');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    let isCodeValid = false;
    let isBackupCodeUsed = false;

    if (code.length === 6) {
      const secret = decryptSecret(user.twoFactorSecret);
      isCodeValid = verifyTOTP(secret, code);
    } else {
      for (let i = 0; i < user.twoFactorBackupCodes.length; i++) {
        const match = await bcrypt.compare(code, user.twoFactorBackupCodes[i]);
        if (match) {
          isCodeValid = true;
          isBackupCodeUsed = true;
          user.twoFactorBackupCodes.splice(i, 1);
          break;
        }
      }
    }

    if (!isCodeValid) {
      return res.status(401).json({ success: false, message: 'Invalid verification code.' });
    }

    user.lastLogin = new Date();
    await user.save();

    await AuditLog.create({
      action: 'LOGIN',
      entity: 'User',
      entityId: user._id,
      description: `${user.name} completed MFA verification${isBackupCodeUsed ? ' using recovery code' : ''}`,
      performedBy: { userId: user._id, name: user.name, email: user.email, role: user.role },
      status: 'success'
    });

    const token = generateToken(user._id, user.tokenVersion || 0);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const safeUser = typeof user.toJSON === 'function' ? user.toJSON() : { ...user, password: undefined };
    res.json({
      success: true,
      token,
      user: safeUser
    });
  } catch (err) {
    res.status(401).json({ success: false, message: 'MFA session expired or invalid.' });
  }
});

// @POST /api/auth/mfa/disable
router.post('/mfa/disable', protect, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required to disable MFA.' });
    }

    const user = await findUserById(req.user._id, true);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = [];
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    await AuditLog.create({
      action: 'UPDATE',
      entity: 'User',
      entityId: user._id,
      description: `MFA disabled for ${user.email}`,
      performedBy: { userId: user._id, name: user.name, email: user.email, role: user.role },
      status: 'success'
    });

    res.json({ success: true, message: 'MFA has been disabled successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/auth/revoke-sessions
router.post('/revoke-sessions', protect, async (req, res) => {
  try {
    const user = await findUserById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Incrementing tokenVersion invalidates all JWT tokens ever generated for this user
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    await AuditLog.create({
      action: 'OTHER',
      entity: 'Security',
      entityId: user._id,
      description: `Remote session revocation: Revoked all active sessions for ${user.email}`,
      performedBy: { userId: user._id, name: user.name, email: user.email, role: user.role },
      status: 'success'
    });

    res.clearCookie('token');
    res.json({ success: true, message: 'All other sessions have been successfully revoked. You have been logged out of this device as well.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/auth/gdpr/export
router.get('/gdpr/export', protect, async (req, res) => {
  try {
    const user = await findUserById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const logs = await AuditLog.find({ 'performedBy.userId': req.user._id });

    const gdprData = {
      profile: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        company: user.company,
        gstNumber: user.gstNumber,
        address: user.address,
        department: user.department,
        designation: user.designation,
        shift: user.shift,
        joiningDate: user.joiningDate
      },
      auditLogs: logs.map(l => ({
        action: l.action,
        entity: l.entity,
        description: l.description,
        ip: l.ip,
        status: l.status,
        timestamp: l.createdAt
      }))
    };

    res.setHeader('Content-disposition', `attachment; filename=personal_data_${user.name.replace(/\s+/g, '_')}.json`);
    res.setHeader('Content-type', 'application/json');
    res.write(JSON.stringify(gdprData, null, 2));
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/auth/gdpr/delete
router.post('/gdpr/delete', protect, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required to request deletion.' });
    }

    const user = await findUserById(req.user._id, true);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    // Flag account as inactive (soft delete for audit purposes, standard GDPR data retention protocol)
    user.isActive = false;
    user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate sessions
    await user.save();

    await AuditLog.create({
      action: 'DELETE',
      entity: 'User',
      entityId: user._id,
      description: `GDPR deletion request: Deactivated account ${user.email}`,
      performedBy: { userId: user._id, name: user.name, email: user.email, role: user.role },
      status: 'success'
    });

    res.clearCookie('token');
    res.json({ success: true, message: 'Your account has been deactivated and flagged for permanent deletion.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
