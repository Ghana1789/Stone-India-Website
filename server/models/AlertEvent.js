import mongoose from 'mongoose';

const alertEventSchema = new mongoose.Schema({
  alertConfig: { type: mongoose.Schema.Types.ObjectId, ref: 'AlertConfig', required: true },
  alertName: { type: String, required: true },
  metric: { type: String, required: true },
  severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'warning' },
  message: { type: String, required: true },
  actualValue: { type: Number, required: true },
  thresholdValue: { type: Number, required: true },
  operator: { type: String, required: true },
  isResolved: { type: Boolean, default: false },
  resolvedAt: { type: Date, default: null },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  emailSent: { type: Boolean, default: false },
  emailSentAt: { type: Date, default: null },
}, { timestamps: true });

alertEventSchema.index({ isResolved: 1, createdAt: -1 });
alertEventSchema.index({ alertConfig: 1, createdAt: -1 });

export default mongoose.model('AlertEvent', alertEventSchema);
