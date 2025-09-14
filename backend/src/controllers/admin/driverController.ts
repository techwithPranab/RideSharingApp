/**
 * Admin Driver Management Controller
 * Handles all driver-related administrative operations
 */

import { Request, Response } from 'express';
import { User, UserRole, UserStatus } from '../../models/User';
import { Ride, RideStatus } from '../../models/Ride';
import { asyncHandler } from '../../middleware/asyncHandler';

/**
 * Get all drivers with filtering and pagination
 */
export const getDrivers = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query for drivers only
  const query: any = {
    role: UserRole.DRIVER
  };

  if (status && status !== 'all') {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  // Calculate pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Get drivers with populated vehicle data
  const drivers = await User.find(query)
    .select('-password')
    .populate({
      path: 'vehicleIds',
      options: { lean: true }
    })
    .sort({ [sortBy as string]: sortOrder === 'desc' ? -1 : 1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  // Get total count for pagination
  const totalDrivers = await User.countDocuments(query);
  const totalPages = Math.ceil(totalDrivers / limitNum);

  // Add additional stats for each driver and handle null vehicleIds
  const driversWithStats = await Promise.all(
    drivers.map(async (driver) => {
      const driverStats = await getDriverStats(driver._id.toString());
      return {
        ...driver,
        vehicleIds: driver.vehicleIds || [],
        ...driverStats
      };
    })
  );

  res.status(200).json({
    success: true,
    data: {
      drivers: driversWithStats,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalDrivers,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    }
  });
});

/**
 * Get driver details by ID
 */
export const getDriverById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const driver = await User.findOne({ _id: id, role: UserRole.DRIVER })
    .select('-password')
    .populate({
      path: 'vehicleIds',
      options: { lean: true }
    });

  if (!driver) {
    res.status(404).json({
      success: false,
      message: 'Driver not found'
    });
    return;
  }

  // Get driver statistics
  const driverStats = await getDriverStats(id);

  res.status(200).json({
    success: true,
    data: {
      driver: {
        ...driver.toObject(),
        vehicleIds: driver.vehicleIds || [],
        ...driverStats
      }
    }
  });
});

/**
 * Approve driver application
 */
export const approveDriver = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const driver = await User.findOneAndUpdate(
    { _id: id, role: UserRole.DRIVER },
    {
      status: UserStatus.ACTIVE,
      updatedAt: new Date()
    },
    { new: true }
  ).select('-password');

  if (!driver) {
    res.status(404).json({
      success: false,
      message: 'Driver not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: { driver },
    message: 'Driver approved successfully'
  });
});

/**
 * Suspend driver
 */
export const suspendDriver = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const driver = await User.findOneAndUpdate(
    { _id: id, role: UserRole.DRIVER },
    {
      status: UserStatus.SUSPENDED,
      updatedAt: new Date()
    },
    { new: true }
  ).select('-password');

  if (!driver) {
    res.status(404).json({
      success: false,
      message: 'Driver not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: { driver },
    message: 'Driver suspended successfully'
  });
});

/**
 * Update driver information
 */
export const updateDriver = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updateData = req.body;

  // Remove sensitive fields
  delete updateData.password;
  delete updateData.role;
  delete updateData._id;

  const driver = await User.findOneAndUpdate(
    { _id: id, role: UserRole.DRIVER },
    {
      ...updateData,
      updatedAt: new Date()
    },
    { new: true }
  ).select('-password');

  if (!driver) {
    res.status(404).json({
      success: false,
      message: 'Driver not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: { driver },
    message: 'Driver information updated successfully'
  });
});

/**
 * Get pending driver applications
 */
export const getPendingDrivers = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const pendingDrivers = await User.find({
    role: UserRole.DRIVER,
    status: UserStatus.PENDING_VERIFICATION
  })
  .select('-password')
  .populate({
    path: 'vehicleIds',
    options: { lean: true }
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limitNum);

  // Transform pending drivers to handle null vehicleIds
  const transformedPendingDrivers = pendingDrivers.map(driver => ({
    ...driver.toObject(),
    vehicleIds: driver.vehicleIds || []
  }));

  const totalPending = await User.countDocuments({
    role: UserRole.DRIVER,
    status: UserStatus.PENDING_VERIFICATION
  });

  res.status(200).json({
    success: true,
    data: {
      drivers: transformedPendingDrivers,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalPending / limitNum),
        totalDrivers: totalPending
      }
    }
  });
});

/**
 * Get driver statistics helper function
 */
const getDriverStats = async (driverId: string) => {
  const [
    totalRides,
    completedRides,
    cancelledRides,
    totalEarnings,
    averageRating,
    todayRides,
    weeklyRides,
    monthlyRides
  ] = await Promise.all([
    // Total rides as driver
    Ride.countDocuments({ driverId, status: { $ne: 'cancelled' } }),

    // Completed rides
    Ride.countDocuments({ driverId, status: RideStatus.COMPLETED }),

    // Cancelled rides
    Ride.countDocuments({ driverId, status: 'cancelled' }),

    // Total earnings
    Ride.aggregate([
      { $match: { driverId: driverId, status: RideStatus.COMPLETED } },
      { $group: { _id: null, total: { $sum: '$driverEarnings' } } }
    ]),

    // Average rating
    Ride.aggregate([
      { $match: { driverId: driverId, status: RideStatus.COMPLETED } },
      { $group: { _id: null, avgRating: { $avg: '$rating.driverRating' } } }
    ]),

    // Today's rides
    Ride.countDocuments({
      driverId,
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    }),

    // This week's rides
    Ride.countDocuments({
      driverId,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }),

    // This month's rides
    Ride.countDocuments({
      driverId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    })
  ]);

  const earnings = totalEarnings.length > 0 ? totalEarnings[0].total : 0;
  const avgRating = averageRating.length > 0 ? averageRating[0].avgRating : null;

  return {
    totalRides,
    completedRides,
    cancelledRides,
    totalEarnings: earnings,
    rating: avgRating ? Number(avgRating.toFixed(1)) : null,
    todayRides,
    weeklyRides,
    monthlyRides,
    completionRate: totalRides > 0 ? ((completedRides / totalRides) * 100).toFixed(1) : '0.0'
  };
};

/**
 * Get driver performance metrics
 */
export const getDriverPerformance = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
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

  const rides = await Ride.find({
    driverId: id,
    createdAt: { $gte: startDate }
  }).sort({ createdAt: 1 });

  // Calculate daily earnings and ride counts
  const dailyStats = rides.reduce((acc: any, ride) => {
    const date = ride.createdAt.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { rides: 0, earnings: 0, rating: 0, ratingCount: 0 };
    }
    acc[date].rides += 1;
    acc[date].earnings += ride.driverEarnings || 0;
    // Calculate average rating from passengers
    const passengerRatings = ride.passengers
      .filter(p => p.rating !== undefined)
      .map(p => p.rating!);
    if (passengerRatings.length > 0) {
      const avgRating = passengerRatings.reduce((sum: number, rating: number) => sum + rating, 0) / passengerRatings.length;
      acc[date].rating += avgRating;
      acc[date].ratingCount += 1;
    }
    return acc;
  }, {});

  // Convert to array format
  const performanceData = Object.entries(dailyStats).map(([date, stats]: [string, any]) => ({
    date,
    rides: stats.rides,
    earnings: stats.earnings,
    averageRating: stats.ratingCount > 0 ? (stats.rating / stats.ratingCount).toFixed(1) : null
  }));

  res.status(200).json({
    success: true,
    data: {
      performance: performanceData,
      period,
      totalRides: rides.length,
      totalEarnings: rides.reduce((sum, ride) => sum + (ride.driverEarnings || 0), 0),
      averageRating: rides.length > 0
        ? (rides.reduce((sum, ride) => {
            const passengerRatings = ride.passengers
              .filter(p => p.rating !== undefined)
              .map(p => p.rating!);
            return sum + (passengerRatings.length > 0
              ? passengerRatings.reduce((s, r) => s + r, 0) / passengerRatings.length
              : 0);
          }, 0) / rides.length).toFixed(1)
        : null
    }
  });
});
