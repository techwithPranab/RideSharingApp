/**
 * Alternative email service configuration for Brevo (Port 465 SSL)
 * Use this if port 587 STARTTLS doesn't work
 */

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

class EmailServiceSSL {
  private transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null = null;

  /**
   * Initialize the email service with SSL configuration (Port 465)
   */
  async initialize() {
    try {
      // Check if required environment variables are set
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('EMAIL_USER and EMAIL_PASS environment variables are required');
      }

      const emailConfig = {
        host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
        port: 465, // SSL port
        secure: true, // Use SSL
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false
        },
        debug: process.env.NODE_ENV === 'development',
        logger: process.env.NODE_ENV === 'development'
      };

      this.transporter = nodemailer.createTransport(emailConfig);

      // Verify connection
      await this.transporter.verify();

      logger.info('✅ Email service (SSL) initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      throw new Error(`Email service initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ... rest of the methods would be the same as the main EmailService
}

// Export both versions
export { EmailServiceSSL };
export const emailServiceSSL = new EmailServiceSSL();
