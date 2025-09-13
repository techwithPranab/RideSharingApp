/**
 * Socket.IO service for real-time communication
 * Handles driver tracking, ride status updates, and in-app messaging
 */

import { Server, Socket } from 'socket.io';
import { User, UserRole } from '../models/User';
import { Ride, RideStatus } from '../models/Ride';
import { logger } from '../utils/logger';
const jwt = require('jsonwebtoken');

// Interface for authenticated socket
interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: UserRole;
}

// Store active connections
const activeConnections = new Map<string, AuthenticatedSocket>();

// Store user locations for tracking
const userLocations = new Map<string, { lat: number; lng: number; timestamp: Date }>();

/**
 * Handle Socket.IO connections and events
 */
const socketHandler = (io: Server) => {
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      // Extract token from handshake
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;

      // Get user from database
      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error('User not found'));
      }

      if (user.status !== 'active') {
        return next(new Error('User account is not active'));
      }

      // Attach user info to socket
      socket.userId = user._id.toString();
      socket.userRole = user.role;

      // Store connection
      activeConnections.set(user._id.toString(), socket);

      logger.info(`User ${socket.userId} connected via Socket.IO`);

      next();
    } catch (error) {
      logger.error('Socket authentication failed:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const userRole = socket.userRole!;

    logger.info(`User ${userId} (${userRole}) connected`);

    // Handle location updates
    socket.on('updateLocation', async (data: { lat: number; lng: number }) => {
      try {
        // Update user's current location in database
        await User.findByIdAndUpdate(userId, {
          currentLocation: {
            type: 'Point',
            coordinates: [data.lng, data.lat]
          },
          lastActiveAt: new Date()
        });

        // Store location for real-time tracking
        userLocations.set(userId, {
          lat: data.lat,
          lng: data.lng,
          timestamp: new Date()
        });

        // If user is a driver, broadcast location to nearby riders
        if (userRole === UserRole.DRIVER) {
          // Find active rides for this driver
          const activeRide = await Ride.findOne({
            driverId: userId,
            status: { $in: [RideStatus.ACCEPTED, RideStatus.STARTED] }
          });

          if (activeRide) {
            // Notify passengers about driver location
            for (const passenger of activeRide.passengers) {
              const passengerSocket = activeConnections.get(passenger.userId.toString());
              if (passengerSocket) {
                passengerSocket.emit('driverLocationUpdate', {
                  rideId: activeRide._id,
                  location: data,
                  timestamp: new Date()
                });
              }
            }
          }
        }

        socket.emit('locationUpdated', { success: true });
      } catch (error) {
        logger.error('Error updating location:', error);
        socket.emit('locationUpdateError', { error: 'Failed to update location' });
      }
    });

    // Handle ride status updates
    socket.on('updateRideStatus', async (data: { rideId: string; status: RideStatus }) => {
      try {
        const { rideId, status } = data;

        // Find the ride
        const ride = await Ride.findById(rideId)
          .populate('driverId', 'firstName lastName phoneNumber')
          .populate('passengers.userId', 'firstName lastName phoneNumber');

        if (!ride) {
          socket.emit('rideStatusUpdateError', { error: 'Ride not found' });
          return;
        }

        // Authorization check
        const isDriver = ride.driverId._id.toString() === userId;
        const isPassenger = ride.passengers.some(p => p.userId._id.toString() === userId);

        if (!isDriver && !isPassenger) {
          socket.emit('rideStatusUpdateError', { error: 'Unauthorized' });
          return;
        }

        // Update ride status
        await ride.updateStatus(status);

        // Notify all participants
        const participants = [ride.driverId._id.toString(), ...ride.passengers.map(p => p.userId._id.toString())];

        participants.forEach(participantId => {
          const participantSocket = activeConnections.get(participantId);
          if (participantSocket) {
            participantSocket.emit('rideStatusChanged', {
              rideId: ride._id,
              status: ride.status,
              timestamp: new Date(),
              updatedBy: userId
            });
          }
        });

        socket.emit('rideStatusUpdated', { success: true, rideId, status });
      } catch (error) {
        logger.error('Error updating ride status:', error);
        socket.emit('rideStatusUpdateError', { error: 'Failed to update ride status' });
      }
    });

    // Handle in-app messaging
    socket.on('sendMessage', async (data: { rideId: string; message: string; messageType?: string }) => {
      try {
        const { rideId, message, messageType = 'text' } = data;

        // Find the ride
        const ride = await Ride.findById(rideId);

        if (!ride) {
          socket.emit('messageError', { error: 'Ride not found' });
          return;
        }

        // Check if user is participant in the ride
        const isDriver = ride.driverId?.toString() === userId;
        const isPassenger = ride.passengers.some(p => p.userId.toString() === userId);

        if (!isDriver && !isPassenger) {
          socket.emit('messageError', { error: 'Unauthorized' });
          return;
        }

        // Create message object
        const messageData = {
          id: Date.now().toString(),
          rideId,
          senderId: userId,
          senderRole: userRole,
          message,
          messageType,
          timestamp: new Date()
        };

        // Notify all ride participants
        const participants = [ride.driverId?.toString(), ...ride.passengers.map(p => p.userId.toString())].filter(Boolean);

        participants.forEach(participantId => {
          const participantSocket = activeConnections.get(participantId);
          if (participantSocket) {
            participantSocket.emit('newMessage', messageData);
          }
        });

        socket.emit('messageSent', { success: true, messageId: messageData.id });
      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('messageError', { error: 'Failed to send message' });
      }
    });

    // Handle driver availability updates
    socket.on('updateAvailability', async (data: { isAvailable: boolean }) => {
      try {
        if (userRole !== UserRole.DRIVER) {
          socket.emit('availabilityUpdateError', { error: 'Only drivers can update availability' });
          return;
        }

        // Update driver availability
        await User.findByIdAndUpdate(userId, {
          isAvailable: data.isAvailable,
          lastActiveAt: new Date()
        });

        socket.emit('availabilityUpdated', { success: true, isAvailable: data.isAvailable });
      } catch (error) {
        logger.error('Error updating availability:', error);
        socket.emit('availabilityUpdateError', { error: 'Failed to update availability' });
      }
    });

    // Handle emergency/SOS alerts
    socket.on('sosAlert', async (data: { rideId: string; location: { lat: number; lng: number }; message?: string }) => {
      try {
        const { rideId, location, message } = data;

        // Find the ride
        const ride = await Ride.findById(rideId);

        if (!ride) {
          socket.emit('sosError', { error: 'Ride not found' });
          return;
        }

        // Check if user is participant in the ride
        const isDriver = ride.driverId?.toString() === userId;
        const isPassenger = ride.passengers.some(p => p.userId.toString() === userId);

        if (!isDriver && !isPassenger) {
          socket.emit('sosError', { error: 'Unauthorized' });
          return;
        }

        // Update ride with SOS alert
        ride.sosAlerted = true;
        await ride.save();

        // Create SOS alert data
        const sosData = {
          rideId,
          userId,
          userRole,
          location,
          message: message || 'Emergency alert triggered',
          timestamp: new Date()
        };

        // Notify emergency contacts and admin
        // In a real implementation, this would also trigger emergency services
        logger.error(`SOS ALERT: ${JSON.stringify(sosData)}`);

        // Notify all ride participants
        const participants = [ride.driverId?.toString(), ...ride.passengers.map(p => p.userId.toString())].filter(Boolean);

        participants.forEach(participantId => {
          const participantSocket = activeConnections.get(participantId);
          if (participantSocket) {
            participantSocket.emit('sosTriggered', sosData);
          }
        });

        socket.emit('sosAlerted', { success: true });
      } catch (error) {
        logger.error('Error handling SOS alert:', error);
        socket.emit('sosError', { error: 'Failed to send SOS alert' });
      }
    });

    // Handle ride tracking requests
    socket.on('startRideTracking', async (data: { rideId: string }) => {
      try {
        const { rideId } = data;

        // Find the ride
        const ride = await Ride.findById(rideId);

        if (!ride) {
          socket.emit('trackingError', { error: 'Ride not found' });
          return;
        }

        // Check if user is participant in the ride
        const isDriver = ride.driverId?.toString() === userId;
        const isPassenger = ride.passengers.some(p => p.userId.toString() === userId);

        if (!isDriver && !isPassenger) {
          socket.emit('trackingError', { error: 'Unauthorized' });
          return;
        }

        // Join ride-specific room for tracking
        socket.join(`ride-${rideId}`);

        socket.emit('trackingStarted', { success: true, rideId });
      } catch (error) {
        logger.error('Error starting ride tracking:', error);
        socket.emit('trackingError', { error: 'Failed to start tracking' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User ${userId} disconnected`);

      // Remove from active connections
      activeConnections.delete(userId);

      // Remove from locations
      userLocations.delete(userId);

      // Update last active time
      User.findByIdAndUpdate(userId, {
        lastActiveAt: new Date()
      }).catch(error => {
        logger.error('Error updating last active time:', error);
      });
    });

    // Handle connection errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${userId}:`, error);
    });
  });

  // Periodic cleanup of stale locations
  setInterval(() => {
    const now = new Date();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [userId, location] of userLocations.entries()) {
      if (now.getTime() - location.timestamp.getTime() > staleThreshold) {
        userLocations.delete(userId);
      }
    }
  }, 60 * 1000); // Run every minute

  logger.info('Socket.IO handlers initialized');
};

export default socketHandler;
