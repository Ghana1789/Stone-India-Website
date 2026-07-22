import express from 'express';
import mongoose from 'mongoose';
import { protect, authorize } from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';
import Invoice from '../models/Invoice.js';
import Payslip from '../models/Payslip.js';
import Order from '../models/Order.js';
import Expense from '../models/Expense.js';
import User from '../models/User.js';

const router = express.Router();

// All finance routes require authentication
router.use(protect);

// ─── HELPERS ────────────────────────────────────────────────────────────────
function getMonthName(idx) {
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][idx];
}

// ─── OVERVIEW / SUMMARY ────────────────────────────────────────────────────
router.get('/overview', async (req, res) => {
  try {
    const { role, _id, department } = req.user;
    let filter = {};
    let invoiceFilter = {};
    let payslipFilter = {};

    // Role-based filtering
    if (role === 'client') {
      filter = { user: _id };
      invoiceFilter = { client: _id };
    } else if (role === 'employee') {
      filter = { user: _id };
      payslipFilter = { employee: _id };
    } else if (role === 'manager') {
      // Manager sees department data
      const deptEmployees = await User.find({ department, role: { $in: ['employee'] } }).select('_id');
      const empIds = deptEmployees.map(e => e._id);
      empIds.push(_id);
      filter = { user: { $in: empIds } };
      payslipFilter = { employee: { $in: empIds } };
    }
    // admin: no filter = sees everything

    // Aggregate stats
    const [
      totalRevenue,
      pendingPayments,
      completedTransactions,
      failedTransactions,
      totalInvoices,
      pendingInvoices,
      paidInvoices,
      totalPayslips
    ] = await Promise.all([
      Transaction.aggregate([
        { $match: { ...filter, direction: 'Incoming', status: 'Completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.countDocuments({ ...filter, status: 'Pending' }),
      Transaction.countDocuments({ ...filter, status: 'Completed' }),
      Transaction.countDocuments({ ...filter, status: 'Failed' }),
      Invoice.countDocuments(invoiceFilter),
      Invoice.countDocuments({ ...invoiceFilter, status: 'Pending' }),
      Invoice.countDocuments({ ...invoiceFilter, status: 'Paid' }),
      Payslip.countDocuments(payslipFilter)
    ]);

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyRevenue = await Transaction.aggregate([
      { $match: { ...filter, direction: 'Incoming', status: 'Completed', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const formattedMonthly = monthlyRevenue.map(m => ({
      month: getMonthName(m._id.month - 1),
      revenue: m.total,
      count: m.count
    }));

    // Monthly expenses (last 6 months)
    const monthlyExpenses = await Transaction.aggregate([
      { $match: { ...filter, direction: 'Outgoing', status: 'Completed', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const formattedExpenses = monthlyExpenses.map(m => ({
      month: getMonthName(m._id.month - 1),
      amount: m.total
    }));

    // Category breakdown
    const categoryBreakdown = await Transaction.aggregate([
      { $match: { ...filter, status: 'Completed' } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    // Recent transactions
    const recentTransactions = await Transaction.find(filter)
      .populate('user', 'name email role company')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          totalRevenue: totalRevenue[0]?.total || 0,
          pendingPayments,
          completedTransactions,
          failedTransactions,
          totalInvoices,
          pendingInvoices,
          paidInvoices,
          totalPayslips
        },
        monthlyRevenue: formattedMonthly,
        monthlyExpenses: formattedExpenses,
        categoryBreakdown: categoryBreakdown.map(c => ({
          category: c._id || 'Other',
          total: c.total,
          count: c.count
        })),
        recentTransactions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── TRANSACTIONS LEDGER ────────────────────────────────────────────────────
router.get('/transactions', async (req, res) => {
  try {
    const { role, _id, department } = req.user;
    const { type, status, direction, search, startDate, endDate, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    let filter = {};

    // Role-based filtering
    if (role === 'client' || role === 'employee') {
      filter.user = _id;
    } else if (role === 'manager') {
      const deptEmployees = await User.find({ department, role: 'employee' }).select('_id');
      const empIds = deptEmployees.map(e => e._id);
      empIds.push(_id);
      filter.user = { $in: empIds };
    }

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (direction) filter.direction = direction;
    if (search) {
      filter.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { referenceNumber: { $regex: search, $options: 'i' } }
      ];
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .populate('user', 'name email role company')
      .populate('invoice', 'invoiceNumber')
      .populate('payslip', 'month year')
      .populate('processedBy', 'name')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: transactions,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PAYMENTS ───────────────────────────────────────────────────────────────
router.get('/payments', async (req, res) => {
  try {
    const { role, _id, department } = req.user;
    const { status, direction, page = 1, limit = 20 } = req.query;

    let filter = { type: 'Payment' };

    if (role === 'client' || role === 'employee') {
      filter.user = _id;
    } else if (role === 'manager') {
      const deptEmployees = await User.find({ department, role: 'employee' }).select('_id');
      const empIds = deptEmployees.map(e => e._id);
      empIds.push(_id);
      filter.user = { $in: empIds };
    }

    if (status) filter.status = status;
    if (direction) filter.direction = direction;

    const total = await Transaction.countDocuments(filter);
    const payments = await Transaction.find(filter)
      .populate('user', 'name email role company')
      .populate('invoice', 'invoiceNumber amount')
      .populate('order', 'orderId totalAmount')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: payments, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create payment
router.post('/payments', async (req, res) => {
  try {
    const payment = await Transaction.create({
      ...req.body,
      type: 'Payment',
      user: req.body.user || req.user._id,
      processedBy: req.user._id
    });
    res.status(201).json({ success: true, data: payment, message: 'Payment recorded.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Update payment status (manager/admin only)
router.patch('/payments/:id/status', authorize('manager', 'admin'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const payment = await Transaction.findByIdAndUpdate(
      req.params.id,
      { status, notes, processedBy: req.user._id, processedAt: new Date() },
      { new: true }
    ).populate('user', 'name email');

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
    res.json({ success: true, data: payment, message: `Payment ${status}.` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── INVOICES ───────────────────────────────────────────────────────────────
router.get('/invoices', async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { status, page = 1, limit = 20 } = req.query;

    let filter = {};
    if (role === 'client') filter.client = _id;
    if (status) filter.status = status;

    const total = await Invoice.countDocuments(filter);
    const invoices = await Invoice.find(filter)
      .populate('client', 'name email company')
      .populate('createdBy', 'name')
      .sort({ issueDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: invoices, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create invoice (admin/manager)
router.post('/invoices', authorize('admin', 'manager'), async (req, res) => {
  try {
    const { client, projectTitle, lineItems, taxRate, discount, dueDate, notes } = req.body;

    // Generate invoice number
    const count = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Calculate amount from line items
    let subtotal = 0;
    if (lineItems && lineItems.length > 0) {
      subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    }
    const tax = Math.round(subtotal * ((taxRate || 18) / 100));
    const amount = subtotal + tax - (discount || 0);

    const invoice = await Invoice.create({
      invoiceNumber,
      client,
      projectTitle,
      lineItems: lineItems || [],
      amount,
      subtotal,
      taxRate: taxRate || 18,
      taxAmount: tax,
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

    const populated = await Invoice.findById(invoice._id)
      .populate('client', 'name email company')
      .populate('createdBy', 'name');

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) io.emit('invoice_created', populated);

    res.status(201).json({ success: true, data: populated, message: 'Invoice created.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Update invoice
router.put('/invoices/:id', authorize('admin', 'manager'), async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('client', 'name email company');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) io.emit('invoice_updated', invoice);

    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Pay invoice (client)
router.post('/invoices/:id/pay', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    // Verify client owns this invoice (or admin)
    if (req.user.role === 'client' && invoice.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    invoice.status = 'Paid';
    invoice.paidDate = new Date();
    invoice.paymentId = req.body.paymentId || `PAY-${Date.now()}`;
    invoice.paymentMethod = req.body.paymentMethod || 'Online';
    invoice.amountPaid = invoice.amount;
    await invoice.save();

    // Create completed transaction
    await Transaction.create({
      type: 'Payment',
      direction: 'Incoming',
      amount: invoice.amount,
      status: 'Completed',
      description: `Payment for invoice ${invoice.invoiceNumber}`,
      category: 'Client Payment',
      user: invoice.client,
      invoice: invoice._id,
      paymentMethod: invoice.paymentMethod,
      referenceNumber: invoice.paymentId,
      processedBy: req.user._id,
      processedAt: new Date()
    });

    // Update any pending invoice transaction to completed
    await Transaction.updateMany(
      { invoice: invoice._id, type: 'Invoice', status: 'Pending' },
      { status: 'Completed', processedAt: new Date() }
    );

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) io.emit('invoice_updated', invoice);

    res.json({ success: true, data: invoice, message: 'Payment successful.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PAYSLIPS ───────────────────────────────────────────────────────────────
router.get('/payslips', async (req, res) => {
  try {
    const { role, _id, department } = req.user;
    let filter = {};

    if (role === 'employee') {
      filter.employee = _id;
    } else if (role === 'manager') {
      const deptEmployees = await User.find({ department, role: 'employee' }).select('_id');
      const empIds = deptEmployees.map(e => e._id);
      filter.employee = { $in: empIds };
    }
    // admin: no filter

    const payslips = await Payslip.find(filter)
      .populate('employee', 'name email employeeId department designation')
      .sort({ year: -1, createdAt: -1 });

    res.json({ success: true, data: payslips });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Generate payslip (admin/manager)
router.post('/payslips', authorize('admin', 'manager'), async (req, res) => {
  try {
    const { employee, month, year, earnings, deductions } = req.body;

    const grossSalary = (earnings.basic || 0) + (earnings.hra || 0) + (earnings.allowances || 0) + (earnings.bonus || 0);
    const totalDeductions = (deductions.tax || 0) + (deductions.pf || 0) + (deductions.insurance || 0) + (deductions.other || 0);
    const netSalary = grossSalary - totalDeductions;

    const payslip = await Payslip.create({
      employee,
      month,
      year,
      earnings,
      deductions,
      grossSalary,
      netSalary,
      paymentDate: new Date(),
      status: 'Generated'
    });

    // Create a salary transaction
    await Transaction.create({
      type: 'Salary',
      direction: 'Outgoing',
      amount: netSalary,
      status: 'Completed',
      description: `Salary for ${month} ${year}`,
      category: 'Salary Payout',
      user: employee,
      payslip: payslip._id,
      paymentMethod: 'Bank Transfer',
      processedBy: req.user._id,
      processedAt: new Date()
    });

    const populated = await Payslip.findById(payslip._id)
      .populate('employee', 'name email employeeId department designation');

    res.status(201).json({ success: true, data: populated, message: 'Payslip generated.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Update payslip status (Mark as Paid)
router.patch('/payslips/:id/status', authorize('admin', 'manager'), async (req, res) => {
  try {
    const { status } = req.body;
    const payslip = await Payslip.findByIdAndUpdate(
      req.params.id,
      { status, paymentDate: new Date() },
      { new: true }
    ).populate('employee', 'name email employeeId department designation');

    if (!payslip) return res.status(404).json({ success: false, message: 'Payslip not found.' });

    // Also update the associated Salary transaction to "Completed"
    await Transaction.findOneAndUpdate(
      { payslip: payslip._id, type: 'Salary' },
      { status: 'Completed', processedAt: new Date(), processedBy: req.user._id }
    );

    res.json({ success: true, data: payslip, message: `Payslip marked as ${status}.` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});


// ─── REPORTS & ANALYTICS ────────────────────────────────────────────────────
router.get('/reports', authorize('admin', 'manager'), async (req, res) => {
  try {
    const { period = '6months' } = req.query;
    const { role, department } = req.user;

    let userFilter = {};
    if (role === 'manager') {
      const deptEmployees = await User.find({ department, role: 'employee' }).select('_id');
      const empIds = deptEmployees.map(e => e._id);
      empIds.push(req.user._id);
      userFilter = { user: { $in: empIds } };
    }

    // Date range
    const now = new Date();
    const startDate = new Date();
    if (period === '1month') startDate.setMonth(now.getMonth() - 1);
    else if (period === '3months') startDate.setMonth(now.getMonth() - 3);
    else if (period === '6months') startDate.setMonth(now.getMonth() - 6);
    else if (period === '1year') startDate.setFullYear(now.getFullYear() - 1);
    else startDate.setMonth(now.getMonth() - 6);

    const dateFilter = { createdAt: { $gte: startDate } };

    // Revenue vs Expenses over time
    const revenueOverTime = await Transaction.aggregate([
      { $match: { ...userFilter, ...dateFilter, direction: 'Incoming', status: 'Completed' } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const expensesOverTime = await Transaction.aggregate([
      { $match: { ...userFilter, ...dateFilter, direction: 'Outgoing', status: 'Completed' } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Payment method distribution
    const paymentMethods = await Transaction.aggregate([
      { $match: { ...userFilter, ...dateFilter, status: 'Completed' } },
      { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    // Invoice status summary
    const invoiceStatusFilter = role === 'manager' ? {} : {};
    const invoiceStatuses = await Invoice.aggregate([
      { $match: invoiceStatusFilter },
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]);

    // Top clients by revenue
    const topClients = await Transaction.aggregate([
      { $match: { ...dateFilter, direction: 'Incoming', status: 'Completed', category: 'Client Payment' } },
      { $group: { _id: '$user', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } }
    ]);

    // Salary expenses breakdown
    const salaryBreakdown = await Transaction.aggregate([
      { $match: { ...userFilter, ...dateFilter, type: 'Salary', status: 'Completed' } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        revenueOverTime: revenueOverTime.map(r => ({ month: getMonthName(r._id.month - 1), year: r._id.year, total: r.total })),
        expensesOverTime: expensesOverTime.map(r => ({ month: getMonthName(r._id.month - 1), year: r._id.year, total: r.total })),
        paymentMethods: paymentMethods.map(p => ({ method: p._id || 'Unknown', total: p.total, count: p.count })),
        invoiceStatuses: invoiceStatuses.map(s => ({ status: s._id, count: s.count, total: s.total })),
        topClients: topClients.map(c => ({ name: c.userInfo?.name || 'Unknown', company: c.userInfo?.company || '', total: c.total, count: c.count })),
        salaryBreakdown: salaryBreakdown.map(s => ({ month: getMonthName(s._id.month - 1), year: s._id.year, total: s.total, count: s.count }))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Export data (CSV/JSON)
router.get('/reports/export', authorize('admin', 'manager'), async (req, res) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;

    let filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
    }

    const transactions = await Transaction.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    if (format === 'csv') {
      const header = 'Transaction ID,Type,Direction,Amount,Status,Description,Category,User,Payment Method,Date\n';
      const rows = transactions.map(t =>
        `${t.transactionId},${t.type},${t.direction},${t.amount},${t.status},"${t.description}",${t.category},${t.user?.name || ''},${t.paymentMethod || ''},${new Date(t.createdAt).toISOString()}`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=finance_report_${Date.now()}.csv`);
      return res.send(header + rows);
    }

    res.json({ success: true, data: transactions, total: transactions.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
