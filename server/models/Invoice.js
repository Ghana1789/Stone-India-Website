import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true },
  total: { type: Number }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectTitle: { type: String, required: true },

  // Line items for detailed invoices
  lineItems: [lineItemSchema],

  // Pricing breakdown
  amount: { type: Number, required: true },
  subtotal: { type: Number, default: 0 },
  taxRate: { type: Number, default: 18 }, // GST %
  taxAmount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },

  // Status & dates
  status: { type: String, enum: ['Paid', 'Pending', 'Overdue', 'Cancelled', 'PartiallyPaid'], default: 'Pending' },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  paidDate: { type: Date },

  // Payment info
  paymentId: { type: String },
  paymentMethod: { type: String },
  amountPaid: { type: Number, default: 0 },

  // Meta
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Auto-calculate totals before save
invoiceSchema.pre('save', function (next) {
  if (this.lineItems && this.lineItems.length > 0) {
    this.lineItems.forEach(item => {
      item.total = item.quantity * item.unitPrice;
    });
    this.subtotal = this.lineItems.reduce((sum, item) => sum + item.total, 0);
    this.taxAmount = Math.round(this.subtotal * (this.taxRate / 100));
    this.amount = this.subtotal + this.taxAmount - (this.discount || 0);
  }
  next();
});

export default mongoose.model('Invoice', invoiceSchema);
