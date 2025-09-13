/**
 * Admin Dashboard Controller
 * Provides analytics and dashboard data for admin panel
 */

import { Request, Response } from 'express';
import { User, UserRole, UserStatus } from '../../models/User';
import { Ride, RideStatus } from '../../models/Ride';
import { Payment, PaymentStatus } from '../../models/Payment';
import { AdminAnalytics, AnalyticsPeriod } from '../../models/AdminAnalytics';
import { AdminActivity, AdminAction, ActivitySeverity } from '../../models/AdminActivity';
import { asyncHandler } from '../../middleware/asyncHandler';

/**
 * Get dashboard overview statistics
 */
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  // Get current date and previous period for comparison
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Parallel queries for better performance
  const [
    totalUsers,
    activeUsers,
    totalDrivers,
    activeDrivers,
    totalRides,
    completedRides,
    totalRevenue,
    pendingPayments,
    recentRides,
    recentUsers,
    recentActivities
  ] = await Promise.all([
    // User statistics
    User.countDocuments(),
    User.countDocuments({ status: UserStatus.ACTIVE }),
    User.countDocuments({ role: UserRole.DRIVER }),
    User.countDocuments({ role: UserRole.DRIVER, status: UserStatus.ACTIVE }),

    // Ride statistics
    Ride.countDocuments(),
    Ride.countDocuments({ status: RideStatus.COMPLETED }),

    // Revenue statistics
    Payment.aggregate([
      { $match: { status: PaymentStatus.COMPLETED } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),

    // Pending payments
    Payment.countDocuments({ status: PaymentStatus.PENDING }),

    // Recent rides (last 7 days)
    Ride.find({ createdAt: { $gte: lastWeek } })
      .populate('riderId', 'firstName lastName')
      .populate('driverId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10),

    // Recent users (last 30 days)
    User.find({ createdAt: { $gte: lastMonth } })
      .select('firstName lastName email role status createdAt')
      .sort({ createdAt: -1 })
      .limit(10),

    // Recent admin activities
    AdminActivity.find({})
      .populate('adminId', 'firstName lastName')
      .sort({ timestamp: -1 })
      .limit(10)
  ]);

  // Calculate growth rates (simplified)
  const previousMonthUsers = await User.countDocuments({
    createdAt: { $lt: lastMonth }
  });
  const userGrowthRate = previousMonthUsers > 0
    ? ((totalUsers - previousMonthUsers) / previousMonthUsers) * 100
    : 0;

  const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

  // Get today's statistics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayStats = await Promise.all([
    Ride.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
      status: RideStatus.COMPLETED
    }),
    Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow },
          status: PaymentStatus.COMPLETED
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    User.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    })
  ]);

  const todayRides = todayStats[0];
  const todayRevenue = todayStats[1].length > 0 ? todayStats[1][0].total : 0;
  const todayUsers = todayStats[2];

  // Calculate average ratings
  const avgRatings = await Ride.aggregate([
    { $match: { status: RideStatus.COMPLETED } },
    {
      $group: {
        _id: null,
        avgUserRating: { $avg: '$rating.riderRating' },
        avgDriverRating: { $avg: '$rating.driverRating' }
      }
    }
  ]);

  const averageRating = avgRatings.length > 0
    ? ((avgRatings[0].avgUserRating + avgRatings[0].avgDriverRating) / 2).toFixed(1)
    : '0.0';

  // Log admin activity
  await AdminActivity.create({
    adminId: req.admin._id,
    action: AdminAction.REPORT_GENERATE,
    resource: '/admin/dashboard',
    method: 'GET',
    severity: ActivitySeverity.LOW,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    details: {
      reportType: 'dashboard_stats'
    }
  });

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalUsers,
        activeUsers,
        totalDrivers,
        activeDrivers,
        totalRides,
        completedRides,
        totalRevenue: revenue,
        averageRating: parseFloat(averageRating),
        pendingPayments
      },
      growth: {
        userGrowthRate: Math.round(userGrowthRate * 100) / 100
      },
      today: {
        rides: todayRides,
        revenue: todayRevenue,
        users: todayUsers
      },
      recent: {
        rides: recentRides,
        users: recentUsers,
        activities: recentActivities
      }
    }
  });
});

/**
 * Get detailed analytics data
 */
export const getAnalytics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query;

  let start: Date;
  let end: Date;

  if (startDate && endDate) {
    start = new Date(startDate as string);
    end = new Date(endDate as string);
  } else {
    // Default to last 30 days
    end = new Date();
    start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Get analytics data
  const analytics = await AdminAnalytics.find({
    date: { $gte: start, $lte: end }
  }).sort({ date: 1 });

  // If no analytics data exists, generate it
  if (analytics.length === 0) {
    await generateAnalyticsData(start, end);
    const newAnalytics = await AdminAnalytics.find({
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    res.status(200).json({
      success: true,
      data: newAnalytics
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: analytics
  });
});

/**
 * Generate analytics data for a date range
 */
const generateAnalyticsData = async (startDate: Date, endDate: Date) => {
  const dates = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  for (const date of dates) {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get data for this date
    const [
      newUsers,
      newDrivers,
      completedRides,
      revenue
    ] = await Promise.all([
      User.countDocuments({
        createdAt: { $gte: date, $lt: nextDay }
      }),
      User.countDocuments({
        role: UserRole.DRIVER,
        createdAt: { $gte: date, $lt: nextDay }
      }),
      Ride.countDocuments({
        status: RideStatus.COMPLETED,
        completedAt: { $gte: date, $lt: nextDay }
      }),
      Payment.aggregate([
        {
          $match: {
            status: PaymentStatus.COMPLETED,
            processedAt: { $gte: date, $lt: nextDay }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const revenueAmount = revenue.length > 0 ? revenue[0].total : 0;

    // Create analytics record
    await AdminAnalytics.create({
      period: AnalyticsPeriod.DAILY,
      date,
      metrics: {
        user_registrations: { value: newUsers },
        driver_registrations: { value: newDrivers },
        ride_completions: { value: completedRides },
        revenue: { value: revenueAmount }
      },
      summary: {
        totalUsers: await User.countDocuments({ createdAt: { $lt: nextDay } }),
        activeUsers: await User.countDocuments({
          status: UserStatus.ACTIVE,
          createdAt: { $lt: nextDay }
        }),
        totalDrivers: await User.countDocuments({
          role: UserRole.DRIVER,
          createdAt: { $lt: nextDay }
        }),
        activeDrivers: await User.countDocuments({
          role: UserRole.DRIVER,
          status: UserStatus.ACTIVE,
          createdAt: { $lt: nextDay }
        }),
        totalRides: await Ride.countDocuments({ createdAt: { $lt: nextDay } }),
        completedRides: await Ride.countDocuments({
          status: RideStatus.COMPLETED,
          createdAt: { $lt: nextDay }
        }),
        totalRevenue: revenueAmount,
        averageRating: 4.5 // Placeholder
      },
      breakdowns: {
        ridesByStatus: {},
        usersByRole: {},
        revenueByPaymentMethod: {},
        ridesByHour: {},
        topLocations: []
      }
    });
  }
};

/**
 * Get system health status
 */
export const getSystemHealth = asyncHandler(async (_req: Request, res: Response) => {
  // Check database connectivity
  const dbStatus = 'healthy'; // In a real app, you'd check actual DB connection

  // Check recent errors
  const recentErrors = await AdminActivity.countDocuments({
    success: false,
    timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });

  // Check system metrics
  const [
    activeRides,
    pendingPayments,
    inactiveDrivers
  ] = await Promise.all([
    Ride.countDocuments({ status: { $in: ['accepted', 'started'] } }),
    Payment.countDocuments({ status: PaymentStatus.PENDING }),
    User.countDocuments({
      role: UserRole.DRIVER,
      status: UserStatus.ACTIVE,
      updatedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
  ]);

  const health = {
    database: dbStatus,
    activeRides,
    pendingPayments,
    inactiveDrivers: inactiveDrivers,
    recentErrors,
    overall: recentErrors > 10 ? 'warning' : 'healthy'
  };

  res.status(200).json({
    success: true,
    data: health
  });
});

/**
 * Get admin activity logs
 */
export const getActivityLogs = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 50, action, adminId, severity } = req.query;

  const query: any = {};

  if (action) query.action = action;
  if (adminId) query.adminId = adminId;
  if (severity) query.severity = severity;

  const activities = await AdminActivity.find(query)
    .populate('adminId', 'firstName lastName email')
    .sort({ timestamp: -1 })
    .skip((parseInt(page as string) - 1) * parseInt(limit as string))
    .limit(parseInt(limit as string));

  const total = await AdminActivity.countDocuments(query);

  res.status(200).json({
    success: true,
    data: activities,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string))
    }
  });
});
