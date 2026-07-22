import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Task from './models/Task.js';
import LeaveRequest from './models/LeaveRequest.js';
import PerformanceReview from './models/PerformanceReview.js';
import Timesheet from './models/Timesheet.js';
import Expense from './models/Expense.js';
import Incident from './models/Incident.js';
import Training from './models/Training.js';

dotenv.config();

const seedProductionTeam = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/stone-india';
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // 1. Create/Update Manager: manager@stoneindia.com (Rajan Mehta)
    console.log('🔄 Seeding Production Manager...');
    let manager = await User.findOne({ email: 'manager@stoneindia.com' });
    
    // Hash password helper
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Manager@123', salt);
    const hashedEmpPassword = await bcrypt.hash('Employee@123', salt);

    if (!manager) {
      manager = await User.create({
        name: 'Rajan Mehta',
        email: 'manager@stoneindia.com',
        password: 'Manager@123', // Will be hashed by user pre-save hook
        role: 'manager',
        department: 'Production',
        designation: 'Production Manager',
        shift: 'Morning',
        phone: '9800000002',
        employeeId: 'SI-MGR-001',
        isActive: true
      });
      console.log('✅ Created Rajan Mehta as manager');
    } else {
      manager.role = 'manager';
      manager.department = 'Production';
      manager.designation = 'Production Manager';
      manager.isActive = true;
      await manager.save();
      console.log('✅ Updated Rajan Mehta as manager');
    }

    // 2. Clear existing production employees to prevent duplicate email issues and ensure fresh seed
    console.log('🔄 Cleaning old Production employees...');
    const prodEmails = ['rahul@stoneindia.com', 'sunita@stoneindia.com', 'vikram@stoneindia.com'];
    await User.deleteMany({ email: { $in: prodEmails } });

    // 3. Create active employees for the Production department
    console.log('🔄 Seeding Production employees...');
    const employees = await User.create([
      {
        name: 'Rahul Sharma',
        email: 'rahul@stoneindia.com',
        password: 'Employee@123',
        role: 'employee',
        employeeId: 'SI-EMP-101',
        department: 'Production',
        designation: 'Assembly Technician',
        shift: 'Morning',
        phone: '9811111101',
        joiningDate: new Date('2024-01-10'),
        isActive: true,
        performance: { score: 88, rating: 'Excellent', lastReviewed: new Date() }
      },
      {
        name: 'Sunita Rao',
        email: 'sunita@stoneindia.com',
        password: 'Employee@123',
        role: 'employee',
        employeeId: 'SI-EMP-102',
        department: 'Production',
        designation: 'Senior Packer',
        shift: 'Evening',
        phone: '9811111102',
        joiningDate: new Date('2023-09-15'),
        isActive: true,
        performance: { score: 92, rating: 'Excellent', lastReviewed: new Date() }
      },
      {
        name: 'Vikram Singh',
        email: 'vikram@stoneindia.com',
        password: 'Employee@123',
        role: 'employee',
        employeeId: 'SI-EMP-103',
        department: 'Production',
        designation: 'Machine Operator',
        shift: 'Night',
        phone: '9811111103',
        joiningDate: new Date('2024-03-01'),
        isActive: true,
        performance: { score: 76, rating: 'Good', lastReviewed: new Date() }
      }
    ]);
    const empIds = employees.map(e => e._id);
    console.log(`✅ Seeded ${employees.length} employees`);

    // 4. Seed production-related Tasks
    console.log('🔄 Seeding Tasks...');
    // Delete existing tasks created by this manager to keep it clean
    await Task.deleteMany({ assignedBy: manager._id });
    
    await Task.create([
      {
        title: 'Production Line #1 Cell Assembly',
        description: 'Assemble LFP battery cells for StonePack 48V 30Ah batch SI-LFP-48-30-2W-B1. Check cell sorting alignment.',
        taskType: 'Production',
        assignedTo: [employees[0]._id, employees[1]._id],
        assignedBy: manager._id,
        status: 'InProgress',
        priority: 'High',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
        progress: 60,
        checklist: [
          { item: 'Prepare battery cells sorting matrix', done: true },
          { item: 'Calibrate laser welding machine', done: true },
          { item: 'Perform serial voltage check', done: false }
        ]
      },
      {
        title: 'Pack Thermal Testing & Calibration',
        description: 'Conduct thermal runaway and safety testing logs on completed battery grid packs under high stress parameters.',
        taskType: 'Production',
        assignedTo: [employees[2]._id],
        assignedBy: manager._id,
        status: 'Assigned',
        priority: 'Medium',
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
        assignedTo: [employees[0]._id],
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

    // 5. Seed Leave Requests
    console.log('🔄 Seeding Leave Requests...');
    await LeaveRequest.deleteMany({ employee: { $in: empIds } });
    await LeaveRequest.create([
      {
        employee: employees[0]._id,
        leaveType: 'Casual Leave',
        fromDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        toDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        reason: "Attending family function in native town.",
        status: 'Pending'
      },
      {
        employee: employees[1]._id,
        leaveType: 'Sick Leave',
        fromDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        toDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        reason: 'Suffering from heavy fever and cold.',
        status: 'Approved',
        reviewedBy: manager._id,
        reviewNote: 'Approved. Get well soon and resume after complete rest.',
        reviewedAt: new Date()
      }
    ]);
    console.log('✅ Leave Requests seeded');

    // 6. Seed Performance Reviews
    console.log('🔄 Seeding Performance Reviews...');
    await PerformanceReview.deleteMany({ employee: { $in: empIds } });
    await PerformanceReview.create([
      {
        employee: employees[0]._id,
        reviewer: manager._id,
        reviewPeriod: 'Q3 2026',
        ratings: {
          workQuality: 4,
          productivity: 4,
          communication: 4,
          teamwork: 5,
          reliability: 4
        },
        overallScore: 88,
        strengths: ['Strong team player', 'Excellent welding quality compliance'],
        goals: ['Improve calibration cycle speed'],
        managerComments: 'Rahul exhibits strong technical aptitude and high work quality.',
        status: 'Submitted'
      },
      {
        employee: employees[1]._id,
        reviewer: manager._id,
        reviewPeriod: 'Q3 2026',
        ratings: {
          workQuality: 5,
          productivity: 5,
          communication: 4,
          teamwork: 4,
          reliability: 5
        },
        overallScore: 92,
        strengths: ['Flawless packaging and sorting speed', 'Extremely punctual'],
        goals: ['Attain certification on active advanced cell safety modules'],
        managerComments: 'Sunita consistently delivers high output while maintaining stellar quality scores.',
        status: 'Submitted'
      }
    ]);
    console.log('✅ Performance Reviews seeded');

    // 7. Seed Incidents
    console.log('🔄 Seeding Incidents...');
    await Incident.deleteMany({ department: 'Production' });
    await Incident.create([
      {
        title: 'Mixer Unit M-3 Overheating',
        type: 'Machine Failure',
        description: 'Mixer M-3 in Production line showing temperature alerts. Temperature sensors reading above safe threshold. Cooling system may be blocked.',
        department: 'Production',
        reportedBy: employees[0]._id,
        status: 'Open',
        priority: 'Critical',
        location: 'Line 2, Bay 3',
        affectedMachine: 'Mixer M-3'
      },
      {
        title: 'Coating Roller Slip Issue',
        type: 'Process Delay',
        description: 'Friction roller slip observed on anode coating station 2, causing minor delay in roll speed.',
        department: 'Production',
        reportedBy: employees[1]._id,
        status: 'Investigating',
        priority: 'Medium',
        location: 'Coating Bay 2',
        affectedMachine: 'Coater Roller C-2'
      }
    ]);
    console.log('✅ Incidents seeded');

    // 8. Seed Expenses
    console.log('🔄 Seeding Expenses...');
    await Expense.deleteMany({ employee: { $in: empIds } });
    await Expense.create([
      {
        employee: employees[0]._id,
        title: 'Safety Boots Replacement',
        amount: 2450,
        category: 'Equipment',
        date: new Date(),
        description: 'Industrial grade steel-toed boots for workshop operations.',
        status: 'Pending'
      },
      {
        employee: employees[1]._id,
        title: 'Seal Gasket Procurement',
        amount: 850,
        category: 'Maintenance',
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        description: 'Emergency replacement rubber seal rings for Mixer M-3 cooling pipeline.',
        status: 'Approved',
        approvedBy: manager._id,
        managerRemarks: 'Necessary spare part for mixer maintenance.'
      }
    ]);
    console.log('✅ Expenses seeded');

    // 9. Seed Timesheets
    console.log('🔄 Seeding Timesheets...');
    await Timesheet.deleteMany({ employee: { $in: empIds } });
    await Timesheet.create([
      {
        employee: employees[0]._id,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        clockIn: new Date(Date.now() - 24 * 60 * 60 * 1000 - 8 * 60 * 60 * 1000),
        clockOut: new Date(Date.now() - 24 * 60 * 60 * 1000),
        totalHours: 8,
        status: 'Present',
        remarks: 'Morning shift assembly logged.'
      },
      {
        employee: employees[1]._id,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        clockIn: new Date(Date.now() - 24 * 60 * 60 * 1000 - 9 * 60 * 60 * 1000),
        clockOut: new Date(Date.now() - 24 * 60 * 60 * 1000),
        totalHours: 9,
        status: 'Present',
        remarks: 'Extra sorting hours completed for custom batch.'
      }
    ]);
    console.log('✅ Timesheets seeded');

    // 10. Update Trainings for the Production department
    console.log('🔄 Seeding/Updating Trainings with Production completions...');
    const safetyTraining = await Training.findOne({ title: 'Safety Protocols' });
    const erpTraining = await Training.findOne({ title: 'ERP Proficiency' });
    const qcTraining = await Training.findOne({ title: 'QC Standards' });

    if (safetyTraining) {
      safetyTraining.assignedTo.push(...empIds);
      // Remove duplicates
      safetyTraining.assignedTo = [...new Set(safetyTraining.assignedTo.map(id => id.toString()))].map(id => new mongoose.Types.ObjectId(id));
      
      safetyTraining.completions.push(
        { employee: employees[0]._id, status: 'Completed', score: 95, completedAt: new Date() },
        { employee: employees[1]._id, status: 'Completed', score: 92, completedAt: new Date() },
        { employee: employees[2]._id, status: 'InProgress' }
      );
      await safetyTraining.save();
    }

    if (erpTraining) {
      erpTraining.assignedTo.push(...empIds);
      erpTraining.assignedTo = [...new Set(erpTraining.assignedTo.map(id => id.toString()))].map(id => new mongoose.Types.ObjectId(id));
      
      erpTraining.completions.push(
        { employee: employees[0]._id, status: 'Completed', score: 85, completedAt: new Date() },
        { employee: employees[1]._id, status: 'InProgress' },
        { employee: employees[2]._id, status: 'NotStarted' }
      );
      await erpTraining.save();
    }

    if (qcTraining) {
      qcTraining.assignedTo.push(...empIds);
      qcTraining.assignedTo = [...new Set(qcTraining.assignedTo.map(id => id.toString()))].map(id => new mongoose.Types.ObjectId(id));
      
      qcTraining.completions.push(
        { employee: employees[0]._id, status: 'InProgress' },
        { employee: employees[1]._id, status: 'Completed', score: 88, completedAt: new Date() },
        { employee: employees[2]._id, status: 'NotStarted' }
      );
      await qcTraining.save();
    }
    console.log('✅ Trainings updated');

    console.log('\n🌟 Seeding extended dataset successfully completed! Manager and team are ready in MongoDB.');
    console.log('───────────────────────────────────────────────────────');
    console.log('Manager:   manager@stoneindia.com / Manager@123');
    console.log('Employees: rahul@stoneindia.com   / Employee@123');
    console.log('           sunita@stoneindia.com  / Employee@123');
    console.log('           vikram@stoneindia.com  / Employee@123');
    console.log('───────────────────────────────────────────────────────');

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('❌ Extended Seeding Failed:', err);
    process.exit(1);
  }
};

seedProductionTeam();
