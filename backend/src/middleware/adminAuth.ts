/**
 * Admin authentication middleware
 * Handles admin-specific authentication and authorization
 */

import { Request, Response, NextFunction } from 'express';
import { User, UserRole, UserStatus } from '../models/User';
import { AppError } from './errorHandler';
const jwt = require('jsonwebtoken');

// Extend Request interface to include admin user
declare global {
  namespace Express {
    interface Request {
      admin?: any;
    }
  }
}

// Interface for JWT payload
interface JWTPayload {
  userId: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/**
 * Admin authentication middleware
 * Requires valid JWT token and admin role
 */
export const requireAdmin = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1) Get token from header
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Admin access required. Please log in as an administrator', 401));
    }

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as JWTPayload;

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.userId).select('+password');
    if (!currentUser) {
      return next(new AppError('The admin user belonging to this token no longer exists', 401));
    }

    // 4) Check if user is active
    if (currentUser.status !== 'active') {
      return next(new AppError('Your admin account is not active. Please contact system administrator', 401));
    }

    // 5) Check if user has admin role
    if (currentUser.role !== UserRole.ADMIN) {
      return next(new AppError('Admin access required. Insufficient permissions', 403));
    }

    // Grant access to admin route
    req.admin = currentUser;
    req.user = currentUser; // Also set req.user for compatibility with existing middleware
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid admin token. Please log in again', 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Your admin token has expired. Please log in again', 401));
    }
    return next(new AppError('Admin authentication failed', 401));
  }
};

/**
 * Super admin middleware
 * For highly sensitive operations (system settings, user deletion, etc.)
 */
export const requireSuperAdmin = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.admin) {
      return next(new AppError('Super admin authentication required', 401));
    }

    // Check for super admin flag (you can add this to User model)
    if (!req.admin.isSuperAdmin) {
      return next(new AppError('Super admin privileges required for this operation', 403));
    }

    next();
  } catch (error) {
    console.error('Super admin verification error:', error);
    return next(new AppError('Super admin verification failed', 500));
  }
};

/**
 * Admin activity logging middleware
 * Logs all admin actions for audit purposes
 */
export const logAdminActivity = (action: string) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.admin) {
        const AdminActivity = require('../models/AdminActivity').AdminActivity;

        // Log the admin activity
        await AdminActivity.create({
          adminId: req.admin._id,
          action,
          resource: req.originalUrl,
          method: req.method,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date(),
          details: {
            query: req.query,
            body: req.method !== 'GET' ? req.body : undefined,
            params: req.params
          }
        });
      }

      next();
    } catch (error) {
      // Don't fail the request if logging fails, just log the error
      console.error('Admin activity logging failed:', error);
      next();
    }
  };
};

/**
 * Admin rate limiting middleware
 * Prevents admin abuse with stricter rate limits
 */
export const adminRateLimit = (_req: Request, _res: Response, next: NextFunction): void => {
  // Implement rate limiting logic here
  // For now, just pass through
  next();
};

/**
 * Admin session validation
 * Ensures admin sessions are valid and not expired
 */
export const validateAdminSession = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.admin) {
      return next(new AppError('Admin session validation failed', 401));
    }

    // Check if admin account is still active and hasn't been suspended
    const adminUser = await User.findById(req.admin._id);
    if (!adminUser) {
      return next(new AppError('Admin account not found', 401));
    }

    // Check if admin is suspended
    if (adminUser.status === UserStatus.SUSPENDED) {
      return next(new AppError('Admin account is suspended. Please contact system administrator', 403));
    }

    // Check if admin account is active
    if (adminUser.status !== UserStatus.ACTIVE) {
      return next(new AppError('Admin account is not active', 401));
    }

    // Additional admin-specific validations can be added here
    // e.g., check for admin role expiration, IP restrictions, etc.

    next();
  } catch (error) {
    console.error('Admin session validation error:', error);
    return next(new AppError('Admin session validation failed', 500));
  }
};
