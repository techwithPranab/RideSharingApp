/**
 * Ride tracking controller for handling ride start, tracking, and completion
 * Provides endpoints for real-time ride tracking functionality
 */

import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import RideTrackingService, { getRideTrackingService } from '../services/rideTrackingService';
import Booking, { BookingStatus } from '../models/Booking';

export class RideTrackingController {
  /**
   * Start a ride with initial location tracking
   * POST /api/rides/:bookingId/start
   */
  static async startRide(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const { latitude, longitude, speed, heading } = req.body;
      const driverId = req.user?.id;

      if (!driverId) {
        ApiResponse.error(res, 'Authentication required', 401);
        return;
      }

      if (!latitude || !longitude) {
        ApiResponse.error(res, 'Current location (latitude, longitude) is required', 400);
        return;
      }

      // Verify booking exists and belongs to driver
      const booking = await Booking.findOne({
        bookingId,
        driverId
      });

      if (!booking) {
        ApiResponse.error(res, 'Booking not found or unauthorized', 404);
        return;
      }

      if (booking.status !== BookingStatus.CONFIRMED) {
        ApiResponse.error(res, 'Booking is not confirmed for ride start', 400);
        return;
      }

      const initialLocation: any = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timestamp: new Date()
      };

      if (speed !== undefined) initialLocation.speed = parseFloat(speed);
      if (heading !== undefined) initialLocation.heading = parseFloat(heading);

      const result = await RideTrackingService.startRide({
        bookingId,
        driverId,
        initialLocation
      });

      if (!result.success) {
        ApiResponse.error(res, result.message, 400);
        return;
      }

      ApiResponse.success(res, result.rideTracking, 201);
    } catch (error) {
      console.error('Error in startRide:', error);
      ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Get ride tracking data
   * GET /api/rides/:rideId/tracking
   */
  static async getRideTracking(req: Request, res: Response): Promise<void> {
    try {
      const { rideId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        ApiResponse.error(res, 'Authentication required', 401);
        return;
      }

      const result = await RideTrackingService.getRideTracking(rideId, userId);

      if (!result.success) {
        ApiResponse.error(res, result.message, 404);
        return;
      }

      ApiResponse.success(res, result.rideTracking);
    } catch (error) {
      console.error('Error in getRideTracking:', error);
      ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Update driver location (called by mobile app)
   * PUT /api/rides/:rideId/location
   */
  static async updateLocation(req: Request, res: Response): Promise<void> {
    try {
      const { rideId } = req.params;
      const { latitude, longitude, speed, heading } = req.body;
      const driverId = req.user?.id;

      if (!driverId) {
        ApiResponse.error(res, 'Authentication required', 401);
        return;
      }

      if (!latitude || !longitude) {
        ApiResponse.error(res, 'Location coordinates are required', 400);
        return;
      }

      const locationUpdate: any = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timestamp: new Date()
      };

      if (speed !== undefined) locationUpdate.speed = parseFloat(speed);
      if (heading !== undefined) locationUpdate.heading = parseFloat(heading);

      // Emit location update via socket
      const rideTrackingService = getRideTrackingService();
      rideTrackingService.emitLocationUpdate(rideId, locationUpdate);

      ApiResponse.success(res, { message: 'Location updated successfully' });
    } catch (error) {
      console.error('Error in updateLocation:', error);
      ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Complete a ride
   * PUT /api/rides/:rideId/complete
   */
  static async completeRide(req: Request, res: Response): Promise<void> {
    try {
      const { rideId } = req.params;
      const { latitude, longitude } = req.body;
      const driverId = req.user?.id;

      if (!driverId) {
        ApiResponse.error(res, 'Authentication required', 401);
        return;
      }

      if (!latitude || !longitude) {
        ApiResponse.error(res, 'Final location coordinates are required', 400);
        return;
      }

      const finalLocation: any = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timestamp: new Date()
      };

      // Emit ride completion via socket
      const rideTrackingService = getRideTrackingService();
      rideTrackingService.emitRideCompleted(rideId, finalLocation);

      // Update booking and ride offer status
      const booking = await Booking.findOne({ bookingId: rideId, driverId });
      if (booking) {
        booking.status = BookingStatus.COMPLETED;
        await booking.save();
      }

      ApiResponse.success(res, { message: 'Ride completed successfully' });
    } catch (error) {
      console.error('Error in completeRide:', error);
      ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Get active rides for current user
   * GET /api/rides/active
   */
  static async getActiveRides(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        ApiResponse.error(res, 'Authentication required', 401);
        return;
      }

      const result = await RideTrackingService.getActiveRides(userId);

      if (!result.success) {
        ApiResponse.error(res, 'Failed to fetch active rides', 500);
        return;
      }

      ApiResponse.success(res, result.activeRides);
    } catch (error) {
      console.error('Error in getActiveRides:', error);
      ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Cancel active ride tracking
   * PUT /api/rides/:rideId/cancel-tracking
   */
  static async cancelRideTracking(req: Request, res: Response): Promise<void> {
    try {
      const { rideId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        ApiResponse.error(res, 'Authentication required', 401);
        return;
      }

      const rideTrackingService = getRideTrackingService();
      const result = rideTrackingService.cancelRideTracking(rideId, userId);

      if (!result.success) {
        ApiResponse.error(res, result.message, 400);
        return;
      }

      ApiResponse.success(res, { message: result.message });
    } catch (error) {
      console.error('Error in cancelRideTracking:', error);
      ApiResponse.error(res, 'Internal server error', 500);
    }
  }
}

export default RideTrackingController;
