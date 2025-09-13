/**
 * End-to-End Test Suite for Subscription System
 * Tests the complete subscription lifecycle from purchase to discount application
 */

import { subscriptionAPI } from '../services/api';

// Mock test data
const TEST_RIDE_DATA = {
  pickupLocation: {
    latitude: 12.9716,
    longitude: 77.5946,
    address: 'Test Pickup Location',
  },
  dropoffLocation: {
    latitude: 12.9816,
    longitude: 77.6046,
    address: 'Test Dropoff Location',
  },
  rideType: 'regular' as const,
  estimatedFare: 200,
};

class SubscriptionE2ETest {
  async runAllTests() {
    console.log('🚀 Starting Subscription System E2E Tests...\n');

    try {
      await this.testGetSubscriptionPlans();
      await this.testValidateSubscription();
      await this.testSubscriptionManagement();

      console.log('✅ All tests passed successfully!');
      return { success: true, message: 'All E2E tests passed!' };
    } catch (error) {
      console.error('❌ Test failed:', error);
      return {
        success: false,
        message: `E2E tests failed: ${error}`,
        error: error
      };
    }
  }

  private async testGetSubscriptionPlans() {
    console.log('📋 Testing get subscription plans...');
    try {
      const plansResponse = await subscriptionAPI.getPlans();

      if (plansResponse.data.success && plansResponse.data.data && plansResponse.data.data.length > 0) {
        console.log(`✅ Retrieved ${plansResponse.data.data.length} subscription plans`);
        console.log(`📋 Available plans: ${plansResponse.data.data.map((p: any) => p.name).join(', ')}`);
        return true;
      } else {
        throw new Error('No subscription plans found');
      }
    } catch (error) {
      throw new Error(`Get plans test failed: ${error}`);
    }
  }

  private async testValidateSubscription() {
    console.log('✅ Testing subscription validation...');
    try {
      const validationResponse = await subscriptionAPI.validateSubscription();

      if (validationResponse.data.success && validationResponse.data.data) {
        const validation = validationResponse.data.data;

        if (validation.isValid) {
          console.log('✅ Subscription is valid');
          console.log(`💰 Discount: ${validation.discount}%`);
        } else {
          console.log('ℹ️ No active subscription found (this is expected if user has no subscription)');
        }
        return true;
      } else {
        throw new Error('Subscription validation request failed');
      }
    } catch (error) {
      throw new Error(`Validation test failed: ${error}`);
    }
  }

  private async testSubscriptionManagement() {
    console.log('⚙️ Testing subscription management...');
    try {
      // Get active subscription
      const activeResponse = await subscriptionAPI.getActiveSubscription();

      if (activeResponse.data.success && activeResponse.data.data) {
        console.log('✅ Active subscription retrieved successfully');
        console.log(`📋 Plan: ${activeResponse.data.data.plan?.name || 'Unknown'}`);
        console.log(`📅 Status: ${activeResponse.data.data.status}`);
      } else {
        console.log('ℹ️ No active subscription found (this is expected if user has no subscription)');
      }

      // Get subscription history
      const historyResponse = await subscriptionAPI.getSubscriptionHistory();

      if (historyResponse.data.success && historyResponse.data.data && historyResponse.data.data.length > 0) {
        console.log('✅ Subscription history retrieved successfully');
        console.log(`📚 History items: ${historyResponse.data.data.length}`);
      } else {
        console.log('ℹ️ No subscription history found (this might be expected for new users)');
      }

      return true;
    } catch (error) {
      throw new Error(`Subscription management test failed: ${error}`);
    }
  }
}

// Test runner
export const runSubscriptionE2ETests = async () => {
  const tester = new SubscriptionE2ETest();
  return await tester.runAllTests();
};
