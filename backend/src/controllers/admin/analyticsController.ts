/**
 * Advanced Analytics Controller
 * Provides comprehensive business intelligence and reporting data
 */

import { Request, Response } from 'express';
import {
  User,
  UserRole,
  UserStatus
} from '../../models/User';
import {
  Ride,
  RideStatus
} from '../../models/Ride';
import {
  Payment,
  PaymentStatus as PayStatus
} from '../../models/Payment';
import {
  Subscription,
  SubscriptionPayment,
  SubscriptionStatus,
  SubscriptionPaymentStatus
} from '../../models/Subscription';
import { asyncHandler } from '../../middleware/asyncHandler';

/**
 * Get comprehensive dashboard analytics
 */
export const getDashboardAnalytics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
    case 'quarter':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Get all analytics data in parallel
  const [
    userStats,
    rideStats,
    revenueStats,
    subscriptionStats,
    driverStats,
    topPerformingDrivers,
    recentActivity
  ] = await Promise.all([
    getUserAnalyticsHelper(startDate),
    getRideAnalyticsHelper(startDate),
    getRevenueAnalyticsHelper(startDate),
    getSubscriptionAnalyticsHelper(startDate),
    getDriverAnalyticsHelper(startDate),
    getTopPerformingDrivers(startDate),
    getRecentActivity()
  ]);

  res.status(200).json({
    success: true,
    data: {
      period,
      overview: {
        totalUsers: userStats.totalUsers,
        activeUsers: userStats.activeUsers,
        totalRides: rideStats.totalRides,
        completedRides: rideStats.completedRides,
        totalRevenue: revenueStats.totalRevenue,
        platformCommission: revenueStats.platformCommission,
        activeSubscriptions: subscriptionStats.activeSubscriptions,
        totalDrivers: driverStats.totalDrivers,
        availableDrivers: driverStats.availableDrivers
      },
      growth: {
        userGrowth: userStats.growth,
        rideGrowth: rideStats.growth,
        revenueGrowth: revenueStats.growth,
        subscriptionGrowth: subscriptionStats.growth
      },
      performance: {
        averageRideRating: rideStats.averageRating,
        averageDriverRating: driverStats.averageRating,
        completionRate: rideStats.completionRate,
        cancellationRate: rideStats.cancellationRate
      },
      topPerformingDrivers,
      recentActivity,
      charts: {
        userGrowth: userStats.chartData,
        rideTrends: rideStats.chartData,
        revenueTrends: revenueStats.chartData,
        subscriptionTrends: subscriptionStats.chartData
      }
    }
  });
});

/**
 * Get detailed revenue analytics
 */
export const getRevenueAnalytics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { period = 'month', breakdown = 'daily' } = req.query;

  let startDate: Date;
  const now = new Date();

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Revenue by payment type
  const revenueByType = await Payment.aggregate([
    {
      $match: {
        status: PayStatus.COMPLETED,
        completedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { totalAmount: -1 }
    }
  ]);

  // Revenue by payment method
  const revenueByMethod = await Payment.aggregate([
    {
      $match: {
        status: PayStatus.COMPLETED,
        completedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$method',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { totalAmount: -1 }
    }
  ]);

  // Revenue trends based on breakdown
  let groupBy: any;
  switch (breakdown) {
    case 'hourly':
      groupBy = {
        $dateToString: { format: '%Y-%m-%d %H:00', date: '$completedAt' }
      };
      break;
    case 'daily':
      groupBy = {
        $dateToString: { format: '%Y-%m-%d', date: '$completedAt' }
      };
      break;
    case 'monthly':
      groupBy = {
        $dateToString: { format: '%Y-%m', date: '$completedAt' }
      };
      break;
    default:
      groupBy = {
        $dateToString: { format: '%Y-%m-%d %H:%M', date: '$completedAt' }
      };
      break;
  }

  const revenueTrends = await Payment.aggregate([
    {
      $match: {
        status: PayStatus.COMPLETED,
        completedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: groupBy,
        totalRevenue: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
        averageTransaction: { $avg: '$amount' }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  // Platform commission analysis
  const commissionAnalysis = await Ride.aggregate([
    {
      $match: {
        status: RideStatus.COMPLETED,
        completedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalFare: { $sum: '$totalFare' },
        totalCommission: { $sum: '$platformCommission' },
        totalDriverEarnings: { $sum: '$driverEarnings' },
        averageCommission: { $avg: '$platformCommission' },
        commissionPercentage: {
          $avg: {
            $multiply: [
              { $divide: ['$platformCommission', '$totalFare'] },
              100
            ]
          }
        }
      }
    }
  ]);

  // Subscription revenue
  const subscriptionRevenue = await SubscriptionPayment.aggregate([
    {
      $match: {
        status: SubscriptionPaymentStatus.PAID,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
        averageRevenue: { $avg: '$amount' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      period,
      breakdownType: breakdown,
      summary: {
        totalRevenue: revenueByType.reduce((sum, item) => sum + item.totalAmount, 0),
        totalTransactions: revenueByType.reduce((sum, item) => sum + item.count, 0),
        averageTransaction: revenueTrends.length > 0 ?
          revenueTrends.reduce((sum, item) => sum + item.averageTransaction, 0) / revenueTrends.length : 0
      },
      breakdown: {
        byType: revenueByType,
        byMethod: revenueByMethod,
        trends: revenueTrends
      },
      commission: commissionAnalysis[0] || {
        totalFare: 0,
        totalCommission: 0,
        totalDriverEarnings: 0,
        averageCommission: 0,
        commissionPercentage: 0
      },
      subscriptionRevenue: subscriptionRevenue[0] || {
        totalRevenue: 0,
        transactionCount: 0,
        averageRevenue: 0
      }
    }
  });
});

/**
 * Get user growth and engagement analytics
 */
export const getUserAnalytics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { period = 'month', segment = 'all' } = req.query;

  let startDate: Date;
  const now = new Date();

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // User registration trends
  const userRegistrations = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 },
        byRole: {
          $push: '$role'
        }
      }
    },
    {
      $project: {
        date: '$_id',
        totalUsers: '$count',
        riders: {
          $size: {
            $filter: {
              input: '$byRole',
              cond: { $eq: ['$$this', UserRole.RIDER] }
            }
          }
        },
        drivers: {
          $size: {
            $filter: {
              input: '$byRole',
              cond: { $eq: ['$$this', UserRole.DRIVER] }
            }
          }
        }
      }
    },
    {
      $sort: { date: 1 }
    }
  ]);

  // User engagement metrics
  const userEngagement = await User.aggregate([
    {
      $match: {
        lastActiveAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$lastActiveAt' }
        },
        activeUsers: { $sum: 1 },
        averageRating: { $avg: '$averageRating' }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  // User segmentation
  let userSegmentation: any = {};
  if (segment === 'all' || segment === 'role') {
    userSegmentation.byRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          activeCount: {
            $sum: {
              $cond: [{ $eq: ['$status', UserStatus.ACTIVE] }, 1, 0]
            }
          }
        }
      }
    ]);
  }

  if (segment === 'all' || segment === 'status') {
    userSegmentation.byStatus = await User.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
  }

  if (segment === 'all' || segment === 'subscription') {
    userSegmentation.bySubscription = await User.aggregate([
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'userId',
          as: 'subscription'
        }
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $gt: [{ $size: '$subscription' }, 0] },
              then: 'subscribed',
              else: 'not_subscribed'
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);
  }

  // Retention analysis
  const retentionData = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m', date: '$createdAt' }
        },
        newUsers: { $sum: 1 },
        retainedUsers: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$lastActiveAt', null] },
                  {
                    $gte: [
                      '$lastActiveAt',
                      { $dateAdd: { startDate: '$createdAt', unit: 'month', amount: 1 } }
                    ]
                  }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        month: '$_id',
        newUsers: 1,
        retainedUsers: 1,
        retentionRate: {
          $multiply: [
            { $divide: ['$retainedUsers', '$newUsers'] },
            100
          ]
        }
      }
    },
    {
      $sort: { month: 1 }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      period,
      segment,
      summary: {
        totalUsers: await User.countDocuments(),
        newUsers: userRegistrations.reduce((sum, day) => sum + day.totalUsers, 0),
        activeUsers: userEngagement.reduce((sum, day) => sum + day.activeUsers, 0),
        averageRetention: retentionData.length > 0 ?
          retentionData.reduce((sum, month) => sum + month.retentionRate, 0) / retentionData.length : 0
      },
      trends: {
        registrations: userRegistrations,
        engagement: userEngagement,
        retention: retentionData
      },
      segmentation: userSegmentation
    }
  });
});

/**
 * Get subscription analytics
 */
export const getSubscriptionAnalytics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
    case 'quarter':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Subscription metrics
  const subscriptionMetrics = await Subscription.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalSubscriptions: { $sum: 1 },
        activeSubscriptions: {
          $sum: {
            $cond: [{ $eq: ['$status', SubscriptionStatus.ACTIVE] }, 1, 0]
          }
        },
        cancelledSubscriptions: {
          $sum: {
            $cond: [{ $eq: ['$status', SubscriptionStatus.CANCELLED] }, 1, 0]
          }
        },
        totalRevenue: { $sum: '$totalPaid' },
        averageRevenue: { $avg: '$totalPaid' }
      }
    }
  ]);

  // Subscription trends
  const subscriptionTrends = await Subscription.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        newSubscriptions: { $sum: 1 },
        activeSubscriptions: {
          $sum: {
            $cond: [{ $eq: ['$status', SubscriptionStatus.ACTIVE] }, 1, 0]
          }
        },
        cancelledSubscriptions: {
          $sum: {
            $cond: [{ $eq: ['$status', SubscriptionStatus.CANCELLED] }, 1, 0]
          }
        }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  // Plan performance
  const planPerformance = await Subscription.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $lookup: {
        from: 'subscriptionplans',
        localField: 'planId',
        foreignField: '_id',
        as: 'plan'
      }
    },
    {
      $unwind: '$plan'
    },
    {
      $group: {
        _id: '$plan.name',
        planType: { $first: '$plan.type' },
        subscriptions: { $sum: 1 },
        activeSubscriptions: {
          $sum: {
            $cond: [{ $eq: ['$status', SubscriptionStatus.ACTIVE] }, 1, 0]
          }
        },
        totalRevenue: { $sum: '$totalPaid' },
        averageRevenue: { $avg: '$totalPaid' }
      }
    },
    {
      $sort: { totalRevenue: -1 }
    }
  ]);

  // Churn analysis
  const churnAnalysis = await Subscription.aggregate([
    {
      $match: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: { $gte: startDate }
      }
    },
    {
      $lookup: {
        from: 'subscriptionplans',
        localField: 'planId',
        foreignField: '_id',
        as: 'plan'
      }
    },
    {
      $unwind: '$plan'
    },
    {
      $group: {
        _id: '$plan.name',
        cancellations: { $sum: 1 },
        averageLifespan: {
          $avg: {
            $divide: [
              { $subtract: ['$cancelledAt', '$startDate'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      }
    },
    {
      $sort: { cancellations: -1 }
    }
  ]);

  // Subscription revenue trends
  const revenueTrends = await SubscriptionPayment.aggregate([
    {
      $match: {
        status: SubscriptionPaymentStatus.PAID,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        revenue: { $sum: '$amount' },
        transactions: { $sum: 1 }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      period,
      summary: subscriptionMetrics[0] || {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        cancelledSubscriptions: 0,
        totalRevenue: 0,
        averageRevenue: 0
      },
      trends: {
        subscriptions: subscriptionTrends,
        revenue: revenueTrends
      },
      performance: {
        planPerformance,
        churnAnalysis
      },
      metrics: {
        churnRate: subscriptionMetrics[0] ?
          (subscriptionMetrics[0].cancelledSubscriptions / subscriptionMetrics[0].totalSubscriptions) * 100 : 0,
        averageRevenuePerUser: subscriptionMetrics[0] ?
          subscriptionMetrics[0].totalRevenue / subscriptionMetrics[0].totalSubscriptions : 0
      }
    }
  });
});

/**
 * Get ride performance analytics
 */
export const getRideAnalytics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
    case 'quarter':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Ride metrics
  const rideMetrics = await Ride.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalRides: { $sum: 1 },
        completedRides: {
          $sum: {
            $cond: [{ $eq: ['$status', RideStatus.COMPLETED] }, 1, 0]
          }
        },
        cancelledRides: {
          $sum: {
            $cond: [{ $eq: ['$status', RideStatus.CANCELLED] }, 1, 0]
          }
        },
        pooledRides: {
          $sum: {
            $cond: [{ $eq: ['$isPooled', true] }, 1, 0]
          }
        },
        totalDistance: { $sum: '$actualDistance' },
        totalDuration: { $sum: '$actualDuration' },
        totalFare: { $sum: '$totalFare' },
        averageFare: { $avg: '$totalFare' },
        averageDistance: { $avg: '$actualDistance' },
        averageDuration: { $avg: '$actualDuration' }
      }
    }
  ]);

  // Ride trends
  const rideTrends = await Ride.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        totalRides: { $sum: 1 },
        completedRides: {
          $sum: {
            $cond: [{ $eq: ['$status', RideStatus.COMPLETED] }, 1, 0]
          }
        },
        cancelledRides: {
          $sum: {
            $cond: [{ $eq: ['$status', RideStatus.CANCELLED] }, 1, 0]
          }
        },
        totalRevenue: { $sum: '$totalFare' }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  // Peak hours analysis
  const peakHours = await Ride.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        status: RideStatus.COMPLETED
      }
    },
    {
      $group: {
        _id: {
          $hour: '$createdAt'
        },
        rideCount: { $sum: 1 },
        totalRevenue: { $sum: '$totalFare' },
        averageFare: { $avg: '$totalFare' }
      }
    },
    {
      $sort: { rideCount: -1 }
    }
  ]);

  // Popular routes (simplified)
  const popularRoutes = await Ride.aggregate([
    {
      $match: {
        status: RideStatus.COMPLETED,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          pickup: '$route.0.location.address',
          dropoff: { $arrayElemAt: ['$route', -1] }
        },
        rideCount: { $sum: 1 },
        totalRevenue: { $sum: '$totalFare' },
        averageFare: { $avg: '$totalFare' }
      }
    },
    {
      $match: {
        '_id.pickup': { $ne: null },
        '_id.dropoff.location.address': { $ne: null }
      }
    },
    {
      $sort: { rideCount: -1 }
    },
    {
      $limit: 10
    }
  ]);

  // Ride completion rates by time
  const completionRates = await Ride.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        totalRides: { $sum: 1 },
        completedRides: {
          $sum: {
            $cond: [{ $eq: ['$status', RideStatus.COMPLETED] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        date: '$_id',
        totalRides: 1,
        completedRides: 1,
        completionRate: {
          $multiply: [
            { $divide: ['$completedRides', '$totalRides'] },
            100
          ]
        }
      }
    },
    {
      $sort: { date: 1 }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      period,
      summary: rideMetrics[0] || {
        totalRides: 0,
        completedRides: 0,
        cancelledRides: 0,
        pooledRides: 0,
        totalDistance: 0,
        totalDuration: 0,
        totalFare: 0,
        averageFare: 0,
        averageDistance: 0,
        averageDuration: 0
      },
      trends: {
        daily: rideTrends,
        completionRates
      },
      insights: {
        peakHours,
        popularRoutes
      },
      metrics: {
        completionRate: rideMetrics[0] ?
          (rideMetrics[0].completedRides / rideMetrics[0].totalRides) * 100 : 0,
        cancellationRate: rideMetrics[0] ?
          (rideMetrics[0].cancelledRides / rideMetrics[0].totalRides) * 100 : 0,
        pooledRidePercentage: rideMetrics[0] ?
          (rideMetrics[0].pooledRides / rideMetrics[0].totalRides) * 100 : 0
      }
    }
  });
});

/**
 * Get driver performance analytics
 */
export const getDriverAnalytics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
    case 'quarter':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Driver metrics
  const driverMetrics = await User.aggregate([
    {
      $match: {
        role: UserRole.DRIVER,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalDrivers: { $sum: 1 },
        activeDrivers: {
          $sum: {
            $cond: [{ $eq: ['$status', UserStatus.ACTIVE] }, 1, 0]
          }
        },
        availableDrivers: {
          $sum: {
            $cond: [{ $eq: ['$isAvailable', true] }, 1, 0]
          }
        },
        averageRating: { $avg: '$averageRating' },
        totalRatings: { $sum: '$totalRatings' }
      }
    }
  ]);

  // Driver performance by rides
  const driverPerformance = await Ride.aggregate([
    {
      $match: {
        status: RideStatus.COMPLETED,
        completedAt: { $gte: startDate }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'driverId',
        foreignField: '_id',
        as: 'driver'
      }
    },
    {
      $unwind: '$driver'
    },
    {
      $group: {
        _id: '$driverId',
        driverName: { $first: '$driver.firstName' },
        driverLastName: { $first: '$driver.lastName' },
        totalRides: { $sum: 1 },
        totalEarnings: { $sum: '$driverEarnings' },
        totalDistance: { $sum: '$actualDistance' },
        totalDuration: { $sum: '$actualDuration' },
        averageRating: { $first: '$driver.averageRating' },
        completionRate: {
          $sum: {
            $cond: [{ $eq: ['$status', RideStatus.COMPLETED] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        driverName: { $concat: ['$driverName', ' ', '$driverLastName'] },
        totalRides: 1,
        totalEarnings: 1,
        totalDistance: 1,
        totalDuration: 1,
        averageRating: 1,
        completionRate: {
          $multiply: [
            { $divide: ['$completionRate', '$totalRides'] },
            100
          ]
        },
        averageEarningsPerRide: {
          $divide: ['$totalEarnings', '$totalRides']
        },
        averageDistancePerRide: {
          $divide: ['$totalDistance', '$totalRides']
        }
      }
    },
    {
      $sort: { totalEarnings: -1 }
    },
    {
      $limit: 20
    }
  ]);

  // Driver earnings trends
  const earningsTrends = await Ride.aggregate([
    {
      $match: {
        status: RideStatus.COMPLETED,
        completedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$completedAt' }
        },
        totalEarnings: { $sum: '$driverEarnings' },
        totalRides: { $sum: 1 },
        averageEarnings: { $avg: '$driverEarnings' }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  // Driver availability patterns
  const availabilityPatterns = await User.aggregate([
    {
      $match: {
        role: UserRole.DRIVER,
        lastActiveAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $hour: '$lastActiveAt'
        },
        activeDrivers: { $sum: 1 },
        availableDrivers: {
          $sum: {
            $cond: [{ $eq: ['$isAvailable', true] }, 1, 0]
          }
        }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      period,
      summary: driverMetrics[0] || {
        totalDrivers: 0,
        activeDrivers: 0,
        availableDrivers: 0,
        averageRating: 0,
        totalRatings: 0
      },
      performance: driverPerformance,
      trends: {
        earnings: earningsTrends,
        availability: availabilityPatterns
      },
      metrics: {
        driverUtilization: driverMetrics[0] ?
          (driverMetrics[0].availableDrivers / driverMetrics[0].totalDrivers) * 100 : 0,
        averageDriverRating: driverMetrics[0]?.averageRating || 0
      }
    }
  });
});

/**
 * Generate business intelligence report
 */
export const generateBusinessReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { reportType = 'comprehensive', period = 'month' } = req.query;

  let startDate: Date;
  const now = new Date();

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const report: any = {
    reportType,
    period,
    generatedAt: new Date(),
    dateRange: {
      start: startDate,
      end: now
    }
  };

  switch (reportType) {
    case 'revenue':
      report.data = await generateRevenueReport(startDate);
      break;
    case 'user_growth':
      report.data = await generateUserGrowthReport(startDate);
      break;
    case 'subscription':
      report.data = await generateSubscriptionReport(startDate);
      break;
    case 'driver_performance':
      report.data = await generateDriverPerformanceReport(startDate);
      break;
    case 'comprehensive':
    default:
      report.data = await generateComprehensiveReport(startDate);
      break;
  }

  res.status(200).json({
    success: true,
    data: report
  });
});

// Helper functions for analytics
async function getUserAnalyticsHelper(startDate: Date) {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({
    lastActiveAt: { $gte: startDate }
  });

  const previousPeriodStart = new Date(startDate.getTime() - (startDate.getTime() - new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000).getTime()));
  const previousActiveUsers = await User.countDocuments({
    lastActiveAt: { $gte: previousPeriodStart, $lt: startDate }
  });

  const chartData = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  return {
    totalUsers,
    activeUsers,
    growth: previousActiveUsers > 0 ? ((activeUsers - previousActiveUsers) / previousActiveUsers) * 100 : 0,
    chartData
  };
}

async function getRideAnalyticsHelper(startDate: Date) {
  const totalRides = await Ride.countDocuments({ createdAt: { $gte: startDate } });
  const completedRides = await Ride.countDocuments({
    status: RideStatus.COMPLETED,
    createdAt: { $gte: startDate }
  });

  const previousPeriodStart = new Date(startDate.getTime() - (startDate.getTime() - new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000).getTime()));
  const previousCompletedRides = await Ride.countDocuments({
    status: RideStatus.COMPLETED,
    createdAt: { $gte: previousPeriodStart, $lt: startDate }
  });

  const averageRating = await Ride.aggregate([
    {
      $match: {
        status: RideStatus.COMPLETED,
        createdAt: { $gte: startDate }
      }
    },
    {
      $unwind: '$passengers'
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$passengers.rating' }
      }
    }
  ]);

  const chartData = await Ride.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        totalRides: { $sum: 1 },
        completedRides: {
          $sum: {
            $cond: [{ $eq: ['$status', RideStatus.COMPLETED] }, 1, 0]
          }
        }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  return {
    totalRides,
    completedRides,
    growth: previousCompletedRides > 0 ? ((completedRides - previousCompletedRides) / previousCompletedRides) * 100 : 0,
    averageRating: averageRating[0]?.averageRating || 0,
    completionRate: totalRides > 0 ? (completedRides / totalRides) * 100 : 0,
    cancellationRate: totalRides > 0 ? ((totalRides - completedRides) / totalRides) * 100 : 0,
    chartData
  };
}

async function getRevenueAnalyticsHelper(startDate: Date) {
  const totalRevenue = await Payment.aggregate([
    {
      $match: {
        status: PayStatus.COMPLETED,
        completedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  const previousPeriodStart = new Date(startDate.getTime() - (startDate.getTime() - new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000).getTime()));
  const previousRevenue = await Payment.aggregate([
    {
      $match: {
        status: PayStatus.COMPLETED,
        completedAt: { $gte: previousPeriodStart, $lt: startDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  const platformCommission = await Ride.aggregate([
    {
      $match: {
        status: RideStatus.COMPLETED,
        completedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$platformCommission' }
      }
    }
  ]);

  const chartData = await Payment.aggregate([
    {
      $match: {
        status: PayStatus.COMPLETED,
        completedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$completedAt' }
        },
        revenue: { $sum: '$amount' }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  return {
    totalRevenue: totalRevenue[0]?.total || 0,
    platformCommission: platformCommission[0]?.total || 0,
    growth: previousRevenue[0]?.total > 0 ? ((totalRevenue[0]?.total - previousRevenue[0]?.total) / previousRevenue[0]?.total) * 100 : 0,
    chartData
  };
}

async function getSubscriptionAnalyticsHelper(startDate: Date) {
  const activeSubscriptions = await Subscription.countDocuments({
    status: SubscriptionStatus.ACTIVE,
    createdAt: { $gte: startDate }
  });

  const previousPeriodStart = new Date(startDate.getTime() - (startDate.getTime() - new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000).getTime()));
  const previousActiveSubscriptions = await Subscription.countDocuments({
    status: SubscriptionStatus.ACTIVE,
    createdAt: { $gte: previousPeriodStart, $lt: startDate }
  });

  const chartData = await Subscription.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        newSubscriptions: { $sum: 1 },
        activeSubscriptions: {
          $sum: {
            $cond: [{ $eq: ['$status', SubscriptionStatus.ACTIVE] }, 1, 0]
          }
        }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  return {
    activeSubscriptions,
    growth: previousActiveSubscriptions > 0 ? ((activeSubscriptions - previousActiveSubscriptions) / previousActiveSubscriptions) * 100 : 0,
    chartData
  };
}

async function getDriverAnalyticsHelper(startDate: Date) {
  const totalDrivers = await User.countDocuments({
    role: UserRole.DRIVER,
    createdAt: { $gte: startDate }
  });
  const availableDrivers = await User.countDocuments({
    role: UserRole.DRIVER,
    isAvailable: true,
    lastActiveAt: { $gte: startDate }
  });

  const averageRating = await User.aggregate([
    {
      $match: {
        role: UserRole.DRIVER,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$averageRating' }
      }
    }
  ]);

  return {
    totalDrivers,
    availableDrivers,
    averageRating: averageRating[0]?.averageRating || 0
  };
}

async function getTopPerformingDrivers(startDate: Date) {
  return await Ride.aggregate([
    {
      $match: {
        status: RideStatus.COMPLETED,
        completedAt: { $gte: startDate }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'driverId',
        foreignField: '_id',
        as: 'driver'
      }
    },
    {
      $unwind: '$driver'
    },
    {
      $group: {
        _id: '$driverId',
        name: { $first: { $concat: ['$driver.firstName', ' ', '$driver.lastName'] } },
        totalRides: { $sum: 1 },
        totalEarnings: { $sum: '$driverEarnings' },
        averageRating: { $first: '$driver.averageRating' }
      }
    },
    {
      $sort: { totalEarnings: -1 }
    },
    {
      $limit: 10
    }
  ]);
}

async function getRecentActivity() {
  // Get recent rides
  const recentRides = await Ride.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('driverId', 'firstName lastName')
    .populate('passengers.userId', 'firstName lastName')
    .select('rideId status totalFare createdAt');

  // Get recent payments
  const recentPayments = await Payment.find()
    .sort({ initiatedAt: -1 })
    .limit(5)
    .populate('payerId', 'firstName lastName')
    .populate('payeeId', 'firstName lastName')
    .select('amount status type initiatedAt');

  // Get recent subscriptions
  const recentSubscriptions = await Subscription.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('userId', 'firstName lastName')
    .populate('planId', 'name')
    .select('status totalPaid createdAt');

  return {
    recentRides,
    recentPayments,
    recentSubscriptions
  };
}

// Report generation helper functions
async function generateRevenueReport(startDate: Date) {
  const revenueData = await Payment.aggregate([
    {
      $match: {
        status: PayStatus.COMPLETED,
        completedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m', date: '$completedAt' }
        },
        totalRevenue: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
        averageTransaction: { $avg: '$amount' }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  return {
    monthlyRevenue: revenueData,
    summary: {
      totalRevenue: revenueData.reduce((sum, month) => sum + month.totalRevenue, 0),
      totalTransactions: revenueData.reduce((sum, month) => sum + month.transactionCount, 0),
      averageMonthlyRevenue: revenueData.length > 0 ?
        revenueData.reduce((sum, month) => sum + month.totalRevenue, 0) / revenueData.length : 0
    }
  };
}

async function generateUserGrowthReport(startDate: Date) {
  const userGrowth = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m', date: '$createdAt' }
        },
        newUsers: { $sum: 1 },
        byRole: {
          $push: '$role'
        }
      }
    },
    {
      $project: {
        month: '$_id',
        newUsers: 1,
        riders: {
          $size: {
            $filter: {
              input: '$byRole',
              cond: { $eq: ['$$this', UserRole.RIDER] }
            }
          }
        },
        drivers: {
          $size: {
            $filter: {
              input: '$byRole',
              cond: { $eq: ['$$this', UserRole.DRIVER] }
            }
          }
        }
      }
    },
    {
      $sort: { month: 1 }
    }
  ]);

  return {
    monthlyGrowth: userGrowth,
    summary: {
      totalNewUsers: userGrowth.reduce((sum, month) => sum + month.newUsers, 0),
      totalNewRiders: userGrowth.reduce((sum, month) => sum + month.riders, 0),
      totalNewDrivers: userGrowth.reduce((sum, month) => sum + month.drivers, 0)
    }
  };
}

async function generateSubscriptionReport(startDate: Date) {
  const subscriptionData = await Subscription.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $lookup: {
        from: 'subscriptionplans',
        localField: 'planId',
        foreignField: '_id',
        as: 'plan'
      }
    },
    {
      $unwind: '$plan'
    },
    {
      $group: {
        _id: '$plan.name',
        subscriptions: { $sum: 1 },
        activeSubscriptions: {
          $sum: {
            $cond: [{ $eq: ['$status', SubscriptionStatus.ACTIVE] }, 1, 0]
          }
        },
        totalRevenue: { $sum: '$totalPaid' }
      }
    },
    {
      $sort: { totalRevenue: -1 }
    }
  ]);

  return {
    planPerformance: subscriptionData,
    summary: {
      totalSubscriptions: subscriptionData.reduce((sum, plan) => sum + plan.subscriptions, 0),
      totalActiveSubscriptions: subscriptionData.reduce((sum, plan) => sum + plan.activeSubscriptions, 0),
      totalRevenue: subscriptionData.reduce((sum, plan) => sum + plan.totalRevenue, 0)
    }
  };
}

async function generateDriverPerformanceReport(startDate: Date) {
  const driverData = await Ride.aggregate([
    {
      $match: {
        status: RideStatus.COMPLETED,
        completedAt: { $gte: startDate }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'driverId',
        foreignField: '_id',
        as: 'driver'
      }
    },
    {
      $unwind: '$driver'
    },
    {
      $group: {
        _id: '$driverId',
        name: { $first: { $concat: ['$driver.firstName', ' ', '$driver.lastName'] } },
        totalRides: { $sum: 1 },
        totalEarnings: { $sum: '$driverEarnings' },
        averageRating: { $first: '$driver.averageRating' }
      }
    },
    {
      $sort: { totalEarnings: -1 }
    },
    {
      $limit: 20
    }
  ]);

  return {
    topDrivers: driverData,
    summary: {
      totalDrivers: driverData.length,
      averageRidesPerDriver: driverData.length > 0 ?
        driverData.reduce((sum, driver) => sum + driver.totalRides, 0) / driverData.length : 0,
      averageEarningsPerDriver: driverData.length > 0 ?
        driverData.reduce((sum, driver) => sum + driver.totalEarnings, 0) / driverData.length : 0
    }
  };
}

async function generateComprehensiveReport(startDate: Date) {
  const [
    revenueReport,
    userReport,
    subscriptionReport,
    driverReport
  ] = await Promise.all([
    generateRevenueReport(startDate),
    generateUserGrowthReport(startDate),
    generateSubscriptionReport(startDate),
    generateDriverPerformanceReport(startDate)
  ]);

  return {
    revenue: revenueReport,
    users: userReport,
    subscriptions: subscriptionReport,
    drivers: driverReport,
    overall: {
      period: `${startDate.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`,
      keyMetrics: {
        totalRevenue: revenueReport.summary.totalRevenue,
        totalUsers: userReport.summary.totalNewUsers,
        totalSubscriptions: subscriptionReport.summary.totalSubscriptions,
        activeDrivers: driverReport.summary.totalDrivers
      }
    }
  };
}
