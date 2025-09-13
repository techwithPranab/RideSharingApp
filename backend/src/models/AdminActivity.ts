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
  DRIVER_APPROVE = 'driver_approve',
  DRIVER_REJECT = 'driver_reject',
  DRIVER_SUSPEND = 'driver_suspend',
  RIDE_CANCEL = 'ride_cancel',
  PAYMENT_REFUND = 'payment_refund',
  SUBSCRIPTION_UPDATE = 'subscription_update',
  SYSTEM_CONFIG_UPDATE = 'system_config_update',
  REPORT_GENERATE = 'report_generate'
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
