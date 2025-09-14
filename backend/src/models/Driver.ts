import mongoose, { Schema, Document } from 'mongoose';

interface IDriver extends Document {
  userId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  dateOfBirth: Date;
  licenseNumber: string;
  licenseExpiry: Date;
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    color: string;
    plateNumber: string;
    registrationNumber: string;
  };
  documents: {
    license: string;
    registration: string;
    insurance: string;
    profilePhoto: string;
    vehiclePhoto: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  submissionDate: Date;
  reviewDate?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  notes?: string;
  rating?: number;
  completedRides: number;
  backgroundCheckStatus: 'pending' | 'cleared' | 'failed';
  isActive: boolean;
  isOnline: boolean;
  currentLocation?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  earnings: {
    total: number;
    thisMonth: number;
    thisWeek: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  zipCode: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  licenseExpiry: {
    type: Date,
    required: true
  },
  vehicleInfo: {
    make: {
      type: String,
      required: true,
      trim: true
    },
    model: {
      type: String,
      required: true,
      trim: true
    },
    year: {
      type: Number,
      required: true,
      min: 1990,
      max: new Date().getFullYear() + 1
    },
    color: {
      type: String,
      required: true,
      trim: true
    },
    plateNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    registrationNumber: {
      type: String,
      required: true,
      trim: true
    }
  },
  documents: {
    license: {
      type: String,
      required: true
    },
    registration: {
      type: String,
      required: true
    },
    insurance: {
      type: String,
      required: true
    },
    profilePhoto: {
      type: String,
      required: true
    },
    vehiclePhoto: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  reviewDate: {
    type: Date
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  completedRides: {
    type: Number,
    default: 0
  },
  backgroundCheckStatus: {
    type: String,
    enum: ['pending', 'cleared', 'failed'],
    default: 'pending'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  earnings: {
    total: {
      type: Number,
      default: 0
    },
    thisMonth: {
      type: Number,
      default: 0
    },
    thisWeek: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
DriverSchema.index({ userId: 1 });
DriverSchema.index({ status: 1 });
DriverSchema.index({ email: 1 });
DriverSchema.index({ licenseNumber: 1 });
DriverSchema.index({ 'vehicleInfo.plateNumber': 1 });
DriverSchema.index({ currentLocation: '2dsphere' });
DriverSchema.index({ createdAt: -1 });
DriverSchema.index({ rating: -1 });

// Virtual for full name
DriverSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Method to calculate age
DriverSchema.methods.calculateAge = function(): number {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Method to check if license is expired
DriverSchema.methods.isLicenseExpired = function(): boolean {
  return new Date() > this.licenseExpiry;
};

// Static method to find drivers by status
DriverSchema.statics.findByStatus = function(status: string) {
  return this.find({ status });
};

// Static method to find nearby drivers
DriverSchema.statics.findNearby = function(longitude: number, latitude: number, maxDistance: number = 5000) {
  return this.find({
    currentLocation: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    status: 'approved',
    isActive: true,
    isOnline: true
  });
};

// Pre-save middleware
DriverSchema.pre('save', function(next) {
  // Ensure plate number is uppercase
  if (this.vehicleInfo?.plateNumber) {
    this.vehicleInfo.plateNumber = this.vehicleInfo.plateNumber.toUpperCase();
  }
  
  // Ensure email is lowercase
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  
  next();
});

// Pre-validate middleware
DriverSchema.pre('validate', function(next) {
  // Check if license is not expired
  if (this.licenseExpiry && this.licenseExpiry <= new Date()) {
    return next(new Error('Driver license has expired'));
  }
  
  // Check minimum age (18 years)
  if (this.dateOfBirth && this.calculateAge() < 18) {
    return next(new Error('Driver must be at least 18 years old'));
  }
  
  next();
});

export default mongoose.model<IDriver>('Driver', DriverSchema);
