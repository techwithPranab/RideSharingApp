/**
 * Main server entry point for the RideSharing App
 * Initializes Express server, connects to MongoDB, and sets up middleware
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';

import { connectDB } from './config/database';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import socketHandler from './services/socketService';
import { emailService } from './services/emailService';

// Import routes
import authRoutes from './routes/authRoutes';
import rideRoutes from './routes/rideRoutes';
import paymentRoutes from './routes/paymentRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import adminRoutes from './routes/adminRoutes';
import driverRoutes from './routes/driverRoutes';
import rideOfferRoutes from './routes/rideOfferRoutes';
import placesRoutes from './routes/placesRoutes';

// Load environment variables
dotenv.config();
console.log('Environment variables loaded. EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('LOCATIONIQ_API_KEY loaded:', process.env.LOCATIONIQ_API_KEY ? 'YES' : 'NO');
console.log('MAPBOX_ACCESS_TOKEN loaded:', process.env.MAPBOX_ACCESS_TOKEN ? 'YES' : 'NO');

// Create Express app
const app = express();
const httpServer = createServer(app);

// CORS configuration for mobile apps and web clients
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

    // Allow localhost origins for development
    if (origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('exp://localhost:') ||
        origin.startsWith('exp://127.0.0.1:')) {
      return callback(null, true);
    }

    // Allow Expo development server origins
    if (/^exp:\/\/(\d+\.\d+\.\d+\.\d+|\w+):\d+$/.test(origin)) {
      return callback(null, true);
    }

    // Check against explicitly allowed origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // Deny access for production
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: corsOptions
});

// Connect to MongoDB
connectDB();

// Initialize email service
(async () => {
  try {
    await emailService.initialize();
    logger.info('📧 Email service initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize email service:', error);
    // Don't exit the process, just log the error
  }
})();

// Security middleware
app.use(helmet());
app.use(cors(corsOptions));
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/ride-offers', rideOfferRoutes);
app.use('/api/places', placesRoutes);

// Socket.IO connection handling
socketHandler(io);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  logger.info(`🚀 RideSharing API server is running on port ${PORT}`);
  logger.info(`📱 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔌 Socket.IO enabled for real-time communication`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export { app, io };
