import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISystemConfig extends Document {
  // Application Settings
  app: {
    name: string;
    version: string;
    description: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    supportEmail: string;
    supportPhone: string;
  };

  // Pricing Settings
  pricing: {
    baseFare: number;
    perKmRate: number;
    perMinuteRate: number;
    bookingFee: number;
    cancellationFee: number;
    adminCommission: number;
    currency: string;
  };

  // Notification Settings
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    rideUpdates: boolean;
    promotionalMessages: boolean;
    driverNotifications: boolean;
  };

  // Security Settings
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordMinLength: number;
    maxLoginAttempts: number;
    requireEmailVerification: boolean;
  };

  // Feature Settings
  features: {
    rideScheduling: boolean;
    rideSharing: boolean;
    multipleStops: boolean;
    cashPayments: boolean;
    cardPayments: boolean;
    walletPayments: boolean;
    ratings: boolean;
    driverTracking: boolean;
  };

  // Geolocation Settings
  geolocation: {
    defaultLatitude: number;
    defaultLongitude: number;
    searchRadius: number;
    maxPickupDistance: number;
    defaultCountry: string;
    defaultCity: string;
  };

  // Payment Gateway Settings
  payment: {
    stripeEnabled: boolean;
    razorpayEnabled: boolean;
    paypalEnabled: boolean;
    stripePublishableKey: string;
    razorpayKeyId: string;
    paypalClientId: string;
    testMode: boolean;
  };

  // API Settings
  api: {
    rateLimitEnabled: boolean;
    maxRequestsPerMinute: number;
    apiVersion: string;
    corsEnabled: boolean;
    allowedOrigins: string[];
  };

  // Backup Settings
  backup: {
    autoBackupEnabled: boolean;
    backupFrequency: string;
    retentionDays: number;
    lastBackupDate: string;
    backupLocation: string;
  };

  // Monitoring Settings
  monitoring: {
    errorLoggingEnabled: boolean;
    performanceMonitoring: boolean;
    userActivityTracking: boolean;
    logRetentionDays: number;
    alertEmail: string;
  };

  // Metadata
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Static methods interface
interface ISystemConfigModel extends Model<ISystemConfig> {
  getConfig(): Promise<ISystemConfig | null>;
  updateConfig(updates: Partial<ISystemConfig>, updatedBy: mongoose.Types.ObjectId): Promise<ISystemConfig>;
}

const SystemConfigSchema = new Schema<ISystemConfig>({
  // Application Settings
  app: {
    name: { type: String, required: true, default: 'RideShare Pro' },
    version: { type: String, required: true, default: '1.0.0' },
    description: { type: String, required: true, default: 'Professional ride-sharing platform' },
    maintenanceMode: { type: Boolean, default: false },
    registrationEnabled: { type: Boolean, default: true },
    supportEmail: { type: String, required: true, default: 'support@rideshare.com' },
    supportPhone: { type: String, required: true, default: '+1-234-567-8900' }
  },

  // Pricing Settings
  pricing: {
    baseFare: { type: Number, required: true, default: 5.0, min: 0 },
    perKmRate: { type: Number, required: true, default: 1.5, min: 0 },
    perMinuteRate: { type: Number, required: true, default: 0.25, min: 0 },
    bookingFee: { type: Number, required: true, default: 2.0, min: 0 },
    cancellationFee: { type: Number, required: true, default: 3.0, min: 0 },
    adminCommission: { type: Number, required: true, default: 15.0, min: 0, max: 100 },
    currency: { type: String, required: true, default: 'USD', enum: ['USD', 'EUR', 'GBP', 'INR', 'JPY'] }
  },

  // Notification Settings
  notifications: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    rideUpdates: { type: Boolean, default: true },
    promotionalMessages: { type: Boolean, default: false },
    driverNotifications: { type: Boolean, default: true }
  },

  // Security Settings
  security: {
    twoFactorAuth: { type: Boolean, default: false },
    sessionTimeout: { type: Number, required: true, default: 30, min: 5, max: 480 },
    passwordMinLength: { type: Number, required: true, default: 8, min: 6, max: 32 },
    maxLoginAttempts: { type: Number, required: true, default: 5, min: 3, max: 20 },
    requireEmailVerification: { type: Boolean, default: true }
  },

  // Feature Settings
  features: {
    rideScheduling: { type: Boolean, default: true },
    rideSharing: { type: Boolean, default: true },
    multipleStops: { type: Boolean, default: true },
    cashPayments: { type: Boolean, default: true },
    cardPayments: { type: Boolean, default: true },
    walletPayments: { type: Boolean, default: true },
    ratings: { type: Boolean, default: true },
    driverTracking: { type: Boolean, default: true }
  },

  // Geolocation Settings
  geolocation: {
    defaultLatitude: { type: Number, required: true, default: 12.9716 },
    defaultLongitude: { type: Number, required: true, default: 77.5946 },
    searchRadius: { type: Number, required: true, default: 5, min: 1, max: 50 },
    maxPickupDistance: { type: Number, required: true, default: 2, min: 0.5, max: 10 },
    defaultCountry: { type: String, required: true, default: 'India' },
    defaultCity: { type: String, required: true, default: 'Bangalore' }
  },

  // Payment Gateway Settings
  payment: {
    stripeEnabled: { type: Boolean, default: true },
    razorpayEnabled: { type: Boolean, default: false },
    paypalEnabled: { type: Boolean, default: true },
    stripePublishableKey: { type: String, default: '' },
    razorpayKeyId: { type: String, default: '' },
    paypalClientId: { type: String, default: '' },
    testMode: { type: Boolean, default: true }
  },

  // API Settings
  api: {
    rateLimitEnabled: { type: Boolean, default: true },
    maxRequestsPerMinute: { type: Number, required: true, default: 100, min: 10, max: 1000 },
    apiVersion: { type: String, required: true, default: 'v1' },
    corsEnabled: { type: Boolean, default: true },
    allowedOrigins: [{ type: String }]
  },

  // Backup Settings
  backup: {
    autoBackupEnabled: { type: Boolean, default: true },
    backupFrequency: { type: String, required: true, default: 'daily', enum: ['hourly', 'daily', 'weekly', 'monthly'] },
    retentionDays: { type: Number, required: true, default: 30, min: 1, max: 365 },
    lastBackupDate: { type: String, default: '' },
    backupLocation: { type: String, required: true, default: '/backups/database' }
  },

  // Monitoring Settings
  monitoring: {
    errorLoggingEnabled: { type: Boolean, default: true },
    performanceMonitoring: { type: Boolean, default: true },
    userActivityTracking: { type: Boolean, default: true },
    logRetentionDays: { type: Number, required: true, default: 90, min: 7, max: 365 },
    alertEmail: { type: String, required: true, default: 'admin@rideshare.com' }
  },

  // Metadata
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Ensure only one system config document exists
SystemConfigSchema.pre('save', async function(next) {
  const SystemConfig = mongoose.model('SystemConfig');

  // Check if this is an update or new document
  if (this.isNew) {
    const existing = await SystemConfig.findOne();
    if (existing) {
      return next(new Error('Only one system configuration document is allowed'));
    }
  }

  next();
});

// Static method to get the system configuration
SystemConfigSchema.statics.getConfig = async function(): Promise<ISystemConfig | null> {
  return this.findOne().populate('updatedBy', 'firstName lastName email');
};

// Static method to update configuration
SystemConfigSchema.statics.updateConfig = async function(
  updates: Partial<ISystemConfig>,
  updatedBy: mongoose.Types.ObjectId
): Promise<ISystemConfig> {
  const config = await this.findOneAndUpdate(
    {},
    { ...updates, updatedBy },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  ).populate('updatedBy', 'firstName lastName email');

  return config;
};

export default mongoose.model<ISystemConfig, ISystemConfigModel>('SystemConfig', SystemConfigSchema);
