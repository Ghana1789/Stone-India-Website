import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  jobId: { type: String, required: true },
  jobTitle: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  experience: { type: String, enum: ['Fresher', 'Experienced'], default: 'Fresher' },
  currentCompany: { type: String, trim: true },
  noticePeriod: { type: String, trim: true },
  resume: { type: String, required: true }, // URL or Path to file
  status: { 
    type: String, 
    enum: ['applied', 'reviewed', 'shortlisted', 'rejected', 'hired'], 
    default: 'applied' 
  },
  ipAddress: { type: String },
}, { timestamps: true });

export default mongoose.model('Application', applicationSchema);
