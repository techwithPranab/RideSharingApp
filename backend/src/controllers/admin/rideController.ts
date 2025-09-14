/**
 * Admin Ride Management Controller
 * Handles all ride-related administrative operations
 */

import { Request, Response } from 'express';
import { Ride, RideStatus } from '../../models/Ride';
import { asyncHandler } from '../../middleware/asyncHandler';

/**
 * Get all rides with filtering and pagination
 */
export const getRides = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    status,
    search,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query
  const query: any = {};

  if (status && status !== 'all') {
    query.status = status;
  }

  if (search) {
    // Search by ride ID or user names
    query.$or = [
      { rideId: { $regex: search, $options: 'i' } }
    ];
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate as string);
    if (endDate) query.createdAt.$lte = new Date(endDate as string);
  }

  // Calculate pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Get rides with populated data
  const rides = await Ride.find(query)
    .populate('driverId', 'firstName lastName phoneNumber')
    .populate('vehicleId', 'make model licensePlate')
    .populate('passengers.userId', 'firstName lastName phoneNumber')
    .sort({ [sortBy as string]: sortOrder === 'desc' ? -1 : 1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  // Get total count for pagination
  const totalRides = await Ride.countDocuments(query);
  const totalPages = Math.ceil(totalRides / limitNum);

  // Add additional computed fields and transform data for frontend compatibility
  const ridesWithStats = rides.map(ride => {
    const firstPassenger = ride.passengers[0];
    return {
      ...ride,
      // Add computed fields for frontend compatibility
      pickupLocation: firstPassenger?.pickupLocation || null,
      dropoffLocation: firstPassenger?.dropoffLocation || null,
      passengerCount: ride.passengers.length,
      totalPassengerFare: ride.passengers.reduce((sum, p) => sum + p.fare, 0),
      averageRating: ride.passengers.length > 0
        ? ride.passengers.reduce((sum, p) => sum + (p.rating || 0), 0) / ride.passengers.length
        : null
    };
  });

  res.status(200).json({
    success: true,
    data: {
      rides: ridesWithStats,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalRides,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    }
  });
});

/**
 * Get ride details by ID
 */
export const getRideById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const ride = await Ride.findById(id)
    .populate('driverId', 'firstName lastName phoneNumber email')
    .populate('vehicleId', 'make model licensePlate type')
    .populate('passengers.userId', 'firstName lastName phoneNumber email')
    .populate('appliedSubscriptionId', 'name discountType discountValue');

  if (!ride) {
    res.status(404).json({
      success: false,
      message: 'Ride not found'
    });
    return;
  }

  // Get ride statistics
  const rideStats = await getRideStats(id);

  // Transform ride data for frontend compatibility
  const firstPassenger = ride.passengers[0];
  const transformedRide = {
    ...ride.toObject(),
    ...rideStats,
    pickupLocation: firstPassenger?.pickupLocation || null,
    dropoffLocation: firstPassenger?.dropoffLocation || null
  };

  res.status(200).json({
    success: true,
    data: {
      ride: transformedRide
    }
  });
});

/**
 * Update ride status
 */
export const updateRideStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, cancellationReason } = req.body;

  if (!Object.values(RideStatus).includes(status)) {
    res.status(400).json({
      success: false,
      message: 'Invalid status value'
    });
    return;
  }

  const ride = await Ride.findById(id);
  if (!ride) {
    res.status(404).json({
      success: false,
      message: 'Ride not found'
    });
    return;
  }

  // Update status with timestamp
  await ride.updateStatus(status);

  // Add cancellation reason if provided
  if (status === RideStatus.CANCELLED && cancellationReason) {
    ride.cancellationReason = cancellationReason;
    await ride.save();
  }

  res.status(200).json({
    success: true,
    data: { ride },
    message: `Ride status updated to ${status}`
  });
});

/**
 * Get active rides
 */
export const getActiveRides = asyncHandler(async (_req: Request, res: Response) => {
  const activeStatuses = [RideStatus.REQUESTED, RideStatus.ACCEPTED, RideStatus.DRIVER_ARRIVED, RideStatus.STARTED];

  const activeRides = await Ride.find({
    status: { $in: activeStatuses }
  })
  .populate('driverId', 'firstName lastName phoneNumber')
  .populate('vehicleId', 'make model licensePlate')
  .populate('passengers.userId', 'firstName lastName')
  .sort({ createdAt: -1 });

  // Add real-time status info and transform data for frontend compatibility
  const ridesWithStatus = activeRides.map(ride => {
    const firstPassenger = ride.passengers[0];
    return {
      ...ride.toObject(),
      pickupLocation: firstPassenger?.pickupLocation || null,
      dropoffLocation: firstPassenger?.dropoffLocation || null,
      timeElapsed: ride.startedAt
        ? Math.floor((Date.now() - ride.startedAt.getTime()) / (1000 * 60)) // minutes
        : Math.floor((Date.now() - ride.createdAt.getTime()) / (1000 * 60)), // minutes since request
      estimatedTimeRemaining: ride.estimatedDuration && ride.startedAt
        ? Math.max(0, ride.estimatedDuration - Math.floor((Date.now() - ride.startedAt.getTime()) / (1000 * 60)))
        : ride.estimatedDuration || 0
    };
  });

  res.status(200).json({
    success: true,
    data: {
      rides: ridesWithStatus,
      totalActive: activeRides.length
    }
  });
});

/**
 * Get ride statistics
 */
export const getRideStatistics = asyncHandler(async (req: Request, res: Response) => {
  const { period = 'month' } = req.query;

  let startDate: Date;
  const now = new Date();

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const [
    totalRides,
    completedRides,
    cancelledRides,
    totalRevenue,
    averageRideDuration,
    ridesByStatus,
    ridesByHour,
    topRoutes
  ] = await Promise.all([
    // Total rides in period
    Ride.countDocuments({ createdAt: { $gte: startDate } }),

    // Completed rides
    Ride.countDocuments({
      status: RideStatus.COMPLETED,
      createdAt: { $gte: startDate }
    }),

    // Cancelled rides
    Ride.countDocuments({
      status: RideStatus.CANCELLED,
      createdAt: { $gte: startDate }
    }),

    // Total revenue
    Ride.aggregate([
      { $match: { status: RideStatus.COMPLETED, createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$totalFare' } } }
    ]),

    // Average ride duration
    Ride.aggregate([
      { $match: { status: RideStatus.COMPLETED, createdAt: { $gte: startDate } } },
      { $group: { _id: null, avgDuration: { $avg: '$actualDuration' } } }
    ]),

    // Rides by status
    Ride.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),

    // Rides by hour
    Ride.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]),

    // Top routes (simplified - would need route analysis)
    Ride.aggregate([
      { $match: { status: RideStatus.COMPLETED, createdAt: { $gte: startDate } } },
      { $limit: 10 },
      {
        $project: {
          rideId: 1,
          totalFare: 1,
          distance: '$estimatedDistance'
        }
      }
    ])
  ]);

  const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;
  const avgDuration = averageRideDuration.length > 0 ? averageRideDuration[0].avgDuration : 0;

  res.status(200).json({
    success: true,
    data: {
      period,
      overview: {
        totalRides,
        completedRides,
        cancelledRides,
        completionRate: totalRides > 0 ? ((completedRides / totalRides) * 100).toFixed(1) : '0.0',
        totalRevenue: revenue,
        averageRideDuration: Math.round(avgDuration),
        averageFare: totalRides > 0 ? (revenue / totalRides).toFixed(2) : '0.00'
      },
      charts: {
        ridesByStatus,
        ridesByHour,
        topRoutes
      }
    }
  });
});

/**
 * Get ride stats helper function
 */
const getRideStats = async (rideId: string) => {
  const ride = await Ride.findById(rideId);

  if (!ride) return {};

  const [
    driverRating,
    passengerCount,
    totalDistance,
    totalDuration
  ] = await Promise.all([
    // Driver rating from passengers
    Ride.aggregate([
      { $match: { _id: ride._id } },
      { $unwind: '$passengers' },
      { $group: { _id: null, avgRating: { $avg: '$passengers.rating' } } }
    ]),

    // Passenger count
    Ride.findById(rideId).then(r => r?.passengers.length || 0),

    // Total distance (actual or estimated)
    Promise.resolve(ride.actualDistance || ride.estimatedDistance),

    // Total duration (actual or estimated)
    Promise.resolve(ride.actualDuration || ride.estimatedDuration)
  ]);

  const avgDriverRating = driverRating.length > 0 ? driverRating[0].avgRating : null;

  return {
    driverRating: avgDriverRating ? Number(avgDriverRating.toFixed(1)) : null,
    passengerCount,
    totalDistance,
    totalDuration,
    platformEarnings: ride.platformCommission,
    driverEarnings: ride.driverEarnings
  };
};

/**
 * Get rides by driver
 */
export const getRidesByDriver = asyncHandler(async (req: Request, res: Response) => {
  const { driverId } = req.params;
  const { page = 1, limit = 10, status } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const query: any = { driverId };
  if (status && status !== 'all') {
    query.status = status;
  }

  const rides = await Ride.find(query)
    .populate('passengers.userId', 'firstName lastName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const totalRides = await Ride.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      rides,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalRides / limitNum),
        totalRides
      }
    }
  });
});

/**
 * Get rides by passenger
 */
export const getRidesByPassenger = asyncHandler(async (req: Request, res: Response) => {
  const { passengerId } = req.params;
  const { page = 1, limit = 10, status } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const query: any = { 'passengers.userId': passengerId };
  if (status && status !== 'all') {
    query.status = status;
  }

  const rides = await Ride.find(query)
    .populate('driverId', 'firstName lastName')
    .populate('vehicleId', 'make model')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const totalRides = await Ride.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      rides,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalRides / limitNum),
        totalRides
      }
    }
  });
});
