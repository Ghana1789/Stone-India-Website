import mongoose from 'mongoose';

const energyReadingSchema = new mongoose.Schema({
  source: { 
    type: String,
    enum: ['Production Line A', 'Production Line B', 'Production Line C', 'Production Line D',
           'HVAC System', 'Lighting', 'Compressed Air', 'Electrolyte Room', 'QC Lab', 
           'Packaging Area', 'Warehouse', 'Office', 'Total Plant'],
    required: true
  },
  
  // Energy metrics
  kwhConsumed: { type: Number, default: 0 },     // kWh
  peakDemandKw: { type: Number, default: 0 },     // kW
  powerFactor: { type: Number, default: 0.9 },
  
  // Carbon & sustainability
  carbonKg: { type: Number, default: 0 },          // kg CO2
  carbonIntensity: { type: Number, default: 0 },   // g CO2/kWh
  renewablePercent: { type: Number, default: 0 },  // % from renewable
  
  // Water & waste
  waterLiters: { type: Number, default: 0 },
  wasteKg: { type: Number, default: 0 },
  recycledKg: { type: Number, default: 0 },
  hazardousWasteKg: { type: Number, default: 0 },
  
  // Cost
  energyCostINR: { type: Number, default: 0 },
  
  // Period
  period: { type: String, enum: ['hourly', 'daily', 'weekly', 'monthly'], default: 'daily' },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date },
  
  // Production context
  unitsProduced: { type: Number, default: 0 },
  energyPerUnit: { type: Number, default: 0 },  // kWh/unit
  
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('EnergyReading', energyReadingSchema);
