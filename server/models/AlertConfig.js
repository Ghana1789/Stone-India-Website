import mongoose from 'mongoose';

const alertConfigSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  metric: {
    type: String,
    required: true,
    enum: [
      'revenue_daily',
      'revenue_weekly',
      'revenue_monthly',
      'order_volume_daily',
      'fulfillment_delay_hours',
      'inventory_level',
      'defect_rate_percent',
      'employee_productivity_index',
      'pending_orders_count',
      'warranty_claims_count',
      'batch_failure_rate'
    ]
  },
  operator: { type: String, required: true, enum: ['gt', 'lt', 'gte', 'lte', 'eq'] },
  threshold: { type: Number, required: true },
  severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'warning' },
  channels: {
    dashboard: { type: Boolean, default: true },
    email: { type: Boolean, default: false }
  },
  emailRecipients: [{ type: String, lowercase: true, trim: true }],
  isActive: { type: Boolean, default: true },
  cooldownMinutes: { type: Number, default: 60, min: 5 }, // minimum gap between same alert firing
  lastFiredAt: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('AlertConfig', alertConfigSchema);
