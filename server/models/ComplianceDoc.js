import mongoose from 'mongoose';

const complianceDocSchema = new mongoose.Schema({
  standard: {
    type: String,
    enum: ['ISO 9001:2015', 'ISO 14001:2015', 'ISO 45001:2018', 'IATF 16949', 
           'UN38.3', 'IEC 62133', 'IEC 62619', 'UL 1642', 'CE Marking', 
           'BIS Certification', 'AIS-048', 'AIS-156', 'CMVR', 'REACH', 'RoHS', 'Other'],
    required: true
  },
  documentName: { type: String, required: true },
  documentNumber: String,
  category: { 
    type: String, 
    enum: ['Safety', 'Quality', 'Environmental', 'Product', 'Process', 'Regulatory'],
    default: 'Quality'
  },

  // Status
  status: { 
    type: String, 
    enum: ['Valid', 'Expired', 'Expiring Soon', 'Under Review', 'Pending', 'Not Applicable'],
    default: 'Valid'
  },
  
  // Dates
  issueDate: Date,
  expiryDate: Date,
  auditDate: Date,
  nextAuditDate: Date,
  lastReviewDate: Date,

  // Issuing body
  issuingBody: String,
  certificationNumber: String,
  scope: String,

  // Document management
  documentUrl: String,
  version: { type: String, default: '1.0' },
  isActive: { type: Boolean, default: true },
  daysUntilExpiry: Number,

  // Alerts
  alertSent: { type: Boolean, default: false },
  alertDaysThreshold: { type: Number, default: 60 },

  // Audit findings
  lastAuditFindings: String,
  openNonConformities: { type: Number, default: 0 },
  correctiveActions: [{ description: String, dueDate: Date, status: String }],

  responsiblePerson: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Auto-compute daysUntilExpiry
complianceDocSchema.pre('save', function(next) {
  if (this.expiryDate) {
    const diffMs = new Date(this.expiryDate) - new Date();
    this.daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (this.daysUntilExpiry < 0) this.status = 'Expired';
    else if (this.daysUntilExpiry <= this.alertDaysThreshold) this.status = 'Expiring Soon';
  }
  next();
});

export default mongoose.model('ComplianceDoc', complianceDocSchema);
