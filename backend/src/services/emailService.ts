import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { logger } from '../utils/logger';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: any[];
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null = null;
  private isInitialized = false;

  /**
   * Initialize the email service with configuration
   */
  async initialize() {
    try {
      const emailConfig = {
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD
        }
      };

      this.transporter = nodemailer.createTransport(emailConfig);
      this.isInitialized = true;

      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      throw error;
    }
  }

  /**
   * Send an email
   */
  async sendEmail(options: EmailOptions): Promise<any> {
    if (!this.isInitialized || !this.transporter) {
      throw new Error('Email service not initialized');
    }

    try {
      const mailOptions = {
        from: options.from || `"${process.env.APP_NAME || 'RideShare Pro'}" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info(`Email sent successfully to ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
      return result;
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(email: string, userName: string): Promise<void> {
    const template = this.getWelcomeEmailTemplate(userName);

    const emailOptions: EmailOptions = {
      to: email,
      subject: template.subject,
      html: template.html
    };

    if (template.text) {
      emailOptions.text = template.text;
    }

    await this.sendEmail(emailOptions);
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(email: string, userName: string, verificationToken: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    const template = this.getEmailVerificationTemplate(userName, verificationUrl);

    const emailOptions: EmailOptions = {
      to: email,
      subject: template.subject,
      html: template.html
    };

    if (template.text) {
      emailOptions.text = template.text;
    }

    await this.sendEmail(emailOptions);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, userName: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const template = this.getPasswordResetTemplate(userName, resetUrl);

    const emailOptions: EmailOptions = {
      to: email,
      subject: template.subject,
      html: template.html
    };

    if (template.text) {
      emailOptions.text = template.text;
    }

    await this.sendEmail(emailOptions);
  }

  /**
   * Send subscription confirmation email
   */
  async sendSubscriptionConfirmation(email: string, userName: string, planName: string, amount: number): Promise<void> {
    const template = this.getSubscriptionConfirmationTemplate(userName, planName, amount);

    const emailOptions: EmailOptions = {
      to: email,
      subject: template.subject,
      html: template.html
    };

    if (template.text) {
      emailOptions.text = template.text;
    }

    await this.sendEmail(emailOptions);
  }

  /**
   * Send subscription renewal reminder
   */
  async sendSubscriptionRenewalReminder(email: string, userName: string, planName: string, expiryDate: Date): Promise<void> {
    const template = this.getSubscriptionRenewalTemplate(userName, planName, expiryDate);

    const emailOptions: EmailOptions = {
      to: email,
      subject: template.subject,
      html: template.html
    };

    if (template.text) {
      emailOptions.text = template.text;
    }

    await this.sendEmail(emailOptions);
  }

  /**
   * Send subscription expired notification
   */
  async sendSubscriptionExpired(email: string, userName: string, planName: string): Promise<void> {
    const template = this.getSubscriptionExpiredTemplate(userName, planName);

    const emailOptions: EmailOptions = {
      to: email,
      subject: template.subject,
      html: template.html
    };

    if (template.text) {
      emailOptions.text = template.text;
    }

    await this.sendEmail(emailOptions);
  }

  /**
   * Send ride confirmation email
   */
  async sendRideConfirmation(email: string, userName: string, rideDetails: any): Promise<void> {
    const template = this.getRideConfirmationTemplate(userName, rideDetails);

    const emailOptions: EmailOptions = {
      to: email,
      subject: template.subject,
      html: template.html
    };

    if (template.text) {
      emailOptions.text = template.text;
    }

    await this.sendEmail(emailOptions);
  }

  /**
   * Send ride cancellation email
   */
  async sendRideCancellation(email: string, userName: string, rideId: string, reason?: string): Promise<void> {
    const template = this.getRideCancellationTemplate(userName, rideId, reason);

    const emailOptions: EmailOptions = {
      to: email,
      subject: template.subject,
      html: template.html
    };

    if (template.text) {
      emailOptions.text = template.text;
    }

    await this.sendEmail(emailOptions);
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(email: string, userName: string, paymentDetails: any): Promise<void> {
    const template = this.getPaymentConfirmationTemplate(userName, paymentDetails);

    const emailOptions: EmailOptions = {
      to: email,
      subject: template.subject,
      html: template.html
    };

    if (template.text) {
      emailOptions.text = template.text;
    }

    await this.sendEmail(emailOptions);
  }

  // Email Templates
  private getWelcomeEmailTemplate(userName: string): EmailTemplate {
    return {
      subject: `Welcome to ${process.env.APP_NAME || 'RideShare Pro'}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Welcome to ${process.env.APP_NAME || 'RideShare Pro'}!</h1>
          <p>Hi ${userName},</p>
          <p>Thank you for joining ${process.env.APP_NAME || 'RideShare Pro'}! We're excited to have you as part of our community.</p>
          <p>Here's what you can do to get started:</p>
          <ul>
            <li>Complete your profile</li>
            <li>Book your first ride</li>
            <li>Explore available features</li>
          </ul>
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>Happy riding!</p>
          <p>The ${process.env.APP_NAME || 'RideShare Pro'} Team</p>
        </div>
      `,
      text: `Welcome to ${process.env.APP_NAME || 'RideShare Pro'}!

Hi ${userName},

Thank you for joining ${process.env.APP_NAME || 'RideShare Pro'}! We're excited to have you as part of our community.

Here's what you can do to get started:
- Complete your profile
- Book your first ride
- Explore available features

If you have any questions, feel free to contact our support team.

Happy riding!

The ${process.env.APP_NAME || 'RideShare Pro'} Team`
    };
  }

  private getEmailVerificationTemplate(userName: string, verificationUrl: string): EmailTemplate {
    return {
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Verify Your Email</h1>
          <p>Hi ${userName},</p>
          <p>Please verify your email address to complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>The ${process.env.APP_NAME || 'RideShare Pro'} Team</p>
        </div>
      `,
      text: `Verify Your Email

Hi ${userName},

Please verify your email address to complete your registration.

Click here to verify: ${verificationUrl}

This link will expire in 24 hours.

The ${process.env.APP_NAME || 'RideShare Pro'} Team`
    };
  }

  private getPasswordResetTemplate(userName: string, resetUrl: string): EmailTemplate {
    return {
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Reset Your Password</h1>
          <p>Hi ${userName},</p>
          <p>You requested a password reset for your account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this reset, please ignore this email.</p>
          <p>The ${process.env.APP_NAME || 'RideShare Pro'} Team</p>
        </div>
      `,
      text: `Reset Your Password

Hi ${userName},

You requested a password reset for your account.

Click here to reset: ${resetUrl}

This link will expire in 1 hour.

If you didn't request this reset, please ignore this email.

The ${process.env.APP_NAME || 'RideShare Pro'} Team`
    };
  }

  private getSubscriptionConfirmationTemplate(userName: string, planName: string, amount: number): EmailTemplate {
    return {
      subject: 'Subscription Confirmed',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Subscription Confirmed!</h1>
          <p>Hi ${userName},</p>
          <p>Thank you for subscribing to ${planName}!</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Subscription Details:</h3>
            <p><strong>Plan:</strong> ${planName}</p>
            <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
            <p><strong>Status:</strong> Active</p>
          </div>
          <p>You can now enjoy all the benefits of your subscription plan.</p>
          <p>The ${process.env.APP_NAME || 'RideShare Pro'} Team</p>
        </div>
      `,
      text: `Subscription Confirmed!

Hi ${userName},

Thank you for subscribing to ${planName}!

Subscription Details:
Plan: ${planName}
Amount: $${amount.toFixed(2)}
Status: Active

You can now enjoy all the benefits of your subscription plan.

The ${process.env.APP_NAME || 'RideShare Pro'} Team`
    };
  }

  private getSubscriptionRenewalTemplate(userName: string, planName: string, expiryDate: Date): EmailTemplate {
    return {
      subject: 'Subscription Renewal Reminder',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Subscription Renewal Reminder</h1>
          <p>Hi ${userName},</p>
          <p>Your ${planName} subscription is expiring soon.</p>
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p><strong>Expiry Date:</strong> ${expiryDate.toLocaleDateString()}</p>
            <p>Please renew your subscription to continue enjoying our services.</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Renew Subscription</a>
          </div>
          <p>The ${process.env.APP_NAME || 'RideShare Pro'} Team</p>
        </div>
      `,
      text: `Subscription Renewal Reminder

Hi ${userName},

Your ${planName} subscription is expiring soon.

Expiry Date: ${expiryDate.toLocaleDateString()}

Please renew your subscription to continue enjoying our services.

Renew here: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription

The ${process.env.APP_NAME || 'RideShare Pro'} Team`
    };
  }

  private getSubscriptionExpiredTemplate(userName: string, planName: string): EmailTemplate {
    return {
      subject: 'Subscription Expired',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Subscription Expired</h1>
          <p>Hi ${userName},</p>
          <p>Your ${planName} subscription has expired.</p>
          <p>To continue using our premium features, please renew your subscription.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Renew Now</a>
          </div>
          <p>The ${process.env.APP_NAME || 'RideShare Pro'} Team</p>
        </div>
      `,
      text: `Subscription Expired

Hi ${userName},

Your ${planName} subscription has expired.

To continue using our premium features, please renew your subscription.

Renew here: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription

The ${process.env.APP_NAME || 'RideShare Pro'} Team`
    };
  }

  private getRideConfirmationTemplate(userName: string, rideDetails: any): EmailTemplate {
    return {
      subject: 'Ride Confirmed',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Ride Confirmed!</h1>
          <p>Hi ${userName},</p>
          <p>Your ride has been confirmed. Here are the details:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Ride Details:</h3>
            <p><strong>Ride ID:</strong> ${rideDetails.rideId || 'N/A'}</p>
            <p><strong>Pickup:</strong> ${rideDetails.pickupAddress || 'N/A'}</p>
            <p><strong>Dropoff:</strong> ${rideDetails.dropoffAddress || 'N/A'}</p>
            <p><strong>Date & Time:</strong> ${rideDetails.scheduledTime ? new Date(rideDetails.scheduledTime).toLocaleString() : 'N/A'}</p>
            <p><strong>Estimated Fare:</strong> $${rideDetails.estimatedFare ? rideDetails.estimatedFare.toFixed(2) : 'N/A'}</p>
          </div>
          <p>You'll receive updates about your ride status. Safe travels!</p>
          <p>The ${process.env.APP_NAME || 'RideShare Pro'} Team</p>
        </div>
      `,
      text: `Ride Confirmed!

Hi ${userName},

Your ride has been confirmed. Here are the details:

Ride Details:
Ride ID: ${rideDetails.rideId || 'N/A'}
Pickup: ${rideDetails.pickupAddress || 'N/A'}
Dropoff: ${rideDetails.dropoffAddress || 'N/A'}
Date & Time: ${rideDetails.scheduledTime ? new Date(rideDetails.scheduledTime).toLocaleString() : 'N/A'}
Estimated Fare: $${rideDetails.estimatedFare ? rideDetails.estimatedFare.toFixed(2) : 'N/A'}

You'll receive updates about your ride status. Safe travels!

The ${process.env.APP_NAME || 'RideShare Pro'} Team`
    };
  }

  private getRideCancellationTemplate(userName: string, rideId: string, reason?: string): EmailTemplate {
    return {
      subject: 'Ride Cancelled',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Ride Cancelled</h1>
          <p>Hi ${userName},</p>
          <p>Your ride (ID: ${rideId}) has been cancelled.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p>If you have any questions or need assistance, please contact our support team.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/book-ride" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Book New Ride</a>
          </div>
          <p>The ${process.env.APP_NAME || 'RideShare Pro'} Team</p>
        </div>
      `,
      text: `Ride Cancelled

Hi ${userName},

Your ride (ID: ${rideId}) has been cancelled.
${reason ? `Reason: ${reason}` : ''}

If you have any questions or need assistance, please contact our support team.

Book a new ride: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/book-ride

The ${process.env.APP_NAME || 'RideShare Pro'} Team`
    };
  }

  private getPaymentConfirmationTemplate(userName: string, paymentDetails: any): EmailTemplate {
    return {
      subject: 'Payment Confirmed',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Payment Confirmed!</h1>
          <p>Hi ${userName},</p>
          <p>Your payment has been processed successfully.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Payment Details:</h3>
            <p><strong>Amount:</strong> $${paymentDetails.amount ? paymentDetails.amount.toFixed(2) : 'N/A'}</p>
            <p><strong>Payment ID:</strong> ${paymentDetails.paymentId || 'N/A'}</p>
            <p><strong>Method:</strong> ${paymentDetails.method || 'N/A'}</p>
            <p><strong>Date:</strong> ${paymentDetails.completedAt ? new Date(paymentDetails.completedAt).toLocaleString() : new Date().toLocaleString()}</p>
          </div>
          <p>Thank you for using ${process.env.APP_NAME || 'RideShare Pro'}!</p>
          <p>The ${process.env.APP_NAME || 'RideShare Pro'} Team</p>
        </div>
      `,
      text: `Payment Confirmed!

Hi ${userName},

Your payment has been processed successfully.

Payment Details:
Amount: $${paymentDetails.amount ? paymentDetails.amount.toFixed(2) : 'N/A'}
Payment ID: ${paymentDetails.paymentId || 'N/A'}
Method: ${paymentDetails.method || 'N/A'}
Date: ${paymentDetails.completedAt ? new Date(paymentDetails.completedAt).toLocaleString() : new Date().toLocaleString()}

Thank you for using ${process.env.APP_NAME || 'RideShare Pro'}!

The ${process.env.APP_NAME || 'RideShare Pro'} Team`
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
