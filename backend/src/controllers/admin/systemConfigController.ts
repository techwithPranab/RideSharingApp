import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import SystemConfig from '../../models/SystemConfig';
import { ApiResponse } from '../../utils/apiResponse';

/**
 * Get all system configurations
 */
export const getSystemConfigs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { category, isPublic } = req.query;

  let filter: any = {};

  if (category && category !== 'all') {
    filter.category = category;
  }

  if (isPublic !== undefined) {
    filter.isPublic = isPublic === 'true';
  }

  const configs = await SystemConfig.find(filter)
    .populate('updatedBy', 'firstName lastName email')
    .sort({ category: 1, key: 1 });

  ApiResponse.success(res, {
    configs,
    total: configs.length
  });
});

/**
 * Get system configuration by key
 */
export const getSystemConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { key } = req.params;

  const config = await SystemConfig.findOne({ key })
    .populate('updatedBy', 'firstName lastName email');

  if (!config) {
    ApiResponse.error(res, 'System configuration not found');
    return;
  }

  ApiResponse.success(res, config);
});

/**
 * Create new system configuration
 */
export const createSystemConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { key, value, type, category, description, isPublic } = req.body;

  // Check if configuration already exists
  const existingConfig = await SystemConfig.findOne({ key });
  if (existingConfig) {
    ApiResponse.error(res, 'System configuration with this key already exists');
    return;
  }

  const config = await SystemConfig.create({
    key,
    value,
    type,
    category,
    description,
    isPublic: isPublic || false,
    updatedBy: req.user?.id || req.admin?.id
  });

  await config.populate('updatedBy', 'firstName lastName email');

  ApiResponse.success(res, config);
});

/**
 * Update system configuration
 */
export const updateSystemConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { key } = req.params;
  const { value, type, category, description, isPublic } = req.body;

  const config = await SystemConfig.findOne({ key });

  if (!config) {
    ApiResponse.error(res, 'System configuration not found');
    return;
  }

  // Update fields
  if (value !== undefined) config.value = value;
  if (type !== undefined) config.type = type;
  if (category !== undefined) config.category = category;
  if (description !== undefined) config.description = description;
  if (isPublic !== undefined) config.isPublic = isPublic;
  config.updatedBy = req.user?.id || req.admin?.id;

  await config.save();
  await config.populate('updatedBy', 'firstName lastName email');

  ApiResponse.success(res, config);
});

/**
 * Delete system configuration
 */
export const deleteSystemConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { key } = req.params;

  const config = await SystemConfig.findOneAndDelete({ key });

  if (!config) {
    ApiResponse.error(res, 'System configuration not found');
    return;
  }

  ApiResponse.success(res, 'System configuration deleted successfully');
});

/**
 * Bulk update system configurations
 */
export const bulkUpdateSystemConfigs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { configs } = req.body;

  if (!Array.isArray(configs)) {
    ApiResponse.error(res, 'Configs must be an array');
    return;
  }

  const results: any[] = [];
  const errors: any[] = [];

  for (const configData of configs) {
    try {
      const { key, value, type, category, description, isPublic } = configData;

      const updateData: any = { updatedBy: req.user?.id || req.admin?.id };
      if (value !== undefined) updateData.value = value;
      if (type !== undefined) updateData.type = type;
      if (category !== undefined) updateData.category = category;
      if (description !== undefined) updateData.description = description;
      if (isPublic !== undefined) updateData.isPublic = isPublic;

      const config = await SystemConfig.findOneAndUpdate(
        { key },
        updateData,
        {
          new: true,
          upsert: true,
          runValidators: true
        }
      ).populate('updatedBy', 'firstName lastName email');

      results.push(config);
    } catch (error: any) {
      errors.push({
        key: configData.key,
        error: error.message
      });
    }
  }

  ApiResponse.success(res, {
    updated: results.length,
    errors: errors.length > 0 ? errors : undefined,
    configs: results
  });
});

/**
 * Get public system configurations
 */
export const getPublicSystemConfigs = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const configs = await SystemConfig.find({ isPublic: true })
    .select('key value type category description')
    .sort({ category: 1, key: 1 });

  // Transform to key-value pairs for easier client consumption
  const configMap: { [key: string]: any } = {};
  configs.forEach((config: any) => {
    configMap[config.key] = config.value;
  });

  ApiResponse.success(res, {
    configs: configMap,
    total: configs.length
  });
});

/**
 * Get system configuration categories
 */
export const getConfigCategories = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const categories = [
    { value: 'general', label: 'General Settings' },
    { value: 'payment', label: 'Payment Settings' },
    { value: 'notification', label: 'Notification Settings' },
    { value: 'security', label: 'Security Settings' },
    { value: 'features', label: 'Feature Toggles' },
    { value: 'pricing', label: 'Pricing Settings' },
    { value: 'limits', label: 'System Limits' }
  ];

  ApiResponse.success(res, categories);
});

/**
 * Initialize default system configurations
 */
export const initializeDefaultConfigs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const defaultConfigs = [
    // General Settings
    {
      key: 'app_name',
      value: 'RideShare Pro',
      type: 'string',
      category: 'general',
      description: 'Application name displayed throughout the system',
      isPublic: true
    },
    {
      key: 'app_version',
      value: '1.0.0',
      type: 'string',
      category: 'general',
      description: 'Current application version',
      isPublic: true
    },
    {
      key: 'maintenance_mode',
      value: false,
      type: 'boolean',
      category: 'general',
      description: 'Enable maintenance mode to disable user access',
      isPublic: true
    },

    // Payment Settings
    {
      key: 'platform_commission_rate',
      value: 0.15,
      type: 'number',
      category: 'payment',
      description: 'Platform commission rate as decimal (0.15 = 15%)',
      isPublic: false
    },
    {
      key: 'minimum_fare',
      value: 5.00,
      type: 'number',
      category: 'payment',
      description: 'Minimum fare amount for rides',
      isPublic: true
    },
    {
      key: 'currency',
      value: 'USD',
      type: 'string',
      category: 'payment',
      description: 'Default currency for transactions',
      isPublic: true
    },

    // Notification Settings
    {
      key: 'email_notifications_enabled',
      value: true,
      type: 'boolean',
      category: 'notification',
      description: 'Enable email notifications system-wide',
      isPublic: false
    },
    {
      key: 'sms_notifications_enabled',
      value: true,
      type: 'boolean',
      category: 'notification',
      description: 'Enable SMS notifications system-wide',
      isPublic: false
    },
    {
      key: 'push_notifications_enabled',
      value: true,
      type: 'boolean',
      category: 'notification',
      description: 'Enable push notifications system-wide',
      isPublic: false
    },

    // Security Settings
    {
      key: 'session_timeout',
      value: 3600000,
      type: 'number',
      category: 'security',
      description: 'Session timeout in milliseconds (1 hour = 3600000)',
      isPublic: false
    },
    {
      key: 'max_login_attempts',
      value: 5,
      type: 'number',
      category: 'security',
      description: 'Maximum login attempts before account lockout',
      isPublic: false
    },
    {
      key: 'password_min_length',
      value: 8,
      type: 'number',
      category: 'security',
      description: 'Minimum password length requirement',
      isPublic: true
    },

    // Feature Toggles
    {
      key: 'pooled_rides_enabled',
      value: true,
      type: 'boolean',
      category: 'features',
      description: 'Enable pooled rides feature',
      isPublic: true
    },
    {
      key: 'subscription_enabled',
      value: true,
      type: 'boolean',
      category: 'features',
      description: 'Enable subscription features',
      isPublic: true
    },
    {
      key: 'driver_rating_enabled',
      value: true,
      type: 'boolean',
      category: 'features',
      description: 'Enable driver rating system',
      isPublic: true
    },

    // Pricing Settings
    {
      key: 'base_fare',
      value: 2.50,
      type: 'number',
      category: 'pricing',
      description: 'Base fare amount',
      isPublic: true
    },
    {
      key: 'per_mile_rate',
      value: 1.25,
      type: 'number',
      category: 'pricing',
      description: 'Rate per mile',
      isPublic: true
    },
    {
      key: 'per_minute_rate',
      value: 0.20,
      type: 'number',
      category: 'pricing',
      description: 'Rate per minute',
      isPublic: true
    },

    // System Limits
    {
      key: 'max_ride_distance',
      value: 500,
      type: 'number',
      category: 'limits',
      description: 'Maximum ride distance in miles',
      isPublic: true
    },
    {
      key: 'max_ride_duration',
      value: 180,
      type: 'number',
      category: 'limits',
      description: 'Maximum ride duration in minutes',
      isPublic: true
    },
    {
      key: 'max_passengers_per_ride',
      value: 4,
      type: 'number',
      category: 'limits',
      description: 'Maximum passengers per ride',
      isPublic: true
    }
  ];

  const results = [];
  const skipped = [];

  for (const configData of defaultConfigs) {
    try {
      const existing = await SystemConfig.findOne({ key: configData.key });
      if (!existing) {
        const config = await SystemConfig.create({
          ...configData,
          updatedBy: req.user?.id || req.admin?.id
        });
        results.push(config);
      } else {
        skipped.push(configData.key);
      }
    } catch (error: any) {
      console.error(`Error creating config ${configData.key}:`, error.message);
    }
  }

  ApiResponse.success(res, {
    created: results.length,
    skipped: skipped.length,
    total: results.length + skipped.length
  });
});
