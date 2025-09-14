/**
 * Payment model for handling transactions, split payments, and settlements
 * Manages all financial transactions in the ride-sharing system
 */

import mongoose, { Document, Schema } from 'mongoose';

// Payment type enum
export enum PaymentType {
  RIDE_PAYMENT = 'ride_payment',
  DRIVER_PAYOUT = 'driver_payout',
  REFUND = 'refund',
  COMMISSION = 'commission',
  INCENTIVE = 'incentive'
}

// Payment status enum
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

// Payment method enum
export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  UPI = 'upi',
  WALLET = 'wallet',
  NET_BANKING = 'net_banking'
}

// Payment interface
export interface IPayment extends Document<any, any, any> {
  // Basic payment information
  paymentId: string; // Unique readable payment ID
  type: PaymentType;
  
  // Related entities
  rideId?: mongoose.Types.ObjectId;
  payerId: mongoose.Types.ObjectId; // User who is paying
  payeeId?: mongoose.Types.ObjectId; // User who receives payment (driver)
  
  // Payment details
  amount: number;
  currency: string;
  method: PaymentMethod;
  
  // Gateway information
  gatewayTransactionId?: string; // Razorpay/other gateway transaction ID
  gatewayOrderId?: string;
  gatewaySignature?: string;
  
  // Stripe specific fields
  stripePaymentIntentId?: string;
  stripeClientSecret?: string;
  stripeRefundId?: string;
  
  // Status and timing
  status: PaymentStatus;
  initiatedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  
  // Split payment information (for pooled rides)
  isPartialPayment: boolean;
  totalRideAmount?: number; // Total ride amount for reference
  
  // Additional information
  description?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  updateStatus(newStatus: PaymentStatus, metadata?: Record<string, any>): Promise<void>;
  processRefund(refundAmount?: number): Promise<IPayment>;
}

// Payment schema
const PaymentSchema = new Schema<IPayment>({
  // Basic payment information
  paymentId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: Object.values(PaymentType),
    required: true,
    index: true
  },
  
  // Related entities
  rideId: {
    type: Schema.Types.ObjectId,
    ref: 'Ride',
    sparse: true,
    index: true
  },
  payerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  payeeId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    sparse: true,
    index: true
  },
  
  // Payment details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'INR',
    enum: ['INR', 'USD'] // Can be extended
  },
  method: {
    type: String,
    enum: Object.values(PaymentMethod),
    required: true,
    index: true
  },
  
  // Gateway information
  gatewayTransactionId: {
    type: String,
    sparse: true,
    index: true
  },
  gatewayOrderId: {
    type: String,
    sparse: true,
    index: true
  },
  gatewaySignature: String,
  
  // Stripe specific fields
  stripePaymentIntentId: {
    type: String,
    sparse: true,
    index: true
  },
  stripeClientSecret: {
    type: String,
    sparse: true
  },
  stripeRefundId: {
    type: String,
    sparse: true,
    index: true
  },
  
  // Status and timing
  status: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
    index: true
  },
  initiatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  processedAt: Date,
  completedAt: Date,
  failedAt: Date,
  
  // Split payment information
  isPartialPayment: {
    type: Boolean,
    default: false
  },
  totalRideAmount: Number,
  
  // Additional information
  description: {
    type: String,
    maxlength: 500
  },
  failureReason: {
    type: String,
    maxlength: 200
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
PaymentSchema.index({ paymentId: 1 }, { unique: true });
PaymentSchema.index({ payerId: 1, status: 1 });
PaymentSchema.index({ payeeId: 1, status: 1 });
PaymentSchema.index({ rideId: 1 });
PaymentSchema.index({ gatewayTransactionId: 1 }, { sparse: true });
PaymentSchema.index({ type: 1, status: 1 });
PaymentSchema.index({ initiatedAt: -1 });

// Pre-save middleware to generate payment ID
PaymentSchema.pre('save', async function(next) {
  if (this.isNew && !this.paymentId) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    this.paymentId = `PAY${date}${randomNum}`;
  }
  next();
});

// Method to update payment status with timestamp
PaymentSchema.methods.updateStatus = async function(
  newStatus: PaymentStatus, 
  metadata?: Record<string, any>
): Promise<void> {
  const now = new Date();
  
  this.status = newStatus;
  
  if (metadata) {
    this.metadata = { ...this.metadata, ...metadata };
  }
  
  switch (newStatus) {
    case PaymentStatus.PROCESSING:
      this.processedAt = now;
      break;
    case PaymentStatus.COMPLETED:
      this.completedAt = now;
      break;
    case PaymentStatus.FAILED:
      this.failedAt = now;
      break;
  }
  
  await this.save();
};

// Method to process refund
PaymentSchema.methods.processRefund = async function(refundAmount?: number): Promise<IPayment> {
  const amount = refundAmount || this.amount;
  
  if (amount > this.amount) {
    throw new Error('Refund amount cannot be greater than original payment amount');
  }
  
  // Create refund payment record
  const refund = new (this.constructor as any)({
    type: PaymentType.REFUND,
    payerId: this.payeeId || this.payerId, // Platform pays back
    payeeId: this.payerId, // Original payer receives refund
    rideId: this.rideId,
    amount: amount,
    currency: this.currency,
    method: this.method,
    status: PaymentStatus.PENDING,
    description: `Refund for payment ${this.paymentId}`,
    metadata: {
      originalPaymentId: this.paymentId,
      originalAmount: this.amount
    }
  });
  
  await refund.save();
  
  // Update original payment status
  this.status = PaymentStatus.REFUNDED;
  this.metadata = {
    ...this.metadata,
    refundPaymentId: refund.paymentId,
    refundAmount: amount,
    refundedAt: new Date()
  };
  
  await this.save();
  
  return refund;
};

// Static method to find payments by user
PaymentSchema.statics.findPaymentsByUser = function(
  userId: mongoose.Types.ObjectId,
  type?: PaymentType,
  limit: number = 20
) {
  const query: any = {
    $or: [
      { payerId: userId },
      { payeeId: userId }
    ]
  };
  
  if (type) {
    query.type = type;
  }
  
  return this.find(query)
    .sort({ initiatedAt: -1 })
    .limit(limit)
    .populate('rideId', 'rideId status totalFare')
    .populate('payerId', 'firstName lastName')
    .populate('payeeId', 'firstName lastName');
};

// Static method to calculate driver earnings
PaymentSchema.statics.calculateDriverEarnings = function(
  driverId: mongoose.Types.ObjectId,
  startDate?: Date,
  endDate?: Date
) {
  const matchStage: any = {
    payeeId: driverId,
    type: { $in: [PaymentType.RIDE_PAYMENT, PaymentType.INCENTIVE] },
    status: PaymentStatus.COMPLETED
  };
  
  if (startDate && endDate) {
    matchStage.completedAt = {
      $gte: startDate,
      $lte: endDate
    };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$amount' },
        totalRides: { $sum: 1 },
        averageEarning: { $avg: '$amount' }
      }
    }
  ]);
};

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
