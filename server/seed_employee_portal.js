import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Task from './models/Task.js';
import Timesheet from './models/Timesheet.js';
import Project from './models/Project.js';
import LeaveRequest from './models/LeaveRequest.js';
import Payslip from './models/Payslip.js';
import Expense from './models/Expense.js';
import Training from './models/Training.js';
import PerformanceReview from './models/PerformanceReview.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding');

    const employee = await User.findOne({ email: 'ghanasyamk79@gamil.com' });
    if (!employee) {
      console.log('❌ Employee not found. Please create the user first.');
      process.exit(1);
    }
    const admin = await User.findOne({ role: 'admin' });
    const empId = employee._id;

    console.log(`🌱 Seeding data for: ${employee.name} (${employee.email})`);

    // 1. Clear existing data for this employee to reset
    await Promise.all([
      Timesheet.deleteMany({ employee: empId }),
      Project.deleteMany({ team: empId }),
      Payslip.deleteMany({ employee: empId }),
      Expense.deleteMany({ employee: empId }),
      Training.deleteMany({ assignedTo: empId }),
      PerformanceReview.deleteMany({ employee: empId })
    ]);

    // 2. Projects
    const someClient = await User.findOne({ role: 'client' });
    const projects = await Project.create([
      { 
        title: 'Project Zeus', 
        description: 'Advanced Li-ion Grid Storage Solution', 
        progressPercentage: 65, 
        status: 'On track', 
        team: [empId],
        client: someClient?._id || admin._id,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      { 
        title: 'Quantum Cell', 
        description: 'R&D on high-density solid-state batteries', 
        progressPercentage: 30, 
        status: 'In progress', 
        team: [empId],
        client: someClient?._id || admin._id,
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      }
    ]);

    // 3. Timesheets (Last 5 days)
    const timesheetData = [];
    for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0,0,0,0);
        timesheetData.push({
            employee: empId,
            date: date,
            clockIn: new Date(date.getTime() + 9 * 60 * 60 * 1000), // 9 AM
            clockOut: new Date(date.getTime() + 18 * 60 * 60 * 1000), // 6 PM
            totalHours: 9,
            status: 'Present'
        });
    }
    await Timesheet.insertMany(timesheetData);

    // 4. Payslips
    await Payslip.create([
      { 
        employee: empId, month: 'October', year: 2026, 
        earnings: { basic: 50000, hra: 15000, allowances: 5000 },
        deductions: { tax: 5000, pf: 3000 },
        grossSalary: 70000, netSalary: 62000,
        status: 'Paid', paymentDate: new Date()
      },
      { 
        employee: empId, month: 'September', year: 2026, 
        earnings: { basic: 50000, hra: 15000, allowances: 5000 },
        deductions: { tax: 5000, pf: 3000 },
        grossSalary: 70000, netSalary: 62000,
        status: 'Paid', paymentDate: new Date('2026-09-30')
      }
    ]);

    // 5. Expenses
    await Expense.create([
      { employee: empId, title: 'Travel to Manesar Plant', amount: 1500, category: 'Travel', status: 'Approved' },
      { employee: empId, title: 'Safety Equipment Recharge', amount: 800, category: 'Equipment', status: 'Pending' }
    ]);

    // 6. Training
    await Training.create([
      { 
        title: 'Li-ion Safety Protocols', description: 'Essential safety training for handling lithium cells.', 
        category: 'Safety', assignedTo: [empId],
        completions: [{ employee: empId, status: 'Completed', completedAt: new Date() }]
      },
      { 
        title: 'Modern ERP Usage', description: 'Training for the new portal management system.', 
        category: 'Technical', assignedTo: [empId],
        completions: [{ employee: empId, status: 'InProgress' }]
      }
    ]);

    // 7. Performance Reviews
    await PerformanceReview.create([
      { 
        employee: empId, reviewer: admin._id, reviewPeriod: 'Q3 2026', 
        overallScore: 92, status: 'Submitted',
        managerComments: 'Excellent work on the Zeus project. Very consistent professional track.'
      }
    ]);

    console.log('✅ Employee Portal Seeded Successfully!');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding Error:', err);
    process.exit(1);
  }
};

seed();
