/**
 * Test script to check admin login
 */

import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User } from './src/models/User';

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rideshare';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test admin login
const testAdminLogin = async () => {
  try {
    console.log('🔍 Checking admin users...');

    // Find admin users
    const admins = await User.find({ role: 'admin' }).select('+password');
    console.log(`Found ${admins.length} admin users:`);

    for (const admin of admins) {
      console.log(`- ${admin.firstName} ${admin.lastName}: ${admin.email} (${admin.phoneNumber})`);
      console.log(`  Status: ${admin.status}`);
      console.log(`  Password hash exists: ${!!admin.password}`);
      console.log(`  KYC Status: ${admin.kycStatus}`);
      console.log(`  Phone Verified: ${admin.isPhoneVerified}`);
      console.log(`  Email Verified: ${admin.isEmailVerified}`);

      // Test password comparison
      if (admin.password) {
        const isValidPassword = await bcrypt.compare('admin123', admin.password);
        console.log(`  Password 'admin123' valid: ${isValidPassword}`);

        if (admin.firstName === 'Operations') {
          const isValidManagerPassword = await bcrypt.compare('manager123', admin.password);
          console.log(`  Password 'manager123' valid: ${isValidManagerPassword}`);
        }
      }
      console.log('');
    }

    // Test login simulation
    console.log('🔐 Testing login simulation...');
    const adminUser = await User.findOne({ email: 'admin@rideshare.com' }).select('+password');
    if (adminUser) {
      console.log('Found admin user by email');
      const isValid = await adminUser.comparePassword('admin123');
      console.log(`Password comparison result: ${isValid}`);
    } else {
      console.log('❌ Admin user not found by email');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await testAdminLogin();
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📪 Database connection closed');
  }
};

// Run the script
main();
