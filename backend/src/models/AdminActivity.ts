/**
 * Admin Activity model for audit logging
 * Tracks all admin actions for security and compliance
 */

import mongoose, { Document, Schema } from 'mongoose';

// Admin action types
export enum AdminAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  USER_CREATE = 'user_create',
  USER_UPDATE = 'user_update',
  USER_DELETE = 'user_delete',
  USER_BLOCK = 'user_block',
  USER_UNBLOCK = 'user_unblock',
  USER_DETAIL = 'user_detail',
  USER_STATUS_UPDATE = 'user_status_update',
  USER_ACTIVITY = 'user_activity',
  DRIVER_APPROVE = 'driver_approve',
  DRIVER_REJECT = 'driver_reject',
  DRIVER_SUSPEND = 'driver_suspend',
  DRIVER_DETAIL = 'driver_detail',
  DRIVER_UPDATE = 'driver_update',
  PENDING_DRIVERS = 'pending_drivers',
  DRIVER_PERFORMANCE = 'driver_performance',
  RIDE_CANCEL = 'ride_cancel',
  RIDE_DETAIL = 'ride_detail',
  RIDE_STATUS_UPDATE = 'ride_status_update',
  DRIVER_RIDES = 'driver_rides',
  PASSENGER_RIDES = 'passenger_rides',
  PAYMENT_REFUND = 'payment_refund',
  PAYMENT_LIST = 'payment_list',
  PAYMENT_DETAIL = 'payment_detail',
  PAYMENT_RETRY = 'payment_retry',
  FAILED_PAYMENTS = 'failed_payments',
  USER_PAYMENTS = 'user_payments',
  RIDE_PAYMENTS = 'ride_payments',
  PAYMENT_STATISTICS = 'payment_statistics',
  PROFIT_ANALYSIS = 'profit_analysis',
  SUBSCRIPTION_UPDATE = 'subscription_update',
  SUBSCRIPTION_PLAN_DETAIL = 'subscription_plan_detail',
  SUBSCRIPTION_PLAN_CREATE = 'subscription_plan_create',
  SUBSCRIPTION_PLAN_UPDATE = 'subscription_plan_update',
  SUBSCRIPTION_PLAN_DELETE = 'subscription_plan_delete',
  SUBSCRIPTION_LIST = 'subscription_list',
  SUBSCRIPTION_DETAIL = 'subscription_detail',
  SUBSCRIPTION_STATUS_UPDATE = 'subscription_status_update',
  SUBSCRIPTION_BULK_UPDATE = 'subscription_bulk_update',
  SUBSCRIPTION_STATISTICS = 'subscription_statistics',
  SUBSCRIPTION_PAYMENTS = 'subscription_payments',
  SUBSCRIPTION_REFUND = 'subscription_refund',
  EXPIRING_SUBSCRIPTIONS = 'expiring_subscriptions',
  SUBSCRIPTION_STATS = 'subscription_stats',
  SYSTEM_CONFIG_UPDATE = 'system_config_update',
  REPORT_GENERATE = 'report_generate',
  REVENUE_REPORT = 'revenue_report',
  USER_REPORT = 'user_report',
  DRIVER_REPORT = 'driver_report',
  // Data access actions
  DASHBOARD_STATS = 'dashboard_stats',
  DASHBOARD_ANALYTICS = 'dashboard_analytics',
  SYSTEM_HEALTH = 'system_health',
  ACTIVITY_LOGS = 'activity_logs',
  USER_LIST = 'user_list',
  DRIVER_LIST = 'driver_list',
  RIDE_LIST = 'ride_list',
  RIDE_STATISTICS = 'ride_statistics',
  ACTIVE_RIDES = 'active_rides',
  SUBSCRIPTION_PLANS_LIST = 'subscription_plans_list',
  // Settings actions
  SETTINGS_VIEW = 'settings_view',
  SETTINGS_UPDATE = 'settings_update'
}

// Activity severity levels
export enum ActivitySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Admin Activity interface
export interface IAdminActivity extends Document {
  adminId: mongoose.Types.ObjectId;
  action: AdminAction;
  resource: string; // API endpoint or resource affected
  method: string; // HTTP method
  severity: ActivitySeverity;
  ipAddress: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
  details: {
    query?: any;
    body?: any;
    params?: any;
    targetUserId?: mongoose.Types.ObjectId;
    targetResourceId?: mongoose.Types.ObjectId;
    changes?: any;
    metadata?: any;
  };
}

// Admin Activity schema
const adminActivitySchema = new Schema<IAdminActivity>({
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: Object.values(AdminAction),
    required: true
  },
  resource: {
    type: String,
    required: true
  },
  method: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: Object.values(ActivitySeverity),
    default: ActivitySeverity.LOW
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String
  },
  details: {
    query: Schema.Types.Mixed,
    body: Schema.Types.Mixed,
    params: Schema.Types.Mixed,
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    targetResourceId: Schema.Types.Mixed,
    changes: Schema.Types.Mixed,
    metadata: Schema.Types.Mixed
  }
});

// Indexes for efficient querying
adminActivitySchema.index({ adminId: 1, timestamp: -1 });
adminActivitySchema.index({ action: 1, timestamp: -1 });
adminActivitySchema.index({ severity: 1, timestamp: -1 });
adminActivitySchema.index({ timestamp: -1 });
adminActivitySchema.index({ ipAddress: 1 });

// Static methods
adminActivitySchema.statics.getRecentActivities = function(limit = 50) {
  return this.find({})
    .populate('adminId', 'firstName lastName email')
    .sort({ timestamp: -1 })
    .limit(limit);
};

adminActivitySchema.statics.getActivitiesByAdmin = function(adminId: string, limit = 100) {
  return this.find({ adminId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

adminActivitySchema.statics.getActivitiesByAction = function(action: AdminAction, limit = 100) {
  return this.find({ action })
    .populate('adminId', 'firstName lastName email')
    .sort({ timestamp: -1 })
    .limit(limit);
};

adminActivitySchema.statics.getFailedActivities = function(limit = 50) {
  return this.find({ success: false })
    .populate('adminId', 'firstName lastName email')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Export the model
export const AdminActivity = mongoose.model<IAdminActivity>('AdminActivity', adminActivitySchema);
