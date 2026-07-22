import mongoose from 'mongoose';

const batchLogSchema = new mongoose.Schema({
  batchId: { type: String, unique: true },
  battery: { type: mongoose.Schema.Types.ObjectId, ref: 'Battery', required: true },
  batteryName: String,

  // Production details
  quantity: { type: Number, required: true },
  cellCount: { type: Number },
  rawMaterials: [{
    name: String,
    quantity: String,
    unit: String
  }],

  // QC Results
  qcStatus: { type: String, enum: ['Pending', 'InProgress', 'Passed', 'Failed', 'Rework'], default: 'Pending' },
  qcChecklist: {
    visualInspection: { passed: Boolean, remarks: String },
    voltageTest: { passed: Boolean, value: String, remarks: String },
    capacityTest: { passed: Boolean, value: String, remarks: String },
    insulationTest: { passed: Boolean, remarks: String },
    temperatureTest: { passed: Boolean, value: String, remarks: String },
    cycleTest: { passed: Boolean, remarks: String },
    safetyTest: { passed: Boolean, remarks: String },
    packagingCheck: { passed: Boolean, remarks: String },
  },
  qcScore: { type: Number, min: 0, max: 100 },
  defectRate: { type: Number, default: 0 },

  // Staff
  assignedEmployees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  qcInspector: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Timeline
  productionStartDate: Date,
  productionEndDate: Date,
  qcDate: Date,

  // Documents
  testReports: [{ name: String, url: String, uploadedAt: Date }],
  notes: String,

  // Linked order
  linkedOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },

  status: {
    type: String,
    enum: ['Scheduled', 'InProduction', 'QCPending', 'QCPassed', 'QCFailed', 'Packed', 'Dispatched'],
    default: 'Scheduled'
  }
}, { timestamps: true });

// Auto-generate batch ID
batchLogSchema.pre('save', async function (next) {
  if (!this.batchId) {
    const count = await mongoose.model('BatchLog').countDocuments();
    const pad = String(count + 1).padStart(4, '0');
    const year = new Date().getFullYear();
    this.batchId = `SI-BATCH-${year}-${pad}`;
  }
  next();
});

export default mongoose.model('BatchLog', batchLogSchema);
