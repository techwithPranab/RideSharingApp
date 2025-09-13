/**
 * Ride service for handling ride matching, fare calculation, and distance estimation
 * Contains core business logic for the ride-sharing system
 */

import { Ride, IRide, RideStatus, PaymentStatus } from '../models/Ride';
import { User, IUser, UserRole, ILocation } from '../models/User';
import { Vehicle, IVehicle } from '../models/Vehicle';

export interface RideRequest {
  pickupLocation: ILocation;
  dropoffLocation: ILocation;
  isPooled?: boolean;
  preferredVehicleType?: string;
  specialInstructions?: string;
  paymentMethod: 'cash' | 'card' | 'upi' | 'wallet';
  subscriptionDiscount?: number;
  appliedSubscriptionId?: string;
}

export interface RideMatch {
  driver: IUser;
  vehicle: IVehicle;
  estimatedFare: number;
  estimatedDistance: number;
  estimatedDuration: number;
  distance: number;
}

export interface FareCalculation {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeMultiplier: number;
  totalFare: number;
  driverEarnings: number;
  platformCommission: number;
  subscriptionDiscount?: number;
}

export class RideService {
  // Fare calculation constants (can be moved to config)
  private static readonly BASE_FARE = 30; // Base fare in INR
  private static readonly PER_KM_RATE = 12; // Rate per kilometer
  private static readonly PER_MINUTE_RATE = 2; // Rate per minute
  private static readonly SURGE_MULTIPLIER_BASE = 1.0;
  private static readonly PLATFORM_COMMISSION_PERCENT = 0.15; // 15% commission
  private static readonly MINIMUM_FARE = 50; // Minimum fare in INR

  /**
   * Calculate distance between two points using Haversine formula
   */
  static calculateDistance(point1: ILocation, point2: ILocation): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.coordinates[1] - point1.coordinates[1]);
    const dLon = this.toRadians(point2.coordinates[0] - point1.coordinates[0]);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.coordinates[1])) * Math.cos(this.toRadians(point2.coordinates[1])) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Estimate travel time based on distance and average speed
   */
  static estimateTravelTime(distance: number, averageSpeed: number = 30): number {
    // Average speed in km/h, convert to minutes
    return Math.ceil((distance / averageSpeed) * 60);
  }

  /**
   * Calculate fare based on distance, time, surge pricing, and subscription discount
   */
  static calculateFare(
    distance: number,
    duration: number,
    surgeMultiplier: number = this.SURGE_MULTIPLIER_BASE,
    subscriptionDiscount: number = 0
  ): FareCalculation {
    const distanceFare = distance * this.PER_KM_RATE;
    const timeFare = duration * this.PER_MINUTE_RATE;
    const subtotal = this.BASE_FARE + distanceFare + timeFare;
    const surgedFare = Math.max(subtotal * surgeMultiplier, this.MINIMUM_FARE);

    // Apply subscription discount
    const discountAmount = (surgedFare * subscriptionDiscount) / 100;
    const totalFare = Math.max(surgedFare - discountAmount, this.MINIMUM_FARE);

    const platformCommission = totalFare * this.PLATFORM_COMMISSION_PERCENT;
    const driverEarnings = totalFare - platformCommission;

    return {
      baseFare: this.BASE_FARE,
      distanceFare,
      timeFare,
      surgeMultiplier,
      totalFare: Math.round(totalFare),
      driverEarnings: Math.round(driverEarnings),
      platformCommission: Math.round(platformCommission),
      subscriptionDiscount: discountAmount > 0 ? Math.round(discountAmount) : 0
    };
  }

  /**
   * Calculate surge multiplier based on demand and supply
   */
  static async calculateSurgeMultiplier(
    pickupLocation: ILocation,
    radius: number = 2000
  ): Promise<number> {
    try {
      // Count active rides in the area
      const activeRides = await Ride.countDocuments({
        status: { $in: [RideStatus.REQUESTED, RideStatus.ACCEPTED, RideStatus.STARTED] },
        'passengers.pickupLocation.coordinates': {
          $near: {
            $geometry: pickupLocation,
            $maxDistance: radius
          }
        }
      });

      // Count available drivers in the area
      const availableDrivers = await User.countDocuments({
        role: UserRole.DRIVER,
        isAvailable: true,
        currentLocation: {
          $near: {
            $geometry: pickupLocation,
            $maxDistance: radius
          }
        }
      });

      // Simple surge calculation: demand / supply ratio
      if (availableDrivers === 0) return 2.0; // High surge if no drivers

      const ratio = activeRides / Math.max(availableDrivers, 1);
      let surge = this.SURGE_MULTIPLIER_BASE;

      if (ratio > 2) surge = 1.5;
      else if (ratio > 1.5) surge = 1.3;
      else if (ratio > 1) surge = 1.2;

      return Math.min(surge, 3.0); // Cap at 3x
    } catch (error) {
      console.error('Error calculating surge multiplier:', error);
      return this.SURGE_MULTIPLIER_BASE;
    }
  }

  /**
   * Find available drivers near pickup location
   */
  static async findNearbyDrivers(
    pickupLocation: ILocation,
    maxDistance: number = 5000, // 5km
    limit: number = 10,
    preferredVehicleType?: string
  ): Promise<IUser[]> {
    try {
      const query: any = {
        role: UserRole.DRIVER,
        isAvailable: true,
        currentLocation: {
          $near: {
            $geometry: pickupLocation,
            $maxDistance: maxDistance
          }
        }
      };

      if (preferredVehicleType) {
        query.vehicleIds = {
          $exists: true,
          $ne: []
        };
        // We'll filter by vehicle type after fetching
      }

      const drivers = await User.find(query)
        .populate('vehicleIds')
        .limit(limit)
        .sort({ 'currentLocation.coordinates': 1 }); // Sort by distance

      // Filter by preferred vehicle type if specified
      if (preferredVehicleType) {
        return drivers.filter(driver => {
          return driver.vehicleIds?.some((vehicle: any) =>
            vehicle.type === preferredVehicleType && vehicle.status === 'active'
          );
        });
      }

      return drivers;
    } catch (error) {
      console.error('Error finding nearby drivers:', error);
      return [];
    }
  }

  /**
   * Match ride request with available drivers
   */
  static async matchRide(rideRequest: RideRequest): Promise<RideMatch[]> {
    try {
      const { pickupLocation, dropoffLocation, preferredVehicleType } = rideRequest;

      // Calculate distance and time
      const distance = this.calculateDistance(pickupLocation, dropoffLocation);
      const estimatedDuration = this.estimateTravelTime(distance);

      // Calculate surge multiplier
      const surgeMultiplier = await this.calculateSurgeMultiplier(pickupLocation);

      // Calculate fare
      const fareCalculation = this.calculateFare(distance, estimatedDuration, surgeMultiplier, rideRequest.subscriptionDiscount || 0);

      // Find nearby drivers
      const drivers = await this.findNearbyDrivers(
        pickupLocation,
        5000, // 5km radius
        10,
        preferredVehicleType
      );

      const matches: RideMatch[] = [];

      for (const driver of drivers) {
        // Get driver's active vehicle
        const activeVehicle = await Vehicle.findOne({
          driverId: driver._id,
          status: 'active'
        });

        if (!activeVehicle) continue;

        // Calculate distance from driver to pickup
        const driverDistance = driver.currentLocation
          ? this.calculateDistance(driver.currentLocation, pickupLocation)
          : 0;

        matches.push({
          driver,
          vehicle: activeVehicle,
          estimatedFare: fareCalculation.totalFare,
          estimatedDistance: distance,
          estimatedDuration,
          distance: driverDistance
        });
      }

      // Sort by distance (closest first)
      return matches.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error('Error matching ride:', error);
      return [];
    }
  }

  /**
   * Create a new ride
   */
  static async createRide(
    riderId: string,
    rideRequest: RideRequest,
    matchedDriver?: IUser
  ): Promise<IRide> {
    try {
      const { pickupLocation, dropoffLocation, isPooled, paymentMethod } = rideRequest;

      // Calculate route details
      const distance = this.calculateDistance(pickupLocation, dropoffLocation);
      const estimatedDuration = this.estimateTravelTime(distance);
      const surgeMultiplier = await this.calculateSurgeMultiplier(pickupLocation);
      const fareCalculation = this.calculateFare(distance, estimatedDuration, surgeMultiplier, rideRequest.subscriptionDiscount || 0);

      // Create passenger object
      const passenger = {
        userId: riderId,
        pickupLocation,
        dropoffLocation,
        fare: fareCalculation.totalFare,
        paymentStatus: PaymentStatus.PENDING,
        joinedAt: new Date()
      };

      // Create ride waypoints
      const route = [
        {
          location: pickupLocation,
          type: 'pickup' as const,
          passengerId: riderId,
          estimatedTime: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
        },
        {
          location: dropoffLocation,
          type: 'dropoff' as const,
          passengerId: riderId,
          estimatedTime: new Date(Date.now() + (estimatedDuration + 5) * 60 * 1000)
        }
      ];

      // If driver is matched, assign them
      let driverId = null;
      let vehicleId = null;

      if (matchedDriver) {
        driverId = matchedDriver._id;

        // Get driver's active vehicle
        const vehicle = await Vehicle.findOne({
          driverId: matchedDriver._id,
          status: 'active'
        });

        if (vehicle) {
          vehicleId = vehicle._id;
        }
      }

      // Create ride
      const ride = new Ride({
        isPooled: isPooled || false,
        capacity: 1, // Will be updated if pooled
        driverId,
        vehicleId,
        passengers: [passenger],
        route,
        estimatedDistance: distance,
        estimatedDuration,
        baseFare: fareCalculation.baseFare,
        totalFare: fareCalculation.totalFare,
        driverEarnings: fareCalculation.driverEarnings,
        platformCommission: fareCalculation.platformCommission,
        paymentMethod,
        status: driverId ? RideStatus.ACCEPTED : RideStatus.REQUESTED
      });

      await ride.save();

      // Generate OTP if driver is assigned
      if (driverId) {
        ride.generateOTP();
        await ride.save();
      }

      return ride;
    } catch (error) {
      console.error('Error creating ride:', error);
      throw new Error('Failed to create ride');
    }
  }

  /**
   * Update ride status
   */
  static async updateRideStatus(
    rideId: string,
    newStatus: RideStatus,
    userId: string,
    userRole: UserRole
  ): Promise<IRide> {
    try {
      const ride = await Ride.findById(rideId);

      if (!ride) {
        throw new Error('Ride not found');
      }

      // Authorization checks
      if (userRole === UserRole.RIDER) {
        // Riders can only update their own rides and only to cancel
        const isRiderInRide = ride.passengers.some(p => p.userId.toString() === userId);
        if (!isRiderInRide) {
          throw new Error('Unauthorized: Not a passenger in this ride');
        }
        if (newStatus !== RideStatus.CANCELLED) {
          throw new Error('Riders can only cancel rides');
        }
      } else if (userRole === UserRole.DRIVER) {
        // Drivers can only update rides assigned to them
        if (ride.driverId?.toString() !== userId) {
          throw new Error('Unauthorized: Ride not assigned to this driver');
        }
      }

      // Status transition validation
      const validTransitions: Record<RideStatus, RideStatus[]> = {
        [RideStatus.REQUESTED]: [RideStatus.ACCEPTED, RideStatus.CANCELLED],
        [RideStatus.ACCEPTED]: [RideStatus.DRIVER_ARRIVED, RideStatus.STARTED, RideStatus.CANCELLED],
        [RideStatus.DRIVER_ARRIVED]: [RideStatus.STARTED, RideStatus.CANCELLED],
        [RideStatus.STARTED]: [RideStatus.COMPLETED, RideStatus.CANCELLED],
        [RideStatus.COMPLETED]: [],
        [RideStatus.CANCELLED]: []
      };

      if (!validTransitions[ride.status].includes(newStatus)) {
        throw new Error(`Invalid status transition from ${ride.status} to ${newStatus}`);
      }

      await ride.updateStatus(newStatus);
      return ride;
    } catch (error) {
      console.error('Error updating ride status:', error);
      throw error;
    }
  }

  /**
   * Get ride details with populated references
   */
  static async getRideDetails(rideId: string, userId: string): Promise<IRide | null> {
    try {
      const ride = await Ride.findById(rideId)
        .populate('driverId', 'firstName lastName phoneNumber averageRating currentLocation')
        .populate('vehicleId', 'make model licensePlate type color')
        .populate('passengers.userId', 'firstName lastName phoneNumber avatar');

      if (!ride) return null;

      // Check if user is authorized to view this ride
      const isDriver = ride.driverId?._id.toString() === userId;
      const isPassenger = ride.passengers.some(p => p.userId._id.toString() === userId);

      if (!isDriver && !isPassenger) {
        throw new Error('Unauthorized: Not authorized to view this ride');
      }

      return ride;
    } catch (error) {
      console.error('Error getting ride details:', error);
      throw error;
    }
  }

  /**
   * Get user's ride history
   */
  static async getUserRideHistory(
    userId: string,
    userRole: UserRole,
    page: number = 1,
    limit: number = 10
  ): Promise<{ rides: IRide[], total: number }> {
    try {
      const skip = (page - 1) * limit;

      let query: any = {};

      if (userRole === UserRole.RIDER) {
        query['passengers.userId'] = userId;
      } else if (userRole === UserRole.DRIVER) {
        query.driverId = userId;
      }

      const rides = await Ride.find(query)
        .populate('driverId', 'firstName lastName phoneNumber averageRating')
        .populate('vehicleId', 'make model licensePlate type')
        .populate('passengers.userId', 'firstName lastName avatar')
        .sort({ requestedAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Ride.countDocuments(query);

      return { rides, total };
    } catch (error) {
      console.error('Error getting user ride history:', error);
      throw error;
    }
  }

  /**
   * Helper method to convert degrees to radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
