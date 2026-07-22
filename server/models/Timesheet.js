import mongoose from 'mongoose';

const timesheetSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  clockIn: { type: Date, required: true },
  clockOut: { type: Date },
  totalHours: { type: Number, default: 0 },
  status: { type: String, enum: ['Present', 'Absent', 'HalfDay'], default: 'Present' },
  tasks: [{
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    description: String,
    hours: Number
  }],
  remarks: String
}, { timestamps: true });

export default mongoose.model('Timesheet', timesheetSchema);
