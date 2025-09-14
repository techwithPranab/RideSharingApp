/**
 * RideOffer model for managing driver-offered rides
 * Handles proactive ride offerings with route planning, scheduling, and pricing
 */

import mongoose, { Document, Schema } from 'mongoose';

// Ride offer status enum
export enum RideOfferStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

// Recurring schedule enum
export enum RecurringType {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

// Location interface for ride offers
export interface IRideLocation {
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  placeId?: string; // Google Places ID
}

// Stop interface for multi-stop rides
export interface IRideStop {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  estimatedArrival?: Date;
}

// Schedule interface
export interface IRideSchedule {
  departureDate: Date;
  departureTime: Date;
  isFlexible: boolean;
  flexibilityMinutes: number; // ± minutes for flexible timing
  recurring: {
    isRecurring: boolean;
    type: RecurringType;
    days?: string[]; // For weekly recurring: ['monday', 'wednesday', 'friday']
    endDate?: Date;
  };
}

// Pricing interface
export interface IRidePricing {
  seats: number;
  pricePerSeat: number;
  acceptsNegotiation: boolean;
  minimumPrice?: number; // Minimum acceptable price if negotiation allowed
  totalEarnings: number;
}

// Ride offer interface
export interface IRideOffer extends Document<any, any, any> {
  // Basic information
  offerId: string; // Unique readable offer ID
  driverId: mongoose.Types.ObjectId;

  // Route information
  source: IRideLocation;
  destination: IRideLocation;
  stops?: IRideStop[];
  estimatedDistance?: number; // in kilometers
  estimatedDuration?: number; // in minutes

  // Schedule
  schedule: IRideSchedule;

  // Pricing and capacity
  pricing: IRidePricing;

  // Status and metadata
  status: RideOfferStatus;
  publishedAt?: Date;
  expiresAt?: Date;
  lastModifiedAt: Date;

  // Booking information
  totalBookings: number;
  availableSeats: number;
  bookedSeats: number;

  // Additional information
  specialInstructions?: string;
  vehicleId?: mongoose.Types.ObjectId;

  // Audit fields
  createdAt: Date;
  updatedAt: Date;

  // Methods
  publish(): Promise<void>;
  cancel(reason?: string): Promise<void>;
  updateAvailability(seats: number): Promise<void>;
  isExpired(): boolean;
  getNextDepartureDate(): Date | null;
}

// Location schema for ride offers
const RideLocationSchema = new Schema<IRideLocation>({
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
  },
  placeId: String
}, { _id: false });

// Stop schema
const RideStopSchema = new Schema<IRideStop>({
  id: {
    type: String,
    required: true
  },
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
  },
  estimatedArrival: Date
}, { _id: false });

// Schedule schema
const RideScheduleSchema = new Schema<IRideSchedule>({
  departureDate: {
    type: Date,
    required: true
  },
  departureTime: {
    type: Date,
    required: true
  },
  isFlexible: {
    type: Boolean,
    default: false
  },
  flexibilityMinutes: {
    type: Number,
    default: 15,
    min: 0,
    max: 120
  },
  recurring: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      enum: Object.values(RecurringType),
      default: RecurringType.NONE
    },
    days: [String], // Array of day names for weekly recurring
    endDate: Date
  }
}, { _id: false });

// Pricing schema
const RidePricingSchema = new Schema<IRidePricing>({
  seats: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  pricePerSeat: {
    type: Number,
    required: true,
    min: 0
  },
  acceptsNegotiation: {
    type: Boolean,
    default: false
  },
  minimumPrice: {
    type: Number,
    min: 0
  },
  totalEarnings: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

// Ride offer schema
const RideOfferSchema = new Schema<IRideOffer>({
  // Basic information
  offerId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  driverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Route information
  source: {
    type: RideLocationSchema,
    required: true
  },
  destination: {
    type: RideLocationSchema,
    required: true
  },
  stops: [RideStopSchema],
  estimatedDistance: {
    type: Number,
    min: 0
  },
  estimatedDuration: {
    type: Number,
    min: 0
  },

  // Schedule
  schedule: {
    type: RideScheduleSchema,
    required: true
  },

  // Pricing and capacity
  pricing: {
    type: RidePricingSchema,
    required: true
  },

  // Status and metadata
  status: {
    type: String,
    enum: Object.values(RideOfferStatus),
    default: RideOfferStatus.DRAFT,
    index: true
  },
  publishedAt: Date,
  expiresAt: Date,
  lastModifiedAt: {
    type: Date,
    default: Date.now
  },

  // Booking information
  totalBookings: {
    type: Number,
    default: 0
  },
  availableSeats: {
    type: Number,
    required: true
  },
  bookedSeats: {
    type: Number,
    default: 0
  },

  // Additional information
  specialInstructions: {
    type: String,
    maxlength: 500
  },
  vehicleId: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
RideOfferSchema.index({ offerId: 1 }, { unique: true });
RideOfferSchema.index({ driverId: 1, status: 1 });
RideOfferSchema.index({ status: 1, 'schedule.departureDate': 1 });
RideOfferSchema.index({ 'source.coordinates': '2dsphere' });
RideOfferSchema.index({ 'destination.coordinates': '2dsphere' });
RideOfferSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for full route description
RideOfferSchema.virtual('routeDescription').get(function() {
  const stops = this.stops || [];
  const locations = [this.source.name, ...stops.map(stop => stop.name), this.destination.name];
  return locations.join(' → ');
});

// Virtual for departure date/time combined
RideOfferSchema.virtual('departureDateTime').get(function() {
  const date = new Date(this.schedule.departureDate);
  const time = new Date(this.schedule.departureTime);

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.getHours(),
    time.getMinutes(),
    time.getSeconds()
  );
});

// Pre-save middleware to generate offer ID and set defaults
RideOfferSchema.pre('save', async function(next) {
  if (this.isNew && !this.offerId) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.offerId = `RO${date}${randomNum}`;
  }

  // Set available seats to total seats if not set
  if (this.isNew && this.availableSeats === undefined) {
    this.availableSeats = this.pricing.seats;
  }

  // Set expiration date (24 hours from publication for one-time offers)
  if (this.status === RideOfferStatus.PUBLISHED && !this.expiresAt) {
    if (!this.schedule.recurring.isRecurring) {
      const departureDateTime = new Date(
        this.schedule.departureDate.getFullYear(),
        this.schedule.departureDate.getMonth(),
        this.schedule.departureDate.getDate(),
        this.schedule.departureTime.getHours(),
        this.schedule.departureTime.getMinutes(),
        this.schedule.departureTime.getSeconds()
      );
      this.expiresAt = new Date(departureDateTime.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    } else if (this.schedule.recurring.endDate) {
      this.expiresAt = this.schedule.recurring.endDate;
    }
  }

  this.lastModifiedAt = new Date();
  next();
});

// Method to publish the offer
RideOfferSchema.methods.publish = async function(): Promise<void> {
  if (this.status !== RideOfferStatus.DRAFT) {
    throw new Error('Only draft offers can be published');
  }

  this.status = RideOfferStatus.PUBLISHED;
  this.publishedAt = new Date();
  this.availableSeats = this.pricing.seats - this.bookedSeats;

  await this.save();
};

// Method to cancel the offer
RideOfferSchema.methods.cancel = async function(reason?: string): Promise<void> {
  if (this.status === RideOfferStatus.COMPLETED || this.status === RideOfferStatus.CANCELLED) {
    return;
  }

  this.status = RideOfferStatus.CANCELLED;
  if (reason) {
    this.specialInstructions = reason;
  }

  await this.save();
};

// Method to update available seats
RideOfferSchema.methods.updateAvailability = async function(seats: number): Promise<void> {
  if (seats < 0 || seats > this.pricing.seats) {
    throw new Error('Invalid number of available seats');
  }

  this.availableSeats = seats;
  this.bookedSeats = this.pricing.seats - seats;

  await this.save();
};

// Method to check if offer is expired
RideOfferSchema.methods.isExpired = function(): boolean {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Method to get next departure date for recurring offers
RideOfferSchema.methods.getNextDepartureDate = function(): Date | null {
  if (!this.schedule.recurring.isRecurring) {
    return this.departureDateTime;
  }

  const now = new Date();
  const baseDate = this.departureDateTime;

  if (this.schedule.recurring.type === RecurringType.WEEKLY && this.schedule.recurring.days) {
    const today = now.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDays = this.schedule.recurring.days.map((day: string) => dayNames.indexOf(day.toLowerCase()));

    for (let i = 0; i < 7; i++) {
      const checkDay = (today + i) % 7;
      if (targetDays.includes(checkDay)) {
        const nextDate = new Date(now);
        nextDate.setDate(now.getDate() + i);
        nextDate.setHours(baseDate.getHours(), baseDate.getMinutes(), 0, 0);
        return nextDate;
      }
    }
  }

  return baseDate;
};

// Static method to find active offers for driver
RideOfferSchema.statics.findActiveOffersForDriver = function(driverId: mongoose.Types.ObjectId) {
  return this.find({
    driverId,
    status: { $in: [RideOfferStatus.PUBLISHED, RideOfferStatus.ACTIVE] },
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  }).sort({ 'schedule.departureDate': 1 });
};

// Static method to find available offers by route
RideOfferSchema.statics.findOffersByRoute = function(
  sourceCoords: [number, number],
  destCoords: [number, number],
  maxDistance: number = 5000 // 5km radius
) {
  return this.find({
    status: RideOfferStatus.PUBLISHED,
    availableSeats: { $gt: 0 },
    'source.coordinates': {
      $near: {
        $geometry: { type: 'Point', coordinates: sourceCoords },
        $maxDistance: maxDistance
      }
    },
    'destination.coordinates': {
      $near: {
        $geometry: { type: 'Point', coordinates: destCoords },
        $maxDistance: maxDistance
      }
    }
  })
  .populate('driverId', 'firstName lastName phoneNumber averageRating')
  .populate('vehicleId', 'make model licensePlate type')
  .sort({ 'schedule.departureDate': 1 });
};

export const RideOffer = mongoose.model<IRideOffer>('RideOffer', RideOfferSchema);
