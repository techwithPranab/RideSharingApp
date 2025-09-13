/**
 * Subscription Plan Model
 * Defines different subscription plans available for users
 */

import mongoose, { Schema } from 'mongoose';

// Subscription plan types
export enum SubscriptionPlanType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

// Subscription plan status
export enum SubscriptionPlanStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DEPRECATED = 'deprecated'
}

// Subscription plan features
export interface ISubscriptionPlanFeatures {
  unlimitedRides: boolean;
  maxRidesPerPeriod?: number;
  priorityBooking: boolean;
  discountedRides: boolean;
  discountPercentage?: number;
  freeCancellation: boolean;
  dedicatedSupport: boolean;
  earlyAccess: boolean;
}

// Subscription plan interface
export interface ISubscriptionPlan {
  name: string;
  description: string;
  type: SubscriptionPlanType;
  duration: number; // Duration in days
  price: number; // Price in INR
  currency: string;
  features: ISubscriptionPlanFeatures;
  status: SubscriptionPlanStatus;
  isPopular?: boolean;
  maxUsers?: number; // Maximum number of users allowed
  createdAt: Date;
  updatedAt: Date;
}

// Subscription plan schema
const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: Object.values(SubscriptionPlanType),
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 365
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  features: {
    unlimitedRides: {
      type: Boolean,
      default: false
    },
    maxRidesPerPeriod: {
      type: Number,
      min: 1
    },
    priorityBooking: {
      type: Boolean,
      default: false
    },
    discountedRides: {
      type: Boolean,
      default: false
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    freeCancellation: {
      type: Boolean,
      default: false
    },
    dedicatedSupport: {
      type: Boolean,
      default: false
    },
    earlyAccess: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: Object.values(SubscriptionPlanStatus),
    default: SubscriptionPlanStatus.ACTIVE
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  maxUsers: {
    type: Number,
    min: 1
  }
}, {
  timestamps: true
});

// Indexes
SubscriptionPlanSchema.index({ type: 1, status: 1 });
SubscriptionPlanSchema.index({ price: 1 });
SubscriptionPlanSchema.index({ isPopular: -1 });

// Static methods
SubscriptionPlanSchema.statics.findActivePlans = function() {
  return this.find({ status: SubscriptionPlanStatus.ACTIVE });
};

SubscriptionPlanSchema.statics.findPopularPlans = function() {
  return this.find({
    status: SubscriptionPlanStatus.ACTIVE,
    isPopular: true
  });
};

SubscriptionPlanSchema.statics.findPlansByType = function(planType: SubscriptionPlanType) {
  return this.find({
    type: planType,
    status: SubscriptionPlanStatus.ACTIVE
  });
};

// Create and export the SubscriptionPlan model
export const SubscriptionPlan = mongoose.model<ISubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema);
