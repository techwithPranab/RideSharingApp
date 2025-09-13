import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { ApiResponse } from '../../utils/apiResponse';
import { emailService } from '../../services/emailService';
import { logger } from '../../utils/logger';

/**
 * Admin Email Notification Controller
 * Handles email notification management and testing
 */

/**
 * Send test email
 */
export const sendTestEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { to, subject, html, text } = req.body;

  if (!to || !subject || !html) {
    ApiResponse.error(res, 'Missing required fields: to, subject, html');
    return;
  }

  try {
    await emailService.sendEmail({
      to,
      subject,
      html,
      text
    });

    logger.info(`Test email sent successfully to ${to}`);
    ApiResponse.success(res, 'Test email sent successfully');
  } catch (error: any) {
    logger.error('Failed to send test email:', error);
    ApiResponse.error(res, 'Failed to send test email', 500);
  }
});

/**
 * Send welcome email to user
 */
export const sendWelcomeEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, userName } = req.body;

  if (!email || !userName) {
    ApiResponse.error(res, 'Missing required fields: email, userName');
    return;
  }

  try {
    await emailService.sendWelcomeEmail(email, userName);
    logger.info(`Welcome email sent to ${email}`);
    ApiResponse.success(res, 'Welcome email sent successfully');
  } catch (error: any) {
    logger.error('Failed to send welcome email:', error);
    ApiResponse.error(res, 'Failed to send welcome email', 500);
  }
});

/**
 * Send email verification
 */
export const sendEmailVerification = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, userName, verificationToken } = req.body;

  if (!email || !userName || !verificationToken) {
    ApiResponse.error(res, 'Missing required fields: email, userName, verificationToken');
    return;
  }

  try {
    await emailService.sendEmailVerification(email, userName, verificationToken);
    logger.info(`Email verification sent to ${email}`);
    ApiResponse.success(res, 'Email verification sent successfully');
  } catch (error: any) {
    logger.error('Failed to send email verification:', error);
    ApiResponse.error(res, 'Failed to send email verification', 500);
  }
});

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, userName, resetToken } = req.body;

  if (!email || !userName || !resetToken) {
    ApiResponse.error(res, 'Missing required fields: email, userName, resetToken');
    return;
  }

  try {
    await emailService.sendPasswordResetEmail(email, userName, resetToken);
    logger.info(`Password reset email sent to ${email}`);
    ApiResponse.success(res, 'Password reset email sent successfully');
  } catch (error: any) {
    logger.error('Failed to send password reset email:', error);
    ApiResponse.error(res, 'Failed to send password reset email', 500);
  }
});

/**
 * Send subscription confirmation email
 */
export const sendSubscriptionConfirmation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, userName, planName, amount } = req.body;

  if (!email || !userName || !planName || amount === undefined) {
    ApiResponse.error(res, 'Missing required fields: email, userName, planName, amount');
    return;
  }

  try {
    await emailService.sendSubscriptionConfirmation(email, userName, planName, amount);
    logger.info(`Subscription confirmation email sent to ${email}`);
    ApiResponse.success(res, 'Subscription confirmation email sent successfully');
  } catch (error: any) {
    logger.error('Failed to send subscription confirmation email:', error);
    ApiResponse.error(res, 'Failed to send subscription confirmation email', 500);
  }
});

/**
 * Send subscription renewal reminder
 */
export const sendSubscriptionRenewalReminder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, userName, planName, expiryDate } = req.body;

  if (!email || !userName || !planName || !expiryDate) {
    ApiResponse.error(res, 'Missing required fields: email, userName, planName, expiryDate');
    return;
  }

  try {
    const expiry = new Date(expiryDate);
    await emailService.sendSubscriptionRenewalReminder(email, userName, planName, expiry);
    logger.info(`Subscription renewal reminder sent to ${email}`);
    ApiResponse.success(res, 'Subscription renewal reminder sent successfully');
  } catch (error: any) {
    logger.error('Failed to send subscription renewal reminder:', error);
    ApiResponse.error(res, 'Failed to send subscription renewal reminder', 500);
  }
});

/**
 * Send subscription expired notification
 */
export const sendSubscriptionExpired = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, userName, planName } = req.body;

  if (!email || !userName || !planName) {
    ApiResponse.error(res, 'Missing required fields: email, userName, planName');
    return;
  }

  try {
    await emailService.sendSubscriptionExpired(email, userName, planName);
    logger.info(`Subscription expired notification sent to ${email}`);
    ApiResponse.success(res, 'Subscription expired notification sent successfully');
  } catch (error: any) {
    logger.error('Failed to send subscription expired notification:', error);
    ApiResponse.error(res, 'Failed to send subscription expired notification', 500);
  }
});

/**
 * Send ride confirmation email
 */
export const sendRideConfirmation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, userName, rideDetails } = req.body;

  if (!email || !userName || !rideDetails) {
    ApiResponse.error(res, 'Missing required fields: email, userName, rideDetails');
    return;
  }

  try {
    await emailService.sendRideConfirmation(email, userName, rideDetails);
    logger.info(`Ride confirmation email sent to ${email}`);
    ApiResponse.success(res, 'Ride confirmation email sent successfully');
  } catch (error: any) {
    logger.error('Failed to send ride confirmation email:', error);
    ApiResponse.error(res, 'Failed to send ride confirmation email', 500);
  }
});

/**
 * Send ride cancellation email
 */
export const sendRideCancellation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, userName, rideId, reason } = req.body;

  if (!email || !userName || !rideId) {
    ApiResponse.error(res, 'Missing required fields: email, userName, rideId');
    return;
  }

  try {
    await emailService.sendRideCancellation(email, userName, rideId, reason);
    logger.info(`Ride cancellation email sent to ${email}`);
    ApiResponse.success(res, 'Ride cancellation email sent successfully');
  } catch (error: any) {
    logger.error('Failed to send ride cancellation email:', error);
    ApiResponse.error(res, 'Failed to send ride cancellation email', 500);
  }
});

/**
 * Send payment confirmation email
 */
export const sendPaymentConfirmation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, userName, paymentDetails } = req.body;

  if (!email || !userName || !paymentDetails) {
    ApiResponse.error(res, 'Missing required fields: email, userName, paymentDetails');
    return;
  }

  try {
    await emailService.sendPaymentConfirmation(email, userName, paymentDetails);
    logger.info(`Payment confirmation email sent to ${email}`);
    ApiResponse.success(res, 'Payment confirmation email sent successfully');
  } catch (error: any) {
    logger.error('Failed to send payment confirmation email:', error);
    ApiResponse.error(res, 'Failed to send payment confirmation email', 500);
  }
});

/**
 * Get email service status
 */
export const getEmailServiceStatus = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  try {
    // Check if email service is initialized
    const isInitialized = (emailService as any).isInitialized || false;

    // Get email configuration status
    const configStatus = {
      EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'gmail',
      EMAIL_USER: process.env.EMAIL_USER ? 'configured' : 'not configured',
      EMAIL_APP_PASSWORD: process.env.EMAIL_APP_PASSWORD ? 'configured' : 'not configured',
      EMAIL_CLIENT_ID: process.env.EMAIL_CLIENT_ID ? 'configured' : 'not configured',
      EMAIL_CLIENT_SECRET: process.env.EMAIL_CLIENT_SECRET ? 'configured' : 'not configured',
      EMAIL_REFRESH_TOKEN: process.env.EMAIL_REFRESH_TOKEN ? 'configured' : 'not configured'
    };

    ApiResponse.success(res, {
      isInitialized,
      configStatus,
      service: 'Email Service',
      version: '1.0.0'
    });
  } catch (error: any) {
    logger.error('Failed to get email service status:', error);
    ApiResponse.error(res, 'Failed to get email service status', 500);
  }
});

/**
 * Initialize email service
 */
export const initializeEmailService = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  try {
    await (emailService as any).initialize();
    logger.info('Email service initialized successfully');
    ApiResponse.success(res, 'Email service initialized successfully');
  } catch (error: any) {
    logger.error('Failed to initialize email service:', error);
    ApiResponse.error(res, 'Failed to initialize email service', 500);
  }
});

/**
 * Get available email templates
 */
export const getEmailTemplates = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const templates = [
    {
      name: 'welcome',
      description: 'Welcome email for new users',
      requiredFields: ['email', 'userName']
    },
    {
      name: 'email_verification',
      description: 'Email verification with token',
      requiredFields: ['email', 'userName', 'verificationToken']
    },
    {
      name: 'password_reset',
      description: 'Password reset with token',
      requiredFields: ['email', 'userName', 'resetToken']
    },
    {
      name: 'subscription_confirmation',
      description: 'Subscription confirmation with details',
      requiredFields: ['email', 'userName', 'planName', 'amount']
    },
    {
      name: 'subscription_renewal',
      description: 'Subscription renewal reminder',
      requiredFields: ['email', 'userName', 'planName', 'expiryDate']
    },
    {
      name: 'subscription_expired',
      description: 'Subscription expired notification',
      requiredFields: ['email', 'userName', 'planName']
    },
    {
      name: 'ride_confirmation',
      description: 'Ride booking confirmation',
      requiredFields: ['email', 'userName', 'rideDetails']
    },
    {
      name: 'ride_cancellation',
      description: 'Ride cancellation notification',
      requiredFields: ['email', 'userName', 'rideId']
    },
    {
      name: 'payment_confirmation',
      description: 'Payment confirmation with details',
      requiredFields: ['email', 'userName', 'paymentDetails']
    }
  ];

  ApiResponse.success(res, templates);
});
