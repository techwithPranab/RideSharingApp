/**
 * Subscription Routes
 * API endpoints for subscription management
 */

import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { SubscriptionService } from '../services/subscriptionService';
import { SubscriptionPaymentMethod } from '../models/Subscription';
import { protect } from '../middleware/auth';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

/**
 * GET /api/subscriptions/plans
 * Get all available subscription plans
 */
router.get('/plans', async (_req, res) => {
  try {
    const plans = await SubscriptionService.getAvailablePlans();
    ApiResponse.success(res, {
      message: 'Subscription plans retrieved successfully',
      plans
    });
  } catch (error) {
    logger.error('Error getting subscription plans:', error);
    ApiResponse.error(res, 'Failed to retrieve subscription plans');
  }
});

/**
 * POST /api/subscriptions/purchase
 * Purchase a new subscription
 */
router.post('/purchase', [
  body('planId').isMongoId().withMessage('Valid plan ID is required'),
  body('paymentMethod').isIn(Object.values(SubscriptionPaymentMethod)).withMessage('Valid payment method is required'),
  body('autoRenew').optional().isBoolean().withMessage('Auto renew must be a boolean')
], async (req: express.Request, res: express.Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.validationError(res, errors.array());
    }

    const { planId, paymentMethod, autoRenew } = req.body;
    const userId = req.user.id;

    const subscription = await SubscriptionService.purchaseSubscription({
      userId,
      planId,
      paymentMethod,
      autoRenew
    });

    return ApiResponse.success(res, {
      message: 'Subscription purchased successfully',
      subscription
    }, 201);
  } catch (error: any) {
    logger.error('Error purchasing subscription:', error);
    return ApiResponse.error(res, error.message || 'Failed to purchase subscription');
  }
});

/**
 * GET /api/subscriptions/active
 * Get user's active subscription
 */
router.get('/active', async (req, res) => {
  try {
    const userId = req.user.id;
    const subscription = await SubscriptionService.getUserActiveSubscription(userId);

    if (!subscription) {
      return ApiResponse.success(res, {
        message: 'No active subscription found',
        subscription: null
      });
    }

    return ApiResponse.success(res, {
      message: 'Active subscription retrieved successfully',
      subscription
    });
  } catch (error: any) {
    logger.error('Error getting active subscription:', error);
    return ApiResponse.error(res, 'Failed to retrieve active subscription');
  }
});

/**
 * GET /api/subscriptions/history
 * Get user's subscription history
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const subscriptions = await SubscriptionService.getUserSubscriptionHistory(userId);

    ApiResponse.success(res, {
      message: 'Subscription history retrieved successfully',
      subscriptions
    });
  } catch (error) {
    logger.error('Error getting subscription history:', error);
    ApiResponse.error(res, 'Failed to retrieve subscription history');
  }
});

/**
 * POST /api/subscriptions/:id/cancel
 * Cancel a subscription
 */
router.post('/:id/cancel', [
  param('id').isMongoId().withMessage('Valid subscription ID is required'),
  body('reason').optional().isString().trim().isLength({ max: 500 }).withMessage('Reason must be less than 500 characters')
], async (req: express.Request, res: express.Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.validationError(res, errors.array());
    }

    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const subscription = await SubscriptionService.cancelSubscription(id, userId, reason);

    return ApiResponse.success(res, {
      message: 'Subscription cancelled successfully',
      subscription
    });
  } catch (error: any) {
    logger.error('Error cancelling subscription:', error);
    return ApiResponse.error(res, error.message || 'Failed to cancel subscription');
  }
});

/**
 * POST /api/subscriptions/:id/renew
 * Renew an expired subscription
 */
router.post('/:id/renew', [
  param('id').isMongoId().withMessage('Valid subscription ID is required')
], async (req: express.Request, res: express.Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.validationError(res, errors.array());
    }

    const { id } = req.params;

    const subscription = await SubscriptionService.renewSubscription(id);

    if (!subscription) {
      return ApiResponse.error(res, 'Subscription not found or cannot be renewed', 404);
    }

    return ApiResponse.success(res, {
      message: 'Subscription renewed successfully',
      subscription
    });
  } catch (error: any) {
    logger.error('Error renewing subscription:', error);
    return ApiResponse.error(res, error.message || 'Failed to renew subscription');
  }
});

/**
 * POST /api/subscriptions/validate
 * Validate subscription for ride booking
 */
router.post('/validate', async (req, res) => {
  try {
    const userId = req.user.id;
    const validation = await SubscriptionService.validateSubscriptionForRide(userId);

    ApiResponse.success(res, {
      message: 'Subscription validation completed',
      validation
    });
  } catch (error) {
    logger.error('Error validating subscription:', error);
    ApiResponse.error(res, 'Failed to validate subscription');
  }
});

/**
 * POST /api/subscriptions/apply
 * Apply subscription to a ride (internal use)
 */
router.post('/apply', [
  body('subscriptionId').isMongoId().withMessage('Valid subscription ID is required')
], async (req: express.Request, res: express.Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.validationError(res, errors.array());
    }

    const { subscriptionId } = req.body;
    const success = await SubscriptionService.applySubscriptionToRide(subscriptionId);

    if (!success) {
      return ApiResponse.error(res, 'Failed to apply subscription to ride', 400);
    }

    return ApiResponse.success(res, {
      message: 'Subscription applied to ride successfully'
    });
  } catch (error: any) {
    logger.error('Error applying subscription to ride:', error);
    return ApiResponse.error(res, 'Failed to apply subscription to ride');
  }
});

/**
 * GET /api/subscriptions/stats
 * Get subscription statistics (admin only)
 */
router.get('/admin/stats', async (_req, res) => {
  try {
    // TODO: Add admin role check
    const stats = await SubscriptionService.getSubscriptionStats();

    ApiResponse.success(res, {
      message: 'Subscription statistics retrieved successfully',
      stats
    });
  } catch (error) {
    logger.error('Error getting subscription stats:', error);
    ApiResponse.error(res, 'Failed to retrieve subscription statistics');
  }
});

export default router;
