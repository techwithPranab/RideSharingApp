/**
 * Ride model for managing ride requests, pooling, and trip data
 * Handles single rides and carpooling with multiple passengers
 */

import mongoose, { Document, Schema } from 'mongoose';
import { ILocation } from './User';

// Ride status enum
export enum RideStatus {
  REQUESTED = 'requested',
  ACCEPTED = 'accepted',
  DRIVER_ARRIVED = 'driver_arrived',
  STARTED = 'started',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Payment status enum
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

// Passenger interface for pooled rides
export interface IPassenger {
  userId: mongoose.Types.ObjectId;
  pickupLocation: ILocation;
  dropoffLocation: ILocation;
  fare: number;
  paymentStatus: PaymentStatus;
  joinedAt: Date;
  rating?: number;
  review?: string;
}

// Route waypoint interface
export interface IWaypoint {
  location: ILocation;
  type: 'pickup' | 'dropoff';
  passengerId: mongoose.Types.ObjectId;
  estimatedTime?: Date;
  actualTime?: Date;
}

// Ride interface
export interface IRide extends Document<any, any, any> {
  // Basic ride information
  rideId: string; // Unique readable ride ID
  isPooled: boolean;
  capacity: number; // Maximum passengers for this ride
  
  // Driver and vehicle
  driverId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  
  // Passengers (array for pooled rides)
  passengers: IPassenger[];
  
  // Route information
  route: IWaypoint[];
  estimatedDistance: number; // in kilometers
  actualDistance?: number;
  estimatedDuration: number; // in minutes
  actualDuration?: number;
  
  // Pricing
  baseFare: number;
  totalFare: number;
  driverEarnings: number;
  platformCommission: number;
  
  // Status and timing
  status: RideStatus;
  requestedAt: Date;
  acceptedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  
  // Payment
  paymentStatus: PaymentStatus;
  paymentMethod: 'cash' | 'card' | 'upi' | 'wallet';
  paymentTransactionId?: string;
  
  // Subscription
  appliedSubscriptionId?: mongoose.Types.ObjectId;
  
  // Additional information
  specialInstructions?: string;
  cancellationReason?: string;
  otp?: string; // OTP for ride verification
  
  // Emergency and safety
  sosAlerted: boolean;
  emergencyContacts?: string[];
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  addPassenger(passenger: IPassenger): Promise<void>;
  removePassenger(passengerId: mongoose.Types.ObjectId): Promise<void>;
  updateStatus(newStatus: RideStatus): Promise<void>;
  calculateSplitFare(): number[];
  generateOTP(): string;
}

// Passenger schema
const PassengerSchema = new Schema<IPassenger>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pickupLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: String
  },
  dropoffLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: String
  },
  fare: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    maxlength: 500
  }
}, { _id: false });

// Waypoint schema
const WaypointSchema = new Schema<IWaypoint>({
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: String
  },
  type: {
    type: String,
    enum: ['pickup', 'dropoff'],
    required: true
  },
  passengerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  estimatedTime: Date,
  actualTime: Date
}, { _id: false });

// Ride schema
const RideSchema = new Schema<IRide>({
  // Basic ride information
  rideId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  isPooled: {
    type: Boolean,
    default: false,
    index: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  
  // Driver and vehicle
  driverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  vehicleId: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  
  // Passengers
  passengers: {
    type: [PassengerSchema],
    required: true,
    validate: {
      validator: function(passengers: IPassenger[]): boolean {
        return passengers.length > 0 && passengers.length <= 4; // Default max capacity
      },
      message: 'Number of passengers must be between 1 and vehicle capacity'
    }
  },
  
  // Route information
  route: [WaypointSchema],
  estimatedDistance: {
    type: Number,
    required: true,
    min: 0
  },
  actualDistance: {
    type: Number,
    min: 0
  },
  estimatedDuration: {
    type: Number,
    required: true,
    min: 0
  },
  actualDuration: {
    type: Number,
    min: 0
  },
  
  // Pricing
  baseFare: {
    type: Number,
    required: true,
    min: 0
  },
  totalFare: {
    type: Number,
    required: true,
    min: 0
  },
  driverEarnings: {
    type: Number,
    required: true,
    min: 0
  },
  platformCommission: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Status and timing
  status: {
    type: String,
    enum: Object.values(RideStatus),
    default: RideStatus.REQUESTED,
    index: true
  },
  requestedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  acceptedAt: Date,
  startedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  
  // Payment
  paymentStatus: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'wallet'],
    required: true
  },
  paymentTransactionId: {
    type: String,
    sparse: true,
    index: true
  },
  
  // Subscription
  appliedSubscriptionId: {
    type: Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  
  // Additional information
  specialInstructions: {
    type: String,
    maxlength: 500
  },
  cancellationReason: {
    type: String,
    maxlength: 200
  },
  otp: {
    type: String,
    length: 4
  },
  
  // Emergency and safety
  sosAlerted: {
    type: Boolean,
    default: false
  },
  emergencyContacts: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
RideSchema.index({ rideId: 1 }, { unique: true });
RideSchema.index({ driverId: 1, status: 1 });
RideSchema.index({ 'passengers.userId': 1 });
RideSchema.index({ status: 1, requestedAt: -1 });
RideSchema.index({ paymentStatus: 1 });
RideSchema.index({ isPooled: 1, status: 1 });

// Virtual for ride duration in minutes
RideSchema.virtual('rideDurationMinutes').get(function() {
  if (this.startedAt && this.completedAt) {
    return Math.round((this.completedAt.getTime() - this.startedAt.getTime()) / (1000 * 60));
  }
  return null;
});

// Pre-save middleware to generate ride ID
RideSchema.pre('save', async function(next) {
  if (this.isNew && !this.rideId) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.rideId = `R${date}${randomNum}`;
  }
  next();
});

// Method to add passenger to pooled ride
RideSchema.methods.addPassenger = async function(passenger: IPassenger): Promise<void> {
  if (this.passengers.length >= this.capacity) {
    throw new Error('Ride is at full capacity');
  }
  
  this.passengers.push(passenger);
  
  // Recalculate total fare
  this.totalFare = this.passengers.reduce((total: number, p: IPassenger) => total + p.fare, 0);
  
  await this.save();
};

// Method to remove passenger from pooled ride
RideSchema.methods.removePassenger = async function(passengerId: mongoose.Types.ObjectId): Promise<void> {
  this.passengers = this.passengers.filter((p: IPassenger) => !p.userId.equals(passengerId));
  
  // Recalculate total fare
  this.totalFare = this.passengers.reduce((total: number, p: IPassenger) => total + p.fare, 0);
  
  await this.save();
};

// Method to update ride status with timestamp
RideSchema.methods.updateStatus = async function(newStatus: RideStatus): Promise<void> {
  const now = new Date();
  
  this.status = newStatus;
  
  switch (newStatus) {
    case RideStatus.ACCEPTED:
      this.acceptedAt = now;
      break;
    case RideStatus.STARTED:
      this.startedAt = now;
      break;
    case RideStatus.COMPLETED:
      this.completedAt = now;
      this.paymentStatus = PaymentStatus.PROCESSING;
      break;
    case RideStatus.CANCELLED:
      this.cancelledAt = now;
      break;
  }
  
  await this.save();
};

// Method to calculate split fare for pooled rides
RideSchema.methods.calculateSplitFare = function(): number[] {
  if (!this.isPooled || this.passengers.length <= 1) {
    return [this.totalFare];
  }
  
  // Simple split based on distance (can be enhanced with actual route optimization)
  const baseAmount = this.baseFare / this.passengers.length;
  const distanceAmount = (this.totalFare - this.baseFare) / this.passengers.length;
  
  return this.passengers.map(() => Math.round((baseAmount + distanceAmount) * 100) / 100);
};

// Method to generate OTP for ride verification
RideSchema.methods.generateOTP = function(): string {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  this.otp = otp;
  return otp;
};

// Static method to find active rides for driver
RideSchema.statics.findActiveRideForDriver = function(driverId: mongoose.Types.ObjectId) {
  return this.findOne({
    driverId,
    status: { $in: [RideStatus.ACCEPTED, RideStatus.DRIVER_ARRIVED, RideStatus.STARTED] }
  });
};

// Static method to find rides by passenger
RideSchema.statics.findRidesByPassenger = function(
  userId: mongoose.Types.ObjectId,
  limit: number = 10
) {
  return this.find({
    'passengers.userId': userId
  })
  .sort({ requestedAt: -1 })
  .limit(limit)
  .populate('driverId', 'firstName lastName phoneNumber averageRating')
  .populate('vehicleId', 'make model licensePlate type');
};

export const Ride = mongoose.model<IRide>('Ride', RideSchema);
