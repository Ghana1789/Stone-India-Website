import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'RESET_PASSWORD', 'TOGGLE_STATUS', 'BACKUP', 'SETTINGS_UPDATE', 'OTHER']
  },
  entity: { type: String, required: true }, // e.g. 'User', 'Order', 'Settings', 'Backup'
  entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
  description: { type: String, required: true },
  performedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String },
    email: { type: String },
    role: { type: String }
  },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }, // extra details
  ip: { type: String, default: '' },
  status: { type: String, enum: ['success', 'failed'], default: 'success' }
}, { timestamps: true });

// Index for fast queries
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ 'performedBy.userId': 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ entity: 1 });

export default mongoose.model('AuditLog', auditLogSchema);
