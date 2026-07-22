import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, trim: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  category: {
    type: String,
    enum: ['general', 'notifications', 'security', 'email'],
    default: 'general'
  },
  label: { type: String },       // human readable label
  description: { type: String }, // description shown in UI
  type: {                        // input type hint for UI
    type: String,
    enum: ['text', 'email', 'number', 'boolean', 'password', 'select'],
    default: 'text'
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('SystemSetting', systemSettingSchema);
