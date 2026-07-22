import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploaderRole: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String }, // e.g., 'application/pdf'
  sizeBytes: { type: Number },
}, { timestamps: true });

export default mongoose.model('Document', documentSchema);
