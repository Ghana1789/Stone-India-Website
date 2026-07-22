import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Writable } from 'stream';
import PDFDocument from 'pdfkit';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Battery from '../models/Battery.js';
import Task from '../models/Task.js';
import BatchLog from '../models/BatchLog.js';
import WarrantyClaim from '../models/WarrantyClaim.js';
import LeaveRequest from '../models/LeaveRequest.js';
import AuditLog from '../models/AuditLog.js';
import SystemSetting from '../models/SystemSetting.js';
import BackupRecord from '../models/BackupRecord.js';
import Incident from '../models/Incident.js';
import Invoice from '../models/Invoice.js';
import Project from '../models/Project.js';
import Transaction from '../models/Transaction.js';
import AlertConfig from '../models/AlertConfig.js';
import AlertEvent from '../models/AlertEvent.js';
import ReportSchedule from '../models/ReportSchedule.js';
import SavedReport from '../models/SavedReport.js';
import { protect, authorize, ipAllowlist } from '../middleware/auth.js';
import { mockUsers } from '../mockData.js';
import {
  getAnalyticsOverview,
  getClientAcquisitionData,
  getOrderFulfillmentData,
  getEmployeeProductivityData,
  getRevenueData,
  getInventoryTurnoverData,
  parseDatePreset
} from '../services/analyticsEngine.js';
import { refreshSchedules, registerSchedule, unregisterSchedule } from '../services/reportScheduler.js';

const router = express.Router();
router.use(protect, authorize('admin'), ipAllowlist);

// ─── AUDIT HELPER ───────────────────────────────────────────────────────────
async function logAudit(req, action, entity, description, entityId = null, metadata = {}) {
  try {
    await AuditLog.create({
      action,
      entity,
      entityId,
      description,
      performedBy: {
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      },
      metadata,
      ip: req.ip || req.connection?.remoteAddress || '',
      status: 'success'
    });
  } catch (e) {
    // Non-blocking — don't fail the main request if audit log fails
    console.error('Audit log error:', e.message);
  }
}

const findUserById = async (id) => {
  let user = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    user = await User.findById(id);
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

// ─── DASHBOARD ANALYTICS ────────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalClients,
      totalEmployees,
      totalManagers,
      totalOrders,
      totalBatteries,
      pendingOrders,
      revenueAgg,
      pendingWarranty,
      activeBatches,
      recentUsers,
      recentAudit,
      usersByDept
    ] = await Promise.all([
      User.countDocuments({ role: 'client', isActive: true }),
      User.countDocuments({ role: 'employee', isActive: true }),
      User.countDocuments({ role: 'manager', isActive: true }),
      Order.countDocuments(),
      Battery.countDocuments({ isActive: true }),
      Order.countDocuments({ status: { $in: ['Pending', 'Confirmed', 'Manufacturing', 'QC'] } }),
      Order.aggregate([{ $match: { paymentStatus: 'Paid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      WarrantyClaim.countDocuments({ status: { $in: ['Submitted', 'UnderReview'] } }),
      BatchLog.countDocuments({ status: { $in: ['InProduction', 'QCPending'] } }),
      User.find({ role: 'client', isActive: true }).select('name email company createdAt').sort({ createdAt: -1 }).limit(5),
      AuditLog.find().sort({ createdAt: -1 }).limit(7),
      User.aggregate([
        { $match: { role: { $in: ['employee', 'manager'] }, department: { $ne: null } } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    // Monthly orders for the last 6 months as a proxy for activity
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyOrders = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedMonthly = monthlyOrders.map(m => ({
      month: months[m._id.month - 1],
      orders: m.orders,
      revenue: m.revenue
    }));

    // Role distribution for donut chart
    const roleDistribution = [
      { label: 'Clients', value: totalClients, color: '#3b82f6' },
      { label: 'Employees', value: totalEmployees, color: '#22c55e' },
      { label: 'Managers', value: totalManagers, color: '#f59e0b' },
      { label: 'Admins', value: 1, color: '#ef4444' }
    ];

    // Format recent audit for dashboard activity feed
    const actionColors = {
      CREATE: '#22c55e', UPDATE: '#3b82f6', DELETE: '#ef4444',
      LOGIN: '#a855f7', LOGOUT: '#6b7280', RESET_PASSWORD: '#f59e0b',
      TOGGLE_STATUS: '#14b8a6', BACKUP: '#22c55e', SETTINGS_UPDATE: '#f97316', OTHER: '#6b7280'
    };
    const recentActivity = recentAudit.map(log => ({
      id: log._id,
      text: log.description,
      user: log.performedBy?.name || 'System',
      time: formatTimeAgo(log.createdAt),
      dot: actionColors[log.action] || '#6b7280'
    }));

    // Top clients with order count
    const topClientsWithOrders = await Promise.all(
      recentUsers.map(async (u) => {
        const orderCount = await Order.countDocuments({ client: u._id });
        const totalSpend = await Order.aggregate([
          { $match: { client: u._id, paymentStatus: 'Paid' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        return {
          id: u._id,
          name: u.name,
          initials: u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
          company: u.company || 'Individual',
          orders: orderCount,
          totalSpend: totalSpend[0]?.total || 0,
          status: 'Active',
          statusColor: '#22c55e'
        };
      })
    );

    res.json({
      success: true,
      data: {
        stats: {
          totalClients,
          totalEmployees,
          totalManagers,
          totalOrders,
          totalBatteries,
          pendingOrders,
          activeBatches,
          pendingWarranty,
          totalRevenue: revenueAgg[0]?.total || 0
        },
        monthlyActivity: formattedMonthly,
        roleDistribution,
        departmentDistribution: usersByDept,
        recentActivity,
        topClients: topClientsWithOrders
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── USER MANAGEMENT ────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { role, isActive, search, department, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password -resetOTP -resetOTPExpire')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, data: users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -resetOTP -resetOTPExpire');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    const user = await User.create({ ...req.body, isVerified: true });
    await logAudit(req, 'CREATE', 'User', `Created ${user.role} account for ${user.name} (${user.email})`, user._id, { role: user.role, department: user.department });
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Clean up role-specific fields to avoid MongoDB index issues
    if (updateData.role === 'client') {
      user.employeeId = undefined;
      user.department = undefined;
      user.designation = undefined;
      user.shift = undefined;
    } else {
      user.company = undefined;
      user.gstNumber = undefined;
      user.address = undefined;
      if (!updateData.employeeId || !updateData.employeeId.trim()) {
        user.employeeId = undefined;
      }
    }

    // Update other fields
    Object.assign(user, updateData);

    // If new password is provided, set it to trigger pre-save hashing
    if (password && password.trim().length >= 6) {
      user.password = password;
    }

    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;

    await logAudit(req, 'UPDATE', 'User', `Updated profile for ${user.name} (${user.email})`, user._id, { changes: Object.keys(updateData) });
    res.json({ success: true, data: updatedUser });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }
    await User.findByIdAndDelete(req.params.id);
    await logAudit(req, 'DELETE', 'User', `Deleted ${user.role} account: ${user.name} (${user.email})`, user._id, { role: user.role });
    res.json({ success: true, message: `User ${user.name} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/users/:id/toggle-status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    await logAudit(req, 'TOGGLE_STATUS', 'User', `${user.isActive ? 'Activated' : 'Deactivated'} account for ${user.name} (${user.email})`, user._id);
    res.json({ success: true, data: user, message: `User ${user.isActive ? 'activated' : 'deactivated'}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/users/:id/reset-password', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    // Generate a random temporary password
    const tempPassword = crypto.randomBytes(4).toString('hex').toUpperCase() + '@1';
    user.password = tempPassword;
    await user.save();
    await logAudit(req, 'RESET_PASSWORD', 'User', `Reset password for ${user.name} (${user.email})`, user._id);
    res.json({ success: true, message: 'Password reset successfully.', tempPassword });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── EMPLOYEES (managers + employees) ────────────────────────────────────────
router.get('/employees', async (req, res) => {
  try {
    const { department, role, search, page = 1, limit = 50 } = req.query;
    const filter = { role: { $in: ['employee', 'manager'] } };
    if (department) filter.department = department;
    if (role && ['employee', 'manager'].includes(role)) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } }
      ];
    }
    const total = await User.countDocuments(filter);
    const employees = await User.find(filter)
      .select('-password -resetOTP -resetOTPExpire -notifications -gstNumber -address -company')
      .sort({ role: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, data: employees, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ORDER MANAGEMENT ───────────────────────────────────────────────────────
router.get('/orders', async (req, res) => {
  try {
    const { status, paymentStatus, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (search) filter.$or = [
      { orderId: { $regex: search, $options: 'i' } },
      { invoiceNumber: { $regex: search, $options: 'i' } }
    ];
    const orders = await Order.find(filter)
      .populate('client', 'name email company phone')
      .populate('items.battery', 'name sku')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit));
    const total = await Order.countDocuments(filter);
    res.json({ success: true, data: orders, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status, message } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    order.status = status;
    order.trackingHistory.push({ status, message: message || `Status updated to ${status}`, updatedBy: req.user._id });
    await order.save();
    await logAudit(req, 'UPDATE', 'Order', `Updated order ${order.orderId} status to ${status}`, order._id);
    res.json({ success: true, data: order, message: 'Order status updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── TASK MANAGEMENT ────────────────────────────────────────────────────────
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignedTo', 'name employeeId department')
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/tasks', async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, assignedBy: req.user._id });
    await logAudit(req, 'CREATE', 'Task', `Created task: ${task.title}`, task._id);
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    await logAudit(req, 'DELETE', 'Task', `Deleted task: ${task?.title || req.params.id}`, req.params.id);
    res.json({ success: true, message: 'Task deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── BATCH LOGS ─────────────────────────────────────────────────────────────
router.get('/batches', async (req, res) => {
  try {
    const batches = await BatchLog.find()
      .populate('battery', 'name sku')
      .populate('assignedEmployees', 'name employeeId')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: batches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/batches', async (req, res) => {
  try {
    const batch = await BatchLog.create(req.body);
    res.status(201).json({ success: true, data: batch });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── WARRANTY CLAIMS ────────────────────────────────────────────────────────
router.get('/warranty-claims', async (req, res) => {
  try {
    const claims = await WarrantyClaim.find()
      .populate('client', 'name email company')
      .populate('order', 'orderId')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: claims });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/warranty-claims/:id', async (req, res) => {
  try {
    const claim = await WarrantyClaim.findByIdAndUpdate(
      req.params.id,
      { ...req.body, reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, data: claim });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── LEAVE REQUESTS ─────────────────────────────────────────────────────────
router.get('/leave-requests', async (req, res) => {
  try {
    const leaves = await LeaveRequest.find()
      .populate('employee', 'name employeeId department')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: leaves });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/leave-requests/:id', async (req, res) => {
  try {
    const leave = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      { ...req.body, reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, data: leave });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── INVENTORY OVERVIEW ─────────────────────────────────────────────────────
router.get('/inventory', async (req, res) => {
  try {
    const batteries = await Battery.find().sort({ stock: 1 });
    const lowStock = batteries.filter(b => b.stock < 10);
    res.json({ success: true, data: batteries, lowStock });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/inventory/:id/stock', async (req, res) => {
  try {
    const { stock } = req.body;
    const battery = await Battery.findByIdAndUpdate(req.params.id, { stock }, { new: true });
    res.json({ success: true, data: battery });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── AUDIT LOGS ─────────────────────────────────────────────────────────────
router.get('/audit', async (req, res) => {
  try {
    const { action, entity, userId, search, startDate, endDate, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (entity) filter.entity = entity;
    if (userId) filter['performedBy.userId'] = userId;
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { 'performedBy.name': { $regex: search, $options: 'i' } },
        { 'performedBy.email': { $regex: search, $options: 'i' } }
      ];
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
    }
    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, data: logs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── SYSTEM SETTINGS ─────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = [
  // General
  { key: 'app_name', value: 'Stone India Pvt. Ltd.', category: 'general', label: 'Application Name', type: 'text' },
  { key: 'support_email', value: 'support@stoneindia.com', category: 'general', label: 'Support Email', type: 'email' },
  { key: 'maintenance_mode', value: false, category: 'general', label: 'Maintenance Mode', type: 'boolean', description: 'Put the app in maintenance mode (users will see a maintenance page)' },
  { key: 'max_file_upload_mb', value: 10, category: 'general', label: 'Max File Upload Size (MB)', type: 'number' },
  // Notifications
  { key: 'notify_new_user', value: true, category: 'notifications', label: 'Notify on New User Registration', type: 'boolean' },
  { key: 'notify_new_order', value: true, category: 'notifications', label: 'Notify on New Order', type: 'boolean' },
  { key: 'notify_low_stock', value: true, category: 'notifications', label: 'Notify on Low Stock', type: 'boolean' },
  { key: 'notify_leave_request', value: true, category: 'notifications', label: 'Notify on Leave Request', type: 'boolean' },
  { key: 'notify_warranty_claim', value: true, category: 'notifications', label: 'Notify on Warranty Claim', type: 'boolean' },
  // Security
  { key: 'session_timeout_hours', value: 24, category: 'security', label: 'Session Timeout (hours)', type: 'number' },
  { key: 'max_login_attempts', value: 5, category: 'security', label: 'Max Login Attempts', type: 'number' },
  { key: 'require_strong_password', value: true, category: 'security', label: 'Require Strong Password', type: 'boolean' },
  { key: 'two_factor_auth', value: false, category: 'security', label: 'Two-Factor Authentication', type: 'boolean' },
  // Email
  { key: 'email_host', value: 'smtp.gmail.com', category: 'email', label: 'SMTP Host', type: 'text' },
  { key: 'email_port', value: 587, category: 'email', label: 'SMTP Port', type: 'number' },
  { key: 'email_user', value: 'stoneindiapvtltd@gmail.com', category: 'email', label: 'SMTP Email', type: 'email' },
  { key: 'email_from_name', value: 'Stone India', category: 'email', label: 'Sender Name', type: 'text' },
];

router.get('/settings', async (req, res) => {
  try {
    // Seed defaults if no settings exist
    const count = await SystemSetting.countDocuments();
    if (count === 0) {
      await SystemSetting.insertMany(DEFAULT_SETTINGS);
    }
    const settings = await SystemSetting.find().sort({ category: 1, key: 1 });
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/settings/:key', async (req, res) => {
  try {
    const { value } = req.body;
    const setting = await SystemSetting.findOneAndUpdate(
      { key: req.params.key },
      { value, updatedBy: req.user._id },
      { new: true, upsert: true }
    );
    await logAudit(req, 'SETTINGS_UPDATE', 'Settings', `Updated setting "${req.params.key}" to "${value}"`, null, { key: req.params.key, value });
    res.json({ success: true, data: setting });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const { settings } = req.body; // array of { key, value }
    const results = await Promise.all(
      settings.map(({ key, value }) =>
        SystemSetting.findOneAndUpdate(
          { key },
          { value, updatedBy: req.user._id },
          { new: true, upsert: true }
        )
      )
    );
    await logAudit(req, 'SETTINGS_UPDATE', 'Settings', `Bulk updated ${settings.length} settings`, null, { keys: settings.map(s => s.key) });
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── BACKUP & SECURITY ────────────────────────────────────────────────────────
router.get('/backup', async (req, res) => {
  try {
    const records = await BackupRecord.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Compute aggregate stats
    const totalSize = records.reduce((sum, r) => sum + (r.sizeBytes || 0), 0);
    const successfulBackups = records.filter(r => r.status === 'success').length;
    const lastSuccess = records.find(r => r.status === 'success');

    res.json({
      success: true,
      data: records,
      stats: {
        total: records.length,
        successful: successfulBackups,
        totalSizeBytes: totalSize,
        lastBackupAt: lastSuccess?.completedAt || null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/backup/trigger', async (req, res) => {
  try {
    const backupId = `BKP-${Date.now()}`;
    const filename = `stone_india_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

    // Create running record
    const record = await BackupRecord.create({
      backupId,
      filename,
      status: 'running',
      type: req.body.type || 'manual',
      notes: req.body.notes || '',
      createdBy: req.user._id
    });

    // Perform backup asynchronously
    (async () => {
      try {
        const collections = mongoose.connection.modelNames();
        const backupData = {};
        let totalDocs = 0;
        const collectionMeta = [];

        for (const name of collections) {
          const Model = mongoose.model(name);
          const docs = await Model.find().lean();
          backupData[name] = docs;
          totalDocs += docs.length;
          collectionMeta.push({ name, count: docs.length });
        }

        const jsonStr = JSON.stringify({ 
          backupId, 
          createdAt: new Date(), 
          collections: backupData 
        }, null, 2);
        const sizeBytes = Buffer.byteLength(jsonStr, 'utf8');

        await BackupRecord.findByIdAndUpdate(record._id, {
          status: 'success',
          sizeBytes,
          collections: collectionMeta,
          completedAt: new Date()
        });

        await AuditLog.create({
          action: 'BACKUP',
          entity: 'Backup',
          entityId: record._id,
          description: `Manual backup completed: ${filename} (${(sizeBytes / 1024).toFixed(1)} KB, ${totalDocs} records)`,
          performedBy: { userId: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role },
          status: 'success'
        });
      } catch (e) {
        await BackupRecord.findByIdAndUpdate(record._id, {
          status: 'failed',
          errorMessage: e.message,
          completedAt: new Date()
        });
      }
    })();

    res.status(202).json({ success: true, message: 'Backup started.', data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/backup/:id', async (req, res) => {
  try {
    const record = await BackupRecord.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Backup record not found.' });
    await logAudit(req, 'DELETE', 'Backup', `Deleted backup record: ${record.filename}`, record._id);
    res.json({ success: true, message: 'Backup record deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ADMIN PROFILE ────────────────────────────────────────────────────────────
router.get('/profile', async (req, res) => {
  try {
    const user = await findUserById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const safeUser = typeof user.toObject === 'function' ? user.toObject() : { ...user };
    delete safeUser.password;
    res.json({ success: true, data: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    let user = null;
    if (mongoose.Types.ObjectId.isValid(req.user._id)) {
      user = await User.findByIdAndUpdate(
        req.user._id,
        { name, phone, avatar },
        { new: true, runValidators: true }
      ).select('-password -resetOTP -resetOTPExpire');
    } else {
      user = await findUserById(req.user._id);
      if (user) {
        user.name = name;
        user.phone = phone;
        user.avatar = avatar;
      }
    }
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const safeUser = typeof user.toObject === 'function' ? user.toObject() : { ...user };
    delete safeUser.password;
    await logAudit(req, 'UPDATE', 'User', `Admin updated their own profile`, user._id, { fields: ['name', 'phone', 'avatar'] });
    res.json({ success: true, data: safeUser });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/profile/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await findUserById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    user.password = newPassword;
    if (typeof user.save === 'function') {
      await user.save();
    }
    await logAudit(req, 'UPDATE', 'User', 'Admin changed their own password', user._id);
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── DEPARTMENT OVERVIEW ─────────────────────────────────────────────────────
const ALL_DEPARTMENTS = [
  'Research & Development', 'Procurement', 'Production', 'Quality Control',
  'Maintenance', 'Safety & Environment', 'Engineering', 'Logistics & Supply Chain',
  'Packaging', 'Sales & Marketing', 'Human Resources', 'Finance'
];

router.get('/departments', async (req, res) => {
  try {
    const deptStats = await Promise.all(
      ALL_DEPARTMENTS.map(async (dept) => {
        const [employeeCount, managerCount, openTasks, openIncidents] = await Promise.all([
          User.countDocuments({ department: dept, role: 'employee', isActive: true }),
          User.countDocuments({ department: dept, role: 'manager', isActive: true }),
          Task.countDocuments({ status: { $in: ['Assigned', 'InProgress'] } }),
          Incident.countDocuments({ department: dept, status: { $in: ['Open', 'Investigating'] } })
        ]);
        const head = await User.findOne({ department: dept, role: 'manager' }).select('name designation');
        return {
          name: dept,
          employeeCount,
          managerCount,
          headName: head?.name || 'TBD',
          headDesignation: head?.designation || 'Manager',
          openTasks,
          openIncidents,
          status: openIncidents > 2 ? 'Alert' : employeeCount > 0 ? 'Active' : 'Inactive'
        };
      })
    );
    res.json({ success: true, data: deptStats, departments: ALL_DEPARTMENTS });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ADMIN KPI & PRODUCTION ANALYTICS ────────────────────────────────────────
router.get('/kpis', async (req, res) => {
  try {
    const [totalBatches, qcPassedBatches, qcFailedBatches, activeTasks, completedTasks, totalOrders, recentBatches] = await Promise.all([
      BatchLog.countDocuments(),
      BatchLog.countDocuments({ qcStatus: 'Passed' }),
      BatchLog.countDocuments({ qcStatus: 'Failed' }),
      Task.countDocuments({ status: { $in: ['Assigned', 'InProgress'] } }),
      Task.countDocuments({ status: 'Completed' }),
      Order.countDocuments({ status: { $in: ['Manufacturing', 'QC', 'Packaging'] } }),
      BatchLog.find().sort({ createdAt: -1 }).limit(10).populate('battery', 'name')
    ]);

    const totalQC = qcPassedBatches + qcFailedBatches;
    const defectRate = totalQC > 0 ? ((qcFailedBatches / totalQC) * 100).toFixed(1) : 0;
    const efficiency = completedTasks + activeTasks > 0
      ? ((completedTasks / (completedTasks + activeTasks)) * 100).toFixed(1) : 0;

    // Monthly production last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthly = await BatchLog.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, batches: { $sum: 1 }, units: { $sum: '$quantity' } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } }
    ]);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyProduction = monthly.map(m => ({ month: months[m._id.m - 1], batches: m.batches, units: m.units || 0 }));

    // Department task completion
    const deptPerformance = await Task.aggregate([
      { $group: { _id: '$department', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } } } },
      { $project: { dept: '$_id', total: 1, completed: 1, rate: { $multiply: [{ $divide: ['$completed', { $max: ['$total', 1] }] }, 100] } } },
      { $sort: { rate: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: { totalBatches, qcPassedBatches, qcFailedBatches, defectRate: parseFloat(defectRate), efficiency: parseFloat(efficiency), activeTasks, completedTasks, activeOrders: totalOrders },
        monthlyProduction,
        deptPerformance,
        recentBatches
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ADMIN INCIDENTS ─────────────────────────────────────────────────────────
router.get('/incidents', async (req, res) => {
  try {
    const { status, department, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (type) filter.type = type;
    const incidents = await Incident.find(filter)
      .populate('reportedBy', 'name employeeId department')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: incidents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/incidents/:id/status', async (req, res) => {
  try {
    const { status, resolution } = req.body;
    const update = { status };
    if (resolution) update.resolution = resolution;
    if (status === 'Resolved') { update.resolvedAt = new Date(); update.resolvedBy = req.user._id; }
    const incident = await Incident.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('reportedBy', 'name employeeId department');
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found' });
    await logAudit(req, 'UPDATE', 'Incident', `Updated incident "${incident.title}" status to ${status}`, incident._id);
    res.json({ success: true, data: incident });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── ADMIN BILLING ──────────────────────────────────────────────────────────
router.get('/billing', async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('client', 'name email company')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/billing', async (req, res) => {
  try {
    const { client, projectTitle, lineItems, taxRate, discount, dueDate, notes, amount } = req.body;
    
    const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
    const lastNum = lastInvoice ? parseInt(lastInvoice.invoiceNumber.split('-')[2]) : 0;
    const invoiceNumber = `INV-2026-${String(lastNum + 1).padStart(4, '0')}`;
    
    const invoice = await Invoice.create({
      invoiceNumber,
      client,
      projectTitle,
      lineItems: lineItems || [],
      amount: amount || 0,
      taxRate: taxRate || 18,
      discount: discount || 0,
      dueDate,
      notes,
      createdBy: req.user._id
    });
    
    // Create a corresponding transaction
    await Transaction.create({
      type: 'Invoice',
      direction: 'Incoming',
      amount: invoice.amount,
      status: 'Pending',
      description: `Invoice ${invoiceNumber} for ${projectTitle}`,
      category: 'Invoice Payment',
      user: client,
      invoice: invoice._id,
      processedBy: req.user._id
    });

    const populated = await Invoice.findById(invoice._id).populate('client', 'name email company');
    
    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) io.emit('invoice_created', populated);

    await logAudit(req, 'CREATE', 'Invoice', `Created invoice ${invoiceNumber} for client`, invoice._id);
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('Invoice creation error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

router.patch('/billing/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('client', 'name email company');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    
    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) io.emit('invoice_updated', invoice);

    await logAudit(req, 'UPDATE', 'Invoice', `Updated invoice ${invoice.invoiceNumber}`, invoice._id);
    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/billing/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    
    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) io.emit('invoice_deleted', req.params.id);

    await logAudit(req, 'DELETE', 'Invoice', `Deleted invoice ${invoice.invoiceNumber}`, invoice._id);
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ANALYTICS OVERVIEW ─────────────────────────────────────────────────────
router.get('/analytics/overview', async (req, res) => {
  try {
    const { preset = 'last_30_days', startDate, endDate } = req.query;
    const data = await getAnalyticsOverview(preset, startDate, endDate);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── CLIENT ACQUISITION ───────────────────────────────────────────────────────
router.get('/analytics/client-acquisition', async (req, res) => {
  try {
    const { preset = 'last_90_days', startDate, endDate } = req.query;
    const data = await getClientAcquisitionData(preset, startDate, endDate);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ORDER FULFILLMENT ────────────────────────────────────────────────────────
router.get('/analytics/order-fulfillment', async (req, res) => {
  try {
    const { preset = 'last_90_days', startDate, endDate } = req.query;
    const data = await getOrderFulfillmentData(preset, startDate, endDate);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── EMPLOYEE PRODUCTIVITY ────────────────────────────────────────────────────
router.get('/analytics/employee-productivity', async (req, res) => {
  try {
    const { preset = 'last_30_days', startDate, endDate } = req.query;
    const data = await getEmployeeProductivityData(preset, startDate, endDate);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── REVENUE ANALYTICS ────────────────────────────────────────────────────────
router.get('/analytics/revenue', async (req, res) => {
  try {
    const { preset = 'this_year', startDate, endDate } = req.query;
    const data = await getRevenueData(preset, startDate, endDate);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── INVENTORY TURNOVER ────────────────────────────────────────────────────────
router.get('/analytics/inventory-turnover', async (req, res) => {
  try {
    const { preset = 'last_90_days', startDate, endDate } = req.query;
    const data = await getInventoryTurnoverData(preset, startDate, endDate);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── CSV EXPORT ───────────────────────────────────────────────────────────────
router.post('/analytics/export/csv', async (req, res) => {
  try {
    const { reportType = 'overview', preset = 'last_30_days', startDate, endDate } = req.body;
    let rows = [], filename = 'report.csv';

    if (reportType === 'client_acquisition') {
      const d = await getClientAcquisitionData(preset, startDate, endDate);
      rows = d.series.map(r => ({ Period: r.label, 'New Clients': r.newClients }));
      filename = 'client_acquisition.csv';
    } else if (reportType === 'order_fulfillment') {
      const d = await getOrderFulfillmentData(preset, startDate, endDate);
      rows = d.series.map(r => ({
        Period: r.label, 'Total Orders': r.totalOrders,
        Delivered: r.delivered, 'Fulfillment Rate (%)': r.fulfillmentRate, 'Revenue (₹)': r.revenue
      }));
      filename = 'order_fulfillment.csv';
    } else if (reportType === 'employee_productivity') {
      const d = await getEmployeeProductivityData(preset, startDate, endDate);
      rows = d.topPerformers.map(e => ({
        Employee: e.name, 'Employee ID': e.employeeId || '—',
        Department: e.department || '—', 'Tasks Completed': e.tasksCompleted
      }));
      filename = 'employee_productivity.csv';
    } else if (reportType === 'revenue') {
      const d = await getRevenueData(preset, startDate, endDate);
      rows = d.series.map(r => ({
        Period: r.label, 'Revenue (₹)': r.revenue, Orders: r.orders, 'Avg Order Value (₹)': r.avgOrderValue
      }));
      filename = 'revenue_analytics.csv';
    } else if (reportType === 'inventory_turnover') {
      const d = await getInventoryTurnoverData(preset, startDate, endDate);
      rows = d.series.map(r => ({
        Period: r.label, 'Batches Started': r.batchesStarted, 'Units Produced': r.unitsProd, 'QC Passed': r.qcPassed
      }));
      filename = 'inventory_turnover.csv';
    } else {
      // overview
      const d = await getAnalyticsOverview(preset, startDate, endDate);
      rows = [
        { Metric: 'Total Revenue (₹)', Value: d.totalRevenue },
        { Metric: 'Order Count', Value: d.orderCount },
        { Metric: 'Fulfilled Orders', Value: d.fulfilledOrders },
        { Metric: 'Fulfillment Rate (%)', Value: d.fulfillmentRate },
        { Metric: 'Avg Processing Days', Value: d.avgProcessingDays },
        { Metric: 'New Clients', Value: d.newClients },
        { Metric: 'Active Clients', Value: d.activeClients },
        { Metric: 'Tasks Completed', Value: d.tasksCompleted },
        { Metric: 'Tasks Pending', Value: d.tasksPending },
        { Metric: 'Pending Orders', Value: d.pendingOrders },
        { Metric: 'Warranty Claims', Value: d.warrantyClaims }
      ];
      filename = 'analytics_overview.csv';
    }

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'No data for selected filters.' });
    }

    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(','),
      ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csvLines); // BOM for Excel compatibility
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PDF EXPORT ───────────────────────────────────────────────────────────────
router.post('/analytics/export/pdf', async (req, res) => {
  try {
    const { reportType = 'overview', preset = 'last_30_days', startDate, endDate, title } = req.body;

    let rows = [], reportTitle = title || 'Analytics Report', summaryLines = [];

    if (reportType === 'revenue') {
      const d = await getRevenueData(preset, startDate, endDate);
      rows = d.series.map(r => [r.label, `₹${r.revenue.toLocaleString('en-IN')}`, r.orders, `₹${r.avgOrderValue.toLocaleString('en-IN')}`]);
      reportTitle = reportTitle || 'Revenue Analytics Report';
      summaryLines = [
        `Total Revenue: ₹${d.totalRevenue.toLocaleString('en-IN')}`,
        `Growth vs Prior Period: ${d.revenueGrowthPct !== null ? d.revenueGrowthPct + '%' : 'N/A'}`
      ];
    } else if (reportType === 'order_fulfillment') {
      const d = await getOrderFulfillmentData(preset, startDate, endDate);
      rows = d.series.map(r => [r.label, r.totalOrders, r.delivered, `${r.fulfillmentRate}%`]);
      reportTitle = 'Order Fulfillment Report';
      summaryLines = [`Total Orders: ${d.series.reduce((s, r) => s + r.totalOrders, 0)}`];
    } else if (reportType === 'employee_productivity') {
      const d = await getEmployeeProductivityData(preset, startDate, endDate);
      rows = d.topPerformers.map(e => [e.name, e.employeeId || '—', e.department || '—', e.tasksCompleted]);
      reportTitle = 'Employee Productivity Report';
      summaryLines = [`Productivity Index: ${d.productivityIndex}%`, `Total Completed: ${d.totalCompleted}`];
    } else {
      const d = await getAnalyticsOverview(preset, startDate, endDate);
      rows = [
        ['Total Revenue', `₹${d.totalRevenue.toLocaleString('en-IN')}`],
        ['Orders', d.orderCount], ['Fulfillment Rate', `${d.fulfillmentRate}%`],
        ['New Clients', d.newClients], ['Active Clients', d.activeClients],
        ['Tasks Completed', d.tasksCompleted], ['Pending Orders', d.pendingOrders]
      ];
      reportTitle = 'Analytics Overview Report';
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}_report.pdf"`);
    doc.pipe(res);

    // Header
    doc.rect(0, 0, doc.page.width, 90).fill('#0f172a');
    doc.fontSize(22).fillColor('#60a5fa').text('Stone India EV', 50, 25, { align: 'left' });
    doc.fontSize(11).fillColor('#94a3b8').text(reportTitle, 50, 53);
    doc.fontSize(9).fillColor('#64748b').text(`Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`, 50, 68);
    doc.moveDown(3);

    // Summary block
    if (summaryLines.length) {
      doc.rect(50, doc.y, doc.page.width - 100, summaryLines.length * 18 + 20).fill('#1e293b').stroke('#334155');
      const sy = doc.y + 10;
      summaryLines.forEach((line, i) => {
        doc.fontSize(10).fillColor('#e2e8f0').text(line, 60, sy + i * 18);
      });
      doc.moveDown(summaryLines.length + 1);
    }

    // Table
    if (rows.length) {
      const headers = rows[0].map ? null : null; // dynamic
      const colWidth = (doc.page.width - 100) / (rows[0].length || 1);
      const startX = 50;
      let y = doc.y + 10;

      // Header row
      doc.rect(startX, y, doc.page.width - 100, 24).fill('#1e40af');
      const colLabels = rows[0].length === 2 ? ['Metric', 'Value'] :
        rows[0].length === 4 ? ['Period', 'Value 1', 'Value 2', 'Value 3'] : ['Col 1', 'Col 2', 'Col 3', 'Col 4'];
      colLabels.forEach((lbl, i) => {
        doc.fontSize(9).fillColor('#fff').text(lbl, startX + i * colWidth + 6, y + 7, { width: colWidth - 6 });
      });
      y += 24;

      // Data rows
      rows.forEach((row, ri) => {
        const bg = ri % 2 === 0 ? '#0f172a' : '#1e293b';
        doc.rect(startX, y, doc.page.width - 100, 20).fill(bg);
        row.forEach((cell, ci) => {
          doc.fontSize(8).fillColor('#cbd5e1').text(String(cell ?? ''), startX + ci * colWidth + 6, y + 6, { width: colWidth - 8 });
        });
        y += 20;
        if (y > doc.page.height - 60) { doc.addPage(); y = 50; }
      });
    }

    // Footer
    doc.fontSize(8).fillColor('#475569')
      .text('Confidential — Stone India EV Analytics Platform', 50, doc.page.height - 40, { align: 'center' });

    doc.end();
    await logAudit(req, 'OTHER', 'Report', `Exported ${reportType} report as PDF`);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
  }
});

// ─── AD-HOC REPORT BUILDER ────────────────────────────────────────────────────
const REPORT_TEMPLATES = [
  { id: 'client_acquisition', name: 'Client Acquisition', description: 'New client signups over time', metrics: ['newClients', 'activeClients'], defaultPreset: 'last_90_days' },
  { id: 'order_fulfillment', name: 'Order Fulfillment', description: 'Order volume, delivery rates, and revenue', metrics: ['orderCount', 'fulfillmentRate', 'revenue'], defaultPreset: 'last_90_days' },
  { id: 'employee_productivity', name: 'Employee Productivity', description: 'Task completion rates by employee/department', metrics: ['tasksCompleted', 'productivityIndex'], defaultPreset: 'last_30_days' },
  { id: 'revenue_summary', name: 'Revenue Summary', description: 'Revenue trends, growth, and top clients', metrics: ['totalRevenue', 'revenueGrowthPct', 'avgOrderValue'], defaultPreset: 'this_year' },
  { id: 'inventory_turnover', name: 'Inventory Turnover', description: 'Stock movement, batch production, and slow-movers', metrics: ['batchCount', 'inventoryValue', 'turnoverRate'], defaultPreset: 'last_90_days' },
  { id: 'full_business_summary', name: 'Full Business Summary', description: 'Comprehensive cross-domain business overview', metrics: ['totalRevenue', 'orderCount', 'newClients', 'tasksCompleted'], defaultPreset: 'last_30_days' }
];

router.get('/reports/templates', (req, res) => {
  res.json({ success: true, data: REPORT_TEMPLATES });
});

router.post('/reports/run', async (req, res) => {
  try {
    const { templateId, preset = 'last_30_days', startDate, endDate } = req.body;
    if (!templateId) return res.status(400).json({ success: false, message: 'templateId is required.' });

    let data;
    switch (templateId) {
      case 'client_acquisition': data = await getClientAcquisitionData(preset, startDate, endDate); break;
      case 'order_fulfillment': data = await getOrderFulfillmentData(preset, startDate, endDate); break;
      case 'employee_productivity': data = await getEmployeeProductivityData(preset, startDate, endDate); break;
      case 'revenue_summary': data = await getRevenueData(preset, startDate, endDate); break;
      case 'inventory_turnover': data = await getInventoryTurnoverData(preset, startDate, endDate); break;
      case 'full_business_summary': data = await getAnalyticsOverview(preset, startDate, endDate); break;
      default: return res.status(400).json({ success: false, message: `Unknown template: ${templateId}` });
    }

    res.json({ success: true, templateId, preset, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── SAVED REPORTS ────────────────────────────────────────────────────────────
router.get('/reports/saved', async (req, res) => {
  try {
    const reports = await SavedReport.find({ createdBy: req.user._id }).sort({ updatedAt: -1 });
    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/reports/saved', async (req, res) => {
  try {
    const report = await SavedReport.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: report });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/reports/saved/:id', async (req, res) => {
  try {
    await SavedReport.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    res.json({ success: true, message: 'Saved report deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── SCHEDULED REPORTS ────────────────────────────────────────────────────────
router.get('/reports/schedules', async (req, res) => {
  try {
    const schedules = await ReportSchedule.find().sort({ createdAt: -1 });
    res.json({ success: true, data: schedules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/reports/schedules', async (req, res) => {
  try {
    const FREQ_TO_CRON = { daily: '0 7 * * *', weekly: '0 7 * * 1', monthly: '0 7 1 * *' };
    const cronExpression = FREQ_TO_CRON[req.body.frequency] || '0 7 * * *';
    const schedule = await ReportSchedule.create({ ...req.body, cronExpression, createdBy: req.user._id });
    registerSchedule(schedule.toObject());
    res.status(201).json({ success: true, data: schedule });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/reports/schedules/:id', async (req, res) => {
  try {
    const schedule = await ReportSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found.' });
    unregisterSchedule(schedule._id);
    if (schedule.isActive) registerSchedule(schedule.toObject());
    res.json({ success: true, data: schedule });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/reports/schedules/:id', async (req, res) => {
  try {
    const schedule = await ReportSchedule.findByIdAndDelete(req.params.id);
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found.' });
    unregisterSchedule(schedule._id);
    res.json({ success: true, message: 'Schedule deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ALERT CONFIGURATIONS ─────────────────────────────────────────────────────
router.get('/alerts/config', async (req, res) => {
  try {
    const configs = await AlertConfig.find().sort({ createdAt: -1 });
    res.json({ success: true, data: configs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/alerts/config', async (req, res) => {
  try {
    const config = await AlertConfig.create({ ...req.body, createdBy: req.user._id });
    await logAudit(req, 'CREATE', 'AlertConfig', `Created alert rule: ${config.name}`, config._id);
    res.status(201).json({ success: true, data: config });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/alerts/config/:id', async (req, res) => {
  try {
    const config = await AlertConfig.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!config) return res.status(404).json({ success: false, message: 'Alert config not found.' });
    res.json({ success: true, data: config });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/alerts/config/:id', async (req, res) => {
  try {
    const config = await AlertConfig.findByIdAndDelete(req.params.id);
    if (!config) return res.status(404).json({ success: false, message: 'Alert config not found.' });
    await logAudit(req, 'DELETE', 'AlertConfig', `Deleted alert rule: ${config.name}`, config._id);
    res.json({ success: true, message: 'Alert rule deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ALERT EVENTS ─────────────────────────────────────────────────────────────
router.get('/alerts/events', async (req, res) => {
  try {
    const { isResolved, severity, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (isResolved !== undefined) filter.isResolved = isResolved === 'true';
    if (severity) filter.severity = severity;

    const total = await AlertEvent.countDocuments(filter);
    const events = await AlertEvent.find(filter)
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const unresolvedCount = await AlertEvent.countDocuments({ isResolved: false });
    res.json({ success: true, data: events, total, unresolvedCount, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/alerts/events/:id/resolve', async (req, res) => {
  try {
    const event = await AlertEvent.findByIdAndUpdate(
      req.params.id,
      { isResolved: true, resolvedAt: new Date(), resolvedBy: req.user._id },
      { new: true }
    );
    if (!event) return res.status(404).json({ success: false, message: 'Alert event not found.' });

    // Notify via socket
    const io = req.app.get('io');
    if (io) io.emit('admin_alert_resolved', { id: event._id });

    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ADMIN PROJECTS ─────────────────────────────────────────────────────────
router.get('/projects', async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('client', 'name email company')
      .populate('team', 'name avatar role')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── HELPERS ────────────────────────────────────────────────────────────────
function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-IN');
}

export default router;

