import mongoose from 'mongoose';

const supplierScoreSchema = new mongoose.Schema({
  vendorName: { type: String, required: true },
  vendorCode: { type: String, unique: true },
  category: {
    type: String,
    enum: ['Cathode Materials', 'Anode Materials', 'Electrolytes', 'Separators', 
           'Battery Cases', 'BMS Components', 'Packaging', 'Equipment', 'Chemicals', 'Other'],
    required: true
  },
  contactPerson: String,
  contactEmail: String,
  contactPhone: String,
  address: String,
  country: { type: String, default: 'India' },

  // Scorecard metrics (0-100)
  qualityScore: { type: Number, min: 0, max: 100, default: 0 },
  deliveryScore: { type: Number, min: 0, max: 100, default: 0 },
  priceScore: { type: Number, min: 0, max: 100, default: 0 },
  responsiveScore: { type: Number, min: 0, max: 100, default: 0 },
  sustainabilityScore: { type: Number, min: 0, max: 100, default: 0 },
  overallScore: { type: Number, min: 0, max: 100, default: 0 },

  // Performance
  leadTimeDays: { type: Number, default: 0 },
  onTimeDeliveryRate: { type: Number, default: 0 }, // %
  defectRate: { type: Number, default: 0 },          // %
  totalOrders: { type: Number, default: 0 },
  totalValueINR: { type: Number, default: 0 },

  // Certifications
  certifications: [{ name: String, validUntil: Date, status: String }],
  isApproved: { type: Boolean, default: true },
  isCritical: { type: Boolean, default: false }, // Critical supplier flag

  // Audit
  lastAuditDate: Date,
  nextAuditDate: Date,
  auditStatus: { type: String, enum: ['Passed', 'Failed', 'Pending', 'Scheduled'], default: 'Pending' },
  
  rating: { type: String, enum: ['Preferred', 'Approved', 'Conditional', 'Probation', 'Disqualified'], default: 'Approved' },
  notes: String,
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

supplierScoreSchema.pre('save', function(next) {
  this.overallScore = Math.round(
    (this.qualityScore * 0.35 + this.deliveryScore * 0.30 + 
     this.priceScore * 0.20 + this.responsiveScore * 0.10 + 
     this.sustainabilityScore * 0.05)
  );
  if (!this.vendorCode) {
    this.vendorCode = `VND-${Date.now().toString(36).toUpperCase()}`;
  }
  next();
});

export default mongoose.model('SupplierScore', supplierScoreSchema);
