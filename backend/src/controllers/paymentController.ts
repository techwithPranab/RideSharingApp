/**
 * Payment controller for handling payment-related API endpoints
 * Manages payment creation, processing, and retrieval
 */

import { Request, Response } from 'express';
import { PaymentService, PaymentRequest } from '../services/paymentService';
import { Payment, PaymentMethod } from '../models/Payment';
import { Ride, RideStatus } from '../models/Ride';
import Booking from '../models/Booking';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../middleware/asyncHandler';

export class PaymentController {
  /**
   * Create payment order for ride
   * POST /api/payments/create-order
   */
  static readonly createPaymentOrder = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    const { rideId, paymentMethod } = req.body;

    if (!rideId || !paymentMethod) {
      ApiResponse.error(res, 'Missing required fields: rideId, paymentMethod', 400);
      return;
    }

    // Validate payment method
    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      ApiResponse.error(res, 'Invalid payment method', 400);
      return;
    }

    try {
      // Find the ride
      const ride = await Ride.findById(rideId);

      if (!ride) {
        ApiResponse.error(res, 'Ride not found', 404);
        return;
      }

      // Check if user is authorized to pay for this ride
      const isPassenger = ride.passengers.some(p => p.userId.toString() === userId);

      if (!isPassenger) {
        ApiResponse.error(res, 'Unauthorized: Not a passenger in this ride', 403);
        return;
      }

      // Check if ride is completed
      if (ride.status !== RideStatus.COMPLETED) {
        ApiResponse.error(res, 'Payment can only be processed for completed rides', 400);
        return;
      }

      // Process payment
      const { payment, order } = await PaymentService.processRidePayment(
        rideId,
        userId,
        paymentMethod
      );

      ApiResponse.success(res, {
        message: 'Payment order created successfully',
        data: {
          payment: {
            paymentId: payment.paymentId,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status
          },
          order: {
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            status: order.status
          },
          razorpayKeyId: process.env.RAZORPAY_KEY_ID
        }
      });
    } catch (error) {
      console.error('Error creating payment order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create payment order';
      ApiResponse.error(res, errorMessage, 500);
    }
  });

  /**
   * Verify payment after completion
   * POST /api/payments/verify
   */
  static readonly verifyPayment = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      ApiResponse.error(res, 'Missing payment verification data', 400);
      return;
    }

    try {
      // Verify payment signature
      const isValid = await PaymentService.verifyPayment({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      });

      if (!isValid) {
        ApiResponse.error(res, 'Payment verification failed', 400);
        return;
      }

      // Handle successful payment
      const payment = await PaymentService.handlePaymentSuccess(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      ApiResponse.success(res, {
        message: 'Payment verified and processed successfully',
        data: {
          payment: {
            paymentId: payment.paymentId,
            amount: payment.amount,
            status: payment.status,
            completedAt: payment.completedAt
          }
        }
      });
    } catch (error) {
      console.error('Error verifying payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify payment';
      ApiResponse.error(res, errorMessage, 500);
    }
  });

  /**
   * Get payment details
   * GET /api/payments/:paymentId
   */
  static readonly getPayment = asyncHandler(async (req: Request, res: Response) => {
    const { paymentId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    try {
      const payment = await PaymentService.getPaymentDetails(paymentId, userId);

      if (!payment) {
        ApiResponse.error(res, 'Payment not found', 404);
        return;
      }

      ApiResponse.success(res, {
        message: 'Payment details retrieved successfully',
        data: { payment }
      });
    } catch (error) {
      console.error('Error getting payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get payment details';
      ApiResponse.error(res, errorMessage, 500);
    }
  });

  /**
   * Get user's payment history
   * GET /api/payments/history
   */
  static readonly getPaymentHistory = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    try {
      const payments = await Payment.find({
        $or: [
          { payerId: userId },
          { payeeId: userId }
        ]
      })
      .populate('rideId', 'rideId status totalFare requestedAt')
      .populate('payerId', 'firstName lastName')
      .populate('payeeId', 'firstName lastName')
      .sort({ initiatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

      const total = await Payment.countDocuments({
        $or: [
          { payerId: userId },
          { payeeId: userId }
        ]
      });

      ApiResponse.success(res, {
        message: 'Payment history retrieved successfully',
        data: {
          payments,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error getting payment history:', error);
      ApiResponse.error(res, 'Failed to get payment history', 500);
    }
  });

  /**
   * Process refund
   * POST /api/payments/:paymentId/refund
   */
  static readonly processRefund = asyncHandler(async (req: Request, res: Response) => {
    const { paymentId } = req.params;
    const { refundAmount } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    try {
      // Find the payment
      const payment = await Payment.findOne({ paymentId });

      if (!payment) {
        ApiResponse.error(res, 'Payment not found', 404);
        return;
      }

      // Check authorization (only payment recipient can process refunds for now)
      if (payment.payeeId?.toString() !== userId) {
        ApiResponse.error(res, 'Unauthorized to process refund', 403);
        return;
      }

      // Process refund
      const refund = await PaymentService.processRefund(paymentId, refundAmount);

      ApiResponse.success(res, {
        message: 'Refund processed successfully',
        data: {
          refund: {
            paymentId: refund.paymentId,
            amount: refund.amount,
            status: refund.status
          },
          originalPayment: {
            paymentId: payment.paymentId,
            amount: payment.amount
          }
        }
      });
    } catch (error) {
      console.error('Error processing refund:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process refund';
      ApiResponse.error(res, errorMessage, 500);
    }
  });

  /**
   * Handle Razorpay webhook
   * POST /api/payments/webhook
   */
  static readonly handleWebhook = asyncHandler(async (req: Request, res: Response) => {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const webhookData = req.body;

      if (!signature) {
        ApiResponse.error(res, 'Missing webhook signature', 400);
        return;
      }

      // Handle webhook
      await PaymentService.handleWebhook(webhookData, signature);

      // Return 200 to acknowledge receipt
      res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error('Error handling webhook:', error);
      // Return 200 to prevent Razorpay from retrying
      res.status(200).json({ status: 'error', message: 'Webhook processing failed' });
    }
  });

  /**
   * Get payment statistics
   * GET /api/payments/stats
   */
  static readonly getPaymentStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    try {
      const stats = await PaymentService.getPaymentStats(userId, userRole);

      ApiResponse.success(res, {
        message: 'Payment statistics retrieved successfully',
        data: { stats }
      });
    } catch (error) {
      console.error('Error getting payment stats:', error);
      ApiResponse.error(res, 'Failed to get payment statistics', 500);
    }
  });

  /**
   * Create Stripe payment intent for booking
   * POST /api/payments/create-stripe-intent
   */
  static readonly createStripePaymentIntent = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    const { bookingId } = req.body;

    if (!bookingId) {
      ApiResponse.error(res, 'Booking ID is required', 400);
      return;
    }

    try {
      // Find booking
      const booking = await Booking.findById(bookingId).populate('riderId');
      if (!booking) {
        ApiResponse.error(res, 'Booking not found', 404);
        return;
      }

      // Verify user owns the booking
      if (booking.riderId.toString() !== userId) {
        ApiResponse.error(res, 'Unauthorized to make payment for this booking', 403);
        return;
      }

      if (booking.status !== 'confirmed') {
        ApiResponse.error(res, 'Booking must be confirmed before payment', 400);
        return;
      }

      // Create Stripe payment intent
      const { payment, clientSecret, paymentIntentId } = await PaymentService.processRidePaymentWithStripe(
        booking.rideOfferId.toString(),
        userId,
        booking.totalAmount,
        'INR'
      );

      ApiResponse.success(res, {
        message: 'Stripe payment intent created successfully',
        data: {
          paymentId: payment.paymentId,
          clientSecret,
          paymentIntentId,
          amount: payment.amount,
          currency: payment.currency,
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
        }
      });
    } catch (error) {
      console.error('Error creating Stripe payment intent:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create Stripe payment intent';
      ApiResponse.error(res, errorMessage, 500);
    }
  });

  /**
   * Process refund with Stripe
   * POST /api/payments/:paymentId/stripe-refund
   */
  static readonly processStripeRefund = asyncHandler(async (req: Request, res: Response) => {
    const { paymentId } = req.params;
    const { refundAmount, reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    try {
      // Find the payment
      const payment = await Payment.findOne({ paymentId });

      if (!payment) {
        ApiResponse.error(res, 'Payment not found', 404);
        return;
      }

      // Check authorization
      if (payment.payerId.toString() !== userId) {
        ApiResponse.error(res, 'Unauthorized to process refund', 403);
        return;
      }

      if (payment.status !== 'completed') {
        ApiResponse.error(res, 'Payment cannot be refunded', 400);
        return;
      }

      // Process Stripe refund
      const { refund, stripeRefund } = await PaymentService.processStripeRefund(
        paymentId,
        refundAmount,
        reason
      );

      ApiResponse.success(res, {
        message: 'Stripe refund processed successfully',
        data: {
          refund: {
            paymentId: refund.paymentId,
            amount: refund.amount,
            status: refund.status,
            stripeRefundId: stripeRefund.id
          },
          originalPayment: {
            paymentId: payment.paymentId,
            amount: payment.amount
          }
        }
      });
    } catch (error) {
      console.error('Error processing Stripe refund:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process Stripe refund';
      ApiResponse.error(res, errorMessage, 500);
    }
  });

  /**
   * Handle Stripe webhook
   * POST /api/payments/stripe-webhook
   */
  static readonly handleStripeWebhook = async (req: Request, res: Response) => {
    try {
      const sig = req.headers['stripe-signature'] as string;
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!endpointSecret) {
        console.error('Stripe webhook secret not configured');
        return res.status(500).json({ error: 'Webhook secret not configured' });
      }

      let event: any;

      try {
        // Verify webhook signature
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err: any) {
        console.error('Stripe webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle webhook
      await PaymentService.handleStripeWebhook(event);

      // Return 200 to acknowledge receipt
      return res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error handling Stripe webhook:', error);
      // Return 200 to prevent Stripe from retrying
      return res.status(200).json({ status: 'error', message: 'Webhook processing failed' });
    }
  };
  static readonly createSplitPayment = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      ApiResponse.error(res, 'User not authenticated', 401);
      return;
    }

    const { rideId, paymentMethod } = req.body;

    if (!rideId || !paymentMethod) {
      ApiResponse.error(res, 'Missing required fields: rideId, paymentMethod', 400);
      return;
    }

    try {
      // Find the ride
      const ride = await Ride.findById(rideId);

      if (!ride) {
        ApiResponse.error(res, 'Ride not found', 404);
        return;
      }

      if (!ride.isPooled) {
        ApiResponse.error(res, 'This is not a pooled ride', 400);
        return;
      }

      // Find user's passenger record
      const passengerRecord = ride.passengers.find(p => p.userId.toString() === userId);

      if (!passengerRecord) {
        ApiResponse.error(res, 'User is not a passenger in this ride', 403);
        return;
      }

      // Check if payment already completed
      if (passengerRecord.paymentStatus === 'completed') {
        ApiResponse.error(res, 'Payment already completed for this passenger', 400);
        return;
      }

      // Create payment request for split amount
      const paymentRequest: PaymentRequest = {
        amount: passengerRecord.fare,
        currency: 'INR',
        method: paymentMethod,
        description: `Split payment for pooled ride ${ride.rideId}`,
        rideId,
        payerId: userId,
        payeeId: ride.driverId.toString()
      };

      // Create Razorpay order
      const order = await PaymentService.createOrder(paymentRequest);

      // Create payment record
      const payment = await PaymentService.createPaymentRecord(paymentRequest, order.id);

      ApiResponse.success(res, {
        message: 'Split payment order created successfully',
        data: {
          payment: {
            paymentId: payment.paymentId,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status
          },
          order: {
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            status: order.status
          },
          razorpayKeyId: process.env.RAZORPAY_KEY_ID
        }
      });
    } catch (error) {
      console.error('Error creating split payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create split payment';
      ApiResponse.error(res, errorMessage, 500);
    }
  });
}
