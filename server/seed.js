import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Battery from './models/Battery.js';
import Project from './models/Project.js';
import Invoice from './models/Invoice.js';
import Ticket from './models/Ticket.js';
import Document from './models/Document.js';
import Incident from './models/Incident.js';

dotenv.config();

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing
  await User.deleteMany({});
  await Battery.deleteMany({});
  await Project.deleteMany({});
  await Invoice.deleteMany({});
  await Ticket.deleteMany({});
  await Document.deleteMany({});
  await Incident.deleteMany({});
  console.log('🗑 Cleared existing data');

  // Create Users
  const createdUsers = await User.create([
    {
      name: 'Admin User',
      email: 'admin@stoneindia.com',
      password: 'Admin@123',
      role: 'admin',
      phone: '9800000001',
      isActive: true,
      isVerified: true
    },
    {
      name: 'Rajesh Kumar',
      email: 'client@stoneindia.com',
      password: 'Client@123',
      role: 'client',
      phone: '9800000002',
      company: 'EV Fleet Solutions Pvt Ltd',
      gstNumber: '29ABCDE1234F1Z5',
      address: { street: '42 Industrial Area', city: 'Pune', state: 'Maharashtra', pincode: '411001' },
      isActive: true,
      isVerified: true
    },
    {
      name: 'Priya Sharma',
      email: 'employee@stoneindia.com',
      password: 'Employee@123',
      role: 'employee',
      phone: '9800000003',
      employeeId: 'SI-EMP-001',
      department: 'R&D Engineer',
      designation: 'QC Engineer',
      shift: 'Morning',
      joiningDate: new Date('2023-06-01'),
      isActive: true,
      isVerified: true
    },
    {
      name: 'Amit Verma',
      email: 'amit@stoneindia.com',
      password: 'Manager@123',
      role: 'manager',
      phone: '9800000004',
      employeeId: 'SI-EMP-002',
      department: 'Production Supervisor',
      designation: 'Production Lead',
      shift: 'Evening',
      joiningDate: new Date('2022-01-15'),
      isActive: true,
      isVerified: true
    }
  ]);
  console.log('👥 Users created');

  // Create Battery Catalogue
  await Battery.create([
    {
      name: 'StonePack 48V 30Ah (2W)',
      sku: 'SI-LFP-48-30-2W',
      category: '2W/3W',
      description: 'High-performance LFP battery pack for electric two-wheelers. Designed for Indian roads with superior cycle life and thermal stability.',
      image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=500',
      specs: {
        voltage: '48V', capacity: '30Ah', chemistry: 'LFP',
        cycleLife: '2000+ cycles', chargingTime: '4-5 hours',
        weight: '11 kg', dimensions: '320×200×150 mm',
        operatingTemp: '-20°C to +60°C', peakPower: '3.5 kW',
        protection: 'IP67', compatibleVehicles: ['Hero Electric', 'Ather 450', 'Bajaj Chetak']
      },
      price: 28500, gstRate: 18, stock: 150, minOrderQty: 1, isFeatured: true,
      features: ['BMS Protection', 'Waterproof IP67', 'Fast Charge Ready', 'CAN Bus Interface'],
      certifications: ['BIS', 'AIS 038', 'UN38.3']
    },
    {
      name: 'StonePack 60V 40Ah (3W)',
      sku: 'SI-LFP-60-40-3W',
      category: '2W/3W',
      description: 'Robust 60V LFP battery for electric three-wheelers and cargo vehicles. Built for heavy-duty daily use.',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
      specs: {
        voltage: '60V', capacity: '40Ah', chemistry: 'LFP',
        cycleLife: '2500+ cycles', chargingTime: '6-7 hours',
        weight: '18 kg', dimensions: '400×250×180 mm',
        operatingTemp: '-20°C to +60°C', peakPower: '6 kW',
        protection: 'IP65', compatibleVehicles: ['Mahindra Treo', 'Piaggio Ape E-City']
      },
      price: 42000, gstRate: 18, stock: 80, minOrderQty: 1, isFeatured: true,
      features: ['Heavy Duty BMS', 'Cell Balancing', 'Overcharge Protection', 'CAN Bus'],
      certifications: ['BIS', 'AIS 048', 'UN38.3']
    },
    {
      name: 'StoneFleet 72V 100Ah (Bus/Truck)',
      sku: 'SI-NMC-72-100-FL',
      category: 'Fleet',
      description: 'Commercial-grade NMC battery module for electric buses, trucks and fleet vehicles. High energy density with advanced thermal management.',
      image: 'https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?w=500',
      specs: {
        voltage: '72V', capacity: '100Ah', chemistry: 'NMC',
        cycleLife: '1500+ cycles', chargingTime: '8-10 hours (AC), 2 hrs (DC Fast)',
        weight: '55 kg', dimensions: '600×400×350 mm',
        operatingTemp: '-10°C to +55°C', peakPower: '25 kW',
        protection: 'IP66', compatibleVehicles: ['TATA Ultra EV', 'JBM Ecolife', 'Olectra']
      },
      price: 185000, gstRate: 18, stock: 25, minOrderQty: 1, isFeatured: true,
      features: ['Liquid Cooling', 'CCS2 Compatible', 'Fleet Monitoring', 'OTA Updates'],
      certifications: ['BIS', 'AIS 100', 'ISO 26262', 'UN38.3']
    },
    {
      name: 'StoneGrid 200Ah BESS Module',
      sku: 'SI-LFP-200-BESS',
      category: 'Grid/BESS',
      description: 'Industrial-grade LFP battery for grid energy storage, solar backup and BESS applications.',
      image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=500',
      specs: {
        voltage: '48V', capacity: '200Ah', chemistry: 'LFP',
        cycleLife: '6000+ cycles', chargingTime: 'Configurable (0.5C-1C)',
        weight: '85 kg', dimensions: '700×500×400 mm',
        operatingTemp: '-20°C to +55°C', peakPower: '20 kW peak',
        protection: 'IP54'
      },
      price: 320000, gstRate: 18, stock: 15, minOrderQty: 1,
      features: ['Modular Design', 'Grid-tie Ready', 'Remote Monitoring', 'BMS with Comm'],
      certifications: ['IEC 62619', 'ISO 9001', 'CE Marked']
    },
    {
      name: 'StonePack 48V 20Ah (Economy)',
      sku: 'SI-LFP-48-20-2W',
      category: '2W/3W',
      description: 'Cost-effective LFP battery for mass-market electric two-wheelers and scooters.',
      image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=500',
      specs: {
        voltage: '48V', capacity: '20Ah', chemistry: 'LFP',
        cycleLife: '1500+ cycles', chargingTime: '3-4 hours',
        weight: '8.5 kg', dimensions: '280×180×130 mm',
        operatingTemp: '-20°C to +55°C', peakPower: '2.5 kW',
        protection: 'IP65'
      },
      price: 18500, gstRate: 18, stock: 200, minOrderQty: 5,
      features: ['Compact Design', 'Standard BMS', 'Swappable Option available'],
      certifications: ['BIS', 'AIS 038']
    },
    {
      name: 'StoneR&D 96V Custom Pack',
      sku: 'SI-NMC-96-RD',
      category: 'R&D',
      description: 'Custom high-voltage battery packs for R&D, EV prototypes, and racing applications.',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
      specs: {
        voltage: '96V', capacity: 'Custom', chemistry: 'NMC',
        cycleLife: '800+ cycles', chargingTime: 'Custom',
        weight: 'Custom', dimensions: 'Custom',
        operatingTemp: '-10°C to +50°C'
      },
      price: 450000, gstRate: 18, stock: 5, minOrderQty: 1,
      features: ['Fully Custom', 'Engineering Support', 'Prototype Ready', 'Data Logging BMS'],
      certifications: ['Custom Certification Available']
    }
  ]);
  console.log('🔋 Battery catalogue seeded');

  const clientUser = createdUsers.find(u => u.role === 'client');
  const adminUser = createdUsers.find(u => u.role === 'admin');

  if (clientUser) {
    // Projects
    const projects = await Project.create([
      {
        title: 'EV Fleet Battery Deployment - Phase 1',
        client: clientUser._id,
        assignedTeam: 'Manufacturing & QC',
        status: 'In progress',
        progressPercentage: 72,
        dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        milestones: [
          { title: 'Requirements', status: 'Completed', dueDate: new Date(new Date().setDate(new Date().getDate() - 20)) },
          { title: 'Cell Sorting', status: 'Completed', dueDate: new Date(new Date().setDate(new Date().getDate() - 10)) },
          { title: 'Assembly', status: 'In Progress', dueDate: new Date(new Date().setDate(new Date().getDate() + 5)) },
          { title: 'Testing', status: 'Upcoming', dueDate: new Date(new Date().setDate(new Date().getDate() + 15)) },
        ]
      },
      {
        title: 'Custom High-Voltage BMS Integration',
        client: clientUser._id,
        assignedTeam: 'R&D Engineering',
        status: 'On track',
        progressPercentage: 45,
        dueDate: new Date(new Date().setMonth(new Date().getMonth() + 2)),
        milestones: [
          { title: 'Design Specs', status: 'Completed', dueDate: new Date(new Date().setDate(new Date().getDate() - 10)) },
          { title: 'Prototyping', status: 'In Progress', dueDate: new Date(new Date().setDate(new Date().getDate() + 15)) },
          { title: 'Validation', status: 'Upcoming', dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)) },
        ]
      }
    ]);
    console.log('📁 Projects seeded');

    // Invoices
    await Invoice.create([
      {
        invoiceNumber: 'INV-2024-041',
        client: clientUser._id,
        projectTitle: projects[0].title,
        amount: 345000,
        status: 'Pending',
        issueDate: new Date(new Date().setDate(new Date().getDate() - 5)),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
      },
      {
        invoiceNumber: 'INV-2024-038',
        client: clientUser._id,
        projectTitle: 'Initial Consultation & Logistics setup',
        amount: 85000,
        status: 'Paid',
        issueDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        dueDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        paymentId: 'pay_MOCK1234'
      }
    ]);
    console.log('💳 Invoices seeded');

    // Tickets
    await Ticket.create([
      {
        ticketNumber: 'TKT-8291',
        client: clientUser._id,
        subject: 'Compatibility check for new inverter',
        description: 'Need to know if the StoneGrid 200Ah operates seamlessly with our latest hybrid inverters.',
        status: 'Open',
        priority: 'High',
        messages: [{
          senderId: clientUser._id,
          senderName: clientUser.name,
          senderRole: clientUser.role,
          message: 'Need to know if the StoneGrid 200Ah operates seamlessly with our latest hybrid inverters.'
        }]
      },
      {
        ticketNumber: 'TKT-8104',
        client: clientUser._id,
        subject: 'Invoice download issue',
        description: 'Cannot download INV-2024-038',
        status: 'Resolved',
        priority: 'Low',
        messages: [{
          senderId: clientUser._id,
          senderName: clientUser.name,
          senderRole: clientUser.role,
          message: 'Cannot download INV-2024-038'
        }, {
          senderId: adminUser._id,
          senderName: adminUser.name,
          senderRole: adminUser.role,
          message: 'This has been fixed. Please check now.'
        }]
      }
    ]);
    console.log('🎫 Tickets seeded');

    // Documents
    await Document.create([
      {
        title: 'StonePack 48V spec sheet.pdf',
        client: clientUser._id,
        uploadedBy: adminUser._id,
        uploaderRole: 'admin',
        fileUrl: '#/mock',
        fileType: 'application/pdf',
        sizeBytes: 1240000,
      },
      {
        title: 'Signed_NDA_Contract.pdf',
        client: clientUser._id,
        uploadedBy: clientUser._id,
        uploaderRole: 'client',
        fileUrl: '#/mock',
        fileType: 'application/pdf',
        sizeBytes: 2450000,
      }
    ]);
    console.log('📄 Documents seeded');
  }

  // Seeding Incidents
  await Incident.create([
    {
      title: 'Mixer Unit M-3 Overheating',
      type: 'Machine Failure',
      description: 'Temperature sensors reading above safe threshold on Mixer M-3. Cooling system may be blocked.',
      department: 'Production',
      reportedBy: createdUsers.find(u => u.email === 'employee@stoneindia.com')._id,
      status: 'Open',
      priority: 'Critical',
      affectedMachine: 'Mixer M-3',
      location: 'Line 2, Bay 3'
    },
    {
      title: 'QC Sensor Calibration Drift',
      type: 'Quality Issue',
      description: 'Cell voltage sensor showing ±5% drift beyond acceptable tolerance. Recalibration required.',
      department: 'Quality Control',
      reportedBy: createdUsers.find(u => u.email === 'employee@stoneindia.com')._id,
      status: 'Investigating',
      priority: 'High',
      affectedMachine: 'V-Sensor Array',
      location: 'QC Lab'
    },
    {
      title: 'Safety Equipment Check',
      type: 'Safety Concern',
      description: 'Fire extinguishers in Bay 4 nearing expiry date. Replacement scheduled.',
      department: 'Safety & Environment',
      reportedBy: createdUsers.find(u => u.email === 'admin@stoneindia.com')._id,
      status: 'Resolved',
      priority: 'Low',
      location: 'Bay 4',
      resolution: 'Extinguishers replaced by external vendor.',
      resolvedBy: adminUser._id,
      resolvedAt: new Date()
    }
  ]);
  console.log('🚨 Incidents seeded');

  console.log('\n✅ Database seeded successfully!');
  console.log('─────────────────────────────────────');
  console.log('Admin:    admin@stoneindia.com    / Admin@123');
  console.log('Client:   client@stoneindia.com  / Client@123');
  console.log('Employee: employee@stoneindia.com / Employee@123');
  console.log('─────────────────────────────────────');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
