import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Timesheet from '../models/Timesheet.js';
import Expense from '../models/Expense.js';
import Training from '../models/Training.js';
import PerformanceReview from '../models/PerformanceReview.js';
import Project from '../models/Project.js';
import Incident from '../models/Incident.js';

const router = express.Router();

router.use(protect);
router.use(authorize('manager', 'admin'));

// @GET /api/manager/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const department = req.user.department;
    
    const teamQuery = department ? { role: 'employee', department } : { _id: null };
    const employees = await User.find(teamQuery).select('_id');
    const empIds = employees.map(e => e._id);

    const [teamCount, pendingTasks, pendingLeaves, pendingExpenses, trainingCompliance, recentTasks] = await Promise.all([
      User.countDocuments(teamQuery),
      Task.countDocuments({ assignedBy: req.user._id, status: { $ne: 'Completed' } }),
      LeaveRequest.countDocuments({ status: 'Pending' }),
      Expense.countDocuments({ employee: { $in: empIds }, status: 'Pending' }),
      Training.countDocuments({ assignedTo: { $in: empIds } }),
      Task.find({ assignedBy: req.user._id }).sort({ createdAt: -1 }).limit(5).populate('assignedTo', 'name email avatar')
    ]);

    // Skill Compliance dynamic calculation
    const allTrainings = await Training.find();
    const complianceStats = allTrainings.map(t => {
      const deptCompletions = t.completions.filter(c => empIds.some(id => id.toString() === c.employee.toString()));
      const completed = deptCompletions.filter(c => c.status === 'Completed').length;
      const total = deptCompletions.length;
      return {
        label: t.title,
        val: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    }).slice(0, 3); // Top 3 for the widget

    // Default values if no training data
    const finalCompliance = complianceStats.length > 0 ? complianceStats : [
      { label: 'Safety Protocols', val: 92 },
      { label: 'ERP Proficiency', val: 65 },
      { label: 'QC Standards', val: 40 },
    ];

    res.json({
      success: true,
      data: {
        teamCount,
        pendingTasks,
        pendingLeaves,
        pendingExpenses,
        trainingCompliance,
        recentTasks,
        skillCompliance: finalCompliance
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/manager/employees
router.get('/employees', async (req, res) => {
  try {
    const department = req.user.department;
    
    // If manager has no department, they see NO employees (strict security)
    if (!department) {
      return res.json({ success: true, data: [] });
    }

    const query = { role: 'employee', department };
    
    const employees = await User.find(query).select('-password -resetOTP -resetOTPExpire');
    res.json({ success: true, data: employees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/manager/tasks
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find({ assignedBy: req.user._id }).populate('assignedTo', 'name email avatar');
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/manager/tasks
router.post('/tasks', async (req, res) => {
  try {
    const { title, description, assignedTo, dueDate, taskType, priority } = req.body;
    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      dueDate,
      taskType,
      priority
    });
    
    const populatedTask = await Task.findById(task._id).populate('assignedTo', 'name email avatar');
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) io.emit('task_assigned', populatedTask);

    res.status(201).json({ success: true, data: populatedTask });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/manager/tasks/:id/status
router.put('/tasks/:id/status', async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const updateData = { status, remarks };
    if (status === 'Completed') updateData.completedAt = new Date();
    
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, assignedBy: req.user._id },
      updateData,
      { new: true }
    ).populate('assignedTo', 'name email avatar');
    
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) io.emit('task_updated', task);

    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/manager/leaves
router.get('/leaves', async (req, res) => {
  try {
    const leaves = await LeaveRequest.find().populate('employee', 'name email department').sort({ createdAt: -1 });
    
    // Filter leaves so manager only sees leaves from their department employees
    const departmentLeaves = req.user.department 
      ? leaves.filter(l => l.employee && l.employee.department === req.user.department)
      : leaves;
      
    res.json({ success: true, data: departmentLeaves });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/manager/leaves/:id/status
router.put('/leaves/:id/status', async (req, res) => {
  try {
    const { status, reviewNote } = req.body;
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });

    leave.status = status;
    leave.reviewNote = reviewNote;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    await leave.save();
    
    const updatedLeave = await LeaveRequest.findById(leave._id).populate('employee', 'name email department');
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) io.emit('leave_reviewed', updatedLeave);

    res.json({ success: true, data: updatedLeave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── TIMESHEET APPROVALS ────────────────────────────────────────────────────
router.get('/timesheets', async (req, res) => {
  try {
    const department = req.user.department;
    if (!department) return res.json({ success: true, data: [] });

    // Find all employees in manager's department
    const employees = await User.find({ department, role: 'employee' }).select('_id');
    const empIds = employees.map(e => e._id);

    const timesheets = await Timesheet.find({ employee: { $in: empIds } })
      .populate('employee', 'name email employeeId')
      .sort({ date: -1 });
    
    res.json({ success: true, data: timesheets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── EXPENSE APPROVALS ───────────────────────────────────────────────────
router.get('/expenses', async (req, res) => {
  try {
    const department = req.user.department;
    if (!department) return res.json({ success: true, data: [] });

    const employees = await User.find({ department, role: 'employee' }).select('_id');
    const empIds = employees.map(e => e._id);

    const expenses = await Expense.find({ employee: { $in: empIds } })
      .populate('employee', 'name email employeeId')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/expenses/:id/status', async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    expense.status = status;
    expense.managerRemarks = remarks;
    expense.approvedBy = req.user._id;
    await expense.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) io.emit('expense_reviewed', expense);

    res.json({ success: true, data: expense, message: `Expense ${status}` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── TRAINING & PERFORMANCE ──────────────────────────────────────────────
router.get('/training-status', async (req, res) => {
  try {
    const department = req.user.department;
    if (!department) return res.json({ success: true, data: [] });

    const trainings = await Training.find().populate('assignedTo completions.employee', 'name email department');
    // Filter training completions to only show people in manager department
    const filteredTrainings = trainings.map(t => ({
      ...t.toObject(),
      completions: t.completions.filter(c => c.employee && c.employee.department === department)
    }));
    
    res.json({ success: true, data: filteredTrainings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/performance-reviews', async (req, res) => {
  try {
    const review = await PerformanceReview.create({
      ...req.body,
      reviewer: req.user._id,
      status: 'Submitted'
    });
    
    // Update user stats
    const updatedUser = await User.findByIdAndUpdate(req.body.employee, {
      'performance.score': req.body.overallScore,
      'performance.lastReviewed': new Date()
    }, { new: true });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) io.emit('performance_updated', { review, employee: updatedUser });

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── CLIENTS FOR PROJECTS ──────────────────────────────────────────────
router.get('/clients', async (req, res) => {
  try {
    const clients = await User.find({ role: 'client', isActive: true }).select('name company');
    res.json({ success: true, data: clients });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PROJECTS & REALTIME UPDATE ──────────────────────────────────────────
router.get('/projects', async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('client', 'name company')
      .populate('team', 'name avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/projects', async (req, res) => {
  try {
    const project = await Project.create(req.body);
    const populated = await Project.findById(project._id)
      .populate('client', 'name company')
      .populate('team', 'name avatar');

    // Emit live update to all sockets
    const io = req.app.get('io');
    if (io) {
      io.emit('project_created', populated);
    }

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/projects/:id/progress', async (req, res) => {
  try {
    const { progressPercentage, status } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { progressPercentage, status },
      { new: true }
    )
      .populate('client', 'name company')
      .populate('team', 'name avatar');
      
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const io = req.app.get('io');
    if (io) io.emit('project_updated', project);

    res.json({ success: true, data: project });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── INCIDENT / ISSUE TRACKER ────────────────────────────────────────────────
router.get('/incidents', async (req, res) => {
  try {
    const { status, type, priority } = req.query;
    const filter = {};
    if (req.user.department) filter.department = req.user.department;
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
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

    // Emit real-time update
    const io = req.app.get('io');
    if (io) io.emit('incident_resolved', incident);

    res.json({ success: true, data: incident });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;

