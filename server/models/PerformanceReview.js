import mongoose from 'mongoose';

const performanceReviewSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewPeriod: { type: String, required: true }, // e.g., "Q3 2026"
  date: { type: Date, default: Date.now },
  ratings: {
    workQuality: { type: Number, min: 1, max: 5 },
    productivity: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    teamwork: { type: Number, min: 1, max: 5 },
    reliability: { type: Number, min: 1, max: 5 }
  },
  overallScore: { type: Number, min: 0, max: 100 },
  strengths: [String],
  goals: [String],
  managerComments: String,
  employeeComments: String,
  status: { type: String, enum: ['Draft', 'Submitted', 'Acknowledged'], default: 'Draft' }
}, { timestamps: true });

export default mongoose.model('PerformanceReview', performanceReviewSchema);
