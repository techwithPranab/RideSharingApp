/**
 * Test script to run the seed database function
 */

import mongoose from 'mongoose';
import { seedDatabase } from './src/utils/seedDatabase';

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

// Main function
const main = async () => {
  try {
    await connectDB();
    await seedDatabase();
    console.log('🎉 Seed script completed successfully!');
  } catch (error) {
    console.error('❌ Seed script failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📪 Database connection closed');
  }
};

// Run the script
main();
