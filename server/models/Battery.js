import mongoose from 'mongoose';

const batterySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, uppercase: true },
  category: {
    type: String,
    enum: ['2W/3W', 'Fleet', 'Grid/BESS', 'R&D', 'Industrial'],
    required: true
  },
  description: { type: String, required: true },
  image: { type: String, default: '' },

  // Technical Specs
  specs: {
    voltage: { type: String },           // e.g. "48V"
    capacity: { type: String },          // e.g. "30Ah"
    chemistry: { type: String, enum: ['LFP', 'NMC', 'LTO', 'NCA'], default: 'LFP' },
    cycleLife: { type: String },        // e.g. "2000+ cycles"
    chargingTime: { type: String },
    weight: { type: String },
    dimensions: { type: String },
    operatingTemp: { type: String },
    peakPower: { type: String },
    protection: { type: String },
    compatibleVehicles: [String]
  },

  price: { type: Number, required: true, min: 0 },
  gstRate: { type: Number, default: 18 },
  stock: { type: Number, default: 0 },
  minOrderQty: { type: Number, default: 1 },

  features: [String],
  certifications: [String],

  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },

}, { timestamps: true });

export default mongoose.model('Battery', batterySchema);
