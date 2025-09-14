/**
 * Payout History Screen Component
 * Shows driver's withdrawal and payout history
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import types
import { EarningsStackParamList } from '../../navigation/types';

// Import API
// import { driverAPI } from '../../services/api';

type PayoutHistoryScreenNavigationProp = StackNavigationProp<EarningsStackParamList, 'PayoutHistory'>;

interface PayoutItem {
  id: string;
  amount: number;
  status: string;
  requestedAt: string;
  completedAt?: string;
  failedAt?: string;
  description: string;
}

const PayoutHistoryScreen: React.FC = () => {
  const navigation = useNavigation<PayoutHistoryScreenNavigationProp>();
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPayoutHistory();
  }, []);

  const fetchPayoutHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const driverId = await AsyncStorage.getItem('driver_id');
      if (!driverId) {
        setError('Driver ID not found');
        return;
      }

      // Note: The API might need to be updated to have a separate endpoint for withdrawal history
      // For now, we'll show mock data

      // Mock data for demonstration
      const mockPayouts: PayoutItem[] = [
        {
          id: '1',
          amount: 2500.00,
          status: 'completed',
          requestedAt: '2024-01-15T10:30:00Z',
          completedAt: '2024-01-16T14:20:00Z',
          description: 'Driver withdrawal request - ₹2500.00'
        },
        {
          id: '2',
          amount: 1800.00,
          status: 'pending',
          requestedAt: '2024-01-10T09:15:00Z',
          description: 'Driver withdrawal request - ₹1800.00'
        },
        {
          id: '3',
          amount: 3200.00,
          status: 'completed',
          requestedAt: '2024-01-05T16:45:00Z',
          completedAt: '2024-01-06T11:30:00Z',
          description: 'Driver withdrawal request - ₹3200.00'
        }
      ];

      setPayouts(mockPayouts);
    } catch (err: any) {
      console.error('Error fetching payout history:', err);
      setError(err.response?.data?.message || 'Failed to load payout history');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'processing':
        return '#2196F3';
      case 'failed':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const renderPayoutItem = ({ item }: { item: PayoutItem }) => (
    <View style={styles.payoutItem}>
      <View style={styles.itemLeft}>
        <Text style={styles.itemDescription}>{item.description}</Text>
        <Text style={styles.itemDate}>
          Requested: {formatDate(item.requestedAt)}
        </Text>
        {item.completedAt && (
          <Text style={styles.itemDate}>
            Completed: {formatDate(item.completedAt)}
          </Text>
        )}
        {item.failedAt && (
          <Text style={styles.itemDate}>
            Failed: {formatDate(item.failedAt)}
          </Text>
        )}
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemAmount}>₹{item.amount.toFixed(2)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading payout history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPayoutHistory}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Payout History</Text>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            ₹{payouts.reduce((sum: number, item: PayoutItem) => sum + item.amount, 0).toFixed(2)}
          </Text>
          <Text style={styles.summaryLabel}>Total Withdrawn</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {payouts.filter((item: PayoutItem) => item.status === 'completed').length}
          </Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {payouts.filter((item: PayoutItem) => item.status === 'pending').length}
          </Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Withdrawal History</Text>

        {payouts.length > 0 ? (
          <FlatList
            data={payouts}
            renderItem={renderPayoutItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No payout history found</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listContent: {
    padding: 16,
  },
  payoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemLeft: {
    flex: 1,
  },
  itemDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default PayoutHistoryScreen;
