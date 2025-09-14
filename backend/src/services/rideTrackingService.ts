/**
 * Ride tracking service for managing active rides and real-time location updates
 * Handles ride start, location tracking, and ride completion
 */

import { Server as SocketServer } from 'socket.io';
import Booking, { BookingStatus } from '../models/Booking';
import { RideOffer, RideOfferStatus } from '../models/RideOffer';
import { Types } from 'mongoose';

interface LocationUpdate {
  latitude: number;
  longitude: number;
  timestamp: Date;
  speed?: number;
  heading?: number;
}

interface RideTrackingData {
  rideId: string;
  driverId: string;
  riderIds: string[];
  currentLocation: LocationUpdate;
  route: {
    source: LocationUpdate;
    destination: LocationUpdate;
    waypoints?: LocationUpdate[];
  };
  status: 'starting' | 'in_progress' | 'completed' | 'cancelled';
  startedAt?: Date;
  estimatedArrival?: Date;
}

interface StartRideData {
  bookingId: string;
  driverId: string;
  initialLocation: LocationUpdate;
}

interface TrackingResponse {
  success: boolean;
  message: string;
  rideTracking?: RideTrackingData;
  error?: string;
}

export class RideTrackingService {
  private readonly io: SocketServer;
  private readonly activeRides: Map<string, RideTrackingData> = new Map();

  constructor(io: SocketServer) {
    this.io = io;
    this.setupSocketHandlers();
  }

  /**
   * Setup socket event handlers for real-time communication
   */
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Join ride tracking room
      socket.on('join-ride', (rideId: string) => {
        socket.join(`ride-${rideId}`);
        console.log(`Client ${socket.id} joined ride ${rideId}`);
      });

      // Leave ride tracking room
      socket.on('leave-ride', (rideId: string) => {
        socket.leave(`ride-${rideId}`);
        console.log(`Client ${socket.id} left ride ${rideId}`);
      });

      // Handle location updates from driver
      socket.on('location-update', (data: { rideId: string; location: LocationUpdate }) => {
        this.handleLocationUpdate(data.rideId, data.location);
      });

      // Handle ride completion
      socket.on('complete-ride', (data: { rideId: string; finalLocation: LocationUpdate }) => {
        this.handleRideCompletion(data.rideId, data.finalLocation);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Start a ride with initial tracking data
   */
  static async startRide(startData: StartRideData): Promise<TrackingResponse> {
    try {
      const { bookingId, driverId, initialLocation } = startData;

      // Find the booking
      const booking = await Booking.findOne({
        bookingId,
        driverId: new Types.ObjectId(driverId)
      }).populate(['rideOfferId', 'riderId']);

      if (!booking) {
        return { success: false, message: 'Booking not found or unauthorized' };
      }

      if (booking.status !== BookingStatus.CONFIRMED) {
        return { success: false, message: 'Booking is not confirmed for ride start' };
      }

      // Find the ride offer
      const rideOffer = await RideOffer.findById(booking.rideOfferId);
      if (!rideOffer) {
        return { success: false, message: 'Associated ride offer not found' };
      }

      // Update booking status
      booking.status = BookingStatus.CONFIRMED; // Keep as confirmed, will mark as completed later
      await booking.save();

      // Update ride offer status
      rideOffer.status = RideOfferStatus.ACTIVE;
      await rideOffer.save();

      // Create tracking data
      const trackingData: RideTrackingData = {
        rideId: bookingId,
        driverId,
        riderIds: [booking.riderId.toString()],
        currentLocation: initialLocation,
        route: {
          source: {
            latitude: rideOffer.source.coordinates.latitude,
            longitude: rideOffer.source.coordinates.longitude,
            timestamp: new Date()
          },
          destination: {
            latitude: rideOffer.destination.coordinates.latitude,
            longitude: rideOffer.destination.coordinates.longitude,
            timestamp: new Date()
          }
        },
        status: 'starting',
        startedAt: new Date(),
        estimatedArrival: new Date(rideOffer.schedule.departureDate.getTime() + (rideOffer.estimatedDuration || 3600) * 1000) // Default 1 hour if no duration
      };

      return {
        success: true,
        message: 'Ride started successfully',
        rideTracking: trackingData
      };
    } catch (error) {
      console.error('Error starting ride:', error);
      return {
        success: false,
        message: 'Failed to start ride',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle real-time location updates from driver
   */
  private handleLocationUpdate(rideId: string, location: LocationUpdate): void {
    const trackingData = this.activeRides.get(rideId);
    if (!trackingData) {
      console.warn(`No active tracking data found for ride ${rideId}`);
      return;
    }

    // Update current location
    trackingData.currentLocation = location;
    trackingData.status = 'in_progress';

    // Broadcast location update to all riders in this ride
    this.emitLocationUpdate(rideId, location);

    console.log(`Location update for ride ${rideId}: ${location.latitude}, ${location.longitude}`);
  }

  /**
   * Emit location update to ride participants
   */
  emitLocationUpdate(rideId: string, location: LocationUpdate): void {
    this.io.to(`ride-${rideId}`).emit('location-update', {
      rideId,
      location,
      timestamp: new Date()
    });
  }

  /**
   * Emit ride completion to ride participants
   */
  emitRideCompleted(rideId: string, finalLocation: LocationUpdate): void {
    this.io.to(`ride-${rideId}`).emit('ride-completed', {
      rideId,
      finalLocation,
      completedAt: new Date()
    });
  }

  /**
   * Handle ride completion
   */
  private async handleRideCompletion(rideId: string, finalLocation: LocationUpdate): Promise<void> {
    try {
      const trackingData = this.activeRides.get(rideId);
      if (!trackingData) {
        console.warn(`No active tracking data found for ride ${rideId}`);
        return;
      }

      // Update booking status to completed
      const booking = await Booking.findOne({ bookingId: rideId });
      if (booking) {
        booking.status = BookingStatus.COMPLETED;
        await booking.save();
      }

      // Update ride offer status
      const rideOffer = await RideOffer.findOne({
        driverId: new Types.ObjectId(trackingData.driverId)
      });
      if (rideOffer) {
        rideOffer.status = RideOfferStatus.COMPLETED;
        await rideOffer.save();
      }

      // Update tracking data
      trackingData.status = 'completed';
      trackingData.currentLocation = finalLocation;

      // Notify all participants
      this.io.to(`ride-${rideId}`).emit('ride-completed', {
        rideId,
        finalLocation,
        completedAt: new Date()
      });

      // Remove from active rides
      this.activeRides.delete(rideId);

      console.log(`Ride ${rideId} completed successfully`);
    } catch (error) {
      console.error(`Error completing ride ${rideId}:`, error);
    }
  }

  /**
   * Get current tracking data for a ride
   */
  static async getRideTracking(rideId: string, userId: string): Promise<TrackingResponse> {
    try {
      // Find booking to verify user access
      const booking = await Booking.findOne({
        bookingId: rideId,
        $or: [
          { riderId: new Types.ObjectId(userId) },
          { driverId: new Types.ObjectId(userId) }
        ]
      }).populate('rideOfferId');

      if (!booking) {
        return { success: false, message: 'Ride not found or access denied' };
      }

      const rideOffer = await RideOffer.findById(booking.rideOfferId);
      if (!rideOffer) {
        return { success: false, message: 'Ride offer not found' };
      }

      const trackingData: RideTrackingData = {
        rideId,
        driverId: booking.driverId.toString(),
        riderIds: [booking.riderId.toString()],
        currentLocation: {
          latitude: 0, // Will be updated by driver
          longitude: 0,
          timestamp: new Date()
        },
        route: {
          source: {
            latitude: rideOffer.source.coordinates.latitude,
            longitude: rideOffer.source.coordinates.longitude,
            timestamp: new Date()
          },
          destination: {
            latitude: rideOffer.destination.coordinates.latitude,
            longitude: rideOffer.destination.coordinates.longitude,
            timestamp: new Date()
          }
        },
        status: booking.status === BookingStatus.CONFIRMED ? 'in_progress' : 'starting'
      };

      return {
        success: true,
        message: 'Ride tracking data retrieved',
        rideTracking: trackingData
      };
    } catch (error) {
      console.error('Error getting ride tracking:', error);
      return {
        success: false,
        message: 'Failed to get ride tracking data',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Cancel active ride tracking
   */
  cancelRideTracking(rideId: string, cancelledBy: string): TrackingResponse {
    try {
      const trackingData = this.activeRides.get(rideId);
      if (!trackingData) {
        return { success: false, message: 'No active ride tracking found' };
      }

      // Update status
      trackingData.status = 'cancelled';

      // Notify all participants
      this.io.to(`ride-${rideId}`).emit('ride-cancelled', {
        rideId,
        cancelledBy,
        cancelledAt: new Date()
      });

      // Remove from active rides
      this.activeRides.delete(rideId);

      return {
        success: true,
        message: 'Ride tracking cancelled successfully'
      };
    } catch (error) {
      console.error('Error cancelling ride tracking:', error);
      return {
        success: false,
        message: 'Failed to cancel ride tracking',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

    /**
   * Get active rides for a user
   */
  static async getActiveRides(userId: string): Promise<{ success: boolean; activeRides?: RideTrackingData[]; error?: string }> {
    try {
      const activeBookings = await Booking.find({
        $or: [
          { riderId: new Types.ObjectId(userId) },
          { driverId: new Types.ObjectId(userId) }
        ],
        status: { $in: [BookingStatus.CONFIRMED] }
      }).populate('rideOfferId');

      const activeRides: RideTrackingData[] = [];

      for (const booking of activeBookings) {
        const rideOffer = await RideOffer.findById(booking.rideOfferId);
        if (!rideOffer) continue;

        const trackingData: RideTrackingData = {
          rideId: booking.bookingId,
          driverId: booking.driverId.toString(),
          riderIds: [booking.riderId.toString()],
          currentLocation: {
            latitude: 0,
            longitude: 0,
            timestamp: new Date()
          },
          route: {
            source: {
              latitude: rideOffer.source.coordinates.latitude,
              longitude: rideOffer.source.coordinates.longitude,
              timestamp: new Date()
            },
            destination: {
              latitude: rideOffer.destination.coordinates.latitude,
              longitude: rideOffer.destination.coordinates.longitude,
              timestamp: new Date()
            }
          },
          status: 'in_progress'
        };

        activeRides.push(trackingData);
      }

      return {
        success: true,
        activeRides
      };
    } catch (error) {
      console.error('Error getting active rides:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Singleton instance
let rideTrackingServiceInstance: RideTrackingService | null = null;

export const getRideTrackingService = (io?: SocketServer): RideTrackingService => {
  if (!rideTrackingServiceInstance) {
    if (!io) {
      throw new Error('Socket.IO server is required for first initialization');
    }
    rideTrackingServiceInstance = new RideTrackingService(io);
  }
  return rideTrackingServiceInstance;
};

export default RideTrackingService;
