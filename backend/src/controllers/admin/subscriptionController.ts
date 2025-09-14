/**
 * Admin Subscription Management Controller
 * Handles all subscription-related administrative operations
 */

import { Request, Response } from 'express';
import {
  SubscriptionPlan,
  Subscription,
  SubscriptionPayment,
  SubscriptionStatus,
  SubscriptionPaymentStatus
} from '../../models/Subscription';
import { asyncHandler } from '../../middleware/asyncHandler';

/**
 * Get all subscription plans
 */
export const getSubscriptionPlans = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 10, type, active } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build query
  const query: any = {};
  if (type && type !== 'all') {
    query.type = type;
  }
  if (active !== undefined) {
    query.isActive = active === 'true';
  }

  const plans = await SubscriptionPlan.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const totalPlans = await SubscriptionPlan.countDocuments(query);

  // Transform plans to match frontend expectations
  const transformedPlans = plans.map(plan => {
    const planObj = plan.toObject();

    // Convert features object to array for frontend compatibility
    const featuresArray = [];
    if (planObj.features) {
      if (planObj.features.unlimitedRides) featuresArray.push('Unlimited rides');
      if (planObj.features.priorityBooking) featuresArray.push('Priority booking');
      if (planObj.features.discountedRides) featuresArray.push(`Discounted rides (${planObj.features.discountPercentage}%)`);
      if (planObj.features.freeCancellation) featuresArray.push('Free cancellation');
      if (planObj.features.dedicatedSupport) featuresArray.push('Dedicated support');
      if (planObj.features.earlyAccess) featuresArray.push('Early access to features');
      if (planObj.features.maxRidesPerPeriod) featuresArray.push(`Max ${planObj.features.maxRidesPerPeriod} rides per period`);
    }

    return {
      ...planObj,
      features: featuresArray
    };
  });

  res.status(200).json({
    success: true,
    data: {
      plans: transformedPlans,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalPlans / limitNum),
        totalPlans
      }
    }
  });
});

/**
 * Get subscription plan by ID
 */
export const getSubscriptionPlanById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const plan = await SubscriptionPlan.findById(id);
  if (!plan) {
    res.status(404).json({
      success: false,
      message: 'Subscription plan not found'
    });
    return;
  }

  // Transform plan to match frontend expectations
  const planObj = plan.toObject();
  const featuresArray = [];
  if (planObj.features) {
    if (planObj.features.unlimitedRides) featuresArray.push('Unlimited rides');
    if (planObj.features.priorityBooking) featuresArray.push('Priority booking');
    if (planObj.features.discountedRides) featuresArray.push(`Discounted rides (${planObj.features.discountPercentage}%)`);
    if (planObj.features.freeCancellation) featuresArray.push('Free cancellation');
    if (planObj.features.dedicatedSupport) featuresArray.push('Dedicated support');
    if (planObj.features.earlyAccess) featuresArray.push('Early access to features');
    if (planObj.features.maxRidesPerPeriod) featuresArray.push(`Max ${planObj.features.maxRidesPerPeriod} rides per period`);
  }

  const transformedPlan = {
    ...planObj,
    features: featuresArray
  };

  res.status(200).json({
    success: true,
    data: { plan: transformedPlan }
  });
});

/**
 * Create new subscription plan
 */
export const createSubscriptionPlan = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const {
    name,
    type,
    description,
    price,
    billingCycle,
    features,
    maxRides,
    priorityBooking,
    dedicatedSupport,
    discountPercentage
  } = req.body;

  const plan = await SubscriptionPlan.create({
    name,
    type,
    description,
    price,
    billingCycle,
    features: features || [],
    maxRides,
    priorityBooking: priorityBooking || false,
    dedicatedSupport: dedicatedSupport || false,
    discountPercentage: discountPercentage || 0
  });

  res.status(201).json({
    success: true,
    data: { plan },
    message: 'Subscription plan created successfully'
  });
});

/**
 * Update subscription plan
 */
export const updateSubscriptionPlan = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updateData = req.body;

  // Remove fields that shouldn't be updated directly
  delete updateData._id;
  delete updateData.createdAt;

  const plan = await SubscriptionPlan.findByIdAndUpdate(
    id,
    { ...updateData, updatedAt: new Date() },
    { new: true }
  );

  if (!plan) {
    res.status(404).json({
      success: false,
      message: 'Subscription plan not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: { plan },
    message: 'Subscription plan updated successfully'
  });
});

/**
 * Delete subscription plan (soft delete by deactivating)
 */
export const deleteSubscriptionPlan = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const plan = await SubscriptionPlan.findByIdAndUpdate(
    id,
    { isActive: false, updatedAt: new Date() },
    { new: true }
  );

  if (!plan) {
    res.status(404).json({
      success: false,
      message: 'Subscription plan not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: { plan },
    message: 'Subscription plan deactivated successfully'
  });
});

/**
 * Get all user subscriptions
 */
export const getSubscriptions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const {
    page = 1,
    limit = 10,
    status,
    planId,
    userId,
    search
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build query
  const query: any = {};
  if (status && status !== 'all') {
    query.status = status;
  }
  if (planId) {
    query.planId = planId;
  }
  if (userId) {
    query.userId = userId;
  }

  let subscriptions = await Subscription.find(query)
    .populate('userId', 'firstName lastName email phoneNumber')
    .populate('planId', 'name type price billingCycle')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  // Apply search filter if provided
  if (search) {
    const searchRegex = new RegExp(search as string, 'i');
    subscriptions = subscriptions.filter(sub =>
      sub.userId &&
      (searchRegex.test((sub.userId as any).firstName) ||
       searchRegex.test((sub.userId as any).lastName) ||
       searchRegex.test((sub.userId as any).email))
    );
  }

  const totalSubscriptions = await Subscription.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      subscriptions,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalSubscriptions / limitNum),
        totalSubscriptions
      }
    }
  });
});

/**
 * Get subscription by ID
 */
export const getSubscriptionById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const subscription = await Subscription.findById(id)
    .populate('userId', 'firstName lastName email phoneNumber')
    .populate('planId');

  if (!subscription) {
    res.status(404).json({
      success: false,
      message: 'Subscription not found'
    });
    return;
  }

  // Get subscription payments
  const payments = await SubscriptionPayment.find({ subscriptionId: id })
    .sort({ createdAt: -1 })
    .limit(10);

  res.status(200).json({
    success: true,
    data: {
      subscription,
      payments
    }
  });
});

/**
 * Update subscription status
 */
export const updateSubscriptionStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, cancellationReason } = req.body;

  if (!Object.values(SubscriptionStatus).includes(status)) {
    res.status(400).json({
      success: false,
      message: 'Invalid status value'
    });
    return;
  }

  const subscription = await Subscription.findById(id);
  if (!subscription) {
    res.status(404).json({
      success: false,
      message: 'Subscription not found'
    });
    return;
  }

  // Update status
  subscription.status = status;
  subscription.updatedAt = new Date();

  // Handle cancellation
  if (status === SubscriptionStatus.CANCELLED) {
    subscription.cancelledAt = new Date();
    subscription.autoRenew = false;
    if (cancellationReason) {
      subscription.cancellationReason = cancellationReason;
    }
  }

  await subscription.save();

  res.status(200).json({
    success: true,
    data: { subscription },
    message: `Subscription status updated to ${status}`
  });
});

/**
 * Get subscription statistics
 */
export const getSubscriptionStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { period = 'month' } = req.query;

  let startDate: Date;
  const now = new Date();

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const [
    totalSubscriptions,
    activeSubscriptions,
    cancelledSubscriptions,
    totalRevenue,
    subscriptionsByPlan,
    subscriptionsByStatus,
    revenueByMonth,
    expiringSoon
  ] = await Promise.all([
    // Total subscriptions in period
    Subscription.countDocuments({ createdAt: { $gte: startDate } }),

    // Active subscriptions
    Subscription.countDocuments({
      status: SubscriptionStatus.ACTIVE,
      createdAt: { $gte: startDate }
    }),

    // Cancelled subscriptions
    Subscription.countDocuments({
      status: SubscriptionStatus.CANCELLED,
      createdAt: { $gte: startDate }
    }),

    // Total revenue from subscriptions
    SubscriptionPayment.aggregate([
      { $match: { status: SubscriptionPaymentStatus.PAID, createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),

    // Subscriptions by plan
    Subscription.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $lookup: {
          from: 'subscriptionplans',
          localField: 'planId',
          foreignField: '_id',
          as: 'plan'
        }
      },
      { $unwind: '$plan' },
      { $group: { _id: '$plan.name', count: { $sum: 1 } } }
    ]),

    // Subscriptions by status
    Subscription.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),

    // Revenue by month
    SubscriptionPayment.aggregate([
      { $match: { status: SubscriptionPaymentStatus.PAID, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]),

    // Subscriptions expiring soon (next 7 days)
    Subscription.countDocuments({
      status: SubscriptionStatus.ACTIVE,
      endDate: {
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        $gt: new Date()
      }
    })
  ]);

  const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

  res.status(200).json({
    success: true,
    data: {
      period,
      overview: {
        totalSubscriptions,
        activeSubscriptions,
        cancelledSubscriptions,
        totalRevenue: revenue,
        churnRate: totalSubscriptions > 0 ? ((cancelledSubscriptions / totalSubscriptions) * 100).toFixed(1) : '0.0',
        expiringSoon
      },
      charts: {
        subscriptionsByPlan,
        subscriptionsByStatus,
        revenueByMonth
      }
    }
  });
});

/**
 * Get subscription payments
 */
export const getSubscriptionPayments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const {
    page = 1,
    limit = 10,
    status,
    subscriptionId,
    userId
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build query
  const query: any = {};
  if (status && status !== 'all') {
    query.status = status;
  }
  if (subscriptionId) {
    query.subscriptionId = subscriptionId;
  }
  if (userId) {
    query.userId = userId;
  }

  const payments = await SubscriptionPayment.find(query)
    .populate('subscriptionId')
    .populate('userId', 'firstName lastName email')
    .populate('planId', 'name type')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const totalPayments = await SubscriptionPayment.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      payments,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalPayments / limitNum),
        totalPayments
      }
    }
  });
});

/**
 * Process subscription payment refund
 */
export const processSubscriptionRefund = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { amount, reason } = req.body;

  const payment = await SubscriptionPayment.findById(id);
  if (!payment) {
    res.status(404).json({
      success: false,
      message: 'Subscription payment not found'
    });
    return;
  }

  if (payment.status !== SubscriptionPaymentStatus.PAID) {
    res.status(400).json({
      success: false,
      message: 'Can only refund paid payments'
    });
    return;
  }

  // Update payment status
  payment.status = SubscriptionPaymentStatus.REFUNDED;
  payment.metadata = {
    ...payment.metadata,
    refundAmount: amount || payment.amount,
    refundReason: reason,
    refundedAt: new Date(),
    refundedBy: 'admin'
  };

  await payment.save();

  // Update subscription total paid
  const subscription = await Subscription.findById(payment.subscriptionId);
  if (subscription) {
    subscription.totalPaid -= amount || payment.amount;
    await subscription.save();
  }

  res.status(200).json({
    success: true,
    data: { payment },
    message: `Refund of $${amount || payment.amount} processed successfully`
  });
});

/**
 * Get subscriptions expiring soon
 */
export const getExpiringSubscriptions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { days = 7 } = req.query;

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + parseInt(days as string));

  const subscriptions = await Subscription.find({
    status: SubscriptionStatus.ACTIVE,
    endDate: { $lte: futureDate, $gt: new Date() },
    autoRenew: true
  })
  .populate('userId', 'firstName lastName email phoneNumber')
  .populate('planId', 'name type price')
  .sort({ endDate: 1 });

  res.status(200).json({
    success: true,
    data: {
      subscriptions,
      totalExpiring: subscriptions.length
    }
  });
});

/**
 * Bulk update subscription plans
 */
export const bulkUpdateSubscriptions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { subscriptionIds, updates } = req.body;

  if (!subscriptionIds || !Array.isArray(subscriptionIds)) {
    res.status(400).json({
      success: false,
      message: 'Subscription IDs array is required'
    });
    return;
  }

  const result = await Subscription.updateMany(
    { _id: { $in: subscriptionIds } },
    { ...updates, updatedAt: new Date() }
  );

  res.status(200).json({
    success: true,
    data: {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    },
    message: `Updated ${result.modifiedCount} subscriptions`
  });
});
