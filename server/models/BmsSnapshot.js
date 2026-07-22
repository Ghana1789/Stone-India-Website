import mongoose from 'mongoose';

const bmsSnapshotSchema = new mongoose.Schema({
  packId: { type: String, required: true },
  packSerialNumber: String,
  batteryRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Battery' },
  orderRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },

  // State of Charge
  soc: { type: Number, min: 0, max: 100 },    // %
  socEstimationMethod: { type: String, default: 'Coulomb Counting' },

  // State of Health
  soh: { type: Number, min: 0, max: 100 },     // %
  cycleCount: { type: Number, default: 0 },
  capacityFade: { type: Number, default: 0 },  // %

  // Cell data
  cellCount: { type: Number, default: 1 },
  cellVoltages: [Number],                       // V each cell
  minCellVoltage: Number,
  maxCellVoltage: Number,
  avgCellVoltage: Number,
  voltageImbalance: Number,                     // mV

  // Temperature
  packTemperature: Number,                      // °C
  cellTemperatures: [Number],
  maxCellTemp: Number,
  minCellTemp: Number,
  thermalRunawayRisk: { type: String, enum: ['None', 'Low', 'Medium', 'High'], default: 'None' },

  // Current & Power
  current: Number,                              // A (+ charging, - discharging)
  power: Number,                                // W
  packVoltage: Number,                          // V
  energyRemaining: Number,                      // kWh

  // Balancing
  balancingActive: { type: Boolean, default: false },
  balancingCells: [Number],                     // cell indices being balanced

  // Faults
  faultCodes: [{
    code: String,
    description: String,
    severity: { type: String, enum: ['Info', 'Warning', 'Error', 'Critical'] },
    timestamp: Date,
    resolved: { type: Boolean, default: false }
  }],
  activeFaultCount: { type: Number, default: 0 },

  // BMS firmware
  firmwareVersion: String,
  hardwareVersion: String,
  bmsSupplier: String,
  lastFirmwareUpdate: Date,
  
  // Location
  location: String,  // Where the pack is (production, field, storage)
  
  // Remote diagnostics
  isRemotelyMonitored: { type: Boolean, default: false },
  lastCommunicationAt: Date,

  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

bmsSnapshotSchema.pre('save', function(next) {
  if (this.cellVoltages && this.cellVoltages.length > 0) {
    this.minCellVoltage = Math.min(...this.cellVoltages);
    this.maxCellVoltage = Math.max(...this.cellVoltages);
    this.avgCellVoltage = this.cellVoltages.reduce((a, b) => a + b, 0) / this.cellVoltages.length;
    this.voltageImbalance = (this.maxCellVoltage - this.minCellVoltage) * 1000; // convert to mV
  }
  if (this.faultCodes) {
    this.activeFaultCount = this.faultCodes.filter(f => !f.resolved).length;
  }
  next();
});

export default mongoose.model('BmsSnapshot', bmsSnapshotSchema);
