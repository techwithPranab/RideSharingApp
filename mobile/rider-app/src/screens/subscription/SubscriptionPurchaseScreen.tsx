/**
 * Subscription Purchase Screen
 * Handles the purchase flow for subscription plans
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  RootStackParamList,
  SubscriptionPlan,
  PaymentMethodType,
  APIResponse,
  PaymentMethod
} from '../../types';
import { subscriptionAPI, paymentAPI } from '../../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RoutePropType = RouteProp<RootStackParamList, 'SubscriptionPurchase'>;

const SubscriptionPurchaseScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { planId } = route.params;

  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>('card');
  const [autoRenew, setAutoRenew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlanDetails();
    fetchPaymentMethods();
  }, []);

  const fetchPlanDetails = async () => {
    try {
      const response = await subscriptionAPI.getPlans();
      const result: APIResponse<SubscriptionPlan[]> = response.data;

      if (result.success && result.data) {
        const selectedPlan = result.data.find(p => p.id === planId);
        if (selectedPlan) {
          setPlan(selectedPlan);
        } else {
          setError('Plan not found');
        }
      } else {
        setError(result.message || 'Failed to load plan details');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load plan details');
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await paymentAPI.getPaymentMethods();
      const result: APIResponse<PaymentMethod[]> = response.data;

      if (result.success && result.data) {
        // Set default payment method if available
        const defaultMethod = result.data.find(pm => pm.isDefault);
        if (defaultMethod) {
          setSelectedPaymentMethod(defaultMethod.type);
        }
      }
    } catch (err: any) {
      // Payment methods are optional, don't set error
      console.log('Failed to load payment methods:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!plan) return;

    try {
      setPurchasing(true);
      setError(null);

      const purchaseData = {
        planId: plan.id,
        paymentMethod: selectedPaymentMethod,
        autoRenew,
      };

      const response = await subscriptionAPI.purchaseSubscription(purchaseData);
      const result: APIResponse<any> = response.data;

      if (result.success) {
        // Show success notification
        Alert.alert(
          '🎉 Subscription Activated!',
          `Welcome to ${plan.name}! Your subscription is now active and you can start saving on rides.`,
          [
            {
              text: 'Great!',
              onPress: () => navigation.navigate('SubscriptionManagement'),
            },
          ]
        );
      } else {
        setError(result.message || 'Failed to purchase subscription');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to purchase subscription');
    } finally {
      setPurchasing(false);
    }
  };

  const getPaymentMethodIcon = (type: PaymentMethodType) => {
    switch (type) {
      case 'card':
        return '💳';
      case 'upi':
        return '📱';
      case 'wallet':
        return '👛';
      default:
        return '💳';
    }
  };

  const getPaymentMethodLabel = (type: PaymentMethodType) => {
    switch (type) {
      case 'card':
        return 'Credit/Debit Card';
      case 'upi':
        return 'UPI';
      case 'wallet':
        return 'Wallet';
      default:
        return 'Card';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading plan details...</Text>
      </View>
    );
  }

  if (error && !plan) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPlanDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Plan not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Purchase Subscription</Text>
        <Text style={styles.headerSubtitle}>
          Review your plan and complete payment
        </Text>
      </View>

      {/* Plan Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plan Summary</Text>
        <View style={styles.planSummary}>
          <View style={styles.planHeader}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planPrice}>
              {plan.currency} {plan.price}
            </Text>
          </View>

          <View style={styles.planFeatures}>
            {plan.features.unlimitedRides ? (
              <Text style={styles.featureText}>✓ Unlimited rides</Text>
            ) : (
              <Text style={styles.featureText}>
                ✓ Up to {plan.features.maxRides} rides
              </Text>
            )}
            <Text style={styles.featureText}>
              ✓ {plan.features.discountPercentage}% discount on rides
            </Text>
            {plan.features.priorityBooking && (
              <Text style={styles.featureText}>✓ Priority booking</Text>
            )}
            <Text style={styles.featureText}>
              ✓ Valid for {plan.features.validDays} days
            </Text>
          </View>
        </View>
      </View>

      {/* Payment Method Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.paymentMethods}>
          {(['card', 'upi', 'wallet'] as PaymentMethodType[]).map((method) => (
            <TouchableOpacity
              key={method}
              style={[
                styles.paymentMethod,
                selectedPaymentMethod === method && styles.selectedPaymentMethod,
              ]}
              onPress={() => setSelectedPaymentMethod(method)}
            >
              <Text style={styles.paymentMethodIcon}>
                {getPaymentMethodIcon(method)}
              </Text>
              <Text style={styles.paymentMethodLabel}>
                {getPaymentMethodLabel(method)}
              </Text>
              {selectedPaymentMethod === method && (
                <View style={styles.selectedIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Auto Renew Option */}
      <View style={styles.section}>
        <View style={styles.autoRenewContainer}>
          <View style={styles.autoRenewText}>
            <Text style={styles.sectionTitle}>Auto Renew</Text>
            <Text style={styles.autoRenewDescription}>
              Automatically renew subscription when it expires
            </Text>
          </View>
          <Switch
            value={autoRenew}
            onValueChange={setAutoRenew}
            trackColor={{ false: '#E5E5E5', true: '#34C759' }}
            thumbColor={autoRenew ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Purchase Button */}
      <View style={styles.purchaseContainer}>
        <TouchableOpacity
          style={[styles.purchaseButton, purchasing && styles.purchaseButtonDisabled]}
          onPress={handlePurchase}
          disabled={purchasing}
        >
          {purchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.purchaseButtonText}>
              Pay {plan.currency} {plan.price}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 20,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  planSummary: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  planFeatures: {
    marginTop: 8,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 6,
    lineHeight: 22,
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentMethod: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    marginHorizontal: 4,
    position: 'relative',
  },
  selectedPaymentMethod: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  paymentMethodIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  paymentMethodLabel: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  autoRenewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  autoRenewText: {
    flex: 1,
  },
  autoRenewDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: '#FFF2F2',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
  },
  purchaseContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  purchaseButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SubscriptionPurchaseScreen;
