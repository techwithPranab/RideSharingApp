/**
 * Subscription Service
 * Handles subscription management, validation, and auto-application logic
 */

import { Subscription, ISubscription, SubscriptionStatus, SubscriptionPaymentMethod } from '../models/Subscription';
import { SubscriptionPlan, ISubscriptionPlan } from '../models/SubscriptionPlan';
import { User } from '../models/User';
import { PaymentMethod } from '../models/Payment';
import { PaymentService } from './paymentService';
import { emailService } from './emailService';
import { logger } from '../utils/logger';

export interface SubscriptionPurchaseRequest {
  userId: string;
  planId: string;
  paymentMethod: SubscriptionPaymentMethod;
  autoRenew?: boolean;
}

export interface SubscriptionValidationResult {
  isValid: boolean;
  subscription?: ISubscription;
  discount?: number;
  error?: string;
}

export class SubscriptionService {
  /**
   * Purchase a new subscription
   */
  static async purchaseSubscription(request: SubscriptionPurchaseRequest): Promise<ISubscription> {
    try {
      const { userId, planId, paymentMethod, autoRenew = true } = request;

      // Validate user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Validate plan
      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      if (plan.status !== 'active') {
        throw new Error('Subscription plan is not available');
      }

      // Check if user already has an active subscription
      const existingSubscription = await Subscription.findOne({
        userId,
        status: SubscriptionStatus.ACTIVE,
        endDate: { $gt: new Date() }
      });

      if (existingSubscription) {
        throw new Error('User already has an active subscription');
      }

      // Process payment
      await PaymentService.createOrder({
        amount: plan.price,
        currency: plan.currency,
        method: PaymentMethod.CARD,
        description: `Subscription: ${plan.name}`,
        payerId: userId
      });

      // Create subscription
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration);

      const subscription = new Subscription({
        userId,
        planId,
        status: SubscriptionStatus.PENDING,
        startDate,
        endDate,
        autoRenew,
        paymentMethod,
        totalPaid: plan.price,
        currency: plan.currency,
        ridesUsed: 0,
        ridesRemaining: plan.features.unlimitedRides ? undefined : plan.features.maxRidesPerPeriod
      });

      await subscription.save();

      // Update user's subscription status
      user.activeSubscriptionId = subscription._id;
      user.subscriptionStatus = 'active';
      user.subscriptionExpiryDate = endDate;
      await user.save();

      // Send subscription confirmation email
      if (user.email) {
        try {
          await emailService.sendSubscriptionConfirmation(
            user.email,
            `${user.firstName} ${user.lastName}`,
            plan.name,
            plan.price
          );
          logger.info(`Subscription confirmation email sent to ${user.email}`);
        } catch (emailError) {
          logger.error('Failed to send subscription confirmation email:', emailError);
          // Don't fail the subscription if email fails
        }
      }

      logger.info(`Subscription purchased: ${subscription._id} for user ${userId}`);

      return subscription;
    } catch (error) {
      logger.error('Error purchasing subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(subscriptionId: string, userId: string, reason?: string): Promise<ISubscription> {
    try {
      const subscription = await Subscription.findOne({
        _id: subscriptionId,
        userId,
        status: SubscriptionStatus.ACTIVE
      });

      if (!subscription) {
        throw new Error('Active subscription not found');
      }

      // Cancel subscription
      subscription.status = SubscriptionStatus.CANCELLED;
      subscription.cancelledAt = new Date();
      subscription.autoRenew = false;
      if (reason) {
        subscription.cancellationReason = reason;
      }
      await subscription.save();

      // Update user's subscription status
      const user = await User.findById(userId);
      if (user) {
        user.subscriptionStatus = 'cancelled';
        await user.save();
      }

      logger.info(`Subscription cancelled: ${subscriptionId} for user ${userId}`);

      return subscription;
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Validate and get subscription discount for a ride
   */
  static async validateSubscriptionForRide(userId: string): Promise<SubscriptionValidationResult> {
    try {
      const subscription = await Subscription.findOne({
        userId,
        status: SubscriptionStatus.ACTIVE,
        endDate: { $gt: new Date() }
      }).populate('planId');

      if (!subscription) {
        return { isValid: false, error: 'No active subscription found' };
      }

      const plan = subscription.planId as unknown as ISubscriptionPlan;

      // Check if subscription can be used for rides
      const canUseRide = subscription.status === SubscriptionStatus.ACTIVE &&
                        new Date() <= subscription.endDate &&
                        (subscription.ridesRemaining === undefined || subscription.ridesRemaining > 0);

      if (!canUseRide) {
        return { isValid: false, error: 'Subscription cannot be used for rides' };
      }

      // Calculate discount
      let discount = 0;
      if (plan.features.discountedRides && plan.features.discountPercentage) {
        discount = plan.features.discountPercentage;
      }

      return {
        isValid: true,
        subscription,
        discount
      };
    } catch (error) {
      logger.error('Error validating subscription for ride:', error);
      return { isValid: false, error: 'Failed to validate subscription' };
    }
  }

  /**
   * Apply subscription to a ride (deduct from usage)
   */
  static async applySubscriptionToRide(subscriptionId: string): Promise<boolean> {
    try {
      const subscription = await Subscription.findById(subscriptionId);

      if (!subscription) {
        return false;
      }

      // Use ride
      subscription.ridesUsed += 1;
      if (subscription.ridesRemaining !== undefined) {
        subscription.ridesRemaining -= 1;
      }
      await subscription.save();
      logger.info(`Subscription applied to ride: ${subscriptionId}`);

      return true;
    } catch (error) {
      logger.error('Error applying subscription to ride:', error);
      return false;
    }
  }

  /**
   * Get user's active subscription
   */
  static async getUserActiveSubscription(userId: string): Promise<ISubscription | null> {
    try {
      return await Subscription.findOne({
        userId,
        status: SubscriptionStatus.ACTIVE,
        endDate: { $gt: new Date() }
      }).populate('planId');
    } catch (error) {
      logger.error('Error getting user active subscription:', error);
      return null;
    }
  }

  /**
   * Get user's subscription history
   */
  static async getUserSubscriptionHistory(userId: string): Promise<ISubscription[]> {
    try {
      return await Subscription.find({ userId })
        .populate('planId')
        .sort({ createdAt: -1 });
    } catch (error) {
      logger.error('Error getting user subscription history:', error);
      return [];
    }
  }

  /**
   * Renew an expired subscription
   */
  static async renewSubscription(subscriptionId: string): Promise<ISubscription | null> {
    try {
      const subscription = await Subscription.findById(subscriptionId).populate('planId');

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const plan = subscription.planId as unknown as ISubscriptionPlan;

      // Process payment for renewal
      await PaymentService.createOrder({
        amount: plan.price,
        currency: plan.currency,
        method: PaymentMethod.CARD,
        description: `Subscription Renewal: ${plan.name}`,
        payerId: subscription.userId.toString()
      });

      // Calculate new end date
      const newEndDate = new Date(subscription.endDate);
      newEndDate.setDate(newEndDate.getDate() + plan.duration);

      // Renew subscription
      subscription.endDate = newEndDate;
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.lastPaymentDate = new Date();
      subscription.totalPaid += plan.price;
      await subscription.save();

      // Update user's subscription status
      const user = await User.findById(subscription.userId);
      if (user) {
        user.subscriptionStatus = 'active';
        user.subscriptionExpiryDate = newEndDate;
        await user.save();
      }

      logger.info(`Subscription renewed: ${subscriptionId}`);

      return subscription;
    } catch (error) {
      logger.error('Error renewing subscription:', error);
      return null;
    }
  }

  /**
   * Process expired subscriptions
   */
  static async processExpiredSubscriptions(): Promise<number> {
    try {
      const expiredSubscriptions = await Subscription.find({
        status: SubscriptionStatus.ACTIVE,
        endDate: { $lt: new Date() }
      });

      let processedCount = 0;

      for (const subscription of expiredSubscriptions) {
        subscription.status = SubscriptionStatus.EXPIRED;
        await subscription.save();

        // Update user's subscription status
        const user = await User.findById(subscription.userId);
        if (user) {
          user.subscriptionStatus = 'expired';
          await user.save();
        }

        processedCount++;
      }

      logger.info(`Processed ${processedCount} expired subscriptions`);
      return processedCount;
    } catch (error) {
      logger.error('Error processing expired subscriptions:', error);
      return 0;
    }
  }

  /**
   * Get subscription statistics
   */
  static async getSubscriptionStats(): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    expiredSubscriptions: number;
    totalRevenue: number;
  }> {
    try {
      const [
        totalSubscriptions,
        activeSubscriptions,
        expiredSubscriptions,
        revenueResult
      ] = await Promise.all([
        Subscription.countDocuments(),
        Subscription.countDocuments({ status: SubscriptionStatus.ACTIVE }),
        Subscription.countDocuments({ status: SubscriptionStatus.EXPIRED }),
        Subscription.aggregate([
          { $group: { _id: null, totalRevenue: { $sum: '$totalPaid' } } }
        ])
      ]);

      const totalRevenue = revenueResult[0]?.totalRevenue || 0;

      return {
        totalSubscriptions,
        activeSubscriptions,
        expiredSubscriptions,
        totalRevenue
      };
    } catch (error) {
      logger.error('Error getting subscription stats:', error);
      return {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        expiredSubscriptions: 0,
        totalRevenue: 0
      };
    }
  }

  /**
   * Get available subscription plans
   */
  static async getAvailablePlans(): Promise<ISubscriptionPlan[]> {
    try {
      return await SubscriptionPlan.find({ status: 'active' }).sort({ price: 1 });
    } catch (error) {
      logger.error('Error getting available plans:', error);
      return [];
    }
  }
}
