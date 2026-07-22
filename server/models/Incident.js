import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['Machine Failure', 'Safety Concern', 'Quality Issue', 'Environmental', 'Process Delay', 'Other'],
    required: true
  },
  description: { type: String, required: true },
  department: {
    type: String,
    enum: [
      'Research & Development', 'Procurement', 'Production', 'Quality Control',
      'Maintenance', 'Safety & Environment', 'Engineering', 'Logistics & Supply Chain',
      'Packaging', 'Sales & Marketing', 'Human Resources', 'Finance'
    ],
    required: true
  },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['Open', 'Investigating', 'Resolved', 'Closed'],
    default: 'Open'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  location: { type: String, trim: true },
  affectedMachine: { type: String, trim: true },
  mediaUrls: [{ type: String }],
  resolution: { type: String },
  resolvedAt: { type: Date },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('Incident', incidentSchema);
