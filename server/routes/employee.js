import express from 'express';
import Task from '../models/Task.js';
import BatchLog from '../models/BatchLog.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Timesheet from '../models/Timesheet.js';
import Project from '../models/Project.js';
import Expense from '../models/Expense.js';
import Training from '../models/Training.js';
import Payslip from '../models/Payslip.js';
import PerformanceReview from '../models/PerformanceReview.js';
import Message from '../models/Message.js';
import Incident from '../models/Incident.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect, authorize('employee', 'admin'));

// ─── DASHBOARD ──────────────────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const empId = req.user._id;
    const [myTasks, completedTasks, pendingLeaves, activeBatches] = await Promise.all([
      Task.countDocuments({ assignedTo: empId, status: { $in: ['Assigned', 'InProgress'] } }),
      Task.countDocuments({ assignedTo: empId, status: 'Completed' }),
      LeaveRequest.countDocuments({ employee: empId, status: 'Pending' }),
      BatchLog.countDocuments({ assignedEmployees: empId, status: { $in: ['InProduction', 'QCPending'] } })
    ]);

    const recentTasks = await Task.find({ assignedTo: empId })
      .sort({ createdAt: -1 }).limit(5)
      .populate('relatedBatch', 'batchId');

    // Calculate real performance stats
    // 1. Task Completion Rate
    const allTasks = await Task.countDocuments({ assignedTo: empId });
    const taskCompletionRate = allTasks > 0 ? Math.round((completedTasks / allTasks) * 100) : 0;

    // 2. Attendance Streak (Simplified: Days clocked in during last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const recentTimesheets = await Timesheet.countDocuments({ 
        employee: empId, 
        date: { $gte: fourteenDaysAgo } 
    });

    // Calculate dynamic shift stages
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayTimesheet = await Timesheet.findOne({ employee: empId, date: { $gte: today } });

    const [hasInProduction, hasQCPending] = await Promise.all([
      BatchLog.exists({ 
        assignedEmployees: empId, 
        status: { $in: ['InProduction', 'QCPending', 'QCPassed', 'QCFailed', 'Packed', 'Dispatched'] },
        updatedAt: { $gte: today }
      }),
      BatchLog.exists({ 
        assignedEmployees: empId, 
        status: { $in: ['QCPending', 'QCPassed', 'QCFailed', 'Packed', 'Dispatched'] },
        updatedAt: { $gte: today }
      })
    ]);

    const shiftStages = [
      { label: 'Clock In', done: !!todayTimesheet },
      { label: 'Production', done: !!hasInProduction },
      { label: 'QC Check', done: !!hasQCPending },
      { label: 'Clock Out', done: !!(todayTimesheet && todayTimesheet.clockOut) },
    ];

    res.json({
      success: true,
      data: {
        myTasks,
        completedTasks,
        pendingLeaves,
        activeBatches,
        recentTasks,
        shiftStages, // Added dynamic stages
        performance: {
            taskCompletionRate,
            attendanceStreak: recentTimesheets, // Number of days present in last 14
            attendanceRate: Math.round((recentTimesheets / 14) * 100)
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── MY TASKS ───────────────────────────────────────────────────────────────
router.get('/tasks', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { assignedTo: req.user._id };
    if (status) filter.status = status;
    const tasks = await Task.find(filter)
      .populate('relatedBatch', 'batchId batteryName')
      .populate('assignedBy', 'name')
      .sort({ dueDate: 1, priority: -1 });
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, assignedTo: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const { status, progress, remarks, checklist } = req.body;
    if (status) task.status = status;
    if (progress !== undefined) task.progress = progress;
    if (remarks) task.remarks = remarks;
    if (checklist) task.checklist = checklist;
    if (status === 'InProgress' && !task.startedAt) task.startedAt = new Date();
    if (status === 'Completed') task.completedAt = new Date();

    await task.save();
    
    // Emit real-time update to manager
    const io = req.app.get('io');
    if (io) io.emit('task_updated', task);

    res.json({ success: true, data: task });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── BATCH LOGS ─────────────────────────────────────────────────────────────
router.get('/batches', async (req, res) => {
  try {
    const batches = await BatchLog.find({ assignedEmployees: req.user._id })
      .populate('battery', 'name sku')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: batches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/batches/:id', async (req, res) => {
  try {
    const batch = await BatchLog.findById(req.params.id)
      .populate('battery', 'name sku specs')
      .populate('assignedEmployees', 'name employeeId')
      .populate('qcInspector', 'name');
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });
    res.json({ success: true, data: batch });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/batches/:id/qc', async (req, res) => {
  try {
    const batch = await BatchLog.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });

    const { qcChecklist, qcStatus, notes, defectRate } = req.body;
    if (qcChecklist) batch.qcChecklist = qcChecklist;
    if (qcStatus) batch.qcStatus = qcStatus;
    if (notes) batch.notes = notes;
    if (defectRate !== undefined) batch.defectRate = defectRate;

    batch.qcInspector = req.user._id;
    batch.qcDate = new Date();

    // Calculate QC score
    if (qcChecklist) {
      const checks = Object.values(qcChecklist);
      const passed = checks.filter(c => c.passed).length;
      batch.qcScore = Math.round((passed / checks.length) * 100);
      batch.qcStatus = batch.qcScore >= 80 ? 'Passed' : 'Failed';
      batch.status = batch.qcScore >= 80 ? 'QCPassed' : 'QCFailed';
    }

    await batch.save();
    res.json({ success: true, data: batch, message: 'QC checklist submitted.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/batches/:id/status', async (req, res) => {
  try {
    const batch = await BatchLog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) io.emit('batch_updated', batch);

    res.json({ success: true, data: batch });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Upload test report URL (after Cloudinary upload on frontend)
router.post('/batches/:id/reports', async (req, res) => {
  try {
    const { name, url } = req.body;
    const batch = await BatchLog.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });
    batch.testReports.push({ name, url, uploadedAt: new Date() });
    await batch.save();
    res.json({ success: true, data: batch, message: 'Report uploaded.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── LEAVE REQUESTS ─────────────────────────────────────────────────────────
router.get('/leave-requests', async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ employee: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: leaves });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/leave-requests', async (req, res) => {
  try {
    const leave = await LeaveRequest.create({ ...req.body, employee: req.user._id });
    
    // Emit to manager
    const io = req.app.get('io');
    if (io) io.emit('leave_requested', leave);

    res.status(201).json({ success: true, data: leave, message: 'Leave request submitted.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── TIMESHEET ─────────────────────────────────────────────────────────────
router.get('/timesheets', async (req, res) => {
  try {
    const timesheets = await Timesheet.find({ employee: req.user._id })
      .sort({ date: -1 })
      .limit(31);
    res.json({ success: true, data: timesheets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/timesheets/clock-in', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const existing = await Timesheet.findOne({ employee: req.user._id, clockOut: { $exists: false } });
    if (existing) return res.status(400).json({ success: false, message: 'You have an active clock-in. Please clock out first.' });

    const ts = await Timesheet.create({ employee: req.user._id, clockIn: new Date(), date: today });
    
    // Emit real-time attendance update
    const io = req.app.get('io');
    if (io) io.emit('clock_in_out', { employee: req.user._id, status: 'In', time: new Date() });

    res.status(201).json({ success: true, data: ts });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/timesheets/clock-out', async (req, res) => {
  try {
    const ts = await Timesheet.findOne({ employee: req.user._id, clockOut: { $exists: false } }).sort({ createdAt: -1 });
    if (!ts) return res.status(404).json({ success: false, message: 'No active clock-in found.' });

    ts.clockOut = new Date();
    ts.totalHours = Math.round((ts.clockOut - ts.clockIn) / (1000 * 60 * 60) * 100) / 100;
    await ts.save();

    // Emit real-time attendance update
    const io = req.app.get('io');
    if (io) io.emit('clock_in_out', { employee: req.user._id, status: 'Out', time: new Date() });

    res.json({ success: true, data: ts });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── PROJECTS ──────────────────────────────────────────────────────────────
router.get('/projects', async (req, res) => {
  try {
    const projects = await Project.find({ team: req.user._id }).populate('client', 'name company');
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── EXPENSES ──────────────────────────────────────────────────────────────
router.get('/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find({ employee: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/expenses', async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, employee: req.user._id });

    // Emit to manager
    const io = req.app.get('io');
    if (io) io.emit('expense_submitted', expense);

    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── PAYSLIPS ──────────────────────────────────────────────────────────────
router.get('/payslips', async (req, res) => {
  try {
    const payslips = await Payslip.find({ employee: req.user._id }).sort({ year: -1, month: -1 });
    res.json({ success: true, data: payslips });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── TRAINING ──────────────────────────────────────────────────────────────
router.get('/training', async (req, res) => {
  try {
    const trainings = await Training.find({ assignedTo: req.user._id });
    res.json({ success: true, data: trainings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/training/:id/status', async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) return res.status(404).json({ success: false, message: 'Training module not found.' });
    const completion = training.completions?.find(c => c.employee.toString() === req.user._id.toString()) || { status: 'Not Started' };
    if (completion) {
      completion.status = req.body.status;
      if (req.body.status === 'Completed') completion.completedAt = new Date();
    } else {
      training.completions.push({ employee: req.user._id, status: req.body.status });
    }
    await training.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) io.emit('training_updated', { training, employeeId: req.user._id, status: req.body.status });

    res.json({ success: true, data: training });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── PERFORMANCE ──────────────────────────────────────────────────────────
router.get('/performance', async (req, res) => {
  try {
    const reviews = await PerformanceReview.find({ employee: req.user._id }).populate('reviewer', 'name designation') || [];
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── CHAT ──────────────────────────────────────────────────────────────────
router.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id },
        { recipient: req.user._id },
        { recipient: null }
      ]
    }).populate('sender', 'name avatar role').sort({ createdAt: 1 }).limit(50);
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ISSUE / INCIDENT REPORTING ────────────────────────────────────────────
router.get('/issues', async (req, res) => {
  try {
    const issues = await Incident.find({ reportedBy: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: issues });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/issues', async (req, res) => {
  try {
    const { title, type, description, priority, location, affectedMachine } = req.body;
    const issue = await Incident.create({
      title,
      type,
      description,
      priority: priority || 'Medium',
      location,
      affectedMachine,
      department: req.user.department || 'Production',
      reportedBy: req.user._id,
      status: 'Open'
    });

    // Emit to Manager
    const io = req.app.get('io');
    if (io) io.emit('incident_reported', issue);

    res.status(201).json({ success: true, data: issue, message: 'Issue reported successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
