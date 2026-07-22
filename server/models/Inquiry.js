import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  company: { type: String, trim: true },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['General Enquiry', 'Product Quote', 'Technical Support', 'Partnership', 'Warranty', 'Career'], 
    default: 'General Enquiry' 
  },
  status: { 
    type: String, 
    enum: ['new', 'in-progress', 'resolved', 'spam'], 
    default: 'new' 
  },
  ipAddress: { type: String },
}, { timestamps: true });

export default mongoose.model('Inquiry', inquirySchema);
