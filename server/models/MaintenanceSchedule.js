import mongoose from 'mongoose';

const maintenanceScheduleSchema = new mongoose.Schema({
  machineId: { type: String, required: true },
  machineName: { type: String, required: true },
  machineRef: { type: mongoose.Schema.Types.ObjectId, ref: 'MachineSensor' },

  maintenanceType: {
    type: String,
    enum: ['Preventive', 'Predictive', 'Corrective', 'Emergency', 'Calibration', 'Inspection'],
    required: true
  },

  // Schedule
  scheduledDate: { type: Date, required: true },
  completedDate: Date,
  durationHours: { type: Number, default: 2 },

  // Prediction (AI-derived from sensor trends)
  predictedFailureDate: Date,
  predictionConfidence: { type: Number, min: 0, max: 100 }, // %
  predictionBasis: { type: String }, // e.g., "Vibration trend +34% over 7 days"

  // Health metrics at time of record
  healthScoreAtRecord: { type: Number, min: 0, max: 100 },
  vibrationAtRecord: Number,
  temperatureAtRecord: Number,
  runHoursAtRecord: Number,

  // Alert
  alertLevel: { type: String, enum: ['Info', 'Warning', 'Critical', 'Emergency'], default: 'Info' },
  alertMessage: String,

  // Work order
  workOrderId: String,
  assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  partsRequired: [{ partName: String, partCode: String, quantity: Number, costINR: Number }],
  totalCostINR: { type: Number, default: 0 },

  // Outcome
  status: { 
    type: String, 
    enum: ['Scheduled', 'InProgress', 'Completed', 'Overdue', 'Cancelled', 'Postponed'], 
    default: 'Scheduled' 
  },
  completionNotes: String,
  rootCause: String,
  actionTaken: String,
  preventedDowntimeHours: Number,

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('MaintenanceSchedule', maintenanceScheduleSchema);
