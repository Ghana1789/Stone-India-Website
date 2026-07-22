import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/Order.js';
import BatchLog from './models/BatchLog.js';
import CellBatch from './models/CellBatch.js';
import Battery from './models/Battery.js';
import User from './models/User.js';
import EnergyReading from './models/EnergyReading.js';

dotenv.config();

const seedManufacturing = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/stone_india');
  console.log('✅ Connected to MongoDB for Manufacturing Seed');

  const admin = await User.findOne({ role: 'admin' });
  const client = await User.findOne({ role: 'client' });
  const battery = await Battery.findOne();

  if (!admin || !client || !battery) {
    console.error('❌ Please run `npm run seed` first to populate base users and batteries.');
    process.exit(1);
  }

  // 1. Clear old data
  await Order.deleteMany({});
  await BatchLog.deleteMany({});
  await CellBatch.deleteMany({});
  await EnergyReading.deleteMany({});
  console.log('🗑 Cleared old manufacturing data');

  // 2. Create Orders
  const today = new Date();
  const pastOrders = [];
  for (let i = 1; i <= 15; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (Math.floor(Math.random() * 60)));
    pastOrders.push({
      orderId: `ORD-2026-${String(i).padStart(3, '0')}`,
      client: client._id,
      items: [{ battery: battery._id, quantity: Math.floor(Math.random() * 50) + 10, unitPrice: battery.price }],
      totalAmount: battery.price * 20,
      status: ['Pending', 'Confirmed', 'Manufacturing', 'QC', 'Packed', 'Shipped', 'Delivered'][Math.floor(Math.random() * 7)],
      paymentStatus: 'Paid',
      deliveryAddress: { street: '42 Main St', city: 'Pune', state: 'MH', pincode: '411001' },
      createdAt: d
    });
  }
  const createdOrders = await Order.insertMany(pastOrders);
  console.log('📦 Orders seeded');

  // 3. Create Cell Batches
  const cellBatches = [];
  for (let i = 1; i <= 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (Math.floor(Math.random() * 180)));
    cellBatches.push({
      batchNumber: `CB-2026-${String(i).padStart(4, '0')}`,
      cellChemistry: ['NMC', 'LFP', 'NCA', 'NiMH', 'LTO'][Math.floor(Math.random() * 5)],
      formationStage: ['Formation', 'Aging', 'Grading', 'Complete'][Math.floor(Math.random() * 4)],
      quantity: Math.floor(Math.random() * 5000) + 1000,
      yieldPercent: 85 + (Math.random() * 14),
      scrapPercent: Math.random() * 5,
      qcStatus: ['Passed', 'Passed', 'Passed', 'Failed', 'Rework'][Math.floor(Math.random() * 5)],
      qcScore: Math.floor(Math.random() * 20) + 80,
      defects: [{ type: 'High IR', count: Math.floor(Math.random() * 10), severity: 'Minor' }],
      assignedLine: ['Line A', 'Line B', 'Line C', 'Line D'][Math.floor(Math.random() * 4)],
      status: ['Completed', 'Completed', 'Completed', 'InProgress'][Math.floor(Math.random() * 4)],
      createdAt: d,
      productionStartDate: d
    });
  }
  await CellBatch.insertMany(cellBatches);
  console.log('🔋 Cell Batches seeded');

  // 4. Create BatchLogs
  const batchLogs = [];
  for (let i = 1; i <= 40; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (Math.floor(Math.random() * 180)));
    batchLogs.push({
      batchId: `SI-BATCH-2026-${String(i).padStart(4, '0')}`,
      battery: battery._id,
      batteryName: battery.name,
      quantity: Math.floor(Math.random() * 100) + 20,
      qcStatus: ['Passed', 'Passed', 'Passed', 'Failed', 'Rework'][Math.floor(Math.random() * 5)],
      qcScore: Math.floor(Math.random() * 15) + 85,
      defectRate: Math.random() * 4,
      status: ['Packed', 'Dispatched', 'QCPassed', 'QCFailed', 'InProduction'][Math.floor(Math.random() * 5)],
      createdAt: d,
      productionStartDate: d
    });
  }
  await BatchLog.insertMany(batchLogs);
  console.log('🏭 BatchLogs seeded');

  // 5. EnergyReadings
  const energyData = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    energyData.push({
      source: 'Total Plant',
      periodStart: d,
      periodEnd: d,
      kwhConsumed: Math.floor(Math.random() * 2000) + 5000,
      carbonKg: Math.floor(Math.random() * 500) + 1000,
      waterLiters: Math.floor(Math.random() * 1000) + 2000,
      costEstimate: Math.floor(Math.random() * 5000) + 15000,
      createdAt: d
    });
  }
  await EnergyReading.insertMany(energyData);
  console.log('⚡ Energy Readings seeded');

  console.log('✅ Manufacturing data seeded successfully! The admin dashboards will now display live graphs & tables.');
  
  await mongoose.disconnect();
  process.exit(0);
};

seedManufacturing().catch(err => {
  console.error(err);
  process.exit(1);
});
