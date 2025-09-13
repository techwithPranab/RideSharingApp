/**
 * Subscription Model
 * Handles subscription plans, user subscriptions, and billing
 */

import mongoose, { Document, Schema } from 'mongoose';

// Subscription plan types
export enum SubscriptionPlanType {
  BASIC = 'basic',
  PREMIUM = 'premium',
  BUSINESS = 'business'
}

// Billing cycle types
export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

// Subscription status
export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PENDING = 'pending'
}

// Payment status for subscriptions
export enum SubscriptionPaymentStatus {
  PAID = 'paid',
  PENDING = 'pending',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

// Payment method for subscription
export enum SubscriptionPaymentMethod {
  CARD = 'card',
  UPI = 'upi',
  WALLET = 'wallet',
  NET_BANKING = 'net_banking'
}

// Subscription Plan Schema
export interface ISubscriptionPlan extends Document {
  name: string;
  type: SubscriptionPlanType;
  description: string;
  price: number;
  billingCycle: BillingCycle;
  features: string[];
  maxRides?: number;
  priorityBooking: boolean;
  dedicatedSupport: boolean;
  discountPercentage: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced Subscription interface
export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  nextBillingDate: Date;
  autoRenew: boolean;
  paymentMethod: SubscriptionPaymentMethod;
  paymentMethodId?: string;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  totalPaid: number;
  currency: string;

  // Usage tracking
  ridesUsed: number;
  ridesRemaining?: number; // For plans with limited rides

  // Cancellation
  cancelledAt?: Date;
  cancellationReason?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Subscription Payment Schema
export interface ISubscriptionPayment extends Document {
  subscriptionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: SubscriptionPaymentStatus;
  paymentMethod: string;
  transactionId?: string;
  billingPeriod: {
    start: Date;
    end: Date;
  };
  processedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Subscription Plan Schema
const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: Object.values(SubscriptionPlanType),
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  billingCycle: {
    type: String,
    enum: Object.values(BillingCycle),
    required: true
  },
  features: [{
    type: String,
    trim: true
  }],
  maxRides: {
    type: Number,
    min: 0
  },
  priorityBooking: {
    type: Boolean,
    default: false
  },
  dedicatedSupport: {
    type: Boolean,
    default: false
  },
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Enhanced Subscription schema
const SubscriptionSchema = new Schema<ISubscription>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  planId: {
    type: Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: Object.values(SubscriptionStatus),
    default: SubscriptionStatus.PENDING,
    index: true
  },
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    required: true,
    index: true
  },
  nextBillingDate: {
    type: Date,
    required: true,
    index: true
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  paymentMethod: {
    type: String,
    enum: Object.values(SubscriptionPaymentMethod),
    required: true
  },
  paymentMethodId: {
    type: String,
    trim: true
  },
  lastPaymentDate: {
    type: Date
  },
  nextPaymentDate: {
    type: Date
  },
  totalPaid: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'INR', 'EUR']
  },

  // Usage tracking
  ridesUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  ridesRemaining: {
    type: Number,
    min: 0
  },

  // Cancellation
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Subscription Payment Schema
const SubscriptionPaymentSchema = new Schema<ISubscriptionPayment>({
  subscriptionId: {
    type: Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planId: {
    type: Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    trim: true
  },
  status: {
    type: String,
    enum: Object.values(SubscriptionPaymentStatus),
    default: SubscriptionPaymentStatus.PENDING
  },
  paymentMethod: {
    type: String,
    required: true,
    trim: true
  },
  transactionId: {
    type: String,
    trim: true
  },
  billingPeriod: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },
  processedAt: {
    type: Date
  },
  failedAt: {
    type: Date
  },
  failureReason: {
    type: String,
    trim: true
  },
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for better performance
SubscriptionPlanSchema.index({ type: 1, isActive: 1 });
SubscriptionPlanSchema.index({ name: 1 });

SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ planId: 1 });
SubscriptionSchema.index({ endDate: 1 });
SubscriptionSchema.index({ nextBillingDate: 1 });

SubscriptionPaymentSchema.index({ subscriptionId: 1 });
SubscriptionPaymentSchema.index({ userId: 1, status: 1 });
SubscriptionPaymentSchema.index({ processedAt: 1 });

// Virtual for checking if subscription is expired
SubscriptionSchema.virtual('isExpired').get(function() {
  return new Date() > this.endDate;
});

// Virtual for checking if subscription is active
SubscriptionSchema.virtual('isActive').get(function() {
  return this.status === SubscriptionStatus.ACTIVE && new Date() <= this.endDate;
});

// Virtual for days remaining
SubscriptionSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const diffTime = this.endDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Instance methods
SubscriptionSchema.methods.canUseRide = function(): boolean {
  if (this.status !== SubscriptionStatus.ACTIVE) return false;
  if (this.isExpired) return false;

  // Check ride limits if applicable
  if (this.ridesRemaining !== undefined && this.ridesRemaining <= 0) {
    return false;
  }

  return true;
};

SubscriptionSchema.methods.useRide = function(): boolean {
  if (!this.canUseRide()) return false;

  this.ridesUsed += 1;

  // Decrease remaining rides if limited
  if (this.ridesRemaining !== undefined) {
    this.ridesRemaining -= 1;
  }

  return true;
};

SubscriptionSchema.methods.cancel = function(reason?: string): void {
  this.status = SubscriptionStatus.CANCELLED;
  this.cancelledAt = new Date();
  this.autoRenew = false;

  if (reason) {
    this.cancellationReason = reason;
  }
};

SubscriptionSchema.methods.renew = function(newEndDate: Date): void {
  this.endDate = newEndDate;
  this.status = SubscriptionStatus.ACTIVE;
  this.lastPaymentDate = new Date();
};

// Static methods for SubscriptionPlan
SubscriptionPlanSchema.statics = {
  // Get active plans
  getActivePlans: function() {
    return this.find({ isActive: true }).sort({ price: 1 });
  },

  // Get plans by type
  getPlansByType: function(type: SubscriptionPlanType) {
    return this.find({ type, isActive: true });
  }
};

// Static methods for Subscription
SubscriptionSchema.statics.findActiveByUserId = function(userId: mongoose.Types.ObjectId) {
  return this.find({
    userId,
    status: SubscriptionStatus.ACTIVE,
    endDate: { $gt: new Date() }
  }).populate('planId');
};

SubscriptionSchema.statics.findExpiringSoon = function(days: number = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.find({
    status: SubscriptionStatus.ACTIVE,
    endDate: { $lte: futureDate, $gt: new Date() },
    autoRenew: true
  }).populate('userId planId');
};

SubscriptionSchema.statics.findExpiredSubscriptions = function() {
  return this.find({
    status: SubscriptionStatus.ACTIVE,
    endDate: { $lt: new Date() }
  }).populate('userId planId');
};

// Pre-save middleware to update status based on dates
SubscriptionSchema.pre('save', function(next) {
  if (this.isModified('endDate') || this.isModified('status')) {
    if (this.status === SubscriptionStatus.ACTIVE && new Date() > this.endDate) {
      this.status = SubscriptionStatus.EXPIRED;
    }
  }
  next();
});

// Create and export the models
export const SubscriptionPlan = mongoose.model<ISubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema);
export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
export const SubscriptionPayment = mongoose.model<ISubscriptionPayment>('SubscriptionPayment', SubscriptionPaymentSchema);

export default {
  SubscriptionPlan,
  Subscription,
  SubscriptionPayment
};
