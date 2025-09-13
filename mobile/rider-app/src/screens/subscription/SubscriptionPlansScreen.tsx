/**
 * Subscription Plans Screen
 * Displays available subscription plans for users to choose from
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, SubscriptionPlan, APIResponse } from '../../types';
import { subscriptionAPI } from '../../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SubscriptionPlansScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionPlans();
  }, []);

  const fetchSubscriptionPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await subscriptionAPI.getPlans();
      const result: APIResponse<SubscriptionPlan[]> = response.data;

      if (result.success && result.data) {
        setPlans(result.data);
      } else {
        setError(result.message || 'Failed to load subscription plans');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    navigation.navigate('SubscriptionPurchase', { planId: plan.id });
  };

  const getPlanTypeColor = (type: string) => {
    switch (type) {
      case 'daily':
        return '#007AFF';
      case 'weekly':
        return '#34C759';
      case 'monthly':
        return '#FF9500';
      case 'yearly':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return `${currency} ${price}`;
  };

  const renderPlanCard = (plan: SubscriptionPlan) => (
    <TouchableOpacity
      key={plan.id}
      style={[styles.planCard, { borderLeftColor: getPlanTypeColor(plan.type) }]}
      onPress={() => handlePlanSelect(plan)}
    >
      <View style={styles.planHeader}>
        <Text style={styles.planName}>{plan.name}</Text>
        <Text style={[styles.planType, { color: getPlanTypeColor(plan.type) }]}>
          {plan.type.charAt(0).toUpperCase() + plan.type.slice(1)}
        </Text>
      </View>

      <Text style={styles.planPrice}>
        {formatPrice(plan.price, plan.currency)}
      </Text>

      <View style={styles.featuresContainer}>
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

      <TouchableOpacity
        style={[styles.selectButton, { backgroundColor: getPlanTypeColor(plan.type) }]}
        onPress={() => handlePlanSelect(plan)}
      >
        <Text style={styles.selectButtonText}>Select Plan</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading subscription plans...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSubscriptionPlans}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
        <Text style={styles.headerSubtitle}>
          Save money with our subscription plans and enjoy priority booking
        </Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {plans.map(renderPlanCard)}
      </ScrollView>
    </View>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
  planType: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 16,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  selectButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
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

export default SubscriptionPlansScreen;
