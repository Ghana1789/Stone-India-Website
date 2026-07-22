import mongoose from 'mongoose';

const trainingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: { type: String, enum: ['Technical', 'Safety', 'Soft Skills', 'Compliance', 'Management'], default: 'Technical' },
  instructor: String,
  resources: [{
    name: String,
    url: String,
    type: { type: String, enum: ['PDF', 'Video', 'Link', 'Document'], default: 'Link' }
  }],
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  completions: [{
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['NotStarted', 'InProgress', 'Completed'], default: 'NotStarted' },
    score: Number,
    completedAt: Date
  }]
}, { timestamps: true });

export default mongoose.model('Training', trainingSchema);
