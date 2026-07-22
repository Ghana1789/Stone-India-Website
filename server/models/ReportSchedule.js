import mongoose from 'mongoose';

const reportScheduleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  templateId: {
    type: String,
    required: true,
    enum: [
      'client_acquisition',
      'order_fulfillment',
      'employee_productivity',
      'revenue_summary',
      'inventory_turnover',
      'full_business_summary'
    ]
  },
  frequency: { type: String, required: true, enum: ['daily', 'weekly', 'monthly'] },
  // Derived cron expression stored for reference
  cronExpression: { type: String, required: true },
  recipients: [{ type: String, lowercase: true, trim: true, required: true }],
  dateRangePreset: {
    type: String,
    enum: ['last_7_days', 'last_30_days', 'last_90_days', 'this_month', 'last_month', 'this_year'],
    default: 'last_30_days'
  },
  isActive: { type: Boolean, default: true },
  lastRunAt: { type: Date, default: null },
  lastRunStatus: { type: String, enum: ['success', 'failed', 'never'], default: 'never' },
  nextRunAt: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('ReportSchedule', reportScheduleSchema);
