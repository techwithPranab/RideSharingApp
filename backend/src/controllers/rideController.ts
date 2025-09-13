/**
 * Ride controller for handling ride-related API endpoints
 * Manages ride creation, matching, status updates, and ride lifecycle
 */

import { Request, Response } from 'express';
import { RideService, RideRequest } from '../services/rideService';
import { Ride, RideStatus } from '../models/Ride';
import { User, UserRole } from '../models/User';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../middleware/asyncHandler';
import { logger } from '../utils/logger';
import { SubscriptionService } from '../services/subscriptionService';
import { PaymentService } from '../services/paymentService';
import { PaymentMethod } from '../models/Payment';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Helper function to convert payment method string to PaymentMethod enum
 */
function convertPaymentMethodToEnum(paymentMethod: string): PaymentMethod {
  switch (paymentMethod) {
    case 'cash':
      return PaymentMethod.CASH;
    case 'card':
      return PaymentMethod.CARD;
    case 'upi':
      return PaymentMethod.UPI;
    case 'wallet':
      return PaymentMethod.WALLET;
    default:
      return PaymentMethod.WALLET; // Default fallback
  }
}

export class RideController {
  /**
   * Create a new ride request
   * POST /api/rides
   */
  static readonly createRide = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    if (userRole !== UserRole.RIDER) {
      ApiResponse.error(res, 'Only riders can create ride requests', 403);
      return;
    }

    const {
      pickupLocation,
      dropoffLocation,
      isPooled,
      preferredVehicleType,
      specialInstructions,
      paymentMethod
    } = req.body;

    // Validate required fields
    if (!pickupLocation || !dropoffLocation || !paymentMethod) {
      ApiResponse.error(res, 'Missing required fields: pickupLocation, dropoffLocation, paymentMethod', 400);
      return;
    }

    // Validate location format
    if (!pickupLocation.coordinates || !dropoffLocation.coordinates ||
        pickupLocation.coordinates.length !== 2 || dropoffLocation.coordinates.length !== 2) {
      ApiResponse.error(res, 'Invalid location format. Must include coordinates array [lng, lat]', 400);
      return;
    }

    try {
      // Check if user has an active ride
      const activeRide = await Ride.findOne({
        'passengers.userId': userId,
        status: { $in: [RideStatus.REQUESTED, RideStatus.ACCEPTED, RideStatus.STARTED] }
      });

      if (activeRide) {
        ApiResponse.error(res, 'You already have an active ride. Complete or cancel it first.', 400);
        return;
      }

      // Check for active subscription and apply discount
      let subscriptionDiscount = 0;
      let appliedSubscriptionId: string | undefined;

      const subscriptionValidation = await SubscriptionService.validateSubscriptionForRide(userId);
      if (subscriptionValidation.isValid && subscriptionValidation.discount) {
        subscriptionDiscount = subscriptionValidation.discount;
        appliedSubscriptionId = (subscriptionValidation.subscription as any)._id?.toString();
        logger.info(`Applying subscription discount: ${subscriptionDiscount}% for user ${userId}`);
      }

      // Create ride request object
      const rideRequest: RideRequest = {
        pickupLocation: {
          type: 'Point',
          coordinates: pickupLocation.coordinates
        },
        dropoffLocation: {
          type: 'Point',
          coordinates: dropoffLocation.coordinates
        },
        isPooled: isPooled || false,
        preferredVehicleType,
        specialInstructions,
        paymentMethod,
        subscriptionDiscount
      };

      // Add appliedSubscriptionId only if it's defined
      if (appliedSubscriptionId) {
        (rideRequest as any).appliedSubscriptionId = appliedSubscriptionId;
      }

      // Find matching drivers
      const matches = await RideService.matchRide(rideRequest);

      if (matches.length === 0) {
        ApiResponse.error(res, 'No drivers available at the moment. Please try again later.', 404);
        return;
      }

      // For now, assign the closest driver
      const bestMatch = matches[0];

      // Create the ride
      const ride = await RideService.createRide(userId, rideRequest, bestMatch.driver);

      // Populate ride details for response
      await ride.populate('driverId', 'firstName lastName phoneNumber averageRating currentLocation');
      await ride.populate('vehicleId', 'make model licensePlate type color');
      await ride.populate('passengers.userId', 'firstName lastName phoneNumber avatar');

      logger.info(`Ride created: ${ride._id} for user ${userId}`);

      ApiResponse.success(res, {
        message: 'Ride created successfully',
        ride: {
          id: ride._id,
          status: ride.status,
          pickupLocation: ride.passengers[0].pickupLocation,
          dropoffLocation: ride.passengers[0].dropoffLocation,
          driver: ride.driverId,
          vehicle: ride.vehicleId,
          estimatedFare: ride.totalFare,
          estimatedDistance: ride.estimatedDistance,
          estimatedDuration: ride.estimatedDuration,
          otp: ride.otp,
          createdAt: ride.requestedAt
        }
      }, 201);

    } catch (error) {
      logger.error('Error creating ride:', error);
      ApiResponse.error(res, 'Failed to create ride. Please try again.', 500);
    }
  });

  /**
   * Search for available rides/drivers
   * POST /api/rides/search
   */
  static readonly searchRides = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    if (userRole !== UserRole.RIDER) {
      ApiResponse.error(res, 'Only riders can search for rides', 403);
      return;
    }

    const { pickupLocation, dropoffLocation, preferredVehicleType } = req.body;

    // Validate required fields
    if (!pickupLocation || !dropoffLocation) {
      ApiResponse.error(res, 'Missing required fields: pickupLocation, dropoffLocation', 400);
      return;
    }

    // Validate location format
    if (!pickupLocation.coordinates || !dropoffLocation.coordinates ||
        pickupLocation.coordinates.length !== 2 || dropoffLocation.coordinates.length !== 2) {
      ApiResponse.error(res, 'Invalid location format. Must include coordinates array [lng, lat]', 400);
      return;
    }

    try {
      // Create ride request object for matching
      const rideRequest: RideRequest = {
        pickupLocation: {
          type: 'Point',
          coordinates: pickupLocation.coordinates
        },
        dropoffLocation: {
          type: 'Point',
          coordinates: dropoffLocation.coordinates
        },
        isPooled: false,
        preferredVehicleType,
        paymentMethod: 'cash' // Default for search
      };

      // Find matching drivers
      const matches = await RideService.matchRide(rideRequest);

      if (matches.length === 0) {
        ApiResponse.success(res, {
          message: 'No drivers available',
          matches: [],
          estimatedFare: null
        });
        return;
      }

      // Format response
      const formattedMatches = matches.slice(0, 5).map(match => ({
        driver: {
          id: match.driver._id,
          firstName: match.driver.firstName,
          lastName: match.driver.lastName,
          phoneNumber: match.driver.phoneNumber,
          averageRating: match.driver.averageRating,
          currentLocation: match.driver.currentLocation
        },
        vehicle: {
          id: (match.vehicle as any)._id,
          make: match.vehicle.make,
          model: match.vehicle.model,
          licensePlate: match.vehicle.licensePlate,
          type: match.vehicle.type,
          color: match.vehicle.color
        },
        estimatedFare: match.estimatedFare,
        estimatedDistance: match.estimatedDistance,
        estimatedDuration: match.estimatedDuration,
        distance: match.distance
      }));

      ApiResponse.success(res, {
        message: 'Available drivers found',
        matches: formattedMatches,
        estimatedFare: matches[0].estimatedFare
      });

    } catch (error) {
      logger.error('Error searching rides:', error);
      ApiResponse.error(res, 'Failed to search for rides. Please try again.', 500);
    }
  });

  /**
   * Get ride details
   * GET /api/rides/:rideId
   */
  static readonly getRide = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    const { rideId } = req.params;

    if (!rideId) {
      ApiResponse.error(res, 'Ride ID is required', 400);
      return;
    }

    try {
      const ride = await RideService.getRideDetails(rideId, userId);

      if (!ride) {
        ApiResponse.error(res, 'Ride not found or access denied', 404);
        return;
      }

      ApiResponse.success(res, {
        ride: {
          id: ride._id,
          status: ride.status,
          isPooled: ride.isPooled,
          capacity: ride.capacity,
          driver: ride.driverId,
          vehicle: ride.vehicleId,
          passengers: ride.passengers,
          route: ride.route,
          estimatedDistance: ride.estimatedDistance,
          estimatedDuration: ride.estimatedDuration,
          baseFare: ride.baseFare,
          totalFare: ride.totalFare,
          driverEarnings: ride.driverEarnings,
          platformCommission: ride.platformCommission,
          paymentMethod: ride.paymentMethod,
          otp: ride.otp,
          startedAt: ride.startedAt,
          completedAt: ride.completedAt,
          cancelledAt: ride.cancelledAt,
          requestedAt: ride.requestedAt,
          sosAlerted: ride.sosAlerted
        }
      });

    } catch (error) {
      logger.error('Error getting ride details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get ride details';
      ApiResponse.error(res, errorMessage, 500);
    }
  });

  /**
   * Update ride status
   * PATCH /api/rides/:rideId/status
   */
  static readonly updateRideStatus = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    const { rideId } = req.params;
    const { status } = req.body;

    if (!rideId || !status) {
      ApiResponse.error(res, 'Missing required fields: rideId, status', 400);
      return;
    }

    // Validate status
    if (!Object.values(RideStatus).includes(status)) {
      ApiResponse.error(res, 'Invalid ride status', 400);
      return;
    }

    try {
      const ride = await RideService.updateRideStatus(rideId, status, userId, userRole);

      logger.info(`Ride ${rideId} status updated to ${status} by user ${userId}`);

      ApiResponse.success(res, {
        message: 'Ride status updated successfully',
        ride: {
          id: ride._id,
          status: ride.status,
          updatedAt: new Date()
        }
      });

    } catch (error) {
      logger.error('Error updating ride status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update ride status';
      ApiResponse.error(res, errorMessage, 500);
    }
  });

  /**
   * Cancel a ride
   * PATCH /api/rides/:rideId/cancel
   */
  static readonly cancelRide = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    const { rideId } = req.params;
    const { reason } = req.body;

    if (!rideId) {
      ApiResponse.error(res, 'Ride ID is required', 400);
      return;
    }

    try {
      const ride = await RideService.updateRideStatus(rideId, RideStatus.CANCELLED, userId, userRole);

      // Update cancellation details
      ride.cancelledAt = new Date();
      ride.cancellationReason = reason || 'Cancelled by user';
      await ride.save();

      logger.info(`Ride ${rideId} cancelled by user ${userId}`);

      ApiResponse.success(res, {
        message: 'Ride cancelled successfully',
        ride: {
          id: ride._id,
          status: ride.status,
          cancelledAt: ride.cancelledAt,
          cancellationReason: ride.cancellationReason
        }
      });

    } catch (error) {
      logger.error('Error cancelling ride:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel ride';
      ApiResponse.error(res, errorMessage, 500);
    }
  });

  /**
   * Get user's ride history
   * GET /api/rides/history
   */
  static readonly getRideHistory = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 50) {
      ApiResponse.error(res, 'Invalid pagination parameters', 400);
      return;
    }

    try {
      const { rides, total } = await RideService.getUserRideHistory(userId, userRole, page, limit);

      const formattedRides = rides.map(ride => ({
        id: ride._id,
        status: ride.status,
        isPooled: ride.isPooled,
        driver: ride.driverId,
        vehicle: ride.vehicleId,
        passengers: ride.passengers,
        estimatedDistance: ride.estimatedDistance,
        estimatedDuration: ride.estimatedDuration,
        totalFare: ride.totalFare,
        paymentMethod: ride.paymentMethod,
        startedAt: ride.startedAt,
        completedAt: ride.completedAt,
        cancelledAt: ride.cancelledAt,
        requestedAt: ride.requestedAt
      }));

      ApiResponse.success(res, {
        rides: formattedRides,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      logger.error('Error getting ride history:', error);
      ApiResponse.error(res, 'Failed to get ride history', 500);
    }
  });

  /**
   * Get active ride for user
   * GET /api/rides/active
   */
  static readonly getActiveRide = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    try {
      let activeRide;

      if (userRole === UserRole.RIDER) {
        activeRide = await Ride.findOne({
          'passengers.userId': userId,
          status: { $in: [RideStatus.REQUESTED, RideStatus.ACCEPTED, RideStatus.STARTED] }
        });
      } else if (userRole === UserRole.DRIVER) {
        activeRide = await Ride.findOne({
          driverId: userId,
          status: { $in: [RideStatus.ACCEPTED, RideStatus.STARTED] }
        });
      }

      if (!activeRide) {
        ApiResponse.success(res, {
          message: 'No active ride found',
          ride: null
        });
        return;
      }

      // Get detailed ride information
      const rideDetails = await RideService.getRideDetails(activeRide._id.toString(), userId);

      if (!rideDetails) {
        ApiResponse.error(res, 'Active ride not found or access denied', 404);
        return;
      }

      ApiResponse.success(res, {
        ride: {
          id: rideDetails._id,
          status: rideDetails.status,
          isPooled: rideDetails.isPooled,
          capacity: rideDetails.capacity,
          driver: rideDetails.driverId,
          vehicle: rideDetails.vehicleId,
          passengers: rideDetails.passengers,
          route: rideDetails.route,
          estimatedDistance: rideDetails.estimatedDistance,
          estimatedDuration: rideDetails.estimatedDuration,
          baseFare: rideDetails.baseFare,
          totalFare: rideDetails.totalFare,
          driverEarnings: rideDetails.driverEarnings,
          platformCommission: rideDetails.platformCommission,
          paymentMethod: rideDetails.paymentMethod,
          otp: rideDetails.otp,
          startedAt: rideDetails.startedAt,
          completedAt: rideDetails.completedAt,
          cancelledAt: rideDetails.cancelledAt,
          requestedAt: rideDetails.requestedAt,
          sosAlerted: rideDetails.sosAlerted
        }
      });

    } catch (error) {
      logger.error('Error getting active ride:', error);
      ApiResponse.error(res, 'Failed to get active ride', 500);
    }
  });

  /**
   * Complete a ride (Driver only)
   * PATCH /api/rides/:rideId/complete
   */
  static readonly completeRide = asyncHandler(async (req: Request, res: Response) => {
    const { rideId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { distance, duration } = req.body;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    if (userRole !== UserRole.DRIVER) {
      ApiResponse.error(res, 'Only drivers can complete rides', 403);
      return;
    }

    try {
      const ride = await Ride.findById(rideId);

      if (!ride) {
        ApiResponse.error(res, 'Ride not found', 404);
        return;
      }

      // Check if driver is assigned to this ride
      if (ride.driverId?.toString() !== userId) {
        ApiResponse.error(res, 'You are not assigned to this ride', 403);
        return;
      }

      // Check if ride is in STARTED status
      if (ride.status !== RideStatus.STARTED) {
        ApiResponse.error(res, 'Can only complete started rides', 400);
        return;
      }

      // Update ride status to completed
      ride.status = RideStatus.COMPLETED;
      ride.completedAt = new Date();
      ride.actualDistance = distance || ride.estimatedDistance;
      ride.actualDuration = duration || ride.estimatedDuration;

      await ride.save();

      // Apply subscription if one was used
      if (ride.appliedSubscriptionId) {
        await SubscriptionService.applySubscriptionToRide(ride.appliedSubscriptionId.toString());
        logger.info(`Applied subscription ${ride.appliedSubscriptionId} for completed ride ${rideId}`);
      }

      // Process payment
      try {
        const passenger = ride.passengers[0]; // For simplicity, process payment for first passenger
        const paymentMethodEnum = convertPaymentMethodToEnum(ride.paymentMethod);
        await PaymentService.processRidePayment(rideId, passenger.userId.toString(), paymentMethodEnum);
        logger.info(`Payment processed for completed ride ${rideId}`);
      } catch (paymentError) {
        logger.error(`Payment processing failed for ride ${rideId}:`, paymentError);
        // Don't fail the ride completion if payment fails
      }

      // Populate ride details for response
      await ride.populate('driverId', 'firstName lastName phoneNumber averageRating');
      await ride.populate('vehicleId', 'make model licensePlate type color');
      await ride.populate('passengers.userId', 'firstName lastName phoneNumber avatar');

      logger.info(`Ride ${rideId} completed by driver ${userId}`);

      ApiResponse.success(res, {
        message: 'Ride completed successfully',
        ride: {
          id: ride._id,
          status: ride.status,
          completedAt: ride.completedAt,
          actualDistance: ride.actualDistance,
          actualDuration: ride.actualDuration,
          finalFare: ride.totalFare,
          passengers: ride.passengers
        }
      });

    } catch (error) {
      logger.error('Error completing ride:', error);
      ApiResponse.error(res, 'Failed to complete ride', 500);
    }
  });

  /**
   * Get fare estimate
   * POST /api/rides/fare-estimate
   */
  static readonly getFareEstimate = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    const { pickupLat, pickupLng, dropoffLat, dropoffLng } = req.body;

    // Validate required fields
    if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
      ApiResponse.error(res, 'Missing required fields: pickupLat, pickupLng, dropoffLat, dropoffLng', 400);
      return;
    }

    try {
      // Create location objects
      const pickupLocation = {
        type: 'Point' as const,
        coordinates: [pickupLng, pickupLat] as [number, number]
      };

      const dropoffLocation = {
        type: 'Point' as const,
        coordinates: [dropoffLng, dropoffLat] as [number, number]
      };

      // Calculate distance and duration
      const distance = RideService.calculateDistance(pickupLocation, dropoffLocation);
      const estimatedDuration = RideService.estimateTravelTime(distance);

      // Calculate surge multiplier
      const surgeMultiplier = await RideService.calculateSurgeMultiplier(pickupLocation);

      // Check for subscription discount
      let subscriptionDiscount = 0;
      const subscriptionValidation = await SubscriptionService.validateSubscriptionForRide(userId);
      if (subscriptionValidation.isValid && subscriptionValidation.discount) {
        subscriptionDiscount = subscriptionValidation.discount;
      }

      // Calculate fare
      const fareCalculation = RideService.calculateFare(distance, estimatedDuration, surgeMultiplier, subscriptionDiscount);

      ApiResponse.success(res, {
        message: 'Fare estimate calculated successfully',
        estimate: {
          distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
          estimatedDuration,
          baseFare: fareCalculation.baseFare,
          distanceFare: Math.round(fareCalculation.distanceFare),
          timeFare: Math.round(fareCalculation.timeFare),
          surgeMultiplier,
          subtotal: Math.round(fareCalculation.baseFare + fareCalculation.distanceFare + fareCalculation.timeFare),
          subscriptionDiscount: fareCalculation.subscriptionDiscount || 0,
          totalFare: fareCalculation.totalFare,
          driverEarnings: fareCalculation.driverEarnings,
          platformCommission: fareCalculation.platformCommission
        }
      });

    } catch (error) {
      logger.error('Error calculating fare estimate:', error);
      ApiResponse.error(res, 'Failed to calculate fare estimate', 500);
    }
  });

  /**
   * Rate a completed ride
   * POST /api/rides/:rideId/rate
   */
  static readonly rateRide = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    if (userRole !== UserRole.RIDER) {
      ApiResponse.error(res, 'Only riders can rate rides', 403);
      return;
    }

    const { rideId } = req.params;
    const { rating, review } = req.body;

    if (!rideId) {
      ApiResponse.error(res, 'Ride ID is required', 400);
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      ApiResponse.error(res, 'Rating must be between 1 and 5', 400);
      return;
    }

    try {
      const ride = await Ride.findById(rideId);

      if (!ride) {
        ApiResponse.error(res, 'Ride not found', 404);
        return;
      }

      // Check if ride is completed
      if (ride.status !== RideStatus.COMPLETED) {
        ApiResponse.error(res, 'Can only rate completed rides', 400);
        return;
      }

      // Find the passenger in this ride
      const passengerIndex = ride.passengers.findIndex(p => p.userId.toString() === userId);

      if (passengerIndex === -1) {
        ApiResponse.error(res, 'You were not a passenger in this ride', 403);
        return;
      }

      // Check if user already rated this ride
      const passenger = ride.passengers[passengerIndex];
      if (passenger.rating) {
        ApiResponse.error(res, 'You have already rated this ride', 400);
        return;
      }

      // Update passenger rating and review
      ride.passengers[passengerIndex].rating = rating;
      ride.passengers[passengerIndex].review = review || '';

      await ride.save();

      // Update driver's average rating
      if (ride.driverId) {
        const driver = await User.findById(ride.driverId);
        if (driver) {
          // Get all completed rides for this driver with ratings
          const completedRides = await Ride.find({
            driverId: ride.driverId,
            status: RideStatus.COMPLETED,
            'passengers.rating': { $exists: true, $ne: null }
          });

          let totalRating = 0;
          let totalCount = 0;

          completedRides.forEach(rideDoc => {
            rideDoc.passengers.forEach((passenger: any) => {
              if (passenger.rating) {
                totalRating += passenger.rating;
                totalCount += 1;
              }
            });
          });

          if (totalCount > 0) {
            driver.averageRating = totalRating / totalCount;
            await driver.save();
          }
        }
      }

      logger.info(`Ride ${rideId} rated by user ${userId} with rating ${rating}`);

      ApiResponse.success(res, {
        message: 'Ride rated successfully',
        rating: {
          rating,
          review: review || '',
          createdAt: new Date()
        }
      });

    } catch (error) {
      logger.error('Error rating ride:', error);
      ApiResponse.error(res, 'Failed to rate ride', 500);
    }
  });
}
