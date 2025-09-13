/**
 * Admin Payment Management Controller
 * Handles all payment-related administrative operations
 */

import { Request, Response } from 'express';
import { Payment, PaymentStatus } from '../../models/Payment';
import { Ride } from '../../models/Ride';
import { asyncHandler } from '../../middleware/asyncHandler';

/**
 * Get all payments with filtering and pagination
 */
export const getPayments = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    status,
    method,
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

  if (method && method !== 'all') {
    query.paymentMethod = method;
  }

  if (search) {
    // Search by payment ID, ride ID, or user names
    query.$or = [
      { paymentId: { $regex: search, $options: 'i' } },
      { 'rideId': { $regex: search, $options: 'i' } }
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

  // Get payments with populated data
  const payments = await Payment.find(query)
    .populate('payerId', 'firstName lastName email phoneNumber')
    .populate('rideId', 'rideId status totalFare')
    .sort({ [sortBy as string]: sortOrder === 'desc' ? -1 : 1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  // Get total count for pagination
  const totalPayments = await Payment.countDocuments(query);
  const totalPages = Math.ceil(totalPayments / limitNum);

  // Calculate totals
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const successfulPayments = payments.filter(p => p.status === PaymentStatus.COMPLETED).length;

  res.status(200).json({
    success: true,
    data: {
      payments,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalPayments,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      },
      summary: {
        totalAmount,
        successfulPayments,
        successRate: totalPayments > 0 ? ((successfulPayments / totalPayments) * 100).toFixed(1) : '0.0'
      }
    }
  });
});

/**
 * Get payment details by ID
 */
export const getPaymentById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const payment = await Payment.findById(id)
    .populate('payerId', 'firstName lastName email phoneNumber')
    .populate('rideId', 'rideId status totalFare driverId passengers')
    .populate('payeeId', 'firstName lastName');

  if (!payment) {
    res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
    return;
  }

  // Get payment history and related transactions
  const paymentHistory = await getPaymentHistory(id);

  res.status(200).json({
    success: true,
    data: {
      payment: {
        ...payment.toObject(),
        ...paymentHistory
      }
    }
  });
});

/**
 * Process payment refund
 */
export const processRefund = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { amount, reason } = req.body;

  const payment = await Payment.findById(id);
  if (!payment) {
    res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
    return;
  }

  if (payment.status !== PaymentStatus.COMPLETED) {
    res.status(400).json({
      success: false,
      message: 'Can only refund completed payments'
    });
    return;
  }

  try {
    // Use the model's processRefund method
    const refundAmount = amount || payment.amount;
    const refund = await payment.processRefund(refundAmount);

    // Add refund reason to metadata
    if (reason) {
      refund.metadata = {
        ...refund.metadata,
        refundReason: reason,
        processedBy: 'admin'
      };
      await refund.save();
    }

    res.status(200).json({
      success: true,
      data: { payment, refund },
      message: `Refund of $${refundAmount} processed successfully`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Refund processing failed'
    });
  }
});

/**
 * Get payment statistics
 */
export const getPaymentStatistics = asyncHandler(async (req: Request, res: Response) => {
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
    totalPayments,
    successfulPayments,
    failedPayments,
    refundedPayments,
    totalRevenue,
    averagePayment,
    paymentsByMethod,
    paymentsByStatus,
    revenueByDay,
    topPayingUsers
  ] = await Promise.all([
    // Total payments in period
    Payment.countDocuments({ createdAt: { $gte: startDate } }),

    // Successful payments
    Payment.countDocuments({
      status: PaymentStatus.COMPLETED,
      createdAt: { $gte: startDate }
    }),

    // Failed payments
    Payment.countDocuments({
      status: PaymentStatus.FAILED,
      createdAt: { $gte: startDate }
    }),

    // Refunded payments
    Payment.countDocuments({
      status: PaymentStatus.REFUNDED,
      createdAt: { $gte: startDate }
    }),

    // Total revenue
    Payment.aggregate([
      { $match: { status: PaymentStatus.COMPLETED, createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),

    // Average payment amount
    Payment.aggregate([
      { $match: { status: PaymentStatus.COMPLETED, createdAt: { $gte: startDate } } },
      { $group: { _id: null, avgAmount: { $avg: '$amount' } } }
    ]),

    // Payments by method
    Payment.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$method', count: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]),

    // Payments by status
    Payment.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),

    // Revenue by day
    Payment.aggregate([
      { $match: { status: PaymentStatus.COMPLETED, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]),

    // Top paying users
    Payment.aggregate([
      { $match: { status: PaymentStatus.COMPLETED, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$payerId',
          totalSpent: { $sum: '$amount' },
          paymentCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          totalSpent: 1,
          paymentCount: 1,
          userName: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          userEmail: '$user.email'
        }
      }
    ])
  ]);

  const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;
  const avgPayment = averagePayment.length > 0 ? averagePayment[0].avgAmount : 0;

  res.status(200).json({
    success: true,
    data: {
      period,
      overview: {
        totalPayments,
        successfulPayments,
        failedPayments,
        refundedPayments,
        successRate: totalPayments > 0 ? ((successfulPayments / totalPayments) * 100).toFixed(1) : '0.0',
        totalRevenue: revenue,
        averagePayment: Number(avgPayment.toFixed(2)),
        refundRate: totalPayments > 0 ? ((refundedPayments / totalPayments) * 100).toFixed(1) : '0.0'
      },
      charts: {
        paymentsByMethod,
        paymentsByStatus,
        revenueByDay,
        topPayingUsers
      }
    }
  });
});

/**
 * Get platform profit analysis
 */
export const getPlatformProfitAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const { period = 'month', startDate, endDate } = req.query;

  let start: Date;
  let end: Date = new Date();

  if (startDate && endDate) {
    start = new Date(startDate as string);
    end = new Date(endDate as string);
  } else {
    // Default periods
    switch (period) {
      case 'week':
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  // Get all completed ride payments in the period
  const ridePayments = await Payment.find({
    type: 'ride_payment',
    status: PaymentStatus.COMPLETED,
    createdAt: { $gte: start, $lte: end }
  }).populate('rideId', 'totalFare distance duration');

  // Calculate platform profit based on commission structure
  const COMMISSION_RATE = 0.15; // 15% platform commission
  const PROCESSING_FEE = 2; // ₹2 processing fee per transaction

  let totalRideRevenue = 0;
  let totalPlatformCommission = 0;
  let totalProcessingFees = 0;
  let totalDriverPayouts = 0;
  let totalPlatformProfit = 0;

  const profitBreakdown = [];

  for (const payment of ridePayments) {
    const rideFare = payment.amount;
    const commission = rideFare * COMMISSION_RATE;
    const driverPayout = rideFare - commission;
    const processingFee = PROCESSING_FEE;
    const netProfit = commission - processingFee;

    totalRideRevenue += rideFare;
    totalPlatformCommission += commission;
    totalProcessingFees += processingFee;
    totalDriverPayouts += driverPayout;
    totalPlatformProfit += netProfit;

    profitBreakdown.push({
      paymentId: payment.paymentId,
      rideFare,
      commission,
      processingFee,
      driverPayout,
      netProfit,
      date: payment.createdAt
    });
  }

  // Get additional revenue streams
  const [
    subscriptionRevenue,
    incentivePayments,
    refundAmount
  ] = await Promise.all([
    // Subscription revenue
    Payment.aggregate([
      { $match: { type: 'subscription', status: PaymentStatus.COMPLETED, createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    // Incentive payments (platform spending)
    Payment.aggregate([
      { $match: { type: 'incentive', status: PaymentStatus.COMPLETED, createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    // Refunds (platform spending)
    Payment.aggregate([
      { $match: { status: PaymentStatus.REFUNDED, createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  const additionalRevenue = subscriptionRevenue.length > 0 ? subscriptionRevenue[0].total : 0;
  const incentiveCosts = incentivePayments.length > 0 ? incentivePayments[0].total : 0;
  const refundCosts = refundAmount.length > 0 ? refundAmount[0].total : 0;

  // Calculate final profit
  const totalRevenue = totalRideRevenue + additionalRevenue;
  const finalProfit = totalPlatformProfit + additionalRevenue - incentiveCosts - refundCosts;

  // Calculate profit margins
  const profitMargin = totalRevenue > 0 ? (finalProfit / totalRevenue) * 100 : 0;
  const commissionMargin = totalRideRevenue > 0 ? (totalPlatformCommission / totalRideRevenue) * 100 : 0;

  // Get profit trends (by day)
  const profitTrends = await Payment.aggregate([
    {
      $match: {
        type: 'ride_payment',
        status: PaymentStatus.COMPLETED,
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        dailyRevenue: { $sum: '$amount' },
        dailyCommission: { $sum: { $multiply: ['$amount', COMMISSION_RATE] } },
        transactionCount: { $sum: 1 }
      }
    },
    {
      $project: {
        date: '$_id',
        revenue: '$dailyRevenue',
        commission: '$dailyCommission',
        profit: { $subtract: ['$dailyCommission', { $multiply: [2, '$transactionCount'] }] },
        transactions: '$transactionCount'
      }
    },
    { $sort: { date: 1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
        duration: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      },
      summary: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalPlatformProfit: Number(finalProfit.toFixed(2)),
        profitMargin: Number(profitMargin.toFixed(2)),
        commissionMargin: Number(commissionMargin.toFixed(2)),
        totalTransactions: ridePayments.length
      },
      breakdown: {
        rideRevenue: {
          totalFare: Number(totalRideRevenue.toFixed(2)),
          commission: Number(totalPlatformCommission.toFixed(2)),
          driverPayouts: Number(totalDriverPayouts.toFixed(2)),
          processingFees: Number(totalProcessingFees.toFixed(2)),
          netProfit: Number(totalPlatformProfit.toFixed(2))
        },
        additionalRevenue: {
          subscriptions: Number(additionalRevenue.toFixed(2)),
          incentives: Number((-incentiveCosts).toFixed(2)), // Negative as it's a cost
          refunds: Number((-refundCosts).toFixed(2)) // Negative as it's a cost
        }
      },
      metrics: {
        averageRideFare: ridePayments.length > 0 ? Number((totalRideRevenue / ridePayments.length).toFixed(2)) : 0,
        averageCommission: ridePayments.length > 0 ? Number((totalPlatformCommission / ridePayments.length).toFixed(2)) : 0,
        averageProfitPerRide: ridePayments.length > 0 ? Number((totalPlatformProfit / ridePayments.length).toFixed(2)) : 0,
        commissionRate: (COMMISSION_RATE * 100).toFixed(1) + '%',
        processingFeePerTransaction: PROCESSING_FEE.toFixed(2)
      },
      trends: profitTrends,
      recentTransactions: profitBreakdown.slice(-10) // Last 10 transactions
    }
  });
});

/**
 * Get failed payments for review
 */
export const getFailedPayments = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const failedPayments = await Payment.find({ status: PaymentStatus.FAILED })
    .populate('payerId', 'firstName lastName email phoneNumber')
    .populate('rideId', 'rideId status')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const totalFailed = await Payment.countDocuments({ status: PaymentStatus.FAILED });

  res.status(200).json({
    success: true,
    data: {
      payments: failedPayments,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalFailed / limitNum),
        totalFailed
      }
    }
  });
});

/**
 * Retry failed payment
 */
export const retryPayment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const payment = await Payment.findById(id);
  if (!payment) {
    res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
    return;
  }

  if (payment.status !== PaymentStatus.FAILED) {
    res.status(400).json({
      success: false,
      message: 'Can only retry failed payments'
    });
    return;
  }

  // Here you would integrate with your payment processor to retry the payment
  // For now, we'll simulate a retry attempt
  const retrySuccessful = Math.random() > 0.5; // 50% success rate for demo

  if (retrySuccessful) {
    payment.status = PaymentStatus.COMPLETED;
    payment.processedAt = new Date();
    await payment.save();

    res.status(200).json({
      success: true,
      data: { payment },
      message: 'Payment retry successful'
    });
  } else {
    // Update retry count in metadata
    const currentRetryCount = payment.metadata?.retryCount || 0;
    payment.metadata = {
      ...payment.metadata,
      retryCount: currentRetryCount + 1,
      lastRetryAt: new Date()
    };
    await payment.save();

    res.status(200).json({
      success: false,
      data: { payment },
      message: 'Payment retry failed'
    });
  }
});

/**
 * Get payment history helper function
 */
const getPaymentHistory = async (paymentId: string) => {
  const payment = await Payment.findById(paymentId);

  if (!payment) return {};

  const [
    relatedPayments,
    userPaymentHistory,
    refundTotal
  ] = await Promise.all([
    // Other payments for the same ride
    Payment.find({
      rideId: payment.rideId,
      _id: { $ne: paymentId }
    }).select('paymentId status amount createdAt'),

    // User's payment history (last 5)
    Payment.find({ payerId: payment.payerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('paymentId status amount createdAt'),

    // Total refunded amount
    Payment.aggregate([
      { $match: { _id: payment._id } },
      { $unwind: '$refunds' },
      { $group: { _id: null, totalRefunded: { $sum: '$refunds.amount' } } }
    ])
  ]);

  const totalRefunded = refundTotal.length > 0 ? refundTotal[0].totalRefunded : 0;

  return {
    relatedPayments,
    userPaymentHistory,
    totalRefunded,
    availableForRefund: Math.max(0, payment.amount - totalRefunded)
  };
};

/**
 * Get payments by user
 */
export const getPaymentsByUser = asyncHandler(async (req: Request, res: Response) => {
  const { payerId } = req.params;
  const { page = 1, limit = 10, status } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const query: any = { payerId };
  if (status && status !== 'all') {
    query.status = status;
  }

  const payments = await Payment.find(query)
    .populate('rideId', 'rideId status totalFare')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const totalPayments = await Payment.countDocuments(query);

  // Calculate user payment statistics
  const userStats = await Payment.aggregate([
    { $match: { payerId: payerId } },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: '$amount' },
        paymentCount: { $sum: 1 },
        successfulPayments: {
          $sum: { $cond: [{ $eq: ['$status', PaymentStatus.COMPLETED] }, 1, 0] }
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ['$status', PaymentStatus.FAILED] }, 1, 0] }
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      payments,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalPayments / limitNum),
        totalPayments
      },
      userStats: userStats[0] || {
        totalSpent: 0,
        paymentCount: 0,
        successfulPayments: 0,
        failedPayments: 0
      }
    }
  });
});

/**
 * Get payments by ride
 */
export const getPaymentsByRide = asyncHandler(async (req: Request, res: Response) => {
  const { rideId } = req.params;

  const payments = await Payment.find({ rideId })
    .populate('payerId', 'firstName lastName email')
    .sort({ createdAt: -1 });

  const ride = await Ride.findById(rideId).select('rideId totalFare status');

  res.status(200).json({
    success: true,
    data: {
      payments,
      ride
    }
  });
});
