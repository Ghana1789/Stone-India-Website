import mongoose from 'mongoose';

const machineSensorSchema = new mongoose.Schema({
  machineId: { type: String, required: true },
  machineName: { type: String, required: true },
  machineType: { 
    type: String, 
    enum: ['Coating Machine', 'Calendering Press', 'Slitting Machine', 'Winding Machine', 
           'Electrolyte Filler', 'Welding Station', 'Formation Cycler', 'Aging Oven',
           'QC Tester', 'Packaging Line', 'Assembly Robot', 'Conveyor'],
    default: 'Coating Machine'
  },
  location: { type: String, default: 'Line A' },
  
  // Real-time sensor readings
  vibration: { type: Number, default: 0 },       // mm/s
  temperature: { type: Number, default: 25 },     // °C
  pressure: { type: Number, default: 1 },         // bar
  humidity: { type: Number, default: 45 },        // %
  rpm: { type: Number, default: 0 },
  currentDraw: { type: Number, default: 0 },      // A
  powerConsumption: { type: Number, default: 0 }, // kW

  // Performance
  oeeScore: { type: Number, min: 0, max: 100 },
  uptimePercent: { type: Number, min: 0, max: 100 },
  throughput: { type: Number, default: 0 },       // units/hr
  targetThroughput: { type: Number, default: 100 },

  // Downtime
  downtimeMinutes: { type: Number, default: 0 },
  downtimeCause: String,
  lastDowntimeAt: Date,

  // Maintenance
  lastMaintenanceAt: Date,
  nextMaintenanceDue: Date,
  maintenanceHoursRun: { type: Number, default: 0 },
  totalRunHours: { type: Number, default: 0 },

  // Health
  healthScore: { type: Number, min: 0, max: 100 },
  alertLevel: { type: String, enum: ['Normal', 'Warning', 'Critical', 'Offline'], default: 'Normal' },
  faultCodes: [{ code: String, description: String, detectedAt: Date, resolved: Boolean }],
  
  status: { type: String, enum: ['Running', 'Idle', 'Maintenance', 'Breakdown', 'Offline'], default: 'Running' },
  operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('MachineSensor', machineSensorSchema);
