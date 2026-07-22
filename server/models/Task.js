import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  taskType: {
    type: String,
    enum: ['Production', 'QC', 'Packaging', 'Dispatch', 'Maintenance', 'Documentation', 'Other'],
    default: 'Production'
  },

  // Assignment
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Linked batch
  relatedBatch: { type: mongoose.Schema.Types.ObjectId, ref: 'BatchLog' },

  // Status & Priority
  status: {
    type: String,
    enum: ['Assigned', 'InProgress', 'OnHold', 'Completed', 'Cancelled'],
    default: 'Assigned'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },

  // Timeline
  dueDate: { type: Date },
  startedAt: Date,
  completedAt: Date,

  // Employee updates
  progress: { type: Number, min: 0, max: 100, default: 0 },
  remarks: String,

  // Subtasks / checklist
  checklist: [{
    item: String,
    done: { type: Boolean, default: false }
  }],

  // Attachments
  attachments: [{ name: String, url: String }],

}, { timestamps: true });

export default mongoose.model('Task', taskSchema);
