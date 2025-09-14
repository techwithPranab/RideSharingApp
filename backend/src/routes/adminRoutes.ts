/**
 * Admin Routes
 * Defines all admin-related API endpoints with proper authentication and authorization
 */

import express from 'express';
import { requireAdmin, logAdminActivity, adminRateLimit } from '../middleware/adminAuth';

// Import admin controllers
import {
  getDashboardStats,
  getAnalytics,
  getSystemHealth,
  getActivityLogs
} from '../controllers/admin/dashboardController';

// Import user management controller
import {
  getUsers,
  getUserById,
  updateUserStatus,
  updateUser,
  deleteUser,
  getUserActivity
} from '../controllers/admin/userController';

// Import driver management controller
import {
  getDrivers,
  getDriverById,
  approveDriver,
  suspendDriver,
  updateDriver,
  getPendingDrivers,
  getDriverPerformance
} from '../controllers/admin/driverController';

// Import ride management controller
import {
  getRides,
  getRideById,
  updateRideStatus,
  getActiveRides,
  getRideStatistics,
  getRidesByDriver,
  getRidesByPassenger
} from '../controllers/admin/rideController';

// Import payment management controller
import {
  getPayments,
  getPaymentById,
  processRefund,
  getPaymentStatistics,
  getFailedPayments,
  retryPayment,
  getPaymentsByUser,
  getPaymentsByRide,
  getPlatformProfitAnalysis
} from '../controllers/admin/paymentController';

// Import subscription management controller
import {
  getSubscriptionPlans,
  getSubscriptionPlanById,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getSubscriptions,
  getSubscriptionById,
  updateSubscriptionStatus,
  getSubscriptionStatistics,
  getSubscriptionPayments,
  processSubscriptionRefund,
  getExpiringSubscriptions,
  bulkUpdateSubscriptions
} from '../controllers/admin/subscriptionController';

// Import system configuration routes
import systemConfigRoutes from './admin/systemConfigRoutes';

// Import email notification routes
import emailRoutes from './admin/emailRoutes';

const router = express.Router();

// Apply admin authentication to all routes
router.use(requireAdmin);
router.use(adminRateLimit);

// Dashboard routes
router.get('/dashboard/stats', logAdminActivity('dashboard_stats'), getDashboardStats);
router.get('/dashboard/analytics', logAdminActivity('dashboard_analytics'), getAnalytics);
router.get('/dashboard/health', logAdminActivity('system_health'), getSystemHealth);

// Activity logs
router.get('/activity-logs', logAdminActivity('activity_logs'), getActivityLogs);

// Settings routes - get system configuration for admin settings page
router.get('/settings', logAdminActivity('settings_view'), async (req, res) => {
  try {
    const SystemConfig = require('../models/SystemConfig').default;
    const ApiResponse = require('../utils/apiResponse').ApiResponse;

    // Get the system configuration
    const config = await SystemConfig.getConfig();

    if (!config) {
      // Create default configuration if none exists
      const defaultConfig = {
        app: {
          name: 'RideShare Pro',
          version: '1.0.0',
          description: 'Professional ride-sharing platform',
          maintenanceMode: false,
          registrationEnabled: true,
          supportEmail: 'support@rideshare.com',
          supportPhone: '+1-234-567-8900'
        },
        pricing: {
          baseFare: 5.0,
          perKmRate: 1.5,
          perMinuteRate: 0.25,
          bookingFee: 2.0,
          cancellationFee: 3.0,
          adminCommission: 15.0,
          currency: 'USD'
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: true,
          pushNotifications: true,
          rideUpdates: true,
          promotionalMessages: false,
          driverNotifications: true
        },
        security: {
          twoFactorAuth: false,
          sessionTimeout: 30,
          passwordMinLength: 8,
          maxLoginAttempts: 5,
          requireEmailVerification: true
        },
        features: {
          rideScheduling: true,
          rideSharing: true,
          multipleStops: true,
          cashPayments: true,
          cardPayments: true,
          walletPayments: true,
          ratings: true,
          driverTracking: true
        },
        geolocation: {
          defaultLatitude: 12.9716,
          defaultLongitude: 77.5946,
          searchRadius: 5,
          maxPickupDistance: 2,
          defaultCountry: 'India',
          defaultCity: 'Bangalore'
        },
        payment: {
          stripeEnabled: true,
          razorpayEnabled: false,
          paypalEnabled: true,
          stripePublishableKey: 'pk_test_...',
          razorpayKeyId: '',
          paypalClientId: 'client_id_...',
          testMode: true
        },
        api: {
          rateLimitEnabled: true,
          maxRequestsPerMinute: 100,
          apiVersion: 'v1',
          corsEnabled: true,
          allowedOrigins: ['http://localhost:3000', 'https://yourapp.com']
        },
        backup: {
          autoBackupEnabled: true,
          backupFrequency: 'daily',
          retentionDays: 30,
          lastBackupDate: '2025-01-13T10:00:00Z',
          backupLocation: '/backups/database'
        },
        monitoring: {
          errorLoggingEnabled: true,
          performanceMonitoring: true,
          userActivityTracking: true,
          logRetentionDays: 90,
          alertEmail: 'admin@rideshare.com'
        },
        updatedBy: req.admin?.id || req.user?.id
      };

      const newConfig = await SystemConfig.updateConfig(defaultConfig, req.admin?.id || req.user?.id);
      return ApiResponse.success(res, {
        message: 'Default system configuration created',
        data: newConfig
      });
    }

    ApiResponse.success(res, {
      message: 'System configuration retrieved successfully',
      data: config
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    const ApiResponse = require('../utils/apiResponse').ApiResponse;
    ApiResponse.error(res, 'Failed to fetch settings');
  }
});

// Update settings - update system configuration
router.put('/settings', logAdminActivity('settings_update'), async (req, res) => {
  try {
    const { settings } = req.body;
    const SystemConfig = require('../models/SystemConfig').default;
    const ApiResponse = require('../utils/apiResponse').ApiResponse;

    if (!settings) {
      return ApiResponse.error(res, 'Settings data is required');
    }

    // Update the system configuration
    const updatedConfig = await SystemConfig.updateConfig(settings, req.admin?.id || req.user?.id);

    ApiResponse.success(res, {
      message: 'System configuration updated successfully',
      data: updatedConfig
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    const ApiResponse = require('../utils/apiResponse').ApiResponse;

    if (error.name === 'ValidationError') {
      return ApiResponse.error(res, 'Validation failed: ' + Object.values(error.errors).map((e: any) => e.message).join(', '));
    }

    ApiResponse.error(res, 'Failed to update settings');
  }
});

// User management routes
router.get('/users', logAdminActivity('user_list'), getUsers);
router.get('/users/:id', logAdminActivity('user_detail'), getUserById);
router.put('/users/:id/status', logAdminActivity('user_status_update'), updateUserStatus);
router.put('/users/:id', logAdminActivity('user_update'), updateUser);
router.delete('/users/:id', logAdminActivity('user_delete'), deleteUser);
router.get('/users/:id/activity', logAdminActivity('user_activity'), getUserActivity);

// Driver management routes
router.get('/drivers', logAdminActivity('driver_list'), getDrivers);
router.get('/drivers/pending/all', logAdminActivity('pending_drivers'), getPendingDrivers);
router.get('/drivers/approval', logAdminActivity('driver_approval_list'), async (req, res) => {
  try {
    const { status } = req.query;
    const Driver = require('../models/Driver').default;
    const ApiResponse = require('../utils/apiResponse').ApiResponse;
    
    let filter = {};
    if (status && status !== 'all') {
      filter = { status };
    }
    
    const drivers = await Driver.find(filter)
      .populate('userId', 'firstName lastName email phone')
      .populate('vehicleId', 'make model year color plateNumber')
      .sort({ createdAt: -1 });
    
    ApiResponse.success(res, {
      message: 'Driver approval list retrieved successfully',
      data: drivers
    });
  } catch (error) {
    console.error('Error fetching driver approval list:', error);
    const ApiResponse = require('../utils/apiResponse').ApiResponse;
    ApiResponse.error(res, 'Failed to fetch driver approval list');
  }
});
router.get('/drivers/:id', logAdminActivity('driver_detail'), getDriverById);
router.put('/drivers/:id/approve', logAdminActivity('driver_approve'), approveDriver);
router.put('/drivers/:id/approval', logAdminActivity('driver_approval_update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;
    const Driver = require('../models/Driver').default;
    const ApiResponse = require('../utils/apiResponse').ApiResponse;
    
    if (!['approve', 'reject'].includes(action)) {
      return ApiResponse.error(res, 'Invalid action. Must be approve or reject');
    }
    
    const driver = await Driver.findById(id);
    if (!driver) {
      return ApiResponse.error(res, 'Driver not found');
    }
    
    if (driver.status !== 'pending') {
      return ApiResponse.error(res, 'Driver has already been processed');
    }
    
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    const updatedDriver = await Driver.findByIdAndUpdate(
      id,
      {
        status: newStatus,
        reviewDate: new Date(),
        reviewedBy: req.admin?.id || req.user?.id,
        notes: notes || undefined
      },
      { new: true }
    ).populate('userId', 'firstName lastName email phone');
    
    ApiResponse.success(res, {
      message: `Driver ${action}d successfully`,
      data: updatedDriver
    });
  } catch (error) {
    console.error('Error updating driver approval:', error);
    const ApiResponse = require('../utils/apiResponse').ApiResponse;
    ApiResponse.error(res, 'Failed to update driver approval status');
  }
});
router.put('/drivers/:id/suspend', logAdminActivity('driver_suspend'), suspendDriver);
router.put('/drivers/:id', logAdminActivity('driver_update'), updateDriver);
router.get('/drivers/:id/performance', logAdminActivity('driver_performance'), getDriverPerformance);

// Ride management routes
router.get('/rides', logAdminActivity('ride_list'), getRides);
router.get('/rides/active', logAdminActivity('active_rides'), getActiveRides);
router.get('/rides/:id', logAdminActivity('ride_detail'), getRideById);
router.put('/rides/:id/status', logAdminActivity('ride_status_update'), updateRideStatus);
router.get('/rides/driver/:driverId', logAdminActivity('driver_rides'), getRidesByDriver);
router.get('/rides/passenger/:passengerId', logAdminActivity('passenger_rides'), getRidesByPassenger);
router.get('/rides/statistics/overview', logAdminActivity('ride_statistics'), getRideStatistics);

// Payment management routes
router.get('/payments', logAdminActivity('payment_list'), getPayments);
router.get('/payments/:id', logAdminActivity('payment_detail'), getPaymentById);
router.put('/payments/:id/refund', logAdminActivity('payment_refund'), processRefund);
router.put('/payments/:id/retry', logAdminActivity('payment_retry'), retryPayment);
router.get('/payments/failed/all', logAdminActivity('failed_payments'), getFailedPayments);
router.get('/payments/user/:payerId', logAdminActivity('user_payments'), getPaymentsByUser);
router.get('/payments/ride/:rideId', logAdminActivity('ride_payments'), getPaymentsByRide);
router.get('/payments/statistics/overview', logAdminActivity('payment_statistics'), getPaymentStatistics);
router.get('/payments/profit-analysis', logAdminActivity('profit_analysis'), getPlatformProfitAnalysis);

// Subscription management routes
router.get('/subscriptions/plans', logAdminActivity('subscription_plans_list'), getSubscriptionPlans);
router.get('/subscriptions/plans/:id', logAdminActivity('subscription_plan_detail'), getSubscriptionPlanById);
router.post('/subscriptions/plans', logAdminActivity('subscription_plan_create'), createSubscriptionPlan);
router.put('/subscriptions/plans/:id', logAdminActivity('subscription_plan_update'), updateSubscriptionPlan);
router.delete('/subscriptions/plans/:id', logAdminActivity('subscription_plan_delete'), deleteSubscriptionPlan);

router.get('/subscriptions', logAdminActivity('subscription_list'), getSubscriptions);
router.get('/subscriptions/:id', logAdminActivity('subscription_detail'), getSubscriptionById);
router.put('/subscriptions/:id/status', logAdminActivity('subscription_status_update'), updateSubscriptionStatus);
router.put('/subscriptions/bulk-update', logAdminActivity('subscription_bulk_update'), bulkUpdateSubscriptions);

router.get('/subscriptions/statistics/overview', logAdminActivity('subscription_statistics'), getSubscriptionStatistics);
router.get('/subscriptions/payments', logAdminActivity('subscription_payments'), getSubscriptionPayments);
router.put('/subscriptions/payments/:id/refund', logAdminActivity('subscription_refund'), processSubscriptionRefund);
router.get('/subscriptions/expiring', logAdminActivity('expiring_subscriptions'), getExpiringSubscriptions);

// Subscription stats route (moved from subscriptionRoutes.ts for consistency)
router.get('/subscriptions/stats', logAdminActivity('subscription_stats'), async (_req, res) => {
  try {
    const SubscriptionService = require('../services/subscriptionService').SubscriptionService;
    const stats = await SubscriptionService.getSubscriptionStats();

    const ApiResponse = require('../utils/apiResponse').ApiResponse;
    ApiResponse.success(res, {
      message: 'Subscription statistics retrieved successfully',
      stats
    });
  } catch (error) {
    console.error('Error getting subscription stats:', error);
    const ApiResponse = require('../utils/apiResponse').ApiResponse;
    ApiResponse.error(res, 'Failed to retrieve subscription statistics');
  }
});

// Analytics and reporting routes
router.get('/reports/revenue', logAdminActivity('revenue_report'), async (_req, res) => {
  // Revenue report - Coming soon
  res.json({ message: 'Revenue report endpoint - Coming soon' });
});

router.get('/reports/users', logAdminActivity('user_report'), async (_req, res) => {
  // User growth report - Coming soon
  res.json({ message: 'User growth report endpoint - Coming soon' });
});

router.get('/reports/drivers', logAdminActivity('driver_report'), async (_req, res) => {
  // Driver performance report - Coming soon
  res.json({ message: 'Driver performance report endpoint - Coming soon' });
});

// System configuration routes (super admin only)
router.use('/config', systemConfigRoutes);

// Email notification routes
router.use('/email', emailRoutes);

export default router;
