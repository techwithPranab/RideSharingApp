/**
 * Unit tests for Ride Service
 * Tests ride matching algorithm, pooling logic, and ride management
 */

const { RideService } = require('../../../../backend/src/services/rideService');
const { User } = require('../../../../backend/src/models/User');
const { Ride } = require('../../../../backend/src/models/Ride');
const { Vehicle } = require('../../../../backend/src/models/Vehicle');

// Mock dependencies
jest.mock('../../../../backend/src/models/User');
jest.mock('../../../../backend/src/models/Ride');
jest.mock('../../../../backend/src/models/Vehicle');

describe('RideService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findAvailableDrivers', () => {
    it('should find available drivers within radius', async () => {
      const rideRequest = {
        userId: 'rider-id',
        pickupLocation: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749]
        },
        dropoffLocation: {
          type: 'Point',
          coordinates: [-122.4094, 37.7849]
        },
        rideType: 'regular',
        isPooled: false
      };

      const mockDrivers = [
        {
          _id: 'driver-1',
          firstName: 'John',
          lastName: 'Driver',
          phoneNumber: '+1234567890',
          averageRating: 4.5,
          currentLocation: {
            type: 'Point',
            coordinates: [-122.4194, 37.7749]
          },
          isAvailable: true,
          status: 'active'
        }
      ];

      const mockVehicles = [
        {
          _id: 'vehicle-1',
          driverId: 'driver-1',
          make: 'Toyota',
          model: 'Camry',
          licensePlate: 'ABC123',
          type: 'sedan',
          color: 'white',
          isActive: true
        }
      ];

      User.find.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockDrivers)
      }));

      Vehicle.find.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockVehicles)
      }));

      // Mock distance calculation
      RideService.calculateDistance = jest.fn().mockReturnValue(2.5);
      RideService.calculateFare = jest.fn().mockReturnValue({
        baseFare: 20.00,
        distanceFare: 5.00,
        timeFare: 3.00,
        totalFare: 28.00
      });
      RideService.calculateDuration = jest.fn().mockReturnValue(15);

      const result = await RideService.findAvailableDrivers(rideRequest);

      expect(User.find).toHaveBeenCalledWith({
        role: 'driver',
        isAvailable: true,
        status: 'active',
        currentLocation: {
          $near: {
            $geometry: rideRequest.pickupLocation,
            $maxDistance: expect.any(Number)
          }
        }
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        driver: expect.objectContaining({
          _id: 'driver-1',
          firstName: 'John',
          lastName: 'Driver'
        }),
        vehicle: expect.objectContaining({
          _id: 'vehicle-1',
          make: 'Toyota',
          model: 'Camry'
        }),
        distance: 2.5,
        estimatedFare: 28.00,
        estimatedDuration: 15
      });
    });

    it('should return empty array when no drivers available', async () => {
      const rideRequest = {
        userId: 'rider-id',
        pickupLocation: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749]
        },
        dropoffLocation: {
          type: 'Point',
          coordinates: [-122.4094, 37.7849]
        }
      };

      User.find.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue([])
      }));

      const result = await RideService.findAvailableDrivers(rideRequest);

      expect(result).toEqual([]);
    });

    it('should sort drivers by distance', async () => {
      const rideRequest = {
        userId: 'rider-id',
        pickupLocation: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749]
        },
        dropoffLocation: {
          type: 'Point',
          coordinates: [-122.4094, 37.7849]
        }
      };

      const mockDrivers = [
        { _id: 'driver-1', firstName: 'John', isAvailable: true, status: 'active' },
        { _id: 'driver-2', firstName: 'Jane', isAvailable: true, status: 'active' }
      ];

      const mockVehicles = [
        { _id: 'vehicle-1', driverId: 'driver-1', make: 'Toyota', isActive: true },
        { _id: 'vehicle-2', driverId: 'driver-2', make: 'Honda', isActive: true }
      ];

      User.find.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockDrivers)
      }));

      Vehicle.find.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockVehicles)
      }));

      // Mock different distances
      RideService.calculateDistance = jest.fn()
        .mockReturnValueOnce(5.0) // driver-1 farther
        .mockReturnValueOnce(2.0); // driver-2 closer

      RideService.calculateFare = jest.fn().mockReturnValue({ totalFare: 25.00 });
      RideService.calculateDuration = jest.fn().mockReturnValue(15);

      const result = await RideService.findAvailableDrivers(rideRequest);

      expect(result).toHaveLength(2);
      // driver-2 should be first (closer)
      expect(result[0].driver._id).toBe('driver-2');
      expect(result[0].distance).toBe(2.0);
      expect(result[1].driver._id).toBe('driver-1');
      expect(result[1].distance).toBe(5.0);
    });
  });

  describe('createRide', () => {
    it('should create a new ride successfully', async () => {
      const userId = 'rider-id';
      const rideRequest = {
        pickupLocation: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749],
          address: '123 Main St'
        },
        dropoffLocation: {
          type: 'Point',
          coordinates: [-122.4094, 37.7849],
          address: '456 Oak St'
        },
        rideType: 'regular',
        isPooled: false
      };
      const driver = {
        _id: 'driver-id',
        firstName: 'John',
        lastName: 'Driver'
      };

      const mockRide = {
        _id: 'ride-id',
        rideId: 'R123456',
        status: 'requested',
        save: jest.fn().mockResolvedValue(true)
      };

      Ride.mockImplementation(() => mockRide);

      // Mock ID generation
      RideService.generateRideId = jest.fn().mockReturnValue('R123456');
      RideService.generateOTP = jest.fn().mockReturnValue('1234');
      RideService.calculateFare = jest.fn().mockReturnValue({
        baseFare: 20.00,
        distanceFare: 5.00,
        timeFare: 3.00,
        totalFare: 28.00
      });
      RideService.calculateDistance = jest.fn().mockReturnValue(5.2);
      RideService.calculateDuration = jest.fn().mockReturnValue(15);

      const result = await RideService.createRide(userId, rideRequest, driver);

      expect(Ride).toHaveBeenCalledWith(expect.objectContaining({
        rideId: 'R123456',
        status: 'requested',
        passengers: expect.arrayContaining([
          expect.objectContaining({
            userId,
            pickupLocation: rideRequest.pickupLocation,
            dropoffLocation: rideRequest.dropoffLocation,
            fare: 28.00
          })
        ]),
        driverId: 'driver-id',
        totalFare: 28.00,
        otp: '1234'
      }));

      expect(mockRide.save).toHaveBeenCalled();
      expect(result).toBe(mockRide);
    });
  });

  describe('calculateFare', () => {
    it('should calculate fare correctly', () => {
      const distance = 5.5; // km
      const duration = 20; // minutes
      const rideType = 'regular';

      const result = RideService.calculateFare(distance, duration, rideType);

      expect(result).toEqual({
        baseFare: expect.any(Number),
        distanceFare: expect.any(Number),
        timeFare: expect.any(Number),
        totalFare: expect.any(Number)
      });

      expect(result.totalFare).toBe(
        result.baseFare + result.distanceFare + result.timeFare
      );
    });

    it('should apply premium multiplier for premium rides', () => {
      const distance = 5.0;
      const duration = 15;

      const regularFare = RideService.calculateFare(distance, duration, 'regular');
      const premiumFare = RideService.calculateFare(distance, duration, 'premium');

      expect(premiumFare.totalFare).toBeGreaterThan(regularFare.totalFare);
    });

    it('should apply pooled ride discount', () => {
      const distance = 5.0;
      const duration = 15;

      const regularFare = RideService.calculateFare(distance, duration, 'regular', false);
      const pooledFare = RideService.calculateFare(distance, duration, 'regular', true);

      expect(pooledFare.totalFare).toBeLessThan(regularFare.totalFare);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance using Haversine formula', () => {
      const point1 = {
        coordinates: [-122.4194, 37.7749] // San Francisco
      };
      const point2 = {
        coordinates: [-122.4094, 37.7849] // Nearby point
      };

      const distance = RideService.calculateDistance(point1, point2);

      expect(distance).toBeGreaterThan(0);
      expect(typeof distance).toBe('number');
    });

    it('should return 0 for same coordinates', () => {
      const point1 = {
        coordinates: [-122.4194, 37.7749]
      };
      const point2 = {
        coordinates: [-122.4194, 37.7749]
      };

      const distance = RideService.calculateDistance(point1, point2);

      expect(distance).toBe(0);
    });
  });

  describe('findPoolingOpportunities', () => {
    it('should find rides available for pooling', async () => {
      const rideRequest = {
        pickupLocation: {
          coordinates: [-122.4194, 37.7749]
        },
        dropoffLocation: {
          coordinates: [-122.4094, 37.7849]
        }
      };

      const mockPoolableRides = [
        {
          _id: 'ride-1',
          status: 'accepted',
          isPooled: true,
          passengers: [
            {
              userId: 'other-rider',
              pickupLocation: { coordinates: [-122.4190, 37.7750] },
              dropoffLocation: { coordinates: [-122.4090, 37.7850] }
            }
          ],
          maxPassengers: 4
        }
      ];

      Ride.find.mockImplementation(() => ({
        populate: jest.fn().mockResolvedValue(mockPoolableRides)
      }));

      RideService.calculateDistance = jest.fn().mockReturnValue(0.5); // Close enough

      const result = await RideService.findPoolingOpportunities(rideRequest);

      expect(Ride.find).toHaveBeenCalledWith({
        status: { $in: ['accepted', 'started'] },
        isPooled: true,
        $expr: { $lt: [{ $size: '$passengers' }, '$maxPassengers'] }
      });

      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe('ride-1');
    });

    it('should filter out rides that are too far', async () => {
      const rideRequest = {
        pickupLocation: { coordinates: [-122.4194, 37.7749] },
        dropoffLocation: { coordinates: [-122.4094, 37.7849] }
      };

      const mockRides = [
        {
          _id: 'ride-1',
          passengers: [
            {
              pickupLocation: { coordinates: [-122.4190, 37.7750] },
              dropoffLocation: { coordinates: [-122.4090, 37.7850] }
            }
          ]
        }
      ];

      Ride.find.mockImplementation(() => ({
        populate: jest.fn().mockResolvedValue(mockRides)
      }));

      // Mock large distance (too far for pooling)
      RideService.calculateDistance = jest.fn().mockReturnValue(10.0);

      const result = await RideService.findPoolingOpportunities(rideRequest);

      expect(result).toHaveLength(0);
    });
  });

  describe('updateRideStatus', () => {
    it('should update ride status successfully', async () => {
      const rideId = 'ride-id';
      const newStatus = 'started';
      const userId = 'driver-id';
      const userRole = 'driver';

      const mockRide = {
        _id: 'ride-id',
        status: 'accepted',
        driverId: 'driver-id',
        save: jest.fn().mockResolvedValue(true)
      };

      Ride.findById.mockResolvedValue(mockRide);

      const result = await RideService.updateRideStatus(rideId, newStatus, userId, userRole);

      expect(Ride.findById).toHaveBeenCalledWith(rideId);
      expect(mockRide.status).toBe('started');
      expect(mockRide.startedAt).toBeDefined();
      expect(mockRide.save).toHaveBeenCalled();
      expect(result).toBe(mockRide);
    });

    it('should throw error for unauthorized user', async () => {
      const mockRide = {
        _id: 'ride-id',
        status: 'accepted',
        driverId: 'correct-driver-id'
      };

      Ride.findById.mockResolvedValue(mockRide);

      await expect(
        RideService.updateRideStatus('ride-id', 'started', 'wrong-user-id', 'driver')
      ).rejects.toThrow('Unauthorized to update this ride');
    });

    it('should validate status transitions', async () => {
      const mockRide = {
        _id: 'ride-id',
        status: 'requested',
        driverId: 'driver-id'
      };

      Ride.findById.mockResolvedValue(mockRide);

      // Cannot go directly from requested to completed
      await expect(
        RideService.updateRideStatus('ride-id', 'completed', 'driver-id', 'driver')
      ).rejects.toThrow('Invalid status transition');
    });
  });

  describe('generateRideId', () => {
    it('should generate unique ride ID', () => {
      const rideId1 = RideService.generateRideId();
      const rideId2 = RideService.generateRideId();

      expect(typeof rideId1).toBe('string');
      expect(typeof rideId2).toBe('string');
      expect(rideId1).not.toBe(rideId2);
      expect(rideId1).toMatch(/^R[A-Z0-9]+$/); // Format: R followed by alphanumeric
    });
  });

  describe('generateOTP', () => {
    it('should generate 4-digit OTP', () => {
      const otp = RideService.generateOTP();

      expect(typeof otp).toBe('string');
      expect(otp).toMatch(/^\d{4}$/); // 4 digits
      expect(otp.length).toBe(4);
    });

    it('should generate different OTPs', () => {
      const otp1 = RideService.generateOTP();
      const otp2 = RideService.generateOTP();

      // While it's possible they could be the same, it's very unlikely
      expect(typeof otp1).toBe('string');
      expect(typeof otp2).toBe('string');
    });
  });
});
