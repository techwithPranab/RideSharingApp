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

// User management routes
router.get('/users', logAdminActivity('user_list'), getUsers);
router.get('/users/:id', logAdminActivity('user_detail'), getUserById);
router.put('/users/:id/status', logAdminActivity('user_status_update'), updateUserStatus);
router.put('/users/:id', logAdminActivity('user_update'), updateUser);
router.delete('/users/:id', logAdminActivity('user_delete'), deleteUser);
router.get('/users/:id/activity', logAdminActivity('user_activity'), getUserActivity);

// Driver management routes
router.get('/drivers', logAdminActivity('driver_list'), getDrivers);
router.get('/drivers/:id', logAdminActivity('driver_detail'), getDriverById);
router.put('/drivers/:id/approve', logAdminActivity('driver_approve'), approveDriver);
router.put('/drivers/:id/suspend', logAdminActivity('driver_suspend'), suspendDriver);
router.put('/drivers/:id', logAdminActivity('driver_update'), updateDriver);
router.get('/drivers/pending/all', logAdminActivity('pending_drivers'), getPendingDrivers);
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
