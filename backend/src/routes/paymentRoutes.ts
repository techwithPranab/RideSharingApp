/**
 * Payment routes for handling payment-related API endpoints
 * Defines routes for payment creation, processing, and retrieval
 */

import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { protect } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all payment routes
router.use(protect);

/**
 * @route POST /api/payments/create-order
 * @desc Create payment order for ride
 * @access Private
 */
router.post('/create-order', PaymentController.createPaymentOrder);

/**
 * @route POST /api/payments/verify
 * @desc Verify payment after completion
 * @access Private
 */
router.post('/verify', PaymentController.verifyPayment);

/**
 * @route GET /api/payments/:paymentId
 * @desc Get payment details
 * @access Private
 */
router.get('/:paymentId', PaymentController.getPayment);

/**
 * @route GET /api/payments/history
 * @desc Get user's payment history
 * @access Private
 */
router.get('/history', PaymentController.getPaymentHistory);

/**
 * @route POST /api/payments/:paymentId/refund
 * @desc Process refund
 * @access Private
 */
router.post('/:paymentId/refund', PaymentController.processRefund);

/**
 * @route POST /api/payments/create-stripe-intent
 * @desc Create Stripe payment intent for booking
 * @access Private
 */
router.post('/create-stripe-intent', PaymentController.createStripePaymentIntent);

/**
 * @route POST /api/payments/stripe-webhook
 * @desc Handle Stripe webhook
 * @access Public (but verified via signature)
 */
router.post('/stripe-webhook', PaymentController.handleStripeWebhook);

/**
 * @route POST /api/payments/:paymentId/stripe-refund
 * @desc Process refund with Stripe
 * @access Private
 */
router.post('/:paymentId/stripe-refund', PaymentController.processStripeRefund);

/**
 * @route GET /api/payments/stats
 * @desc Get payment statistics
 * @access Private
 */
router.get('/stats', PaymentController.getPaymentStats);

/**
 * @route POST /api/payments/split
 * @desc Create payment for split fare (pooled rides)
 * @access Private
 */
router.post('/split', PaymentController.createSplitPayment);

export default router;
