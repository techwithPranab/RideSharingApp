/**
 * Authentication controller
 * Handles user registration, login, OTP verification, and password management
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { validationResult } from 'express-validator';
const jwt = require('jsonwebtoken');

import { User, UserRole, UserStatus } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { sendOTP } from '../services/smsService';
import { emailService } from '../services/emailService';
import { logger } from '../utils/logger';

// Interface for request bodies
interface RegisterRequest extends Request {
  body: {
    phoneNumber: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    email?: string;
    referralCode?: string;
  };
}

interface LoginRequest extends Request {
  body: {
    phoneNumber: string;
    password?: string;
    otp?: string;
  };
}

interface VerifyOTPRequest extends Request {
  body: {
    phoneNumber: string;
    otp: string;
  };
}

// Store OTPs temporarily (in production, use Redis)
const otpStore: Map<string, { otp: string; expiresAt: Date; attempts: number }> = new Map();

/**
 * Generate JWT token
 */
const signToken = (userId: string, role: UserRole): string => {
  const secret = process.env.JWT_SECRET as string;
  const expiresIn = process.env.JWT_EXPIRES_IN as string;
  
  return jwt.sign(
    { userId, role },
    secret || 'fallback-secret',
    { expiresIn: expiresIn || '7d' }
  );
};

/**
 * Generate and send OTP
 */
const generateAndSendOTP = async (phoneNumber: string): Promise<void> => {
  // Generate 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  
  // Store OTP with 5-minute expiry
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5);
  
  otpStore.set(phoneNumber, {
    otp,
    expiresAt,
    attempts: 0
  });
  
  // Send OTP via SMS
  await sendOTP(phoneNumber, otp);
  
  logger.info(`OTP sent to ${phoneNumber}: ${otp}`); // Remove in production
};

/**
 * Verify OTP
 */
const verifyOTP = (phoneNumber: string, inputOTP: string): boolean => {
  const stored = otpStore.get(phoneNumber);
  
  if (!stored) {
    return false;
  }
  
  // Check expiry
  if (new Date() > stored.expiresAt) {
    otpStore.delete(phoneNumber);
    return false;
  }
  
  // Check attempts limit
  if (stored.attempts >= 3) {
    otpStore.delete(phoneNumber);
    return false;
  }
  
  // Verify OTP
  if (stored.otp !== inputOTP) {
    stored.attempts++;
    return false;
  }
  
  // OTP verified, remove from store
  otpStore.delete(phoneNumber);
  return true;
};

/**
 * Register new user
 */
export const register = async (req: RegisterRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400));
    }
    
    const { phoneNumber, firstName, lastName, role, email, referralCode } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return next(new AppError('User with this phone number already exists', 400));
    }
    
    // Check referral code if provided
    let referredBy;
    if (referralCode) {
      referredBy = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (!referredBy) {
        return next(new AppError('Invalid referral code', 400));
      }
    }
    
    // Generate unique referral code for new user
    const newReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    // Create user
    const user = await User.create({
      phoneNumber,
      firstName,
      lastName,
      role,
      email,
      referralCode: newReferralCode,
      referredBy: referredBy?._id,
      status: UserStatus.PENDING_VERIFICATION,
      isPhoneVerified: false
    });
    
    // Generate and send OTP
    await generateAndSendOTP(phoneNumber);
    
    // Send welcome email if email is provided
    if (email) {
      try {
        await emailService.sendWelcomeEmail(email, `${firstName} ${lastName}`);
        logger.info(`Welcome email sent to ${email}`);
      } catch (emailError) {
        logger.error('Failed to send welcome email:', emailError);
        // Don't fail registration if email fails
      }
    }
    
    logger.info(`New user registered: ${user.phoneNumber} (${user.role})`);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your phone number.',
      data: {
        userId: user._id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        referralCode: user.referralCode
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    return next(new AppError('Registration failed', 500));
  }
};

/**
 * Login user with phone number and OTP
 */
export const login = async (req: LoginRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400));
    }
    
    const { phoneNumber, password, otp } = req.body;
    
    // Find user
    const user = await User.findOne({ phoneNumber }).select('+password');
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // Check if user is active
    if (user.status === UserStatus.SUSPENDED) {
      return next(new AppError('Your account has been suspended. Please contact support', 403));
    }
    
    let isAuthenticated = false;
    
    // Authentication with password (if provided)
    if (password && user.password) {
      isAuthenticated = await user.comparePassword(password);
    }
    
    // Authentication with OTP (if provided)
    if (otp) {
      isAuthenticated = verifyOTP(phoneNumber, otp);
    }
    
    if (!isAuthenticated) {
      return next(new AppError('Invalid credentials', 401));
    }
    
    // Update user status and last active
    user.status = UserStatus.ACTIVE;
    user.isPhoneVerified = true;
    user.lastActiveAt = new Date();
    await user.save();
    
    // Generate JWT token
    const token = signToken(user._id.toString(), user.role);
    
    logger.info(`User logged in: ${user.phoneNumber}`);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.status,
          isPhoneVerified: user.isPhoneVerified,
          isEmailVerified: user.isEmailVerified,
          averageRating: user.averageRating,
          kycStatus: user.kycStatus
        },
        token
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    return next(new AppError('Login failed', 500));
  }
};

/**
 * Send OTP for phone verification or login
 */
export const sendLoginOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return next(new AppError('Phone number is required', 400));
    }
    
    // Check if user exists
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // Generate and send OTP
    await generateAndSendOTP(phoneNumber);
    
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    logger.error('Send OTP error:', error);
    return next(new AppError('Failed to send OTP', 500));
  }
};

/**
 * Verify phone number with OTP
 */
export const verifyPhoneNumber = async (req: VerifyOTPRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { phoneNumber, otp } = req.body;
    
    if (!phoneNumber || !otp) {
      return next(new AppError('Phone number and OTP are required', 400));
    }
    
    // Verify OTP
    const isValid = verifyOTP(phoneNumber, otp);
    if (!isValid) {
      return next(new AppError('Invalid or expired OTP', 400));
    }
    
    // Update user verification status
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    user.isPhoneVerified = true;
    user.status = UserStatus.ACTIVE;
    await user.save();
    
    // Generate JWT token
    const token = signToken(user._id.toString(), user.role);
    
    logger.info(`Phone verified for user: ${user.phoneNumber}`);
    
    res.status(200).json({
      success: true,
      message: 'Phone number verified successfully',
      data: {
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isPhoneVerified: user.isPhoneVerified
        },
        token
      }
    });
  } catch (error) {
    logger.error('Phone verification error:', error);
    return next(new AppError('Phone verification failed', 500));
  }
};

/**
 * Get current user profile
 */
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }
    
    const user = await User.findById(req.user._id)
      .populate('vehicleIds', 'make model licensePlate type status');
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    return next(new AppError('Failed to fetch profile', 500));
  }
};

/**
 * Logout user (client should delete token)
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  // Update last active time
  if (req.user) {
    req.user.lastActiveAt = new Date();
    await req.user.save();
  }
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

/**
 * Send email verification
 */
export const sendEmailVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Email is required', 400));
    }

    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Update user with verification token
    req.user.emailVerificationToken = verificationToken;
    req.user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await req.user.save();

    // Send verification email
    await emailService.sendEmailVerification(
      email,
      `${req.user.firstName} ${req.user.lastName}`,
      verificationToken
    );

    logger.info(`Email verification sent to ${email}`);

    res.status(200).json({
      success: true,
      message: 'Email verification sent successfully'
    });
  } catch (error) {
    logger.error('Send email verification error:', error);
    return next(new AppError('Failed to send email verification', 500));
  }
};

/**
 * Verify email with token
 */
export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      return next(new AppError('Verification token is required', 400));
    }

    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    // Check if token matches and hasn't expired
    if (req.user.emailVerificationToken !== token) {
      return next(new AppError('Invalid verification token', 400));
    }

    if (!req.user.emailVerificationExpires || req.user.emailVerificationExpires < new Date()) {
      return next(new AppError('Verification token has expired', 400));
    }

    // Update user verification status
    req.user.isEmailVerified = true;
    req.user.emailVerificationToken = undefined;
    req.user.emailVerificationExpires = undefined;
    await req.user.save();

    logger.info(`Email verified for user: ${req.user.phoneNumber}`);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    logger.error('Email verification error:', error);
    return next(new AppError('Email verification failed', 500));
  }
};

/**
 * Refresh token
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    // Generate new token
    const token = signToken(req.user._id.toString(), req.user.role);

    res.status(200).json({
      success: true,
      data: {
        token
      }
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    return next(new AppError('Token refresh failed', 500));
  }
};
