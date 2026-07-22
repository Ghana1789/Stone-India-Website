import mongoose from 'mongoose';

const payslipSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true }, // e.g., "October 2026"
  year: { type: Number, required: true },
  earnings: {
    basic: { type: Number, required: true },
    hra: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 }
  },
  deductions: {
    tax: { type: Number, default: 0 },
    pf: { type: Number, default: 0 },
    insurance: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  grossSalary: { type: Number, required: true },
  netSalary: { type: Number, required: true },
  paymentDate: { type: Date },
  status: { type: String, enum: ['Generated', 'Paid'], default: 'Generated' },
  pdfUrl: String
}, { timestamps: true });

export default mongoose.model('Payslip', payslipSchema);
