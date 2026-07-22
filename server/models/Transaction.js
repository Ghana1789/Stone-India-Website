import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, unique: true },
  type: {
    type: String,
    enum: ['Payment', 'Invoice', 'Salary', 'Expense', 'Refund', 'Adjustment'],
    required: true
  },
  direction: {
    type: String,
    enum: ['Incoming', 'Outgoing'],
    required: true
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Cancelled', 'Processing'],
    default: 'Pending'
  },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['Client Payment', 'Salary Payout', 'Expense Reimbursement', 'Invoice Payment', 'Refund', 'Other'],
    default: 'Other'
  },

  // Linked entities (optional — whichever applies)
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  payslip: { type: mongoose.Schema.Types.ObjectId, ref: 'Payslip' },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  expense: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense' },

  // Payment method
  paymentMethod: {
    type: String,
    enum: ['Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Razorpay', 'Other'],
    default: 'Bank Transfer'
  },
  referenceNumber: { type: String },

  // Metadata
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date },
  notes: { type: String },
  tags: [String]
}, { timestamps: true });

// Auto-generate transaction ID
transactionSchema.pre('save', async function (next) {
  if (!this.transactionId) {
    const count = await mongoose.model('Transaction').countDocuments();
    const pad = String(count + 1).padStart(6, '0');
    this.transactionId = `TXN-${pad}`;
  }
  next();
});

// Index for fast queries
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ createdAt: -1 });

export default mongoose.model('Transaction', transactionSchema);
