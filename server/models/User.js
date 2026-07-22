import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const DEPARTMENTS = [
  'Research & Development',
  'Procurement',
  'Production',
  'Quality Control',
  'Maintenance',
  'Safety & Environment',
  'Engineering',
  'Logistics & Supply Chain',
  'Packaging',
  'Sales & Marketing',
  'Human Resources',
  'Finance',
  'Machine Operator',
  'Sales Executive',
  'Marketing Manager',
  'Account Executive',
  'Data Analyst',
  'Production Supervisor',
  'R&D Engineer',
  'Ass HR Manager'
];

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['client', 'employee', 'manager', 'admin'], default: 'client' },
  phone: { type: String, trim: true },
  avatar: { type: String, default: '' },
  isActive: { type: Boolean, default: true },

  // Client-specific
  company: { type: String, trim: true },
  gstNumber: { type: String, trim: true },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },

  // Employee / Manager specific
  employeeId: { type: String, unique: true, sparse: true },
  department: {
    type: String,
    enum: DEPARTMENTS,
    default: null
  },
  designation: { type: String },
  shift: { type: String, enum: ['Morning', 'Evening', 'Night'], default: 'Morning' },
  joiningDate: { type: Date },

  // Performance (for employees and managers)
  performance: {
    score: { type: Number, min: 0, max: 100, default: 0 },
    rating: { type: String, enum: ['Excellent', 'Good', 'Average', 'Poor'], default: 'Average' },
    lastReviewed: { type: Date }
  },

  // OTP for password reset
  resetOTP: { type: String },
  resetOTPExpire: { type: Date },

  // Email verification
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpire: { type: Date },

  // Brute force / Login lockout
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },

  // Session management version
  tokenVersion: { type: Number, default: 0 },

  // Multi-Factor Authentication (MFA)
  twoFactorSecret: { type: String },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorBackupCodes: [{ type: String }],

  // Notifications
  notifications: [{
    message: String,
    type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],

  lastLogin: { type: Date },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password and MFA secrets from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetOTP;
  delete obj.resetOTPExpire;
  delete obj.verificationToken;
  delete obj.verificationTokenExpire;
  delete obj.twoFactorSecret;
  delete obj.twoFactorBackupCodes;
  return obj;
};

export const DEPARTMENT_LIST = DEPARTMENTS;
export default mongoose.model('User', userSchema);
