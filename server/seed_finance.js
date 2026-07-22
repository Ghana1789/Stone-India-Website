import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './models/User.js';
import Invoice from './models/Invoice.js';
import Payslip from './models/Payslip.js';
import Transaction from './models/Transaction.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

async function seedFinance() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get existing users
    const clients = await User.find({ role: 'client' }).limit(5);
    const employees = await User.find({ role: 'employee' }).limit(10);
    const managers = await User.find({ role: 'manager' }).limit(2);
    const admins = await User.find({ role: 'admin' }).limit(1);

    if (clients.length === 0 || employees.length === 0) {
      console.log('⚠️  No users found. Please run seed.js first.');
      process.exit(1);
    }

    const creator = admins[0] || managers[0];

    // Clear existing finance data
    await Transaction.deleteMany({});
    console.log('🗑️  Cleared existing transactions');

    // ─── INVOICES ────────────────────────────────────────────────────
    const invoiceSeeds = [];
    const projectNames = [
      'Battery Pack Assembly Line', 'Solar Storage System', 'UPS Module Retrofit',
      'Custom Battery Design', 'Warehouse Power Backup', 'Industrial Battery Upgrade',
      'Fleet EV Battery Supply', 'Telecom Tower Battery', 'Hospital Backup Power',
      'Railway Signal Battery'
    ];

    for (let i = 0; i < Math.min(clients.length * 2, 10); i++) {
      const client = clients[i % clients.length];
      const monthIdx = Math.floor(Math.random() * 6) + 3; // March-August range
      const statusOpts = ['Paid', 'Pending', 'Overdue'];
      const status = statusOpts[Math.floor(Math.random() * statusOpts.length)];

      const lineItems = [
        { description: 'Battery Units', quantity: Math.floor(Math.random() * 50) + 5, unitPrice: Math.floor(Math.random() * 5000) + 2000 },
        { description: 'Installation & Setup', quantity: 1, unitPrice: Math.floor(Math.random() * 15000) + 5000 },
        { description: 'Testing & Certification', quantity: 1, unitPrice: Math.floor(Math.random() * 8000) + 2000 },
      ];

      const subtotal = lineItems.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
      const taxRate = 18;
      const taxAmount = Math.round(subtotal * 0.18);
      const discount = Math.floor(Math.random() * 5000);
      const amount = subtotal + taxAmount - discount;

      const issueDate = new Date(2026, monthIdx - 2, Math.floor(Math.random() * 25) + 1);
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 30);

      invoiceSeeds.push({
        invoiceNumber: `INV-2026-${String(i + 1).padStart(4, '0')}`,
        client: client._id,
        projectTitle: projectNames[i],
        lineItems,
        amount,
        subtotal,
        taxRate,
        taxAmount,
        discount,
        status,
        issueDate,
        dueDate,
        paidDate: status === 'Paid' ? new Date(issueDate.getTime() + Math.random() * 15 * 86400000) : undefined,
        paymentId: status === 'Paid' ? `PAY-${Date.now()}-${i}` : undefined,
        paymentMethod: status === 'Paid' ? ['Bank Transfer', 'UPI', 'Razorpay'][Math.floor(Math.random() * 3)] : undefined,
        amountPaid: status === 'Paid' ? amount : 0,
        notes: `Invoice for ${projectNames[i]}`,
        createdBy: creator?._id
      });
    }

    // Upsert invoices (avoid duplicates)
    for (const inv of invoiceSeeds) {
      await Invoice.findOneAndUpdate(
        { invoiceNumber: inv.invoiceNumber },
        inv,
        { upsert: true, new: true }
      );
    }
    console.log(`📄 Seeded ${invoiceSeeds.length} invoices`);

    // ─── PAYSLIPS ────────────────────────────────────────────────────
    const payslipSeeds = [];
    for (const emp of employees) {
      for (let m = 0; m < 4; m++) {
        const month = MONTHS[m + 5]; // June-September
        const basic = Math.floor(Math.random() * 20000) + 25000;
        const hra = Math.round(basic * 0.4);
        const allowances = Math.floor(Math.random() * 5000) + 3000;
        const bonus = m === 3 ? Math.floor(Math.random() * 10000) : 0;
        const tax = Math.round((basic + hra + allowances + bonus) * 0.1);
        const pf = Math.round(basic * 0.12);
        const insurance = 500;
        const grossSalary = basic + hra + allowances + bonus;
        const netSalary = grossSalary - tax - pf - insurance;

        payslipSeeds.push({
          employee: emp._id,
          month,
          year: 2026,
          earnings: { basic, hra, allowances, bonus },
          deductions: { tax, pf, insurance, other: 0 },
          grossSalary,
          netSalary,
          paymentDate: new Date(2026, m + 5, 28),
          status: 'Paid'
        });
      }
    }

    await Payslip.deleteMany({ year: 2026 });
    await Payslip.insertMany(payslipSeeds);
    console.log(`💰 Seeded ${payslipSeeds.length} payslips`);

    // ─── TRANSACTIONS ────────────────────────────────────────────────
    const transactionSeeds = [];
    let txnCounter = 1;

    // Client payment transactions from paid invoices
    const paidInvoices = await Invoice.find({ status: 'Paid' });
    for (const inv of paidInvoices) {
      transactionSeeds.push({
        transactionId: `TXN-${String(txnCounter++).padStart(6, '0')}`,
        type: 'Payment',
        direction: 'Incoming',
        amount: inv.amount,
        status: 'Completed',
        description: `Payment for invoice ${inv.invoiceNumber}`,
        category: 'Client Payment',
        user: inv.client,
        invoice: inv._id,
        paymentMethod: inv.paymentMethod || 'Bank Transfer',
        referenceNumber: inv.paymentId,
        processedBy: creator?._id,
        processedAt: inv.paidDate,
        createdAt: inv.paidDate
      });
    }

    // Pending invoice transactions
    const pendingInvoices = await Invoice.find({ status: { $in: ['Pending', 'Overdue'] } });
    for (const inv of pendingInvoices) {
      transactionSeeds.push({
        transactionId: `TXN-${String(txnCounter++).padStart(6, '0')}`,
        type: 'Invoice',
        direction: 'Incoming',
        amount: inv.amount,
        status: 'Pending',
        description: `Pending invoice ${inv.invoiceNumber} - ${inv.projectTitle}`,
        category: 'Invoice Payment',
        user: inv.client,
        invoice: inv._id,
        processedBy: creator?._id,
        createdAt: inv.issueDate
      });
    }

    // Salary payout transactions
    for (const ps of payslipSeeds) {
      transactionSeeds.push({
        transactionId: `TXN-${String(txnCounter++).padStart(6, '0')}`,
        type: 'Salary',
        direction: 'Outgoing',
        amount: ps.netSalary,
        status: 'Completed',
        description: `Salary payout for ${ps.month} ${ps.year}`,
        category: 'Salary Payout',
        user: ps.employee,
        paymentMethod: 'Bank Transfer',
        processedBy: creator?._id,
        processedAt: ps.paymentDate,
        createdAt: ps.paymentDate
      });
    }

    // Expense reimbursement transactions
    for (let i = 0; i < 8; i++) {
      const emp = employees[i % employees.length];
      const categories = ['Travel', 'Equipment', 'Office Supplies', 'Maintenance'];
      const statuses = ['Completed', 'Pending', 'Completed', 'Completed'];
      const amounts = [2500, 8500, 1200, 15000, 4500, 3200, 6800, 9500];

      transactionSeeds.push({
        transactionId: `TXN-${String(txnCounter++).padStart(6, '0')}`,
        type: 'Expense',
        direction: 'Outgoing',
        amount: amounts[i],
        status: statuses[i % statuses.length],
        description: `${categories[i % categories.length]} expense reimbursement`,
        category: 'Expense Reimbursement',
        user: emp._id,
        paymentMethod: ['Bank Transfer', 'UPI'][Math.floor(Math.random() * 2)],
        processedBy: creator?._id,
        processedAt: statuses[i % statuses.length] === 'Completed' ? new Date(2026, 6 + Math.floor(i/3), 15) : undefined,
        createdAt: new Date(2026, 6 + Math.floor(i/3), 10 + i)
      });
    }

    // A few refund transactions
    for (let i = 0; i < 2; i++) {
      const client = clients[i];
      transactionSeeds.push({
        transactionId: `TXN-${String(txnCounter++).padStart(6, '0')}`,
        type: 'Refund',
        direction: 'Outgoing',
        amount: Math.floor(Math.random() * 20000) + 5000,
        status: 'Completed',
        description: `Partial refund for defective units - Order batch ${i + 1}`,
        category: 'Refund',
        user: client._id,
        paymentMethod: 'Bank Transfer',
        processedBy: creator?._id,
        processedAt: new Date(2026, 7, 20 + i),
        createdAt: new Date(2026, 7, 18 + i)
      });
    }

    await Transaction.insertMany(transactionSeeds);
    console.log(`📊 Seeded ${transactionSeeds.length} transactions`);

    console.log('\n✅ Finance data seeded successfully!');
    console.log(`   • ${invoiceSeeds.length} invoices`);
    console.log(`   • ${payslipSeeds.length} payslips`);
    console.log(`   • ${transactionSeeds.length} transactions`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seedFinance();
