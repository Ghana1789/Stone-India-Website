import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const managerEmail = 'amit@stoneindia.com';
        let user = await User.findOne({ email: managerEmail });

        if (user) {
            console.log('User found, updating role to manager');
            user.role = 'manager';
            user.department = 'Machine Operator'; // Must be from DEPARTMENTS enum
            user.isActive = true;
            await user.save();
        } else {
            console.log('User not found, creating manager');
            user = await User.create({
                name: 'Amit Verma',
                email: managerEmail,
                password: 'password123',
                role: 'manager',
                department: 'Machine Operator',
                designation: 'Production Manager',
                employeeId: 'MGR001',
                isActive: true
            });
        }

        console.log('Manager user ready:', user.email, 'Role:', user.role);
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
};

seed();
