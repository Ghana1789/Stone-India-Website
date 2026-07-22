import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  battery: { type: mongoose.Schema.Types.ObjectId, ref: 'Battery', required: true },
  batteryName: String,
  batterySku: String,
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  gstRate: { type: Number, default: 18 },
  totalPrice: Number,
});

const trackingHistorySchema = new mongoose.Schema({
  status: String,
  message: String,
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],

  // Pricing
  subtotal: Number,
  gstAmount: Number,
  totalAmount: Number,

  // Delivery
  deliveryAddress: {
    name: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  expectedDelivery: Date,

  // Status
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Manufacturing', 'QC', 'Packed', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  trackingHistory: [trackingHistorySchema],

  // Payment
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Partial', 'Paid', 'Refunded'],
    default: 'Pending'
  },
  paymentMethod: String,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  paidAt: Date,

  // Notes
  notes: String,
  internalNotes: String,

  // Invoice
  invoiceUrl: String,
  invoiceNumber: String,

  // Assigned batch
  assignedBatch: { type: mongoose.Schema.Types.ObjectId, ref: 'BatchLog' },

}, { timestamps: true });

// Auto-generate order ID
orderSchema.pre('save', async function (next) {
  if (!this.orderId) {
    const count = await mongoose.model('Order').countDocuments();
    const pad = String(count + 1).padStart(5, '0');
    this.orderId = `SI-ORD-${pad}`;
  }
  next();
});

export default mongoose.model('Order', orderSchema);
