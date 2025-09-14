import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import SystemConfig from '../../models/SystemConfig';
import { ApiResponse } from '../../utils/apiResponse';

/**
 * Get the system configuration
 */
export const getSystemConfig = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const config = await SystemConfig.getConfig();

  if (!config) {
    ApiResponse.error(res, 'System configuration not found');
    return;
  }

  ApiResponse.success(res, config);
});

/**
 * Update system configuration
 */
export const updateSystemConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { app, pricing, notifications, security, features, geolocation, payment, api, backup, monitoring } = req.body;

  const updates: any = {};
  if (app !== undefined) updates.app = app;
  if (pricing !== undefined) updates.pricing = pricing;
  if (notifications !== undefined) updates.notifications = notifications;
  if (security !== undefined) updates.security = security;
  if (features !== undefined) updates.features = features;
  if (geolocation !== undefined) updates.geolocation = geolocation;
  if (payment !== undefined) updates.payment = payment;
  if (api !== undefined) updates.api = api;
  if (backup !== undefined) updates.backup = backup;
  if (monitoring !== undefined) updates.monitoring = monitoring;

  const config = await SystemConfig.updateConfig(updates, req.user?.id || req.admin?.id);

  ApiResponse.success(res, config);
});

/**
 * Get system configuration categories
 */
export const getConfigCategories = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const categories = [
    { value: 'app', label: 'Application Settings' },
    { value: 'pricing', label: 'Pricing Settings' },
    { value: 'notifications', label: 'Notification Settings' },
    { value: 'security', label: 'Security Settings' },
    { value: 'features', label: 'Feature Toggles' },
    { value: 'geolocation', label: 'Location Settings' },
    { value: 'payment', label: 'Payment Settings' },
    { value: 'api', label: 'API Settings' },
    { value: 'backup', label: 'Backup Settings' },
    { value: 'monitoring', label: 'Monitoring Settings' }
  ];

  ApiResponse.success(res, categories);
});

/**
 * Initialize default system configuration
 */
export const initializeDefaultConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const existingConfig = await SystemConfig.getConfig();

  if (existingConfig) {
    ApiResponse.error(res, 'System configuration already exists');
    return;
  }

  const defaultConfig = {
    app: {
      name: 'RideShare Pro',
      version: '1.0.0',
      description: 'Professional ride-sharing platform',
      maintenanceMode: false,
      registrationEnabled: true,
      supportEmail: 'support@rideshare.com',
      supportPhone: '+1-234-567-8900'
    },
    pricing: {
      baseFare: 5.0,
      perKmRate: 1.5,
      perMinuteRate: 0.25,
      bookingFee: 2.0,
      cancellationFee: 3.0,
      adminCommission: 15.0,
      currency: 'USD'
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      rideUpdates: true,
      promotionalMessages: false,
      driverNotifications: true
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordMinLength: 8,
      maxLoginAttempts: 5,
      requireEmailVerification: true
    },
    features: {
      rideScheduling: true,
      rideSharing: true,
      multipleStops: true,
      cashPayments: true,
      cardPayments: true,
      walletPayments: true,
      ratings: true,
      driverTracking: true
    },
    geolocation: {
      defaultLatitude: 12.9716,
      defaultLongitude: 77.5946,
      searchRadius: 5,
      maxPickupDistance: 2,
      defaultCountry: 'India',
      defaultCity: 'Bangalore'
    },
    payment: {
      stripeEnabled: true,
      razorpayEnabled: false,
      paypalEnabled: true,
      stripePublishableKey: 'pk_test_...',
      razorpayKeyId: '',
      paypalClientId: 'client_id_...',
      testMode: true
    },
    api: {
      rateLimitEnabled: true,
      maxRequestsPerMinute: 100,
      apiVersion: 'v1',
      corsEnabled: true,
      allowedOrigins: ['http://localhost:3000', 'https://yourapp.com']
    },
    backup: {
      autoBackupEnabled: true,
      backupFrequency: 'daily',
      retentionDays: 30,
      lastBackupDate: '2025-01-13T10:00:00Z',
      backupLocation: '/backups/database'
    },
    monitoring: {
      errorLoggingEnabled: true,
      performanceMonitoring: true,
      userActivityTracking: true,
      logRetentionDays: 90,
      alertEmail: 'admin@rideshare.com'
    }
  };

  const config = await SystemConfig.updateConfig(defaultConfig, req.user?.id || req.admin?.id);

  ApiResponse.success(res, {
    message: 'Default system configuration initialized successfully',
    config
  });
});

/**
 * Reset system configuration to defaults
 */
export const resetSystemConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const defaultConfig = {
    app: {
      name: 'RideShare Pro',
      version: '1.0.0',
      description: 'Professional ride-sharing platform',
      maintenanceMode: false,
      registrationEnabled: true,
      supportEmail: 'support@rideshare.com',
      supportPhone: '+1-234-567-8900'
    },
    pricing: {
      baseFare: 5.0,
      perKmRate: 1.5,
      perMinuteRate: 0.25,
      bookingFee: 2.0,
      cancellationFee: 3.0,
      adminCommission: 15.0,
      currency: 'USD'
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      rideUpdates: true,
      promotionalMessages: false,
      driverNotifications: true
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordMinLength: 8,
      maxLoginAttempts: 5,
      requireEmailVerification: true
    },
    features: {
      rideScheduling: true,
      rideSharing: true,
      multipleStops: true,
      cashPayments: true,
      cardPayments: true,
      walletPayments: true,
      ratings: true,
      driverTracking: true
    },
    geolocation: {
      defaultLatitude: 12.9716,
      defaultLongitude: 77.5946,
      searchRadius: 5,
      maxPickupDistance: 2,
      defaultCountry: 'India',
      defaultCity: 'Bangalore'
    },
    payment: {
      stripeEnabled: true,
      razorpayEnabled: false,
      paypalEnabled: true,
      stripePublishableKey: 'pk_test_...',
      razorpayKeyId: '',
      paypalClientId: 'client_id_...',
      testMode: true
    },
    api: {
      rateLimitEnabled: true,
      maxRequestsPerMinute: 100,
      apiVersion: 'v1',
      corsEnabled: true,
      allowedOrigins: ['http://localhost:3000', 'https://yourapp.com']
    },
    backup: {
      autoBackupEnabled: true,
      backupFrequency: 'daily',
      retentionDays: 30,
      lastBackupDate: '2025-01-13T10:00:00Z',
      backupLocation: '/backups/database'
    },
    monitoring: {
      errorLoggingEnabled: true,
      performanceMonitoring: true,
      userActivityTracking: true,
      logRetentionDays: 90,
      alertEmail: 'admin@rideshare.com'
    }
  };

  const config = await SystemConfig.updateConfig(defaultConfig, req.user?.id || req.admin?.id);

  ApiResponse.success(res, {
    message: 'System configuration reset to defaults successfully',
    config
  });
});

/**
 * Get public system configuration (limited fields)
 */
export const getPublicSystemConfig = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const config = await SystemConfig.getConfig();

  if (!config) {
    ApiResponse.error(res, 'System configuration not found');
    return;
  }

  // Return only public-safe configuration
  const publicConfig = {
    app: {
      name: config.app.name,
      version: config.app.version,
      description: config.app.description,
      maintenanceMode: config.app.maintenanceMode
    },
    pricing: {
      currency: config.pricing.currency
    },
    features: {
      rideScheduling: config.features.rideScheduling,
      rideSharing: config.features.rideSharing,
      ratings: config.features.ratings
    }
  };

  ApiResponse.success(res, publicConfig);
});

/**
 * Legacy functions for backward compatibility - these will be deprecated
 */
export const getSystemConfigs = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  ApiResponse.error(res, 'This endpoint is deprecated. Use /admin/settings instead.');
});

export const getSystemConfigByKey = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  ApiResponse.error(res, 'This endpoint is deprecated. Use /admin/settings instead.');
});

export const createSystemConfig = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  ApiResponse.error(res, 'This endpoint is deprecated. Use /admin/settings instead.');
});

export const updateSystemConfigByKey = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  ApiResponse.error(res, 'This endpoint is deprecated. Use /admin/settings instead.');
});

export const deleteSystemConfig = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  ApiResponse.error(res, 'This endpoint is deprecated. Use /admin/settings instead.');
});

export const bulkUpdateSystemConfigs = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  ApiResponse.error(res, 'This endpoint is deprecated. Use /admin/settings instead.');
});

export const getPublicSystemConfigs = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  ApiResponse.error(res, 'This endpoint is deprecated. Use /admin/settings instead.');
});

export const initializeDefaultConfigs = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  ApiResponse.error(res, 'This endpoint is deprecated. Use /admin/settings instead.');
});
