import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const employeesToSeed = [
    {
        name: 'Suresh Kumar',
        email: 'suresh@stoneindia.com',
        password: 'password123',
        role: 'employee',
        department: 'Machine Operator',
        designation: 'Senior Operator',
        employeeId: 'EMP001',
        performance: { score: 85, rating: 'Excellent' }
    },
    {
        name: 'Anita Rao',
        email: 'anita@stoneindia.com',
        password: 'password123',
        role: 'employee',
        department: 'Machine Operator',
        designation: 'Junior Operator',
        employeeId: 'EMP002',
        performance: { score: 72, rating: 'Good' }
    },
    {
        name: 'Rahul Singh',
        email: 'rahul@stoneindia.com',
        password: 'password123',
        role: 'employee',
        department: 'Machine Operator',
        designation: 'Technician',
        employeeId: 'EMP003',
        performance: { score: 65, rating: 'Average' }
    },
    {
        name: 'Priya Sharma',
        email: 'priya@stoneindia.com',
        password: 'password123',
        role: 'employee',
        department: 'Sales Executive', // Different department to test filtering
        designation: 'Sales Lead',
        employeeId: 'EMP004'
    }
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        for (const empData of employeesToSeed) {
            const existing = await User.findOne({ email: empData.email });
            if (!existing) {
                await User.create(empData);
                console.log(`Created employee: ${empData.name}`);
            } else {
                console.log(`Employee already exists: ${empData.email}`);
            }
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

seed();
