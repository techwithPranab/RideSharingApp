/**
 * Driver routes for handling driver-specific API endpoints
 * Defines all routes for driver operations like earnings, withdrawals, etc.
 */

import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { protect } from '../middleware/auth';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { Payment, PaymentType, PaymentStatus, PaymentMethod } from '../models/Payment';
import { User } from '../models/User';

const router = Router();

// Apply authentication middleware to all driver routes
router.use(protect);

/**
 * @route GET /api/driver/:driverId
 * @desc Get driver profile information
 * @access Private (Driver only)
 */
router.get('/:driverId', [
  param('driverId').isMongoId().withMessage('Valid driver ID is required')
], async (req: any, res: any) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.validationError(res, errors.array());
    }

    const { driverId } = req.params;

    // Verify the authenticated user is the driver
    if (req.user.id !== driverId) {
      return ApiResponse.error(res, 'Unauthorized access to driver profile', 403);
    }

    // Get driver profile from database
    const driver = await User.findById(driverId)
      .select('-password -otp -otpExpiresAt -resetPasswordToken -resetPasswordExpiresAt')
      .populate('vehicleIds', 'make model year licensePlate color vehicleType status');

    if (!driver) {
      return ApiResponse.error(res, 'Driver not found', 404);
    }

    return res.status(200).json({
      success: true,
      message: 'Driver profile retrieved successfully',
      data: {
        id: driver._id,
        email: driver.email,
        firstName: driver.firstName,
        lastName: driver.lastName,
        phoneNumber: driver.phoneNumber,
        role: driver.role,
        status: driver.status,
        isPhoneVerified: driver.isPhoneVerified,
        isEmailVerified: driver.isEmailVerified,
        averageRating: driver.averageRating,
        totalRatings: driver.totalRatings,
        kycStatus: driver.kycStatus,
        isOnline: driver.isAvailable, // Map isAvailable to isOnline for frontend compatibility
        isAvailable: driver.isAvailable,
        vehicleIds: driver.vehicleIds,
        vehicles: driver.vehicleIds, // Populated vehicles
        totalEarnings: 0, // Placeholder - would need to be calculated from payments
        totalTrips: 0, // Placeholder - would need to be calculated from rides
        totalDistance: 0, // Placeholder - would need to be calculated from rides
        totalHours: 0, // Placeholder - would need to be calculated from rides
        createdAt: driver.createdAt,
        updatedAt: driver.updatedAt,
        lastActiveAt: driver.lastActiveAt,
        currentLocation: driver.currentLocation,
        drivingLicenseNumber: driver.drivingLicenseNumber,
        drivingLicenseExpiry: driver.drivingLicenseExpiry
      }
    });

  } catch (error: any) {
    logger.error('Error getting driver profile:', error);
    return ApiResponse.error(res, error.message || 'Failed to retrieve driver profile');
  }
});

/**
 * @route PUT /api/driver/:driverId
 * @desc Update driver profile information
 * @access Private (Driver only)
 */
router.put('/:driverId', [
  param('driverId').isMongoId().withMessage('Valid driver ID is required'),
  body('firstName').optional().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
  body('lastName').optional().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
  body('phoneNumber').optional().matches(/^[6-9]\d{9}$/).withMessage('Valid Indian phone number required')
], async (req: any, res: any) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.validationError(res, errors.array());
    }

    const { driverId } = req.params;
    const updateData = req.body;

    // Verify the authenticated user is the driver
    if (req.user.id !== driverId) {
      return ApiResponse.error(res, 'Unauthorized profile update', 403);
    }

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.password;
    delete updateData.email;
    delete updateData.role;
    delete updateData.kycStatus;
    delete updateData.totalEarnings;
    delete updateData.totalTrips;
    delete updateData.averageRating;
    delete updateData.totalRatings;

    // Update driver profile
    const updatedDriver = await User.findByIdAndUpdate(
      driverId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .select('-password -otp -otpExpiresAt -resetPasswordToken -resetPasswordExpiresAt')
      .populate('vehicleIds', 'make model year licensePlate color vehicleType status');

    if (!updatedDriver) {
      return ApiResponse.error(res, 'Driver not found', 404);
    }

    return res.status(200).json({
      success: true,
      message: 'Driver profile updated successfully',
      data: {
        id: updatedDriver._id,
        email: updatedDriver.email,
        firstName: updatedDriver.firstName,
        lastName: updatedDriver.lastName,
        phoneNumber: updatedDriver.phoneNumber,
        role: updatedDriver.role,
        status: updatedDriver.status,
        isPhoneVerified: updatedDriver.isPhoneVerified,
        isEmailVerified: updatedDriver.isEmailVerified,
        averageRating: updatedDriver.averageRating,
        totalRatings: updatedDriver.totalRatings,
        kycStatus: updatedDriver.kycStatus,
        isOnline: updatedDriver.isAvailable, // Map isAvailable to isOnline for frontend compatibility
        isAvailable: updatedDriver.isAvailable,
        vehicleIds: updatedDriver.vehicleIds,
        vehicles: updatedDriver.vehicleIds, // Populated vehicles
        totalEarnings: 0, // Placeholder - would need to be calculated from payments
        totalTrips: 0, // Placeholder - would need to be calculated from rides
        totalDistance: 0, // Placeholder - would need to be calculated from rides
        totalHours: 0, // Placeholder - would need to be calculated from rides
        createdAt: updatedDriver.createdAt,
        updatedAt: updatedDriver.updatedAt,
        lastActiveAt: updatedDriver.lastActiveAt,
        currentLocation: updatedDriver.currentLocation,
        drivingLicenseNumber: updatedDriver.drivingLicenseNumber,
        drivingLicenseExpiry: updatedDriver.drivingLicenseExpiry
      }
    });

  } catch (error: any) {
    logger.error('Error updating driver profile:', error);
    return ApiResponse.error(res, error.message || 'Failed to update driver profile');
  }
});

/**
 * @route PUT /api/driver/:driverId/status
 * @desc Update driver online status
 * @access Private (Driver only)
 */
router.put('/:driverId/status', [
  param('driverId').isMongoId().withMessage('Valid driver ID is required'),
  body('isOnline').isBoolean().withMessage('isOnline must be a boolean')
], async (req: any, res: any) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.validationError(res, errors.array());
    }

    const { driverId } = req.params;
    const { isOnline } = req.body;

    // Verify the authenticated user is the driver
    if (req.user.id !== driverId) {
      return ApiResponse.error(res, 'Unauthorized status update', 403);
    }

    // Update driver online status
    const updatedDriver = await User.findByIdAndUpdate(
      driverId,
      {
        isAvailable: isOnline, // Map isOnline to isAvailable
        lastActiveAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    ).select('isAvailable lastActiveAt');

    if (!updatedDriver) {
      return ApiResponse.error(res, 'Driver not found', 404);
    }

    return ApiResponse.success(res, {
      message: 'Driver status updated successfully',
      driver: {
        id: updatedDriver._id,
        isAvailable: updatedDriver.isAvailable, // Return isAvailable as isOnline for frontend compatibility
        isOnline: updatedDriver.isAvailable, // Also return as isOnline for frontend compatibility
        lastActiveAt: updatedDriver.lastActiveAt
      }
    });

  } catch (error: any) {
    logger.error('Error updating driver status:', error);
    return ApiResponse.error(res, error.message || 'Failed to update driver status');
  }
});

/**
 * @route GET /api/driver/:driverId/earnings
 * @desc Get driver earnings for a specific period
 * @access Private (Driver only)
 */
router.get('/:driverId/earnings', [
  param('driverId').isMongoId().withMessage('Valid driver ID is required')
], async (req: any, res: any) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.validationError(res, errors.array());
    }

    const { driverId } = req.params;
    const { period } = req.query;

    // Verify the authenticated user is the driver
    if (req.user.id !== driverId) {
      return ApiResponse.error(res, 'Unauthorized access to driver earnings', 403);
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    }

    // Get earnings from completed payments
    const earnings = await Payment.aggregate([
      {
        $match: {
          payeeId: driverId,
          type: { $in: [PaymentType.RIDE_PAYMENT, PaymentType.INCENTIVE] },
          status: PaymentStatus.COMPLETED,
          completedAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$amount' },
          totalRides: { $sum: 1 },
          averageEarning: { $avg: '$amount' },
          earnings: {
            $push: {
              id: '$_id',
              amount: '$amount',
              rideId: '$rideId',
              completedAt: '$completedAt',
              description: '$description'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalEarnings: { $round: ['$totalEarnings', 2] },
          totalRides: 1,
          averageEarning: { $round: ['$averageEarning', 2] },
          earnings: 1,
          period: period || 'last_30_days'
        }
      }
    ]);

    const result = earnings[0] || {
      totalEarnings: 0,
      totalRides: 0,
      averageEarning: 0,
      earnings: [],
      period: period || 'last_30_days'
    };

    return ApiResponse.success(res, {
      message: 'Driver earnings retrieved successfully',
      earnings: result
    });

  } catch (error: any) {
    logger.error('Error getting driver earnings:', error);
    return ApiResponse.error(res, error.message || 'Failed to retrieve driver earnings');
  }
});

/**
 * @route GET /api/driver/:driverId/earnings/history
 * @desc Get driver earnings history with pagination
 * @access Private (Driver only)
 */
router.get('/:driverId/earnings/history', [
  param('driverId').isMongoId().withMessage('Valid driver ID is required')
], async (req: any, res: any) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.validationError(res, errors.array());
    }

    const { driverId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Verify the authenticated user is the driver
    if (req.user.id !== driverId) {
      return ApiResponse.error(res, 'Unauthorized access to driver earnings', 403);
    }

    // Get earnings history
    const earnings = await Payment.find({
      payeeId: driverId,
      type: { $in: [PaymentType.RIDE_PAYMENT, PaymentType.INCENTIVE] },
      status: PaymentStatus.COMPLETED
    })
    .populate('rideId', 'rideId status totalFare')
    .sort({ completedAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('amount completedAt description rideId type');

    const totalEarnings = await Payment.countDocuments({
      payeeId: driverId,
      type: { $in: [PaymentType.RIDE_PAYMENT, PaymentType.INCENTIVE] },
      status: PaymentStatus.COMPLETED
    });

    const totalPages = Math.ceil(totalEarnings / limit);

    return ApiResponse.success(res, {
      message: 'Driver earnings history retrieved successfully',
      earnings: earnings.map(earning => ({
        id: earning._id,
        amount: earning.amount,
        type: earning.type,
        description: earning.description,
        completedAt: earning.completedAt,
        rideId: earning.rideId
      })),
      pagination: {
        page,
        limit,
        total: totalEarnings,
        pages: totalPages
      }
    });

  } catch (error: any) {
    logger.error('Error getting driver earnings history:', error);
    return ApiResponse.error(res, error.message || 'Failed to retrieve driver earnings history');
  }
});

/**
 * @route POST /api/driver/:driverId/withdrawals
 * @desc Request a withdrawal from driver earnings
 * @access Private (Driver only)
 */
router.post('/:driverId/withdrawals', [
  param('driverId').isMongoId().withMessage('Valid driver ID is required'),
  body('amount').isFloat({ min: 100 }).withMessage('Minimum withdrawal amount is ₹100')
], async (req: any, res: any) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.validationError(res, errors.array());
    }

    const { driverId } = req.params;
    const { amount } = req.body;

    // Verify the authenticated user is the driver
    if (req.user.id !== driverId) {
      return ApiResponse.error(res, 'Unauthorized withdrawal request', 403);
    }

    // Get driver's available balance (completed earnings minus previous withdrawals)
    const totalEarnings = await Payment.aggregate([
      {
        $match: {
          payeeId: driverId,
          type: { $in: [PaymentType.RIDE_PAYMENT, PaymentType.INCENTIVE] },
          status: PaymentStatus.COMPLETED
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalWithdrawals = await Payment.aggregate([
      {
        $match: {
          payeeId: driverId, // Platform pays out to driver
          type: PaymentType.DRIVER_PAYOUT,
          status: { $in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING, PaymentStatus.COMPLETED] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const availableBalance = (totalEarnings[0]?.total || 0) - (totalWithdrawals[0]?.total || 0);

    if (amount > availableBalance) {
      return ApiResponse.error(res, `Insufficient balance. Available: ₹${availableBalance.toFixed(2)}`, 400);
    }

    // Create withdrawal request
    const withdrawal = new Payment({
      type: PaymentType.DRIVER_PAYOUT,
      payerId: process.env.PLATFORM_USER_ID || 'platform', // Platform account
      payeeId: driverId,
      amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
      currency: 'INR',
      method: PaymentMethod.UPI, // Default to UPI, can be changed later
      status: PaymentStatus.PENDING,
      description: `Driver withdrawal request - ₹${amount}`,
      metadata: {
        withdrawalRequest: true,
        requestedBy: driverId,
        requestedAt: new Date()
      }
    });

    await withdrawal.save();

    // Update driver's pending withdrawal status
    await User.findByIdAndUpdate(driverId, {
      $inc: { pendingWithdrawalAmount: amount }
    });

    return ApiResponse.success(res, {
      message: 'Withdrawal request submitted successfully',
      withdrawal: {
        id: withdrawal.paymentId,
        amount: withdrawal.amount,
        status: withdrawal.status,
        requestedAt: withdrawal.initiatedAt
      }
    }, 201);

  } catch (error: any) {
    logger.error('Error processing withdrawal request:', error);
    return ApiResponse.error(res, error.message || 'Failed to process withdrawal request');
  }
});

/**
 * @route GET /api/driver/:driverId/withdrawals
 * @desc Get driver's withdrawal history
 * @access Private (Driver only)
 */
router.get('/:driverId/withdrawals', [
  param('driverId').isMongoId().withMessage('Valid driver ID is required')
], async (req: any, res: any) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.validationError(res, errors.array());
    }

    const { driverId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Verify the authenticated user is the driver
    if (req.user.id !== driverId) {
      return ApiResponse.error(res, 'Unauthorized access to withdrawal history', 403);
    }

    // Get withdrawal history
    const withdrawals = await Payment.find({
      payeeId: driverId,
      type: PaymentType.DRIVER_PAYOUT
    })
    .sort({ initiatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('paymentId amount status initiatedAt completedAt failedAt description');

    const totalWithdrawals = await Payment.countDocuments({
      payeeId: driverId,
      type: PaymentType.DRIVER_PAYOUT
    });

    const totalPages = Math.ceil(totalWithdrawals / limit);

    return ApiResponse.success(res, {
      message: 'Driver withdrawal history retrieved successfully',
      withdrawals: withdrawals.map(withdrawal => ({
        id: withdrawal.paymentId,
        amount: withdrawal.amount,
        status: withdrawal.status,
        requestedAt: withdrawal.initiatedAt,
        completedAt: withdrawal.completedAt,
        failedAt: withdrawal.failedAt,
        description: withdrawal.description
      })),
      pagination: {
        page,
        limit,
        total: totalWithdrawals,
        pages: totalPages
      }
    });

  } catch (error: any) {
    logger.error('Error getting driver withdrawal history:', error);
    return ApiResponse.error(res, error.message || 'Failed to retrieve driver withdrawal history');
  }
});

/**
 * @route GET /api/driver/:driverId/stats
 * @desc Get driver statistics
 * @access Private (Driver only)
 */
router.get('/:driverId/stats', [
  param('driverId').isMongoId().withMessage('Valid driver ID is required')
], async (req: any, res: any) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.validationError(res, errors.array());
    }

    const { driverId } = req.params;

    // Verify the authenticated user is the driver
    if (req.user.id !== driverId) {
      return ApiResponse.error(res, 'Unauthorized access to driver stats', 403);
    }

    // Get driver stats from database
    const driver = await User.findById(driverId).select('totalRatings averageRating lastActiveAt isAvailable');

    if (!driver) {
      return ApiResponse.error(res, 'Driver not found', 404);
    }

    // Get ride statistics
    const rideStats = await Payment.aggregate([
      {
        $match: {
          payeeId: driverId,
          type: PaymentType.RIDE_PAYMENT,
          status: PaymentStatus.COMPLETED
        }
      },
      {
        $group: {
          _id: null,
          totalRides: { $sum: 1 },
          totalEarnings: { $sum: '$amount' },
          averageEarning: { $avg: '$amount' }
        }
      }
    ]);

    const stats = rideStats[0] || {
      totalRides: 0,
      totalEarnings: 0,
      averageEarning: 0
    };

    return ApiResponse.success(res, {
      message: 'Driver statistics retrieved successfully',
      stats: {
        totalRides: stats.totalRides,
        totalEarnings: Math.round(stats.totalEarnings * 100) / 100,
        averageEarning: Math.round(stats.averageEarning * 100) / 100,
        averageRating: driver.averageRating,
        totalRatings: driver.totalRatings,
        lastActiveAt: driver.lastActiveAt,
        isAvailable: driver.isAvailable
      }
    });

  } catch (error: any) {
    logger.error('Error getting driver stats:', error);
    return ApiResponse.error(res, error.message || 'Failed to retrieve driver statistics');
  }
});

export default router;
