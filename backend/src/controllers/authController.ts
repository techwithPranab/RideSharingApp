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
import { emailService } from '../services/emailService';
import { logger } from '../utils/logger';

// Interface for request bodies
interface RegisterRequest extends Request {
  body: {
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    phoneNumber?: string;
    referralCode?: string;
    password?: string;
  };
}

interface LoginRequest extends Request {
  body: {
    email: string;
    password?: string;
    otp?: string;
  };
}

interface AdminLoginRequest extends Request {
  body: {
    email: string;
    password: string;
    role?: UserRole;
  };
}

interface VerifyOTPRequest extends Request {
  body: {
    email: string;
    otp: string;
  };
}
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
 * Generate and send OTP via email
 */
const generateAndSendOTP = async (email: string, firstName: string): Promise<void> => {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store OTP with 5-minute expiry
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5);
  
  otpStore.set(email, {
    otp,
    expiresAt,
    attempts: 0
  });
  
  // Send OTP via email
  await emailService.sendOTPEmail(email, firstName, otp);
  
  logger.info(`OTP sent to ${email}: ${otp}`); // Remove in production
};

/**
 * Verify OTP
 */
const verifyOTP = (email: string, inputOTP: string): boolean => {
  const stored = otpStore.get(email);
  
  if (!stored) {
    return false;
  }
  
  // Check expiry
  if (new Date() > stored.expiresAt) {
    otpStore.delete(email);
    return false;
  }
  
  // Check attempts limit
  if (stored.attempts >= 3) {
    otpStore.delete(email);
    return false;
  }
  
  // Verify OTP
  if (stored.otp !== inputOTP) {
    stored.attempts++;
    return false;
  }
  
  // OTP verified, remove from store
  otpStore.delete(email);
  return true;
};

/**
 * Register new user
 */
export const register = async (req: RegisterRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check validation errors
    console.log('Inside register');
    console.log('Request body:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400));
    }
    
    const { phoneNumber, firstName, lastName, role, email, referralCode, password } = req.body;
    
    // Validate required fields
    if (!email) {
      return next(new AppError('Email is required', 400));
    }
    
    // Check if user already exists by email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(new AppError('User with this email already exists', 400));
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
    const userData: any = {
      phoneNumber: phoneNumber || undefined,
      firstName,
      lastName,
      role,
      email: email.toLowerCase(),
      referralCode: newReferralCode,
      referredBy: referredBy?._id,
      status: UserStatus.PENDING_VERIFICATION,
      isPhoneVerified: false,
      isEmailVerified: false
    };

    // Add password if provided
    if (password) {
      userData.password = password;
    }

    const user = await User.create(userData);
    
    // Generate and send OTP
    await generateAndSendOTP(email, `${firstName} ${lastName}`);
    
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
      message: 'User registered successfully. Please verify your email.',
      data: {
        userId: user._id,
        email: user.email,
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
    
    const { email, password, otp } = req.body;
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // Check if user is active
    if (user.status === UserStatus.SUSPENDED) {
      return next(new AppError('Your account has been suspended. Please contact support', 403));
    }
    
    let isAuthenticated = false;
    
    // If both password and OTP are provided, try password first, then OTP as fallback
    // If only one is provided, use that method
    if (password && user.password) {
      isAuthenticated = await user.comparePassword(password);
      if (!isAuthenticated && otp) {
        // Password failed, try OTP as fallback
        isAuthenticated = verifyOTP(email, otp);
      }
    } else if (otp) {
      // Only OTP provided
      isAuthenticated = verifyOTP(email, otp);
    } else if (password && !user.password) {
      // User doesn't have password set, can only use OTP
      return next(new AppError('Please use OTP login or set a password first', 400));
    } else {
      return next(new AppError('Please provide either password or OTP', 400));
    }
    
    if (!isAuthenticated) {
      return next(new AppError('Invalid credentials', 401));
    }
    
    // Update user status and last active
    user.status = UserStatus.ACTIVE;
    user.isEmailVerified = true;
    user.lastActiveAt = new Date();
    await user.save();
    
    // Generate JWT token
    const token = signToken(user._id.toString(), user.role);
    
    logger.info(`User logged in: ${user.email}`);
    
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
 * Admin login with email and password
 */
export const adminLogin = async (req: AdminLoginRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400));
    }

    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return next(new AppError('Email and password are required', 400));
    }

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Check if user has admin role
    if (user.role !== UserRole.ADMIN) {
      return next(new AppError('Access denied. Admin privileges required', 403));
    }

    // Check if user is active
    if (user.status === UserStatus.SUSPENDED) {
      return next(new AppError('Your account has been suspended. Please contact support', 403));
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Update user status and last active
    user.status = UserStatus.ACTIVE;
    user.lastActiveAt = new Date();
    await user.save();

    // Generate JWT token
    const token = signToken(user._id.toString(), user.role);

    logger.info(`Admin logged in: ${user.email} (${user.firstName} ${user.lastName})`);

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          role: user.role,
          status: user.status,
          isPhoneVerified: user.isPhoneVerified,
          isEmailVerified: user.isEmailVerified,
          lastActiveAt: user.lastActiveAt
        },
        token
      }
    });
  } catch (error) {
    logger.error('Admin login error:', error);
    return next(new AppError('Admin login failed', 500));
  }
};

/**
 * Send OTP for phone verification or login
 */
export const sendLoginOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('Inside sendLoginOTP');
    console.log('Request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return next(new AppError(`Validation failed: ${errors.array()[0].msg}`, 400));
    }
    
    const { email } = req.body;
    console.log('Request to send OTP to:', email);
    if (!email) {
      return next(new AppError('Email is required', 400));
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Generate and send OTP
    await generateAndSendOTP(email, `${user.firstName} ${user.lastName}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.log('Send OTP error:', error);
    logger.error('Send OTP error:', error);
    return next(new AppError('Failed to send OTP', 500));
  }
};

/**
 * Verify email with OTP
 */
export const verifyEmailOTP = async (req: VerifyOTPRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return next(new AppError('Email and OTP are required', 400));
    }
    
    // Verify OTP
    const isValid = verifyOTP(email, otp);
    if (!isValid) {
      return next(new AppError('Invalid or expired OTP', 400));
    }
    
    // Update user verification status
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    user.isEmailVerified = true;
    user.status = UserStatus.ACTIVE;
    await user.save();
    
    // Generate JWT token
    const token = signToken(user._id.toString(), user.role);
    
    logger.info(`Email verified for user: ${user.email}`);
    
    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        },
        token
      }
    });
  } catch (error) {
    logger.error('Email verification error:', error);
    return next(new AppError('Email verification failed', 500));
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
 * Set or update password for user
 */
export const setPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return next(new AppError('New password and confirm password are required', 400));
    }

    if (newPassword !== confirmPassword) {
      return next(new AppError('New password and confirm password do not match', 400));
    }

    // If user already has a password, require current password
    if (req.user.password && !currentPassword) {
      return next(new AppError('Current password is required to update password', 400));
    }

    // Verify current password if user has one
    if (req.user.password && currentPassword) {
      const isCurrentPasswordValid = await req.user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return next(new AppError('Current password is incorrect', 400));
      }
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return next(new AppError('Password must be at least 6 characters long', 400));
    }

    // Update password
    req.user.password = newPassword;
    await req.user.save();

    logger.info(`Password ${req.user.password ? 'updated' : 'set'} for user: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: req.user.password ? 'Password updated successfully' : 'Password set successfully'
    });
  } catch (error) {
    logger.error('Set password error:', error);
    return next(new AppError('Failed to set password', 500));
  }
};

/**
 * Reset password using email verification
 */
export const requestPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Email is required', 400));
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // For security, don't reveal if email exists or not
      res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive password reset instructions'
      });
      return;
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Save reset token to user
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetTokenExpiry;
    await user.save();

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(email, `${user.firstName} ${user.lastName}`, resetToken);
      logger.info(`Password reset email sent to ${email}`);
    } catch (emailError) {
      logger.error('Failed to send password reset email:', emailError);
      // Clear the reset token if email fails
      user.passwordResetToken = '';
      user.passwordResetExpires = new Date(0);
      await user.save();
      return next(new AppError('Failed to send password reset email', 500));
    }

    res.status(200).json({
      success: true,
      message: 'Password reset instructions sent to your email'
    });
  } catch (error) {
    logger.error('Request password reset error:', error);
    return next(new AppError('Failed to process password reset request', 500));
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return next(new AppError('Token, new password, and confirm password are required', 400));
    }

    if (newPassword !== confirmPassword) {
      return next(new AppError('New password and confirm password do not match', 400));
    }

    if (newPassword.length < 6) {
      return next(new AppError('Password must be at least 6 characters long', 400));
    }

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return next(new AppError('Invalid or expired password reset token', 400));
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.passwordResetToken = '';
    user.passwordResetExpires = new Date(0);
    await user.save();

    logger.info(`Password reset successfully for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    return next(new AppError('Failed to reset password', 500));
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
