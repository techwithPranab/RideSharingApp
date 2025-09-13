/**
 * Script to fix admin passwords
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

// Fix admin passwords
const fixAdminPasswords = async () => {
  try {
    console.log('🔧 Fixing admin passwords...');

    // Find and update Super Admin
    const superAdmin = await User.findOne({ email: 'admin@rideshare.com' });
    if (superAdmin) {
      superAdmin.password = 'admin123'; // This will be hashed by the pre-save middleware
      await superAdmin.save();
      console.log('✅ Super Admin password updated');
    }

    // Find and update Operations Manager
    const manager = await User.findOne({ email: 'manager@rideshare.com' });
    if (manager) {
      manager.password = 'manager123'; // This will be hashed by the pre-save middleware
      await manager.save();
      console.log('✅ Operations Manager password updated');
    }

    console.log('🎉 Admin passwords fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing passwords:', error);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await fixAdminPasswords();
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📪 Database connection closed');
  }
};

// Run the script
main();
