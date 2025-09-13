/**
 * Unit tests for Ride Controller
 * Tests ride creation, management, and booking flow
 */

const { RideController } = require('../../../../backend/src/controllers/rideController');
const { RideService } = require('../../../../backend/src/services/rideService');
const { Ride } = require('../../../../backend/src/models/Ride');
const { User } = require('../../../../backend/src/models/User');

// Mock dependencies
jest.mock('../../../../backend/src/services/rideService');
jest.mock('../../../../backend/src/models/Ride');
jest.mock('../../../../backend/src/models/User');
jest.mock('../../../../backend/src/utils/apiResponse');

describe('RideController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('requestRide', () => {
    it('should create a new ride request successfully', async () => {
      const rideData = {
        pickupLocation: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749],
          address: '123 Main St, San Francisco'
        },
        dropoffLocation: {
          type: 'Point',
          coordinates: [-122.4094, 37.7849],
          address: '456 Oak St, San Francisco'
        },
        rideType: 'regular',
        isPooled: false
      };

      mockReq.body = rideData;
      mockReq.user = { id: 'rider-id', role: 'rider' };

      const mockMatches = [{
        driver: {
          _id: 'driver-id',
          firstName: 'John',
          lastName: 'Driver',
          phoneNumber: '+1234567890',
          averageRating: 4.5,
          currentLocation: {
            type: 'Point',
            coordinates: [-122.4194, 37.7749]
          }
        },
        vehicle: {
          _id: 'vehicle-id',
          make: 'Toyota',
          model: 'Camry',
          licensePlate: 'ABC123',
          type: 'sedan',
          color: 'white'
        },
        estimatedFare: 25.50,
        estimatedDistance: 5.2,
        estimatedDuration: 15,
        distance: 0.5
      }];

      const mockRide = {
        _id: 'ride-id',
        status: 'requested',
        passengers: [{
          userId: 'rider-id',
          pickupLocation: rideData.pickupLocation,
          dropoffLocation: rideData.dropoffLocation,
          fare: 25.50
        }],
        driverId: 'driver-id',
        vehicleId: 'vehicle-id',
        totalFare: 25.50,
        estimatedDistance: 5.2,
        estimatedDuration: 15,
        otp: '1234',
        populate: jest.fn().mockReturnThis()
      };

      RideService.findAvailableDrivers.mockResolvedValue(mockMatches);
      RideService.createRide.mockResolvedValue(mockRide);

      const ApiResponse = require('../../../../backend/src/utils/apiResponse');
      ApiResponse.success = jest.fn();

      await RideController.requestRide(mockReq, mockRes);

      expect(RideService.findAvailableDrivers).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'rider-id',
          pickupLocation: rideData.pickupLocation,
          dropoffLocation: rideData.dropoffLocation,
          rideType: rideData.rideType,
          isPooled: rideData.isPooled
        })
      );

      expect(RideService.createRide).toHaveBeenCalledWith(
        'rider-id',
        expect.any(Object),
        mockMatches[0].driver
      );

      expect(ApiResponse.success).toHaveBeenCalledWith(
        mockRes,
        expect.objectContaining({
          message: 'Ride created successfully',
          ride: expect.objectContaining({
            id: 'ride-id',
            status: 'requested'
          })
        })
      );
    });

    it('should return error when no drivers available', async () => {
      mockReq.body = {
        pickupLocation: { type: 'Point', coordinates: [-122.4194, 37.7749] },
        dropoffLocation: { type: 'Point', coordinates: [-122.4094, 37.7849] },
        rideType: 'regular'
      };
      mockReq.user = { id: 'rider-id', role: 'rider' };

      RideService.findAvailableDrivers.mockResolvedValue([]);

      const ApiResponse = require('../../../../backend/src/utils/apiResponse');
      ApiResponse.error = jest.fn();

      await RideController.requestRide(mockReq, mockRes);

      expect(ApiResponse.error).toHaveBeenCalledWith(
        mockRes,
        'No drivers available at the moment',
        404
      );
    });

    it('should validate required fields', async () => {
      mockReq.body = {
        pickupLocation: { type: 'Point', coordinates: [-122.4194, 37.7749] }
        // Missing dropoffLocation
      };
      mockReq.user = { id: 'rider-id', role: 'rider' };

      const ApiResponse = require('../../../../backend/src/utils/apiResponse');
      ApiResponse.error = jest.fn();

      await RideController.requestRide(mockReq, mockRes);

      expect(ApiResponse.error).toHaveBeenCalledWith(
        mockRes,
        'Missing required fields: pickupLocation, dropoffLocation',
        400
      );
    });
  });

  describe('acceptRide', () => {
    it('should accept ride successfully as driver', async () => {
      mockReq.params = { rideId: 'ride-id' };
      mockReq.user = { id: 'driver-id', role: 'driver' };

      const mockRide = {
        _id: 'ride-id',
        status: 'requested',
        driverId: 'driver-id',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis()
      };

      Ride.findById.mockResolvedValue(mockRide);

      const ApiResponse = require('../../../../backend/src/utils/apiResponse');
      ApiResponse.success = jest.fn();

      await RideController.acceptRide(mockReq, mockRes);

      expect(mockRide.status).toBe('accepted');
      expect(mockRide.acceptedAt).toBeDefined();
      expect(mockRide.save).toHaveBeenCalled();

      expect(ApiResponse.success).toHaveBeenCalledWith(
        mockRes,
        expect.objectContaining({
          message: 'Ride accepted successfully',
          ride: expect.any(Object)
        })
      );
    });

    it('should return error if ride not found', async () => {
      mockReq.params = { rideId: 'non-existent-ride' };
      mockReq.user = { id: 'driver-id', role: 'driver' };

      Ride.findById.mockResolvedValue(null);

      const ApiResponse = require('../../../../backend/src/utils/apiResponse');
      ApiResponse.error = jest.fn();

      await RideController.acceptRide(mockReq, mockRes);

      expect(ApiResponse.error).toHaveBeenCalledWith(
        mockRes,
        'Ride not found',
        404
      );
    });

    it('should return error if user is not the assigned driver', async () => {
      mockReq.params = { rideId: 'ride-id' };
      mockReq.user = { id: 'wrong-driver-id', role: 'driver' };

      const mockRide = {
        _id: 'ride-id',
        status: 'requested',
        driverId: 'correct-driver-id'
      };

      Ride.findById.mockResolvedValue(mockRide);

      const ApiResponse = require('../../../../backend/src/utils/apiResponse');
      ApiResponse.error = jest.fn();

      await RideController.acceptRide(mockReq, mockRes);

      expect(ApiResponse.error).toHaveBeenCalledWith(
        mockRes,
        'You are not authorized to accept this ride',
        403
      );
    });

    it('should return error if ride is not in requested status', async () => {
      mockReq.params = { rideId: 'ride-id' };
      mockReq.user = { id: 'driver-id', role: 'driver' };

      const mockRide = {
        _id: 'ride-id',
        status: 'completed',
        driverId: 'driver-id'
      };

      Ride.findById.mockResolvedValue(mockRide);

      const ApiResponse = require('../../../../backend/src/utils/apiResponse');
      ApiResponse.error = jest.fn();

      await RideController.acceptRide(mockReq, mockRes);

      expect(ApiResponse.error).toHaveBeenCalledWith(
        mockRes,
        'Ride cannot be accepted in current status',
        400
      );
    });
  });

  describe('updateRideStatus', () => {
    it('should update ride status successfully', async () => {
      mockReq.params = { rideId: 'ride-id' };
      mockReq.body = { status: 'started' };
      mockReq.user = { id: 'driver-id', role: 'driver' };

      const mockRide = {
        _id: 'ride-id',
        status: 'accepted',
        driverId: 'driver-id',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis()
      };

      Ride.findById.mockResolvedValue(mockRide);

      const ApiResponse = require('../../../../backend/src/utils/apiResponse');
      ApiResponse.success = jest.fn();

      await RideController.updateRideStatus(mockReq, mockRes);

      expect(mockRide.status).toBe('started');
      expect(mockRide.startedAt).toBeDefined();
      expect(mockRide.save).toHaveBeenCalled();

      expect(ApiResponse.success).toHaveBeenCalledWith(
        mockRes,
        expect.objectContaining({
          message: 'Ride status updated successfully',
          ride: expect.any(Object)
        })
      );
    });

    it('should validate status transitions', async () => {
      mockReq.params = { rideId: 'ride-id' };
      mockReq.body = { status: 'completed' };
      mockReq.user = { id: 'driver-id', role: 'driver' };

      const mockRide = {
        _id: 'ride-id',
        status: 'requested', // Cannot go directly from requested to completed
        driverId: 'driver-id'
      };

      Ride.findById.mockResolvedValue(mockRide);

      const ApiResponse = require('../../../../backend/src/utils/apiResponse');
      ApiResponse.error = jest.fn();

      await RideController.updateRideStatus(mockReq, mockRes);

      expect(ApiResponse.error).toHaveBeenCalledWith(
        mockRes,
        'Invalid status transition',
        400
      );
    });
  });

  describe('getRideHistory', () => {
    it('should get user ride history successfully', async () => {
      mockReq.user = { id: 'user-id', role: 'rider' };
      mockReq.query = { page: '1', limit: '10' };

      const mockRides = [
        {
          _id: 'ride-1',
          status: 'completed',
          createdAt: new Date(),
          totalFare: 25.50
        },
        {
          _id: 'ride-2',
          status: 'completed',
          createdAt: new Date(),
          totalFare: 30.00
        }
      ];

      Ride.find.mockImplementation(() => ({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockRides)
      }));

      Ride.countDocuments.mockResolvedValue(2);

      const ApiResponse = require('../../../../backend/src/utils/apiResponse');
      ApiResponse.success = jest.fn();

      await RideController.getRideHistory(mockReq, mockRes);

      expect(ApiResponse.success).toHaveBeenCalledWith(
        mockRes,
        expect.objectContaining({
          message: 'Ride history retrieved successfully',
          data: expect.objectContaining({
            rides: expect.arrayContaining([
              expect.objectContaining({ _id: 'ride-1' })
            ]),
            pagination: expect.objectContaining({
              currentPage: 1,
              totalPages: 1,
              totalRides: 2
            })
          })
        })
      );
    });
  });

  describe('rateRide', () => {
    it('should rate ride successfully', async () => {
      mockReq.params = { rideId: 'ride-id' };
      mockReq.body = { rating: 5, review: 'Great ride!' };
      mockReq.user = { id: 'rider-id', role: 'rider' };

      const mockRide = {
        _id: 'ride-id',
        status: 'completed',
        passengers: [{
          userId: 'rider-id',
          rating: null
        }],
        driverId: 'driver-id',
        save: jest.fn().mockResolvedValue(true)
      };

      const mockDriver = {
        _id: 'driver-id',
        averageRating: 4.0,
        save: jest.fn().mockResolvedValue(true)
      };

      Ride.findById.mockResolvedValue(mockRide);
      Ride.find.mockResolvedValue([mockRide]); // For driver rating calculation
      User.findById.mockResolvedValue(mockDriver);

      const ApiResponse = require('../../../../backend/src/utils/apiResponse');
      ApiResponse.success = jest.fn();

      await RideController.rateRide(mockReq, mockRes);

      expect(mockRide.passengers[0].rating).toBe(5);
      expect(mockRide.passengers[0].review).toBe('Great ride!');
      expect(mockRide.save).toHaveBeenCalled();

      expect(ApiResponse.success).toHaveBeenCalledWith(
        mockRes,
        expect.objectContaining({
          message: 'Ride rated successfully',
          rating: expect.objectContaining({
            rating: 5,
            review: 'Great ride!'
          })
        })
      );
    });

    it('should return error if ride is not completed', async () => {
      mockReq.params = { rideId: 'ride-id' };
      mockReq.body = { rating: 5 };
      mockReq.user = { id: 'rider-id', role: 'rider' };

      const mockRide = {
        _id: 'ride-id',
        status: 'started', // Not completed
        passengers: [{ userId: 'rider-id' }]
      };

      Ride.findById.mockResolvedValue(mockRide);

      const ApiResponse = require('../../../../backend/src/utils/apiResponse');
      ApiResponse.error = jest.fn();

      await RideController.rateRide(mockReq, mockRes);

      expect(ApiResponse.error).toHaveBeenCalledWith(
        mockRes,
        'Can only rate completed rides',
        400
      );
    });

    it('should return error if user already rated', async () => {
      mockReq.params = { rideId: 'ride-id' };
      mockReq.body = { rating: 5 };
      mockReq.user = { id: 'rider-id', role: 'rider' };

      const mockRide = {
        _id: 'ride-id',
        status: 'completed',
        passengers: [{
          userId: 'rider-id',
          rating: 4 // Already rated
        }]
      };

      Ride.findById.mockResolvedValue(mockRide);

      const ApiResponse = require('../../../../backend/src/utils/apiResponse');
      ApiResponse.error = jest.fn();

      await RideController.rateRide(mockReq, mockRes);

      expect(ApiResponse.error).toHaveBeenCalledWith(
        mockRes,
        'You have already rated this ride',
        400
      );
    });
  });
});
