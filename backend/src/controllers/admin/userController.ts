/**
 * Admin User Management Controller
 * Handles all user-related administrative operations
 */

import { Request, Response } from 'express';
import { User, UserStatus } from '../../models/User';
import { Ride } from '../../models/Ride';
import { asyncHandler } from '../../middleware/asyncHandler';

/**
 * Get all users with filtering and pagination
 */
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    role,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query
  const query: any = {};

  if (status && status !== 'all') {
    query.status = status;
  }

  if (role && role !== 'all') {
    query.role = role;
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

  // Get users with populated data
  const users = await User.find(query)
    .select('-password') // Exclude password field
    .sort({ [sortBy as string]: sortOrder === 'desc' ? -1 : 1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  // Get total count for pagination
  const totalUsers = await User.countDocuments(query);
  const totalPages = Math.ceil(totalUsers / limitNum);

  // Add additional stats for each user
  const usersWithStats = await Promise.all(
    users.map(async (user) => {
      const userStats = await getUserStats(user._id.toString());
      return {
        ...user,
        ...userStats
      };
    })
  );

  res.status(200).json({
    success: true,
    data: {
      users: usersWithStats,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalUsers,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    }
  });
});

/**
 * Get user details by ID
 */
export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const user = await User.findById(id).select('-password');
  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found'
    });
    return;
  }

  // Get user statistics
  const userStats = await getUserStats(id);

  res.status(200).json({
    success: true,
    data: {
      user: {
        ...user.toObject(),
        ...userStats
      }
    }
  });
});

/**
 * Update user status
 */
export const updateUserStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  if (!Object.values(UserStatus).includes(status)) {
    res.status(400).json({
      success: false,
      message: 'Invalid status value'
    });
    return;
  }

  const user = await User.findByIdAndUpdate(
    id,
    {
      status,
      updatedAt: new Date()
    },
    { new: true }
  ).select('-password');

  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: { user },
    message: `User status updated to ${status}`
  });
});

/**
 * Update user information
 */
export const updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updateData = req.body;

  // Remove sensitive fields that shouldn't be updated via this endpoint
  delete updateData.password;
  delete updateData.role; // Role changes should be handled separately
  delete updateData._id;

  const user = await User.findByIdAndUpdate(
    id,
    {
      ...updateData,
      updatedAt: new Date()
    },
    { new: true }
  ).select('-password');

  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: { user },
    message: 'User information updated successfully'
  });
});

/**
 * Delete user (soft delete by setting status to inactive)
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const user = await User.findByIdAndUpdate(
    id,
    {
      status: UserStatus.INACTIVE,
      updatedAt: new Date()
    },
    { new: true }
  ).select('-password');

  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: { user },
    message: 'User deactivated successfully'
  });
});

/**
 * Get user statistics helper function
 */
const getUserStats = async (userId: string) => {
  const [
    totalRides,
    completedRides,
    cancelledRides,
    averageRating
  ] = await Promise.all([
    // Total rides count
    Ride.countDocuments({
      $or: [{ riderId: userId }, { driverId: userId }]
    }),

    // Completed rides count
    Ride.countDocuments({
      $or: [{ riderId: userId }, { driverId: userId }],
      status: 'completed'
    }),

    // Cancelled rides count
    Ride.countDocuments({
      $or: [{ riderId: userId }, { driverId: userId }],
      status: 'cancelled'
    }),

    // Average rating (as driver)
    Ride.aggregate([
      { $match: { driverId: userId, status: 'completed' } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating.driverRating' }
        }
      }
    ])
  ]);

  const avgRating = averageRating.length > 0 ? averageRating[0].avgRating : null;

  return {
    totalRides,
    completedRides,
    cancelledRides,
    rating: avgRating ? Number(avgRating.toFixed(1)) : null
  };
};

/**
 * Get user activity logs
 */
export const getUserActivity = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;

  // This would typically query an activity log collection
  // For now, return recent rides as activity
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const activities = await Ride.find({
    $or: [{ riderId: id }, { driverId: id }]
  })
  .populate({
    path: 'driverId',
    select: 'firstName lastName',
    options: { lean: true }
  })
  .populate({
    path: 'vehicleId',
    select: 'make model licensePlate',
    options: { lean: true }
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limitNum);

  // Transform activities to handle null populated fields
  const transformedActivities = activities.map(activity => ({
    ...activity.toObject(),
    driverId: activity.driverId || {
      firstName: 'Unknown',
      lastName: 'Driver'
    },
    vehicleId: activity.vehicleId || {
      make: 'Unknown',
      model: 'Vehicle',
      licensePlate: 'N/A'
    }
  }));

  const totalActivities = await Ride.countDocuments({
    $or: [{ riderId: id }, { driverId: id }]
  });

  res.status(200).json({
    success: true,
    data: {
      activities: transformedActivities,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalActivities / limitNum),
        totalActivities
      }
    }
  });
});
