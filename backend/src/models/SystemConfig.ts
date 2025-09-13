import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemConfig extends Document {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  category: string;
  description: string;
  isPublic: boolean;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SystemConfigSchema = new Schema<ISystemConfig>({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: Schema.Types.Mixed,
    required: true
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['general', 'payment', 'notification', 'security', 'features', 'pricing', 'limits']
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
SystemConfigSchema.index({ category: 1, key: 1 });
SystemConfigSchema.index({ isPublic: 1 });

// Pre-save middleware to validate value type
SystemConfigSchema.pre('save', function(next) {
  const config = this as ISystemConfig;

  // Validate value type matches the specified type
  switch (config.type) {
    case 'string':
      if (typeof config.value !== 'string') {
        return next(new Error('Value must be a string'));
      }
      break;
    case 'number':
      if (typeof config.value !== 'number' || isNaN(config.value)) {
        return next(new Error('Value must be a valid number'));
      }
      break;
    case 'boolean':
      if (typeof config.value !== 'boolean') {
        return next(new Error('Value must be a boolean'));
      }
      break;
    case 'object':
      if (typeof config.value !== 'object' || Array.isArray(config.value)) {
        return next(new Error('Value must be an object'));
      }
      break;
    case 'array':
      if (!Array.isArray(config.value)) {
        return next(new Error('Value must be an array'));
      }
      break;
  }

  next();
});

export default mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);
