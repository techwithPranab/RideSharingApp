/**
 * Booking model for tracking individual ride bookings
 * Links riders to specific ride offers with payment and status tracking
 */

import mongoose, { Document, Schema } from 'mongoose';

// Booking status enum
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  REFUNDED = 'refunded'
}

// Payment status enum
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  REFUND_PENDING = 'refund_pending'
}

// Type aliases for better code organization
export type CancelledBy = 'rider' | 'driver' | 'system';

// Cancellation policy configuration
export const CANCELLATION_POLICY = {
  FREE_CANCELLATION_HOURS: 2, // Free cancellation within 2 hours
  PARTIAL_REFUND_HOURS: 6, // 50% refund within 6 hours
  NO_REFUND_HOURS: 1, // No refund within 1 hour of departure
  FREE_CANCELLATION_PERCENTAGE: 100,
  PARTIAL_REFUND_PERCENTAGE: 50,
  NO_REFUND_PERCENTAGE: 0
};

// Booking interface
export interface IBooking extends Document {
  bookingId: string;
  rideOfferId: mongoose.Types.ObjectId;
  riderId: mongoose.Types.ObjectId;
  driverId: mongoose.Types.ObjectId;
  
  // Booking details
  seatsBooked: number;
  totalAmount: number;
  bookingDate: Date;
  
  // Status tracking
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  
  // Payment details
  paymentIntentId?: string;
  paymentMethodId?: string;
  refundId?: string;
  refundAmount?: number;
  refundDate?: Date;
  
  // Cancellation details
  cancellationReason?: string;
  cancelledBy?: CancelledBy;
  cancellationDate?: Date;
  
  // Trip details (copied from ride offer for record keeping)
  sourceLocation: {
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  destinationLocation: {
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  departureDateTime: Date;
  estimatedArrival: Date;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  cancel(reason: string, cancelledBy: CancelledBy): Promise<{ refundAmount: number; refundReason: string }>;
  processRefund(amount?: number): Promise<void>;
  confirmPayment(paymentIntentId: string): Promise<void>;
  calculateRefundAmount(): { amount: number; percentage: number; reason: string };
}

// Booking schema
const BookingSchema = new Schema<IBooking>({
  bookingId: {
    type: String,
    required: true,
    unique: true,
    default: () => `BKG-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  },
  rideOfferId: {
    type: Schema.Types.ObjectId,
    ref: 'RideOffer',
    required: true,
    index: true
  },
  riderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  driverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Booking details
  seatsBooked: {
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  bookingDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Status tracking
  status: {
    type: String,
    enum: Object.values(BookingStatus),
    default: BookingStatus.PENDING,
    required: true,
    index: true
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
    required: true,
    index: true
  },
  
  // Payment details
  paymentIntentId: {
    type: String,
    sparse: true
  },
  paymentMethodId: {
    type: String,
    sparse: true
  },
  refundId: {
    type: String,
    sparse: true
  },
  refundAmount: {
    type: Number,
    min: 0
  },
  refundDate: {
    type: Date
  },
  
  // Cancellation details
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  cancelledBy: {
    type: String,
    enum: ['rider', 'driver', 'system']
  },
  cancellationDate: {
    type: Date
  },
  
  // Trip details (snapshot from ride offer)
  sourceLocation: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180
      }
    }
  },
  destinationLocation: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180
      }
    }
  },
  departureDateTime: {
    type: Date,
    required: true,
    index: true
  },
  estimatedArrival: {
    type: Date,
    required: true
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform: function(_doc, ret) {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for efficient queries
BookingSchema.index({ rideOfferId: 1, status: 1 });
BookingSchema.index({ riderId: 1, status: 1 });
BookingSchema.index({ driverId: 1, status: 1 });
BookingSchema.index({ departureDateTime: 1, status: 1 });
BookingSchema.index({ paymentStatus: 1 });

// Method to cancel a booking
BookingSchema.methods.cancel = async function(
  reason: string, 
  cancelledBy: CancelledBy
): Promise<{ refundAmount: number; refundReason: string }> {
  if (this.status === BookingStatus.CANCELLED || this.status === BookingStatus.COMPLETED) {
    throw new Error('Cannot cancel booking that is already cancelled or completed');
  }

  // Calculate refund amount
  const refundInfo = this.calculateRefundAmount();

  this.status = BookingStatus.CANCELLED;
  this.cancellationReason = reason;
  this.cancelledBy = cancelledBy;
  this.cancellationDate = new Date();
  
  // Set refund details
  this.refundAmount = refundInfo.amount;
  this.refundDate = refundInfo.amount > 0 ? new Date() : undefined;
  
  // If payment was made and refund is applicable, mark for refund
  if (this.paymentStatus === PaymentStatus.PAID && refundInfo.amount > 0) {
    this.paymentStatus = PaymentStatus.REFUND_PENDING;
  } else if (this.paymentStatus === PaymentStatus.PAID && refundInfo.amount === 0) {
    this.paymentStatus = PaymentStatus.REFUNDED; // No refund needed
  }
  
  await this.save();

  return {
    refundAmount: refundInfo.amount,
    refundReason: refundInfo.reason
  };
};

// Method to process refund
BookingSchema.methods.processRefund = async function(amount?: number): Promise<void> {
  if (this.paymentStatus !== PaymentStatus.REFUND_PENDING) {
    throw new Error('Booking is not eligible for refund');
  }
  
  this.refundAmount = amount || this.totalAmount;
  this.refundDate = new Date();
  this.paymentStatus = PaymentStatus.REFUNDED;
  this.status = BookingStatus.REFUNDED;
  
  await this.save();
};

// Method to confirm payment
BookingSchema.methods.confirmPayment = async function(paymentIntentId: string): Promise<void> {
  this.paymentIntentId = paymentIntentId;
  this.paymentStatus = PaymentStatus.PAID;
  this.status = BookingStatus.CONFIRMED;
  
  await this.save();
};

// Method to calculate refund amount based on cancellation policy
BookingSchema.methods.calculateRefundAmount = function(): { amount: number; percentage: number; reason: string } {
  const now = new Date();
  const departureTime = new Date(this.departureDateTime);
  const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  // If booking is already cancelled or completed, no refund
  if (this.status === BookingStatus.CANCELLED || this.status === BookingStatus.COMPLETED) {
    return { amount: 0, percentage: 0, reason: 'Booking already cancelled or completed' };
  }

  // If no payment made, no refund needed
  if (this.paymentStatus !== PaymentStatus.PAID) {
    return { amount: 0, percentage: 0, reason: 'No payment made for this booking' };
  }

  // Free cancellation - within 2 hours
  if (hoursUntilDeparture >= CANCELLATION_POLICY.FREE_CANCELLATION_HOURS) {
    return {
      amount: this.totalAmount,
      percentage: CANCELLATION_POLICY.FREE_CANCELLATION_PERCENTAGE,
      reason: `Free cancellation (${hoursUntilDeparture.toFixed(1)} hours before departure)`
    };
  }

  // Partial refund - within 6 hours
  if (hoursUntilDeparture >= CANCELLATION_POLICY.NO_REFUND_HOURS) {
    const refundAmount = Math.round(this.totalAmount * CANCELLATION_POLICY.PARTIAL_REFUND_PERCENTAGE / 100);
    return {
      amount: refundAmount,
      percentage: CANCELLATION_POLICY.PARTIAL_REFUND_PERCENTAGE,
      reason: `Partial refund (${hoursUntilDeparture.toFixed(1)} hours before departure)`
    };
  }

  // No refund - within 1 hour
  return {
    amount: 0,
    percentage: CANCELLATION_POLICY.NO_REFUND_PERCENTAGE,
    reason: `No refund (${hoursUntilDeparture.toFixed(1)} hours before departure)`
  };
};

// Pre-save middleware to ensure data consistency
BookingSchema.pre('save', function(next) {
  // Ensure refund amount doesn't exceed total amount
  if (this.refundAmount && this.refundAmount > this.totalAmount) {
    this.refundAmount = this.totalAmount;
  }
  
  next();
});

// Create and export the model
const Booking = mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
