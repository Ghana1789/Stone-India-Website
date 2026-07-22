import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  status: { type: String, enum: ['Completed', 'In Progress', 'Upcoming'], default: 'Upcoming' },
  dueDate: { type: Date }
});

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTeam: { type: String, default: 'Unassigned' },
  team: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['In progress', 'On track', 'Review', 'Completed', 'Cancelled'], default: 'On track' },
  progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
  milestones: [milestoneSchema]
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);
