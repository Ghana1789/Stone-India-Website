import mongoose from 'mongoose';

const cellBatchSchema = new mongoose.Schema({
  batchNumber: { type: String, unique: true },
  cellChemistry: { type: String, enum: ['NMC', 'LFP', 'NCA', 'NiMH', 'LTO'], default: 'NMC' },
  formationStage: { 
    type: String, 
    enum: ['Electrode Prep', 'Coating', 'Drying', 'Calendering', 'Slitting', 'Winding', 'Electrolyte Fill', 'Formation', 'Aging', 'Grading', 'Complete'],
    default: 'Electrode Prep'
  },
  formationProgress: { type: Number, min: 0, max: 100, default: 0 },

  // Cell specs
  nominalCapacity: { type: Number }, // Ah
  actualCapacity: { type: Number },  // Ah
  nominalVoltage: { type: Number },  // V
  actualVoltage: { type: Number },   // V
  internalResistance: { type: Number }, // mΩ
  cRate: { type: Number, default: 0.5 },

  // Production metrics
  quantity: { type: Number, required: true },
  yieldPercent: { type: Number, min: 0, max: 100 },
  scrapPercent: { type: Number, min: 0, max: 100 },
  scrapQuantity: { type: Number, default: 0 },

  // Defect tracking
  defects: [{
    type: { type: String }, // Short circuit, High IR, Low capacity, Deformation, Leakage
    count: Number,
    severity: { type: String, enum: ['Minor', 'Major', 'Critical'] }
  }],

  // Process params
  electrolyteBatch: String,
  cathodeMaterial: String,
  anodeMaterial: String,
  separatorType: String,
  electrolyteVolume: Number, // mL

  // Formation protocol
  formationCycles: { type: Number, default: 0 },
  formationTemperature: Number, // °C
  formationCurrent: Number, // A

  // QC
  qcStatus: { type: String, enum: ['Pending', 'InProgress', 'Passed', 'Failed', 'Rework'], default: 'Pending' },
  qcScore: { type: Number, min: 0, max: 100 },
  qcInspector: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  qcDate: Date,

  // Linked batch
  linkedBatchLog: { type: mongoose.Schema.Types.ObjectId, ref: 'BatchLog' },
  assignedLine: { type: String, enum: ['Line A', 'Line B', 'Line C', 'Line D'], default: 'Line A' },

  productionStartDate: Date,
  productionEndDate: Date,
  notes: String,
  status: {
    type: String,
    enum: ['Planned', 'InProgress', 'Completed', 'OnHold', 'Scrapped'],
    default: 'Planned'
  }
}, { timestamps: true });

cellBatchSchema.pre('save', async function (next) {
  if (!this.batchNumber) {
    const count = await mongoose.model('CellBatch').countDocuments();
    const pad = String(count + 1).padStart(5, '0');
    const year = new Date().getFullYear();
    this.batchNumber = `CB-${year}-${pad}`;
  }
  next();
});

export default mongoose.model('CellBatch', cellBatchSchema);
