import express from 'express';
import {
  sendTestEmail,
  sendWelcomeEmail,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendSubscriptionConfirmation,
  sendSubscriptionRenewalReminder,
  sendSubscriptionExpired,
  sendRideConfirmation,
  sendRideCancellation,
  sendPaymentConfirmation,
  getEmailServiceStatus,
  initializeEmailService,
  getEmailTemplates
} from '../../controllers/admin/emailController';
import { requireAdmin } from '../../middleware/adminAuth';

const router = express.Router();

// All routes require admin authentication
router.use(requireAdmin);

// Email service management
router.get('/status', getEmailServiceStatus);
router.post('/initialize', initializeEmailService);
router.get('/templates', getEmailTemplates);

// Test email functionality
router.post('/test', sendTestEmail);

// User lifecycle emails
router.post('/welcome', sendWelcomeEmail);
router.post('/verify-email', sendEmailVerification);
router.post('/reset-password', sendPasswordResetEmail);

// Subscription emails
router.post('/subscription/confirm', sendSubscriptionConfirmation);
router.post('/subscription/renewal-reminder', sendSubscriptionRenewalReminder);
router.post('/subscription/expired', sendSubscriptionExpired);

// Ride emails
router.post('/ride/confirm', sendRideConfirmation);
router.post('/ride/cancel', sendRideCancellation);

// Payment emails
router.post('/payment/confirm', sendPaymentConfirmation);

export default router;
