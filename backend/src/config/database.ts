/**
 * Database connection configuration
 * Handles MongoDB connection with Mongoose
 */

import mongoose from 'mongoose';
import { logger } from '../utils/logger';

/**
 * Connect to MongoDB database
 * Uses connection string from environment variables
 */
export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ridesharing';
    
    const options = {
      // Connection pool settings
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      
      // Buffering settings
      bufferCommands: false,
    };

    const conn = await mongoose.connect(mongoURI, options);
    
    logger.info(`🍃 MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

/**
 * Close database connection
 * Used during graceful shutdown
 */
export const closeDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
};
