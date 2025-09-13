/**
 * Vehicle model for driver vehicles
 * Manages vehicle information, documents, and availability
 */

import mongoose, { Schema } from 'mongoose';

// Vehicle type enum
export enum VehicleType {
  HATCHBACK = 'hatchback',
  SEDAN = 'sedan',
  SUV = 'suv',
  AUTO = 'auto',
  BIKE = 'bike'
}

// Vehicle status enum
export enum VehicleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  PENDING_VERIFICATION = 'pending_verification'
}

// Vehicle interface
export interface IVehicle {
  _id?: mongoose.Types.ObjectId;
  // Basic information
  driverId: mongoose.Types.ObjectId;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  
  // Vehicle specifications
  type: VehicleType;
  capacity: number; // Number of passengers
  fuelType: 'petrol' | 'diesel' | 'cng' | 'electric';
  
  // Documents
  registrationNumber: string;
  registrationDocument: string; // URL to document
  insuranceNumber: string;
  insuranceDocument: string; // URL to document
  insuranceExpiry: Date;
  pucCertificate?: string; // Pollution Under Control certificate
  pucExpiry?: Date;
  
  // Vehicle condition and features
  status: VehicleStatus;
  averageRating: number;
  totalRatings: number;
  hasAC: boolean;
  hasMusic: boolean;
  hasWifi: boolean;
  
  // Operational data
  totalDistance: number; // Total distance covered in km
  totalTrips: number;
  lastServiceDate?: Date;
  nextServiceDue?: Date;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  updateRating(newRating: number): Promise<void>;
  isVerified(): boolean;
}

// Vehicle schema
const VehicleSchema = new Schema<IVehicle>({
  // Basic information
  driverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  make: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  model: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  year: {
    type: Number,
    required: true,
    min: 2000,
    max: new Date().getFullYear() + 1
  },
  color: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  licensePlate: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        // Indian license plate format validation
        return /^[A-Z]{2}[ -]?[0-9]{1,2}[A-Z]{0,3}[ -]?[0-9]{4}$/.test(v);
      },
      message: 'Please provide a valid Indian license plate number'
    }
  },
  
  // Vehicle specifications
  type: {
    type: String,
    enum: Object.values(VehicleType),
    required: true,
    index: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  fuelType: {
    type: String,
    enum: ['petrol', 'diesel', 'cng', 'electric'],
    required: true
  },
  
  // Documents
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  registrationDocument: {
    type: String,
    required: true // URL to uploaded document
  },
  insuranceNumber: {
    type: String,
    required: true,
    trim: true
  },
  insuranceDocument: {
    type: String,
    required: true // URL to uploaded document
  },
  insuranceExpiry: {
    type: Date,
    required: true,
    index: true
  },
  pucCertificate: String, // URL to PUC certificate
  pucExpiry: {
    type: Date,
    index: true
  },
  
  // Vehicle condition and features
  status: {
    type: String,
    enum: Object.values(VehicleStatus),
    default: VehicleStatus.PENDING_VERIFICATION,
    index: true
  },
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
  hasAC: {
    type: Boolean,
    default: false
  },
  hasMusic: {
    type: Boolean,
    default: false
  },
  hasWifi: {
    type: Boolean,
    default: false
  },
  
  // Operational data
  totalDistance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalTrips: {
    type: Number,
    default: 0,
    min: 0
  },
  lastServiceDate: Date,
  nextServiceDue: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
VehicleSchema.index({ driverId: 1, status: 1 });
VehicleSchema.index({ licensePlate: 1 }, { unique: true });
VehicleSchema.index({ registrationNumber: 1 }, { unique: true });
VehicleSchema.index({ insuranceExpiry: 1 });
VehicleSchema.index({ pucExpiry: 1 });

// Virtual for vehicle display name
VehicleSchema.virtual('displayName').get(function() {
  return `${this.make} ${this.model} (${this.licensePlate})`;
});

// Virtual to check if documents are expiring soon (within 30 days)
VehicleSchema.virtual('documentsExpiringSoon').get(function() {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  const expiring = [];
  
  if (this.insuranceExpiry && this.insuranceExpiry <= thirtyDaysFromNow) {
    expiring.push('insurance');
  }
  
  if (this.pucExpiry && this.pucExpiry <= thirtyDaysFromNow) {
    expiring.push('puc');
  }
  
  return expiring;
});

// Method to update vehicle rating
VehicleSchema.methods.updateRating = async function(newRating: number): Promise<void> {
  const totalRatings = this.totalRatings + 1;
  const currentTotal = this.averageRating * this.totalRatings;
  const newAverage = (currentTotal + newRating) / totalRatings;
  
  this.averageRating = Math.round(newAverage * 10) / 10; // Round to 1 decimal place
  this.totalRatings = totalRatings;
  
  await this.save();
};

// Method to check if vehicle is fully verified
VehicleSchema.methods.isVerified = function(): boolean {
  return this.status === VehicleStatus.ACTIVE &&
         this.registrationDocument &&
         this.insuranceDocument &&
         this.insuranceExpiry > new Date();
};

// Static method to find vehicles needing maintenance
VehicleSchema.statics.findVehiclesNeedingMaintenance = function() {
  return this.find({
    status: VehicleStatus.ACTIVE,
    $or: [
      { nextServiceDue: { $lte: new Date() } },
      { insuranceExpiry: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }, // 30 days
      { pucExpiry: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }
    ]
  });
};

export const Vehicle = mongoose.model('Vehicle', VehicleSchema);
