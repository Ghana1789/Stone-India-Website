import mongoose from 'mongoose';

const warrantyClaimSchema = new mongoose.Schema({
  claimId: { type: String, unique: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  battery: { type: mongoose.Schema.Types.ObjectId, ref: 'Battery' },
  batchId: String,

  // Issue Details
  issueType: {
    type: String,
    enum: ['Capacity Degradation', 'Physical Damage', 'Charging Issue', 'BMS Fault', 'Overheating', 'Short Circuit', 'Other'],
    required: true
  },
  issueDescription: { type: String, required: true },
  issueDate: { type: Date, required: true },

  // Evidence
  images: [{ name: String, url: String }],
  documents: [{ name: String, url: String }],

  // Status
  status: {
    type: String,
    enum: ['Submitted', 'UnderReview', 'Approved', 'Rejected', 'InService', 'Resolved'],
    default: 'Submitted'
  },

  // Admin review
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNotes: String,
  resolution: {
    type: String,
    enum: ['Replacement', 'Repair', 'Refund', 'Rejected', 'Pending'],
    default: 'Pending'
  },
  resolvedAt: Date,

}, { timestamps: true });

warrantyClaimSchema.pre('save', async function (next) {
  if (!this.claimId) {
    const count = await mongoose.model('WarrantyClaim').countDocuments();
    const pad = String(count + 1).padStart(4, '0');
    this.claimId = `SI-WC-${pad}`;
  }
  next();
});

export default mongoose.model('WarrantyClaim', warrantyClaimSchema);
