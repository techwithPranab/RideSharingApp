/**
 * Ride Offer controller for handling ride offer-related API endpoints
 * Manages ride offer creation, search, booking, and lifecycle management
 */

import { Request, Response } from 'express';
import {
  RideOfferService,
  CreateRideOfferRequest,
  UpdateRideOfferRequest,
  RideOfferSearchFilters
} from '../services/rideOfferService';
import { RideOffer, RideOfferStatus } from '../models/RideOffer';
import { UserRole } from '../models/User';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../middleware/asyncHandler';
import { logger } from '../utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export class RideOfferController {
  /**
   * Create a new ride offer
   * POST /api/ride-offers
   */
  static readonly createRideOffer = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    if (userRole !== UserRole.DRIVER) {
      ApiResponse.error(res, 'Only drivers can create ride offers', 403);
      return;
    }

    const {
      source,
      destination,
      stops,
      schedule,
      pricing,
      vehicleId,
      specialInstructions,
      status
    } = req.body;

    // Validate required fields
    if (!source || !destination || !schedule || !pricing) {
      ApiResponse.error(res, 'Missing required fields: source, destination, schedule, pricing', 400);
      return;
    }

    try {
      // Check if driver has an active ride offer that conflicts
      const activeOffer = await RideOffer.findOne({
        driverId: userId,
        status: RideOfferStatus.PUBLISHED,
        $or: [
          {
            'schedule.departureDate': {
              $gte: new Date(schedule.departureDate),
              $lt: new Date(new Date(schedule.departureDate).getTime() + 2 * 60 * 60 * 1000) // 2 hours window
            }
          },
          {
            'schedule.recurring.isRecurring': true,
            'schedule.recurring.days': { $in: schedule.recurring?.days || [] },
            'schedule.recurring.endDate': { $gte: new Date(schedule.departureDate) }
          }
        ]
      });

      if (activeOffer) {
        ApiResponse.error(res, 'You already have an active ride offer during this time period', 400);
        return;
      }

      // Create ride offer request
      const rideOfferRequest: CreateRideOfferRequest = {
        driverId: userId,
        source: {
          name: source.name,
          address: source.address,
          coordinates: {
            latitude: source.coordinates[1], // [lng, lat] to lat/lng
            longitude: source.coordinates[0]
          },
          placeId: source.placeId
        },
        destination: {
          name: destination.name,
          address: destination.address,
          coordinates: {
            latitude: destination.coordinates[1],
            longitude: destination.coordinates[0]
          },
          placeId: destination.placeId
        },
        stops: stops?.map((stop: any) => ({
          id: stop.id,
          name: stop.name,
          address: stop.address,
          coordinates: {
            latitude: stop.coordinates[1],
            longitude: stop.coordinates[0]
          }
        })),
        schedule: {
          departureDate: new Date(schedule.departureDate),
          departureTime: new Date(schedule.departureTime),
          isFlexible: schedule.isFlexible || false,
          flexibilityMinutes: schedule.flexibilityMinutes || 0,
          recurring: {
            isRecurring: schedule.recurring?.isRecurring || false,
            type: schedule.recurring?.type || 'none',
            days: schedule.recurring?.days || [],
            ...(schedule.recurring?.endDate && { endDate: new Date(schedule.recurring.endDate) })
          }
        },
        pricing: {
          seats: pricing.seats,
          pricePerSeat: pricing.pricePerSeat,
          acceptsNegotiation: pricing.acceptsNegotiation || false,
          minimumPrice: pricing.minimumPrice
        },
        vehicleId,
        specialInstructions
      };

      // Create the ride offer
      const rideOffer = await RideOfferService.createRideOffer(rideOfferRequest, status === 'published' ? RideOfferStatus.PUBLISHED : RideOfferStatus.DRAFT);

      logger.info(`Ride offer created: ${rideOffer._id} by driver ${userId}`);

      ApiResponse.success(res, {
        message: 'Ride offer created successfully',
        rideOffer: {
          id: rideOffer._id,
          status: rideOffer.status,
          source: rideOffer.source,
          destination: rideOffer.destination,
          stops: rideOffer.stops,
          schedule: rideOffer.schedule,
          driver: rideOffer.driverId,
          vehicle: rideOffer.vehicleId,
          pricing: rideOffer.pricing,
          availableSeats: rideOffer.availableSeats,
          specialInstructions: rideOffer.specialInstructions,
          createdAt: rideOffer.createdAt
        }
      }, 201);

    } catch (error) {
      logger.error('Error creating ride offer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create ride offer';
      ApiResponse.error(res, errorMessage, 500);
    }
  });

  /**
   * Get driver's ride offers
   * GET /api/ride-offers
   */
  static readonly getRideOffers = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    if (userRole !== UserRole.DRIVER) {
      ApiResponse.error(res, 'Only drivers can view their ride offers', 403);
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as RideOfferStatus;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 50) {
      ApiResponse.error(res, 'Invalid pagination parameters', 400);
      return;
    }

    try {
      const { offers, total } = await RideOfferService.getDriverRideOffers(userId, status, page, limit);

      const formattedOffers = offers.map((offer: any) => ({
        id: offer._id,
        status: offer.status,
        source: offer.source,
        destination: offer.destination,
        schedule: offer.schedule,
        pricing: offer.pricing,
        availableSeats: offer.availableSeats,
        bookedSeats: offer.bookedSeats,
        totalBookings: offer.totalBookings,
        specialInstructions: offer.specialInstructions,
        createdAt: offer.createdAt
      }));

      ApiResponse.success(res, {
        rideOffers: formattedOffers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      logger.error('Error getting ride offers:', error);
      ApiResponse.error(res, 'Failed to get ride offers', 500);
    }
  });

  /**
   * Get specific ride offer details
   * GET /api/ride-offers/:offerId
   */
  static readonly getRideOffer = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    const { offerId } = req.params;

    if (!offerId) {
      ApiResponse.error(res, 'Ride offer ID is required', 400);
      return;
    }

    try {
      const rideOffer = await RideOfferService.getRideOfferById(offerId, userId);

      if (!rideOffer) {
        ApiResponse.error(res, 'Ride offer not found or access denied', 404);
        return;
      }

      ApiResponse.success(res, {
        rideOffer: {
          id: rideOffer._id,
          status: rideOffer.status,
          source: rideOffer.source,
          destination: rideOffer.destination,
          stops: rideOffer.stops,
          schedule: rideOffer.schedule,
          driver: rideOffer.driverId,
          vehicle: rideOffer.vehicleId,
          pricing: rideOffer.pricing,
          availableSeats: rideOffer.availableSeats,
          bookedSeats: rideOffer.bookedSeats,
          totalBookings: rideOffer.totalBookings,
          specialInstructions: rideOffer.specialInstructions,
          createdAt: rideOffer.createdAt,
          lastModifiedAt: rideOffer.lastModifiedAt
        }
      });

    } catch (error) {
      logger.error('Error getting ride offer details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get ride offer details';
      ApiResponse.error(res, errorMessage, 500);
    }
  });

  /**
   * Update ride offer
   * PUT /api/ride-offers/:offerId
   */
  static readonly updateRideOffer = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    if (userRole !== UserRole.DRIVER) {
      ApiResponse.error(res, 'Only drivers can update ride offers', 403);
      return;
    }

    const { offerId } = req.params;
    const updateData = req.body;

    if (!offerId) {
      ApiResponse.error(res, 'Ride offer ID is required', 400);
      return;
    }

    try {
      // Convert update data to service format
      const updateRequest: UpdateRideOfferRequest = {};

      if (updateData.stops) {
        updateRequest.stops = updateData.stops.map((stop: any) => ({
          id: stop.id,
          name: stop.name,
          address: stop.address,
          coordinates: {
            latitude: stop.coordinates[1],
            longitude: stop.coordinates[0]
          }
        }));
      }

      if (updateData.schedule) {
        const scheduleUpdate: any = {};
        if (updateData.schedule.departureDate) {
          scheduleUpdate.departureDate = new Date(updateData.schedule.departureDate);
        }
        if (updateData.schedule.departureTime) {
          scheduleUpdate.departureTime = new Date(updateData.schedule.departureTime);
        }
        if (updateData.schedule.isFlexible !== undefined) {
          scheduleUpdate.isFlexible = updateData.schedule.isFlexible;
        }
        if (updateData.schedule.flexibilityMinutes !== undefined) {
          scheduleUpdate.flexibilityMinutes = updateData.schedule.flexibilityMinutes;
        }
        if (updateData.schedule.recurring) {
          scheduleUpdate.recurring = updateData.schedule.recurring;
        }
        updateRequest.schedule = scheduleUpdate;
      }

      if (updateData.pricing) {
        updateRequest.pricing = {
          seats: updateData.pricing.seats,
          pricePerSeat: updateData.pricing.pricePerSeat,
          acceptsNegotiation: updateData.pricing.acceptsNegotiation,
          minimumPrice: updateData.pricing.minimumPrice
        };
      }

      if (updateData.specialInstructions !== undefined) {
        updateRequest.specialInstructions = updateData.specialInstructions;
      }

      const rideOffer = await RideOfferService.updateRideOffer(offerId, userId, updateRequest);

      logger.info(`Ride offer ${offerId} updated by driver ${userId}`);

      ApiResponse.success(res, {
        message: 'Ride offer updated successfully',
        rideOffer: {
          id: rideOffer._id,
          status: rideOffer.status,
          source: rideOffer.source,
          destination: rideOffer.destination,
          schedule: rideOffer.schedule,
          pricing: rideOffer.pricing,
          availableSeats: rideOffer.availableSeats,
          specialInstructions: rideOffer.specialInstructions,
          lastModifiedAt: rideOffer.lastModifiedAt
        }
      });

    } catch (error) {
      logger.error('Error updating ride offer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update ride offer';
      ApiResponse.error(res, errorMessage, 500);
    }
  });

  /**
   * Publish ride offer
   * PATCH /api/ride-offers/:offerId/publish
   */
  static readonly publishRideOffer = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    if (userRole !== UserRole.DRIVER) {
      ApiResponse.error(res, 'Only drivers can publish ride offers', 403);
      return;
    }

    const { offerId } = req.params;

    if (!offerId) {
      ApiResponse.error(res, 'Ride offer ID is required', 400);
      return;
    }

    try {
      const rideOffer = await RideOfferService.publishRideOffer(offerId, userId);

      logger.info(`Ride offer ${offerId} published by driver ${userId}`);

      ApiResponse.success(res, {
        message: 'Ride offer published successfully',
        rideOffer: {
          id: rideOffer._id,
          status: rideOffer.status,
          publishedAt: rideOffer.publishedAt
        }
      });

    } catch (error) {
      logger.error('Error publishing ride offer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to publish ride offer';
      ApiResponse.error(res, errorMessage, 500);
    }
  });

  /**
   * Delete/Cancel ride offer
   * DELETE /api/ride-offers/:offerId
   */
  static readonly deleteRideOffer = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    if (userRole !== UserRole.DRIVER) {
      ApiResponse.error(res, 'Only drivers can delete ride offers', 403);
      return;
    }

    const { offerId } = req.params;

    if (!offerId) {
      ApiResponse.error(res, 'Ride offer ID is required', 400);
      return;
    }

    try {
      await RideOfferService.deleteRideOffer(offerId, userId);

      logger.info(`Ride offer ${offerId} deleted by driver ${userId}`);

      ApiResponse.success(res, {
        message: 'Ride offer deleted successfully'
      });

    } catch (error) {
      logger.error('Error deleting ride offer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete ride offer';
      ApiResponse.error(res, errorMessage, 500);
    }
  });

  /**
   * Search available ride offers
   * POST /api/ride-offers/search
   */
  static readonly searchRideOffers = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    if (userRole !== UserRole.RIDER) {
      ApiResponse.error(res, 'Only riders can search for ride offers', 403);
      return;
    }

    const {
      source,
      destination,
      departureDate,
      departureTimeRange,
      maxPrice,
      minSeats,
      vehicleType
    } = req.body;

    try {
      const searchFilters: RideOfferSearchFilters = {};

      if (source) {
        searchFilters.source = {
          latitude: source.latitude,
          longitude: source.longitude,
          radius: source.radius
        };
      }

      if (destination) {
        searchFilters.destination = {
          latitude: destination.latitude,
          longitude: destination.longitude,
          radius: destination.radius
        };
      }

      if (departureDate) {
        searchFilters.departureDate = new Date(departureDate);
      }

      if (departureTimeRange) {
        searchFilters.departureTimeRange = {
          start: new Date(departureTimeRange.start),
          end: new Date(departureTimeRange.end)
        };
      }

      if (maxPrice) {
        searchFilters.maxPrice = maxPrice;
      }

      if (minSeats) {
        searchFilters.minSeats = minSeats;
      }

      if (vehicleType) {
        searchFilters.vehicleType = vehicleType;
      }

      const { offers, total } = await RideOfferService.searchRideOffers(searchFilters);

      const formattedOffers = offers.map((offer: any) => ({
        id: offer._id,
        source: offer.source,
        destination: offer.destination,
        schedule: offer.schedule,
        driver: {
          id: offer.driverId._id,
          firstName: offer.driverId.firstName,
          lastName: offer.driverId.lastName,
          averageRating: offer.driverId.averageRating,
          phoneNumber: offer.driverId.phoneNumber
        },
        vehicle: {
          id: offer.vehicleId._id,
          make: offer.vehicleId.make,
          model: offer.vehicleId.model,
          type: offer.vehicleId.type,
          licensePlate: offer.vehicleId.licensePlate
        },
        pricing: offer.pricing,
        availableSeats: offer.availableSeats,
        specialInstructions: offer.specialInstructions,
        distance: source && destination ?
          RideOfferService.calculateDistance(
            source.latitude, source.longitude,
            destination.latitude, destination.longitude
          ) : undefined
      }));

      ApiResponse.success(res, {
        message: 'Ride offers found',
        rideOffers: formattedOffers,
        total
      });

    } catch (error) {
      logger.error('Error searching ride offers:', error);
      ApiResponse.error(res, 'Failed to search ride offers', 500);
    }
  });

  /**
   * Book seats in a ride offer
   * POST /api/ride-offers/:offerId/book
   */
  static readonly bookRideOffer = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    if (userRole !== UserRole.RIDER) {
      ApiResponse.error(res, 'Only riders can book ride offers', 403);
      return;
    }

    const { offerId } = req.params;
    const { seatsCount } = req.body;

    if (!offerId) {
      ApiResponse.error(res, 'Ride offer ID is required', 400);
      return;
    }

    if (!seatsCount || seatsCount < 1) {
      ApiResponse.error(res, 'Valid seats count is required', 400);
      return;
    }

    try {
      const result = await RideOfferService.bookSeats(offerId, seatsCount, userId);

      if (!result.success) {
        ApiResponse.error(res, result.message, 400);
        return;
      }

      logger.info(`Seats booked in ride offer ${offerId} by rider ${userId}`);

      ApiResponse.success(res, {
        message: result.message,
        booking: {
          seatsCount,
          totalPrice: seatsCount * (result.booking?.totalAmount || 0)
        }
      }, 201);

    } catch (error) {
      logger.error('Error booking ride offer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to book ride offer';
      ApiResponse.error(res, errorMessage, 500);
    }
  });

  /**
   * Cancel ride offer
   * PATCH /api/ride-offers/:offerId/cancel
   */
  static readonly cancelRideOffer = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    if (userRole !== UserRole.DRIVER) {
      ApiResponse.error(res, 'Only drivers can cancel ride offers', 403);
      return;
    }

    const { offerId } = req.params;
    const { reason } = req.body;

    if (!offerId) {
      ApiResponse.error(res, 'Ride offer ID is required', 400);
      return;
    }

    try {
      const result = await RideOfferService.cancelRideOffer(offerId, userId, reason);

      if (!result.success) {
        ApiResponse.error(res, result.message, 400);
        return;
      }

      logger.info(`Ride offer ${offerId} cancelled by driver ${userId}. ${result.data?.cancelledBookings?.length || 0} bookings affected.`);

      ApiResponse.success(res, {
        message: result.message,
        rideOffer: result.data?.rideOffer,
        cancelledBookings: result.data?.cancelledBookings
      });

    } catch (error) {
      logger.error('Error cancelling ride offer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel ride offer';
      ApiResponse.error(res, errorMessage, 500);
    }
  });

  /**
   * Get popular routes
   * GET /api/ride-offers/popular-routes
   */
  static readonly getPopularRoutes = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;

    try {
      const popularRoutes = await RideOfferService.getPopularRoutes(limit);

      ApiResponse.success(res, {
        popularRoutes
      });

    } catch (error) {
      logger.error('Error getting popular routes:', error);
      ApiResponse.error(res, 'Failed to get popular routes', 500);
    }
  });
}
