/**
 * Authentication middleware
 * Handles JWT token verification and user authentication
 */

import { Request, Response, NextFunction } from 'express';
import { User, UserRole } from '../models/User';
import { AppError } from './errorHandler';
const jwt = require('jsonwebtoken');

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
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
 * Protect routes - requires valid JWT token
 */
export const protect = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1) Get token from header
    let token: string | undefined;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access', 401));
    }

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as JWTPayload;

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.userId).select('+password');
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists', 401));
    }

    // 4) Check if user is active
    if (currentUser.status !== 'active') {
      return next(new AppError('Your account is not active. Please contact support', 401));
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token. Please log in again', 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Your token has expired. Please log in again', 401));
    }
    return next(new AppError('Authentication failed', 401));
  }
};

/**
 * Restrict to specific roles
 */
export const restrictTo = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as JWTPayload;
      const currentUser = await User.findById(decoded.userId);
      
      if (currentUser && currentUser.status === 'active') {
        req.user = currentUser;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional routes
    next();
  }
};

/**
 * Verify phone number ownership
 * Used for sensitive operations like changing phone number, password reset
 */
export const verifyPhoneOwnership = (req: Request, _res: Response, next: NextFunction): void => {
  const { phoneNumber } = req.body;
  
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }
  
  if (req.user.phoneNumber !== phoneNumber) {
    return next(new AppError('Phone number does not match your account', 403));
  }
  
  next();
};

/**
 * Check if driver is verified and has active vehicle
 */
export const requireVerifiedDriver = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    
    if (req.user.role !== UserRole.DRIVER) {
      return next(new AppError('Driver access required', 403));
    }
    
    if (req.user.kycStatus !== 'approved') {
      return next(new AppError('Driver verification pending. Please complete KYC', 403));
    }
    
    // Check if driver has at least one active vehicle
    const Vehicle = require('../models/Vehicle').Vehicle;
    const activeVehicle = await Vehicle.findOne({
      driverId: req.user._id,
      status: 'active'
    });
    
    if (!activeVehicle) {
      return next(new AppError('No active vehicle found. Please add and verify a vehicle', 403));
    }
    
    next();
  } catch (error) {
    return next(new AppError('Driver verification failed', 500));
  }
};
