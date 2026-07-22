export const mockUsers = [
  {
    _id: 'mock-admin-id',
    name: 'Admin User',
    email: 'admin@stoneindia.com',
    password: 'Admin@123',
    role: 'admin',
    phone: '9800000001',
    isActive: true
  },
  {
    _id: 'mock-manager-id',
    name: 'Rajan Mehta',
    email: 'manager@stoneindia.com',
    password: 'Manager@123',
    role: 'manager',
    department: 'Production',
    designation: 'Production Manager',
    shift: 'Morning',
    phone: '9800000002',
    isActive: true
  },
  {
    _id: 'mock-client-id',
    name: 'Rajesh Kumar',
    email: 'client@stoneindia.com',
    password: 'Client@123',
    role: 'client',
    company: 'EV Fleet Solutions Pvt Ltd',
    gstNumber: '29ABCDE1234F1Z5',
    address: { street: '42 Industrial Area', city: 'Pune', state: 'Maharashtra', pincode: '411001' },
    isActive: true
  },
  {
    _id: 'mock-emp-id',
    name: 'Priya Sharma',
    email: 'employee@stoneindia.com',
    password: 'Employee@123',
    role: 'employee',
    employeeId: 'SI-EMP-001',
    department: 'Quality Control',
    designation: 'QC Engineer',
    shift: 'Morning',
    isActive: true
  }
];

export const mockBatteries = [
  {
    _id: 'bat-001',
    name: 'StonePack 48V 30Ah (2W)',
    sku: 'SI-LFP-48-30-2W',
    category: '2W/3W',
    description: 'High-performance LFP battery pack for electric two-wheelers. Designed for Indian roads with superior cycle life and thermal stability.',
    image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=500',
    specs: { voltage: '48V', capacity: '30Ah', chemistry: 'LFP', cycleLife: '2000+ cycles', chargingTime: '4-5 hours', protection: 'IP67' },
    price: 28500, gstRate: 18, stock: 150, minOrderQty: 1, isFeatured: true,
    features: ['BMS Protection', 'Waterproof IP67', 'Fast Charge Ready'],
    certifications: ['BIS', 'AIS 038', 'UN38.3']
  },
  {
    _id: 'bat-002',
    name: 'StonePack 60V 40Ah (3W)',
    sku: 'SI-LFP-60-40-3W',
    category: '2W/3W',
    description: 'Robust 60V LFP battery for electric three-wheelers and cargo vehicles.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
    specs: { voltage: '60V', capacity: '40Ah', chemistry: 'LFP', cycleLife: '2500+ cycles', chargingTime: '6-7 hours', protection: 'IP65' },
    price: 42000, gstRate: 18, stock: 80, minOrderQty: 1, isFeatured: true,
    features: ['Heavy Duty BMS', 'Cell Balancing'],
    certifications: ['BIS', 'AIS 048']
  },
  {
    _id: 'bat-003',
    name: 'StoneFleet 72V 100Ah (Bus/Truck)',
    sku: 'SI-NMC-72-100-FL',
    category: 'Fleet',
    description: 'Commercial-grade NMC battery module for electric buses and trucks.',
    image: 'https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?w=500',
    specs: { voltage: '72V', capacity: '100Ah', chemistry: 'NMC', cycleLife: '1500+ cycles', protection: 'IP66' },
    price: 185000, gstRate: 18, stock: 25, minOrderQty: 1, isFeatured: true,
    features: ['Liquid Cooling', 'CCS2 Compatible'],
    certifications: ['BIS', 'AIS 100', 'ISO 26262']
  }
];

export const mockOrders = [
  {
    _id: 'ord-001', orderId: 'ORD-2026-001', client: 'mock-client-id',
    items: [{ battery: 'bat-001', quantity: 2, price: 28500 }],
    totalAmount: 57000, status: 'QC', createdAt: new Date()
  }
];

export const mockTasks = [
  {
    _id: 'task-001', title: 'Quality Check Batch #042',
    description: 'Perform full QC on StonePack 48V 30Ah batch.',
    assignedTo: ['mock-emp-id'], status: 'InProgress', priority: 'High', deadline: new Date()
  }
];

export const mockIncidents = [
  {
    _id: 'inc-001', title: 'Mixer Unit M-3 Overheating',
    type: 'Machine Failure', description: 'Mixer M-3 in Production line showing temperature alerts. Requires immediate maintenance inspection.',
    department: 'Production', reportedBy: 'mock-emp-id',
    status: 'Open', priority: 'High', location: 'Line 2, Bay 3',
    affectedMachine: 'Mixer M-3', createdAt: new Date()
  },
  {
    _id: 'inc-002', title: 'Chemical Spill Near Bay 5',
    type: 'Safety Concern', description: 'Minor electrolyte spill detected near coating station. Area cordoned off, cleanup in progress.',
    department: 'Safety & Environment', reportedBy: 'mock-emp-id',
    status: 'Investigating', priority: 'Critical', location: 'Bay 5', createdAt: new Date()
  }
];

