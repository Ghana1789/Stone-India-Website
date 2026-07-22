import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Task from './models/Task.js';
import LeaveRequest from './models/LeaveRequest.js';
import PerformanceReview from './models/PerformanceReview.js';
import Timesheet from './models/Timesheet.js';
import Expense from './models/Expense.js';
import Incident from './models/Incident.js';
import Training from './models/Training.js';

dotenv.config();

const seedOriginalData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/stone-india';
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // 1. Get/Configure the original manager (amit@stoneindia.com)
    console.log('🔄 Configuring original manager (amit@stoneindia.com)...');
    let manager = await User.findOne({ email: 'amit@stoneindia.com' });
    if (!manager) {
      console.log('❌ Manager amit@stoneindia.com not found. Please run seed.js first.');
      process.exit(1);
    }
    
    manager.role = 'manager';
    manager.department = 'Production';
    manager.designation = 'Production Lead & Manager';
    manager.isActive = true;
    await manager.save();
    console.log('✅ amit@stoneindia.com is now manager of the Production department');

    // 2. Get/Configure the original employee (employee@stoneindia.com - Priya Sharma)
    console.log('🔄 Configuring original employee (employee@stoneindia.com)...');
    let employee = await User.findOne({ email: 'employee@stoneindia.com' });
    if (!employee) {
      console.log('❌ Employee employee@stoneindia.com not found. Please run seed.js first.');
      process.exit(1);
    }

    employee.department = 'Production';
    employee.designation = 'Senior Assembly Specialist';
    employee.performance = { score: 90, rating: 'Excellent', lastReviewed: new Date() };
    await employee.save();
    console.log('✅ employee@stoneindia.com (Priya Sharma) department set to Production');

    // 3. Clear demo mock users if any to keep database clean and strictly "original"
    console.log('🔄 Cleaning mock/demo employees to maintain pure original data...');
    await User.deleteMany({ email: { $in: ['rahul@stoneindia.com', 'sunita@stoneindia.com', 'vikram@stoneindia.com', 'manager@stoneindia.com'] } });

    // 4. Seed Tasks for the original employee
    console.log('🔄 Seeding Tasks for original employee...');
    await Task.deleteMany({ assignedBy: manager._id });
    const tasks = await Task.create([
      {
        title: 'Production Line #1 Cell Assembly',
        description: 'Assemble LFP battery cells for StonePack 48V 30Ah batch SI-LFP-48-30-2W-B1. Verify and check cell sorting.',
        taskType: 'Production',
        assignedTo: [employee._id],
        assignedBy: manager._id,
        status: 'InProgress',
        priority: 'High',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
        progress: 75,
        checklist: [
          { item: 'Prepare battery cells sorting matrix', done: true },
          { item: 'Calibrate laser welding machine', done: true },
          { item: 'Perform serial voltage check', done: false }
        ]
      },
      {
        title: 'Battery Pack Calibration & QC Logs',
        description: 'Conduct thermal runaway and safety testing logs on completed battery packs under stress parameters.',
        taskType: 'QC',
        assignedTo: [employee._id],
        assignedBy: manager._id,
        status: 'Assigned',
        priority: 'Critical',
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
        progress: 0,
        checklist: [
          { item: 'Setup test chambers to 45°C', done: false },
          { item: 'Verify BMS emergency disconnect threshold', done: false }
        ]
      },
      {
        title: 'Daily Equipment Maintenance Log',
        description: 'Log and complete maintenance tasks for Bay 3 welding apparatus and verify hydraulic fluid levels.',
        taskType: 'Maintenance',
        assignedTo: [employee._id],
        assignedBy: manager._id,
        status: 'Completed',
        priority: 'Low',
        dueDate: new Date(),
        completedAt: new Date(),
        progress: 100,
        checklist: [
          { item: 'Hydraulic level check', done: true },
          { item: 'Filter inspection and replacement', done: true }
        ]
      }
    ]);
    console.log('✅ Tasks seeded');

    // 5. Seed Leave Requests for original employee
    console.log('🔄 Seeding Leave Requests...');
    await LeaveRequest.deleteMany({ employee: employee._id });
    await LeaveRequest.create([
      {
        employee: employee._id,
        leaveType: 'Casual Leave',
        fromDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        toDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        reason: 'Attending cousin\'s wedding ceremony in home town.',
        status: 'Pending'
      },
      {
        employee: employee._id,
        leaveType: 'Sick Leave',
        fromDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        toDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        reason: 'Suffering from seasonal influenza and high fever.',
        status: 'Approved',
        reviewedBy: manager._id,
        reviewNote: 'Approved. Rest well and resume after complete recovery.',
        reviewedAt: new Date()
      }
    ]);
    console.log('✅ Leave Requests seeded');

    // 6. Seed Performance Reviews
    console.log('🔄 Seeding Performance Reviews...');
    await PerformanceReview.deleteMany({ employee: employee._id });
    await PerformanceReview.create([
      {
        employee: employee._id,
        reviewer: manager._id,
        reviewPeriod: 'Q3 2026',
        ratings: {
          workQuality: 5,
          productivity: 4,
          communication: 4,
          teamwork: 5,
          reliability: 5
        },
        overallScore: 90,
        strengths: ['Highly collaborative', 'Excellent safety standard compliance', 'High precision work'],
        goals: ['Improve machine calibration speed', 'Acquire active cell thermal testing certification'],
        managerComments: 'Priya is an exceptional asset to the Production department. Her attention to detail is outstanding.',
        status: 'Submitted'
      }
    ]);
    console.log('✅ Performance Reviews seeded');

    // 7. Seed Incidents
    console.log('🔄 Seeding/Updating Incidents for Production...');
    await Incident.deleteMany({ department: 'Production' });
    await Incident.create([
      {
        title: 'Mixer Unit M-3 Overheating',
        type: 'Machine Failure',
        description: 'Temperature sensors reading above safe threshold on Mixer M-3. Cooling system may be blocked.',
        department: 'Production',
        reportedBy: employee._id,
        status: 'Open',
        priority: 'Critical',
        affectedMachine: 'Mixer M-3',
        location: 'Line 2, Bay 3'
      },
      {
        title: 'Calibration drift on line 4 Coater',
        type: 'Process Delay',
        description: 'Friction roller slip observed on anode coating station 2, causing minor delay in roll speed.',
        department: 'Production',
        reportedBy: employee._id,
        status: 'Investigating',
        priority: 'Medium',
        location: 'Coating Bay 2',
        affectedMachine: 'Coater Roller C-2'
      }
    ]);
    console.log('✅ Incidents seeded');

    // 8. Seed Expenses
    console.log('🔄 Seeding Expenses...');
    await Expense.deleteMany({ employee: employee._id });
    await Expense.create([
      {
        employee: employee._id,
        title: 'Safety Boots Replacement',
        amount: 2450,
        category: 'Equipment',
        date: new Date(),
        description: 'Replacement of worn industrial steel-toed boots for workshop floor.',
        status: 'Pending'
      },
      {
        employee: employee._id,
        title: 'Cooling Line Rubber Gasket',
        amount: 850,
        category: 'Maintenance',
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        description: 'Emergency rubber gasket procurements for Mixer M-3.',
        status: 'Approved',
        approvedBy: manager._id,
        managerRemarks: 'Approved as crucial machine spare part.'
      }
    ]);
    console.log('✅ Expenses seeded');

    // 9. Seed Timesheets
    console.log('🔄 Seeding Timesheets...');
    await Timesheet.deleteMany({ employee: employee._id });
    await Timesheet.create([
      {
        employee: employee._id,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        clockIn: new Date(Date.now() - 24 * 60 * 60 * 1000 - 8 * 60 * 60 * 1000),
        clockOut: new Date(Date.now() - 24 * 60 * 60 * 1000),
        totalHours: 8,
        status: 'Present',
        remarks: 'Standard shift logged.'
      },
      {
        employee: employee._id,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        clockIn: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 9 * 60 * 60 * 1000),
        clockOut: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        totalHours: 9,
        status: 'Present',
        remarks: 'Extra calibration support provided.'
      }
    ]);
    console.log('✅ Timesheets seeded');

    // 10. Seeding Training Completions
    console.log('🔄 Seeding Trainings with completions...');
    const safetyTraining = await Training.findOne({ title: 'Safety Protocols' });
    const erpTraining = await Training.findOne({ title: 'ERP Proficiency' });
    const qcTraining = await Training.findOne({ title: 'QC Standards' });

    if (safetyTraining) {
      safetyTraining.assignedTo.push(employee._id);
      safetyTraining.assignedTo = [...new Set(safetyTraining.assignedTo.map(id => id.toString()))].map(id => new mongoose.Types.ObjectId(id));
      safetyTraining.completions.push({ employee: employee._id, status: 'Completed', score: 96, completedAt: new Date() });
      await safetyTraining.save();
    }
    if (erpTraining) {
      erpTraining.assignedTo.push(employee._id);
      erpTraining.assignedTo = [...new Set(erpTraining.assignedTo.map(id => id.toString()))].map(id => new mongoose.Types.ObjectId(id));
      erpTraining.completions.push({ employee: employee._id, status: 'InProgress' });
      await erpTraining.save();
    }
    if (qcTraining) {
      qcTraining.assignedTo.push(employee._id);
      qcTraining.assignedTo = [...new Set(qcTraining.assignedTo.map(id => id.toString()))].map(id => new mongoose.Types.ObjectId(id));
      qcTraining.completions.push({ employee: employee._id, status: 'Completed', score: 90, completedAt: new Date() });
      await qcTraining.save();
    }
    console.log('✅ Trainings updated');

    console.log('\n🌟 Original database seed alignment completely finished!');
    console.log('───────────────────────────────────────────────────────');
    console.log('Manager:   amit@stoneindia.com      / Employee@123');
    console.log('Employee:  employee@stoneindia.com  / Employee@123');
    console.log('───────────────────────────────────────────────────────');

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding Failed:', err);
    process.exit(1);
  }
};

seedOriginalData();
