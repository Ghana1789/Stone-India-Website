import mongoose from 'mongoose';

const savedReportSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  metrics: [{
    type: String,
    enum: [
      'total_revenue', 'order_count', 'avg_order_value', 'fulfillment_rate',
      'avg_processing_days', 'new_clients', 'active_clients',
      'tasks_completed', 'tasks_pending', 'productivity_index',
      'defect_rate', 'batch_count', 'inventory_value', 'turnover_rate',
      'warranty_claims', 'pending_orders', 'revenue_growth_pct'
    ]
  }],
  dimensions: [{
    type: String,
    enum: ['month', 'week', 'day', 'department', 'client_segment', 'product', 'employee']
  }],
  filters: {
    dateRangePreset: {
      type: String,
      enum: ['last_7_days', 'last_30_days', 'last_90_days', 'this_month', 'last_month', 'this_year', 'custom'],
      default: 'last_30_days'
    },
    startDate: { type: Date },
    endDate: { type: Date },
    departments: [String],
    clientSegments: [String]
  },
  sortBy: { type: String, default: 'date' },
  sortOrder: { type: String, enum: ['asc', 'desc'], default: 'desc' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastRunAt: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model('SavedReport', savedReportSchema);
