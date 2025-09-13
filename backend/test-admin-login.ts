/**
 * Test admin login
 */

import mongoose from 'mongoose';
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
    console.log('🔍 Checking admin user...');

    const admin = await User.findOne({ email: 'admin@rideshare.com' }).select('+password');
    if (admin) {
      console.log('✅ Admin found:', admin.email);
      console.log('Password hash exists:', !!admin.password);
      console.log('Role:', admin.role);
      console.log('Status:', admin.status);
      console.log('Phone verified:', admin.isPhoneVerified);
      console.log('Email verified:', admin.isEmailVerified);

      // Test password comparison
      const isValid = await admin.comparePassword('admin123');
      console.log('Password "admin123" valid:', isValid);

      if (!isValid) {
        console.log('❌ Password validation failed!');
      } else {
        console.log('✅ Password validation successful!');
      }
    } else {
      console.log('❌ Admin user not found');
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
