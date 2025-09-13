/**
 * Admin Analytics model for dashboard metrics
 * Stores pre-computed analytics data for fast dashboard loading
 */

import mongoose, { Document, Schema } from 'mongoose';

// Analytics period types
export enum AnalyticsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

// Analytics metric types
export enum MetricType {
  USER_REGISTRATIONS = 'user_registrations',
  DRIVER_REGISTRATIONS = 'driver_registrations',
  RIDE_COMPLETIONS = 'ride_completions',
  REVENUE = 'revenue',
  AVERAGE_RIDE_VALUE = 'average_ride_value',
  DRIVER_UTILIZATION = 'driver_utilization',
  USER_RETENTION = 'user_retention',
  DRIVER_RATING = 'driver_rating',
  USER_RATING = 'user_rating'
}

// Admin Analytics interface
export interface IAdminAnalytics extends Document {
  period: AnalyticsPeriod;
  date: Date;
  metrics: {
    [key in MetricType]?: {
      value: number;
      previousValue?: number;
      change?: number;
      changePercent?: number;
    };
  };
  summary: {
    totalUsers: number;
    activeUsers: number;
    totalDrivers: number;
    activeDrivers: number;
    totalRides: number;
    completedRides: number;
    totalRevenue: number;
    averageRating: number;
  };
  breakdowns: {
    ridesByStatus: { [status: string]: number };
    usersByRole: { [role: string]: number };
    revenueByPaymentMethod: { [method: string]: number };
    ridesByHour: { [hour: string]: number };
    topLocations: Array<{
      location: string;
      rideCount: number;
      revenue: number;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Admin Analytics schema
const adminAnalyticsSchema = new Schema<IAdminAnalytics>({
  period: {
    type: String,
    enum: Object.values(AnalyticsPeriod),
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  metrics: {
    user_registrations: {
      value: { type: Number, default: 0 },
      previousValue: Number,
      change: Number,
      changePercent: Number
    },
    driver_registrations: {
      value: { type: Number, default: 0 },
      previousValue: Number,
      change: Number,
      changePercent: Number
    },
    ride_completions: {
      value: { type: Number, default: 0 },
      previousValue: Number,
      change: Number,
      changePercent: Number
    },
    revenue: {
      value: { type: Number, default: 0 },
      previousValue: Number,
      change: Number,
      changePercent: Number
    },
    average_ride_value: {
      value: { type: Number, default: 0 },
      previousValue: Number,
      change: Number,
      changePercent: Number
    },
    driver_utilization: {
      value: { type: Number, default: 0 },
      previousValue: Number,
      change: Number,
      changePercent: Number
    },
    user_retention: {
      value: { type: Number, default: 0 },
      previousValue: Number,
      change: Number,
      changePercent: Number
    },
    driver_rating: {
      value: { type: Number, default: 0 },
      previousValue: Number,
      change: Number,
      changePercent: Number
    },
    user_rating: {
      value: { type: Number, default: 0 },
      previousValue: Number,
      change: Number,
      changePercent: Number
    }
  },
  summary: {
    totalUsers: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    totalDrivers: { type: Number, default: 0 },
    activeDrivers: { type: Number, default: 0 },
    totalRides: { type: Number, default: 0 },
    completedRides: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 }
  },
  breakdowns: {
    ridesByStatus: {
      type: Map,
      of: Number,
      default: {}
    },
    usersByRole: {
      type: Map,
      of: Number,
      default: {}
    },
    revenueByPaymentMethod: {
      type: Map,
      of: Number,
      default: {}
    },
    ridesByHour: {
      type: Map,
      of: Number,
      default: {}
    },
    topLocations: [{
      location: { type: String, required: true },
      rideCount: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 }
    }]
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
adminAnalyticsSchema.index({ period: 1, date: -1 });
adminAnalyticsSchema.index({ date: -1 });
adminAnalyticsSchema.index({ 'summary.totalRevenue': -1 });
adminAnalyticsSchema.index({ 'summary.totalRides': -1 });

// Static methods
adminAnalyticsSchema.statics.getLatestDashboardData = function() {
  return this.findOne({})
    .sort({ date: -1 });
};

adminAnalyticsSchema.statics.getAnalyticsForPeriod = function(
  period: AnalyticsPeriod,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    period,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
};

adminAnalyticsSchema.statics.getRevenueAnalytics = function(
  startDate: Date,
  endDate: Date
) {
  return this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        totalRevenue: { $sum: '$summary.totalRevenue' },
        totalRides: { $sum: '$summary.totalRides' },
        averageRevenue: { $avg: '$summary.totalRevenue' }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);
};

adminAnalyticsSchema.statics.getUserGrowthAnalytics = function(
  startDate: Date,
  endDate: Date
) {
  return this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        newUsers: { $sum: '$metrics.user_registrations.value' },
        newDrivers: { $sum: '$metrics.driver_registrations.value' },
        totalUsers: { $last: '$summary.totalUsers' },
        totalDrivers: { $last: '$summary.totalDrivers' }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);
};

// Instance methods
adminAnalyticsSchema.methods.calculateGrowthRates = function() {
  // Calculate growth rates compared to previous period
  // This would be implemented based on your specific requirements
  return this;
};

adminAnalyticsSchema.methods.generateReport = function() {
  // Generate a formatted report from the analytics data
  return {
    period: this.period,
    date: this.date,
    summary: this.summary,
    keyMetrics: Object.fromEntries(this.metrics),
    topInsights: this.generateInsights()
  };
};

adminAnalyticsSchema.methods.generateInsights = function() {
  const insights = [];

  // Revenue insights
  if (this.metrics.get(MetricType.REVENUE)?.changePercent) {
    const revenueChange = this.metrics.get(MetricType.REVENUE)?.changePercent;
    if (revenueChange! > 10) {
      insights.push('Revenue is growing significantly');
    } else if (revenueChange! < -10) {
      insights.push('Revenue has declined significantly');
    }
  }

  // User growth insights
  if (this.metrics.get(MetricType.USER_REGISTRATIONS)?.value! > 50) {
    insights.push('High user registration activity');
  }

  // Driver utilization insights
  if (this.metrics.get(MetricType.DRIVER_UTILIZATION)?.value! < 60) {
    insights.push('Driver utilization could be improved');
  }

  return insights;
};

// Pre-save middleware to calculate derived metrics
adminAnalyticsSchema.pre('save', function(next) {
  // Calculate average ride value
  if (this.summary.totalRides > 0 && this.summary.totalRevenue > 0) {
    const avgRideValue = this.summary.totalRevenue / this.summary.totalRides;
    this.metrics.average_ride_value = {
      value: Math.round(avgRideValue * 100) / 100
    };
  }

  // Calculate average rating
  if (this.metrics.user_rating?.value && this.metrics.driver_rating?.value) {
    const avgRating = (
      this.metrics.user_rating.value +
      this.metrics.driver_rating.value
    ) / 2;
    this.summary.averageRating = Math.round(avgRating * 10) / 10;
  }

  next();
});

// Export the model
export const AdminAnalytics = mongoose.model<IAdminAnalytics>('AdminAnalytics', adminAnalyticsSchema);
