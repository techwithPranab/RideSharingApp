/**
 * Subscription Management Screen
 * Shows user's active subscription and subscription history
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Subscription, APIResponse } from '../../types';
import { subscriptionAPI } from '../../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SubscriptionManagementScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch active subscription
      const activeResponse = await subscriptionAPI.getActiveSubscription();
      const activeResult: APIResponse<Subscription | null> = activeResponse.data;

      if (activeResult.success) {
        setActiveSubscription(activeResult.data || null);
      }

      // Fetch subscription history
      const historyResponse = await subscriptionAPI.getSubscriptionHistory();
      const historyResult: APIResponse<Subscription[]> = historyResponse.data;

      if (historyResult.success && historyResult.data) {
        setSubscriptionHistory(historyResult.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = () => {
    if (!activeSubscription) return;

    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to subscription benefits.',
      [
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            handleCancelConfirm();
          },
        },
        {
          text: 'Keep Subscription',
          style: 'cancel',
        },
      ]
    );
  };

  const handleCancelConfirm = async () => {
    if (!activeSubscription) return;

    try {
      const response = await subscriptionAPI.cancelSubscription(activeSubscription.id);
      const result: APIResponse<Subscription> = response.data;

      if (result.success) {
        Alert.alert('Success', 'Your subscription has been cancelled.');
        fetchSubscriptionData(); // Refresh data
      } else {
        Alert.alert('Error', result.message || 'Failed to cancel subscription');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to cancel subscription');
    }
  };

  const handleBuyNewSubscription = () => {
    navigation.navigate('SubscriptionPlans');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#34C759';
      case 'expired':
        return '#FF9500';
      case 'cancelled':
        return '#FF3B30';
      case 'pending':
        return '#007AFF';
      default:
        return '#8E8E93';
    }
  };

  const renderActiveSubscription = () => {
    if (!activeSubscription) {
      return (
        <View style={styles.noSubscriptionContainer}>
          <Text style={styles.noSubscriptionTitle}>No Active Subscription</Text>
          <Text style={styles.noSubscriptionText}>
            Subscribe to enjoy discounted rides and priority booking
          </Text>
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={handleBuyNewSubscription}
          >
            <Text style={styles.subscribeButtonText}>Choose a Plan</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.activeSubscriptionCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Active Subscription</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(activeSubscription.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {activeSubscription.status.charAt(0).toUpperCase() +
                activeSubscription.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.subscriptionDetails}>
          <Text style={styles.planName}>
            {activeSubscription.plan?.name || 'Subscription Plan'}
          </Text>
          <Text style={styles.planPrice}>
            {activeSubscription.currency} {activeSubscription.totalPaid}
          </Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Start Date:</Text>
            <Text style={styles.detailValue}>
              {formatDate(activeSubscription.startDate)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>End Date:</Text>
            <Text style={styles.detailValue}>
              {formatDate(activeSubscription.endDate)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rides Used:</Text>
            <Text style={styles.detailValue}>
              {activeSubscription.ridesUsed}
              {activeSubscription.maxRides && ` / ${activeSubscription.maxRides}`}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Auto Renew:</Text>
            <Text style={styles.detailValue}>
              {activeSubscription.autoRenew ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelSubscription}
          >
            <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSubscriptionHistory = () => {
    if (subscriptionHistory.length === 0) {
      return null;
    }

    return (
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Subscription History</Text>
        {subscriptionHistory.map((subscription) => (
          <View key={subscription.id} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyPlanName}>
                {subscription.plan?.name || 'Subscription Plan'}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(subscription.status) },
                ]}
              >
                <Text style={styles.statusText}>
                  {subscription.status.charAt(0).toUpperCase() +
                    subscription.status.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.historyDetails}>
              <Text style={styles.historyPrice}>
                {subscription.currency} {subscription.totalPaid}
              </Text>
              <Text style={styles.historyDate}>
                {formatDate(subscription.startDate)} - {formatDate(subscription.endDate)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading subscription data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Subscription</Text>
        <Text style={styles.headerSubtitle}>
          Manage your subscription and view history
        </Text>
      </View>

      {renderActiveSubscription()}
      {renderSubscriptionHistory()}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSubscriptionData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
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
  noSubscriptionContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  noSubscriptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  noSubscriptionText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  subscribeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  activeSubscriptionCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  subscriptionDetails: {
    marginBottom: 20,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 16,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historySection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyPlanName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  historyDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  errorContainer: {
    backgroundColor: '#FFF2F2',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
});

export default SubscriptionManagementScreen;
