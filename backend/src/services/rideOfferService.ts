/**
 * Ride Offer service for handling driver-offered rides
 * Contains business logic for creating, managing, and matching ride offers
 */

import { RideOffer, IRideOffer, RideOfferStatus, RecurringType } from '../models/RideOffer';
import { User, UserRole } from '../models/User';
import { Vehicle } from '../models/Vehicle';

export interface CreateRideOfferRequest {
  driverId: string;
  source: {
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    placeId?: string;
  };
  destination: {
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    placeId?: string;
  };
  stops?: Array<{
    id: string;
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  }>;
  schedule: {
    departureDate: Date;
    departureTime: Date;
    isFlexible: boolean;
    flexibilityMinutes: number;
    recurring: {
      isRecurring: boolean;
      type: RecurringType;
      days?: string[];
      endDate?: Date;
    };
  };
  pricing: {
    seats: number;
    pricePerSeat: number;
    acceptsNegotiation: boolean;
    minimumPrice?: number;
  };
  vehicleId?: string;
  specialInstructions?: string;
}

export interface UpdateRideOfferRequest {
  stops?: Array<{
    id: string;
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  }>;
  schedule?: Partial<{
    departureDate: Date;
    departureTime: Date;
    isFlexible: boolean;
    flexibilityMinutes: number;
    recurring: {
      isRecurring: boolean;
      type: RecurringType;
      days?: string[];
      endDate?: Date;
    };
  }>;
  pricing?: Partial<{
    seats: number;
    pricePerSeat: number;
    acceptsNegotiation: boolean;
    minimumPrice?: number;
  }>;
  specialInstructions?: string;
}

export interface RideOfferSearchFilters {
  source?: {
    latitude: number;
    longitude: number;
    radius?: number; // in meters
  };
  destination?: {
    latitude: number;
    longitude: number;
    radius?: number; // in meters
  };
  departureDate?: Date;
  departureTimeRange?: {
    start: Date;
    end: Date;
  };
  maxPrice?: number;
  minSeats?: number;
  vehicleType?: string;
}

export class RideOfferService {
  /**
   * Create a new ride offer
   */
  static async createRideOffer(request: CreateRideOfferRequest, status?: RideOfferStatus): Promise<IRideOffer> {
    try {
      // Validate driver exists and is active
      const driver = await User.findById(request.driverId);
      if (!driver) {
        throw new Error('Driver not found');
      }

      if (driver.role !== UserRole.DRIVER || driver.status !== 'active') {
        throw new Error('Invalid driver or driver not active');
      }

      // Validate vehicle if provided
      if (request.vehicleId) {
        const vehicle = await Vehicle.findById(request.vehicleId);
        if (!vehicle || vehicle.driverId.toString() !== request.driverId) {
          throw new Error('Invalid vehicle for this driver');
        }
      }

      // Calculate total earnings
      const totalEarnings = request.pricing.seats * request.pricing.pricePerSeat;

      // Generate unique offer ID
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      let offerId: string;
      let isUnique = false;
      let attempts = 0;

      do {
        const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        offerId = `RO${date}${randomNum}`;
        const existingOffer = await RideOffer.findOne({ offerId });
        isUnique = !existingOffer;
        attempts++;
      } while (!isUnique && attempts < 10);

      if (!isUnique) {
        throw new Error('Failed to generate unique offer ID');
      }

      // Create ride offer
      const rideOffer = new RideOffer({
        offerId,
        driverId: request.driverId,
        source: request.source,
        destination: request.destination,
        stops: request.stops || [],
        schedule: request.schedule,
        pricing: {
          ...request.pricing,
          totalEarnings
        },
        vehicleId: request.vehicleId,
        specialInstructions: request.specialInstructions,
        availableSeats: request.pricing.seats,
        status: status || RideOfferStatus.DRAFT
      });

      await rideOffer.save();

      // Populate driver and vehicle information
      await rideOffer.populate('driverId', 'firstName lastName phoneNumber averageRating');
      await rideOffer.populate('vehicleId', 'make model licensePlate type');

      return rideOffer;
    } catch (error) {
      console.error('Error creating ride offer:', error);
      throw new Error('Failed to create ride offer');
    }
  }

  /**
   * Get ride offer by ID
   */
  static async getRideOfferById(offerId: string, userId?: string): Promise<IRideOffer | null> {
    try {
      const rideOffer = await RideOffer.findOne({ offerId })
        .populate('driverId', 'firstName lastName phoneNumber averageRating')
        .populate('vehicleId', 'make model licensePlate type color');

      if (!rideOffer) {
        return null;
      }

      // If userId provided, check if they can view this offer
      if (userId && rideOffer.driverId._id.toString() !== userId) {
        // For now, allow viewing all published offers
        // In production, you might want to add more restrictions
        if (rideOffer.status !== RideOfferStatus.PUBLISHED) {
          throw new Error('Unauthorized to view this ride offer');
        }
      }

      return rideOffer;
    } catch (error) {
      console.error('Error getting ride offer:', error);
      throw error;
    }
  }

  /**
   * Get driver's ride offers
   */
  static async getDriverRideOffers(
    driverId: string,
    status?: RideOfferStatus,
    page: number = 1,
    limit: number = 10
  ): Promise<{ offers: IRideOffer[], total: number }> {
    try {
      const skip = (page - 1) * limit;

      const query: any = { driverId };

      if (status) {
        query.status = status;
      }

      const offers = await RideOffer.find(query)
        .populate('vehicleId', 'make model licensePlate type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await RideOffer.countDocuments(query);

      return { offers, total };
    } catch (error) {
      console.error('Error getting driver ride offers:', error);
      throw error;
    }
  }

  /**
   * Search available ride offers
   */
  static async searchRideOffers(
    filters: RideOfferSearchFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{ offers: IRideOffer[], total: number }> {
    try {
      const skip = (page - 1) * limit;
      const query: any = {
        status: RideOfferStatus.PUBLISHED,
        availableSeats: { $gt: 0 }
      };

      // Source location filter
      if (filters.source) {
        const radius = filters.source.radius || 5000; // 5km default
        query['source.coordinates'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [filters.source.longitude, filters.source.latitude]
            },
            $maxDistance: radius
          }
        };
      }

      // Destination location filter
      if (filters.destination) {
        const radius = filters.destination.radius || 5000; // 5km default
        query['destination.coordinates'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [filters.destination.longitude, filters.destination.latitude]
            },
            $maxDistance: radius
          }
        };
      }

      // Date and time filters
      if (filters.departureDate) {
        const startOfDay = new Date(filters.departureDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(filters.departureDate);
        endOfDay.setHours(23, 59, 59, 999);

        query['schedule.departureDate'] = {
          $gte: startOfDay,
          $lte: endOfDay
        };
      }

      if (filters.departureTimeRange) {
        query['schedule.departureTime'] = {
          $gte: filters.departureTimeRange.start,
          $lte: filters.departureTimeRange.end
        };
      }

      // Price filter
      if (filters.maxPrice) {
        query['pricing.pricePerSeat'] = {
          $lte: filters.maxPrice
        };
      }

      // Seats filter
      if (filters.minSeats) {
        query.availableSeats = {
          $gte: filters.minSeats
        };
      }

      // Vehicle type filter
      if (filters.vehicleType) {
        // This would require populating vehicle data
        // For now, we'll skip this filter
      }

      const offers = await RideOffer.find(query)
        .populate('driverId', 'firstName lastName phoneNumber averageRating')
        .populate('vehicleId', 'make model licensePlate type')
        .sort({ 'schedule.departureDate': 1, 'schedule.departureTime': 1 })
        .skip(skip)
        .limit(limit);

      const total = await RideOffer.countDocuments(query);

      return { offers, total };
    } catch (error) {
      console.error('Error searching ride offers:', error);
      throw error;
    }
  }

  /**
   * Update ride offer
   */
  static async updateRideOffer(
    offerId: string,
    driverId: string,
    updates: UpdateRideOfferRequest
  ): Promise<IRideOffer> {
    try {
      const rideOffer = await RideOffer.findOne({ offerId, driverId });

      if (!rideOffer) {
        throw new Error('Ride offer not found or unauthorized');
      }

      // Only allow updates for draft or published offers
      if (rideOffer.status !== RideOfferStatus.DRAFT && rideOffer.status !== RideOfferStatus.PUBLISHED) {
        throw new Error('Cannot update ride offer in current status');
      }

      // Update fields
      if (updates.stops !== undefined) {
        rideOffer.stops = updates.stops;
      }

      if (updates.schedule) {
        Object.assign(rideOffer.schedule, updates.schedule);
      }

      if (updates.pricing) {
        Object.assign(rideOffer.pricing, updates.pricing);

        // Recalculate total earnings if pricing changed
        if (updates.pricing.seats || updates.pricing.pricePerSeat) {
          const seats = updates.pricing.seats || rideOffer.pricing.seats;
          const pricePerSeat = updates.pricing.pricePerSeat || rideOffer.pricing.pricePerSeat;
          rideOffer.pricing.totalEarnings = seats * pricePerSeat;
        }
      }

      if (updates.specialInstructions !== undefined) {
        rideOffer.specialInstructions = updates.specialInstructions;
      }

      rideOffer.lastModifiedAt = new Date();
      await rideOffer.save();

      return rideOffer;
    } catch (error) {
      console.error('Error updating ride offer:', error);
      throw error;
    }
  }

  /**
   * Publish ride offer
   */
  static async publishRideOffer(offerId: string, driverId: string): Promise<IRideOffer> {
    try {
      const rideOffer = await RideOffer.findOne({ offerId, driverId });

      if (!rideOffer) {
        throw new Error('Ride offer not found or unauthorized');
      }

      if (rideOffer.status !== RideOfferStatus.DRAFT) {
        throw new Error('Only draft offers can be published');
      }

      await rideOffer.publish();

      return rideOffer;
    } catch (error) {
      console.error('Error publishing ride offer:', error);
      throw error;
    }
  }

  /**
   * Cancel ride offer
   */
  static async cancelRideOffer(
    offerId: string,
    driverId: string,
    reason?: string
  ): Promise<IRideOffer> {
    try {
      const rideOffer = await RideOffer.findOne({ offerId, driverId });

      if (!rideOffer) {
        throw new Error('Ride offer not found or unauthorized');
      }

      await rideOffer.cancel(reason);

      return rideOffer;
    } catch (error) {
      console.error('Error cancelling ride offer:', error);
      throw error;
    }
  }

  /**
   * Delete ride offer (only for draft offers)
   */
  static async deleteRideOffer(offerId: string, driverId: string): Promise<void> {
    try {
      const rideOffer = await RideOffer.findOne({ offerId, driverId });

      if (!rideOffer) {
        throw new Error('Ride offer not found or unauthorized');
      }

      if (rideOffer.status !== RideOfferStatus.DRAFT) {
        throw new Error('Only draft offers can be deleted');
      }

      await RideOffer.deleteOne({ offerId, driverId });
    } catch (error) {
      console.error('Error deleting ride offer:', error);
      throw error;
    }
  }

  /**
   * Book seats in a ride offer
   */
  static async bookSeats(
    offerId: string,
    seatsToBook: number
  ): Promise<{ success: boolean; message: string; rideOffer?: IRideOffer }> {
    try {
      const rideOffer = await RideOffer.findOne({ offerId });

      if (!rideOffer) {
        return { success: false, message: 'Ride offer not found' };
      }

      if (rideOffer.status !== RideOfferStatus.PUBLISHED) {
        return { success: false, message: 'Ride offer is not available for booking' };
      }

      if (rideOffer.availableSeats < seatsToBook) {
        return { success: false, message: 'Not enough seats available' };
      }

      // Update available seats and booked seats
      rideOffer.availableSeats -= seatsToBook;
      rideOffer.bookedSeats += seatsToBook;
      rideOffer.totalBookings += 1;

      // If all seats are booked, mark as completed
      if (rideOffer.availableSeats === 0) {
        rideOffer.status = RideOfferStatus.COMPLETED;
      }

      await rideOffer.save();

      return {
        success: true,
        message: `Successfully booked ${seatsToBook} seat(s)`,
        rideOffer
      };
    } catch (error) {
      console.error('Error booking seats:', error);
      return { success: false, message: 'Failed to book seats' };
    }
  }

  /**
   * Get popular routes (most offered)
   */
  static async getPopularRoutes(limit: number = 10): Promise<Array<{
    source: string;
    destination: string;
    count: number;
    averagePrice: number;
  }>> {
    try {
      const popularRoutes = await RideOffer.aggregate([
        {
          $match: {
            status: RideOfferStatus.PUBLISHED
          }
        },
        {
          $group: {
            _id: {
              source: '$source.name',
              destination: '$destination.name'
            },
            count: { $sum: 1 },
            averagePrice: { $avg: '$pricing.pricePerSeat' },
            totalOffers: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: limit
        },
        {
          $project: {
            source: '$_id.source',
            destination: '$_id.destination',
            count: 1,
            averagePrice: { $round: ['$averagePrice', 2] }
          }
        }
      ]);

      return popularRoutes;
    } catch (error) {
      console.error('Error getting popular routes:', error);
      return [];
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round((R * c) * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Helper method to convert degrees to radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
