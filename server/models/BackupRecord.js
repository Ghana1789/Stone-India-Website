import mongoose from 'mongoose';

const backupRecordSchema = new mongoose.Schema({
  backupId: { type: String, required: true, unique: true },
  filename: { type: String, required: true },
  sizeBytes: { type: Number, default: 0 },
  collections: [{ name: String, count: Number }],
  status: {
    type: String,
    enum: ['running', 'success', 'failed'],
    default: 'running'
  },
  type: {
    type: String,
    enum: ['manual', 'scheduled'],
    default: 'manual'
  },
  notes: { type: String, default: '' },
  errorMessage: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedAt: { type: Date }
}, { timestamps: true });

backupRecordSchema.index({ createdAt: -1 });

export default mongoose.model('BackupRecord', backupRecordSchema);
