import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { 
    type: String, 
    enum: ['Travel', 'Food', 'Equipment', 'Office Supplies', 'Maintenance', 'Other'],
    default: 'Other'
  },
  date: { type: Date, default: Date.now },
  description: String,
  receiptUrl: String,
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected', 'Paid'], 
    default: 'Pending' 
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  managerRemarks: String
}, { timestamps: true });

export default mongoose.model('Expense', expenseSchema);
