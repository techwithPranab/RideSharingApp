/**
 * User model for both riders and drivers
 * Handles authentication, profile management, and KYC data
 */

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// User role enum
export enum UserRole {
  RIDER = 'rider',
  DRIVER = 'driver',
  ADMIN = 'admin'
}

// User status enum
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification'
}

// KYC status enum
export enum KYCStatus {
  NOT_SUBMITTED = 'not_submitted',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

// Location interface
export interface ILocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
}

// KYC documents interface
export interface IKYCDocument {
  type: string; // 'aadhar', 'pan', 'driving_license', 'vehicle_registration'
  number: string;
  url: string;
  verificationStatus: KYCStatus;
  uploadedAt: Date;
  verifiedAt?: Date;
}

// Payment method interface
export interface IPaymentMethod {
  type: 'card' | 'upi' | 'wallet';
  details: {
    cardNumber?: string; // last 4 digits
    upiId?: string;
    walletProvider?: string;
  };
  isDefault: boolean;
  isActive: boolean;
}

// User interface
export interface IUser extends Document<any, any, any> {
  // Basic information
  phoneNumber: string;
  email?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  
  // Authentication
  password?: string;
  role: UserRole;
  status: UserStatus;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  
  // Location
  currentLocation?: ILocation;
  homeAddress?: string;
  workAddress?: string;
  
  // KYC and verification
  kycStatus: KYCStatus;
  kycDocuments: IKYCDocument[];
  
  // Payment
  paymentMethods: IPaymentMethod[];
  
  // Subscription
  activeSubscriptionId?: mongoose.Types.ObjectId; // Reference to active subscription
  subscriptionStatus?: 'none' | 'active' | 'expired' | 'cancelled';
  subscriptionExpiryDate?: Date;
  
  // Driver specific fields
  drivingLicenseNumber?: string;
  drivingLicenseExpiry?: Date;
  vehicleIds?: mongoose.Types.ObjectId[]; // Reference to Vehicle model
  isAvailable?: boolean; // Driver availability status
  
  // Ratings and reviews
  averageRating: number;
  totalRatings: number;
  
  // Metadata
  lastActiveAt: Date;
  registrationSource: 'app' | 'web' | 'admin';
  referralCode?: string;
  referredBy?: mongoose.Types.ObjectId;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  updateLocation(location: ILocation): Promise<void>;
}

// Location schema
const LocationSchema = new Schema<ILocation>({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number],
    required: true,
    index: '2dsphere'
  },
  address: String
}, { _id: false });

// KYC document schema
const KYCDocumentSchema = new Schema<IKYCDocument>({
  type: {
    type: String,
    required: true,
    enum: ['aadhar', 'pan', 'driving_license', 'vehicle_registration', 'vehicle_insurance']
  },
  number: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  verificationStatus: {
    type: String,
    enum: Object.values(KYCStatus),
    default: KYCStatus.PENDING
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  verifiedAt: Date
}, { _id: false });

// Payment method schema
const PaymentMethodSchema = new Schema<IPaymentMethod>({
  type: {
    type: String,
    enum: ['card', 'upi', 'wallet'],
    required: true
  },
  details: {
    cardNumber: String, // Store only last 4 digits
    upiId: String,
    walletProvider: String
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// User schema
const UserSchema = new Schema<IUser>({
  // Basic information
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    validate: {
      validator: function(v: string) {
        return /^\+91[6-9]\d{9}$/.test(v); // Indian phone number format
      },
      message: 'Please provide a valid Indian phone number'
    }
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please provide a valid email address'
    }
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  avatar: String,
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  
  // Authentication
  password: {
    type: String,
    minlength: 6,
    select: false // Don't include in queries by default
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.ACTIVE,
    index: true
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // Location
  currentLocation: LocationSchema,
  homeAddress: String,
  workAddress: String,
  
  // KYC and verification
  kycStatus: {
    type: String,
    enum: Object.values(KYCStatus),
    default: KYCStatus.NOT_SUBMITTED,
    index: true
  },
  kycDocuments: [KYCDocumentSchema],
  
  // Payment
  paymentMethods: [PaymentMethodSchema],
  
  // Subscription
  activeSubscriptionId: {
    type: Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  subscriptionStatus: {
    type: String,
    enum: ['none', 'active', 'expired', 'cancelled'],
    default: 'none'
  },
  subscriptionExpiryDate: Date,
  
  // Driver specific fields
  drivingLicenseNumber: {
    type: String,
    sparse: true,
    index: true
  },
  drivingLicenseExpiry: Date,
  vehicleIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Vehicle'
  }],
  isAvailable: {
    type: Boolean,
    default: false,
    index: true // Index for finding available drivers
  },
  
  // Ratings and reviews
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  
  // Metadata
  lastActiveAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  registrationSource: {
    type: String,
    enum: ['app', 'web', 'admin'],
    default: 'app'
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true
  },
  referredBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(_doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for performance
UserSchema.index({ phoneNumber: 1, role: 1 });
UserSchema.index({ 'currentLocation.coordinates': '2dsphere' });
UserSchema.index({ isAvailable: 1, role: 1 }, { 
  partialFilterExpression: { role: UserRole.DRIVER } 
});

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) return next();
  
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  
  next();
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to update location
UserSchema.methods.updateLocation = async function(location: ILocation): Promise<void> {
  this.currentLocation = location;
  this.lastActiveAt = new Date();
  await this.save();
};

// Static method to find nearby drivers
UserSchema.statics.findNearbyDrivers = function(
  location: ILocation, 
  maxDistance: number = 5000, // 5km default
  limit: number = 10
) {
  return this.find({
    role: UserRole.DRIVER,
    isAvailable: true,
    status: UserStatus.ACTIVE,
    currentLocation: {
      $near: {
        $geometry: location,
        $maxDistance: maxDistance
      }
    }
  }).limit(limit);
};

export const User = mongoose.model<IUser>('User', UserSchema);
