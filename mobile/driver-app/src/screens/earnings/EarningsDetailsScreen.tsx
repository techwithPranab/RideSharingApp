/**
 * Earnings Details Screen Component
 * Shows detailed earnings breakdown for a specific period
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import types
import { EarningsStackParamList } from '../../navigation/types';

// Import API
import { driverAPI } from '../../services/api';

type EarningsDetailsScreenNavigationProp = StackNavigationProp<EarningsStackParamList, 'EarningsDetails'>;
type EarningsDetailsScreenRouteProp = RouteProp<EarningsStackParamList, 'EarningsDetails'>;

interface EarningsItem {
  id: string;
  amount: number;
  type: string;
  description: string;
  completedAt: string;
  rideId: string;
}

const EarningsDetailsScreen: React.FC = () => {
  const navigation = useNavigation<EarningsDetailsScreenNavigationProp>();
  const route = useRoute<EarningsDetailsScreenRouteProp>();
  const { period } = route.params;

  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<EarningsItem[]>([]);
  const [summary, setSummary] = useState({
    totalEarnings: 0,
    totalRides: 0,
    averageEarning: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEarningsDetails();
  }, [period]);

  const fetchEarningsDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const driverId = await AsyncStorage.getItem('driver_id');
      if (!driverId) {
        setError('Driver ID not found');
        return;
      }

      const response = await driverAPI.getEarningsHistory(driverId, 1, 50); // Get more detailed history
      if (response.data.success) {
        const earningsData = response.data.data.earnings;
        setEarnings(earningsData);

        // Calculate summary
        const totalEarnings = earningsData.reduce((sum: number, item: EarningsItem) => sum + item.amount, 0);
        const totalRides = earningsData.filter((item: EarningsItem) => item.type === 'RIDE_PAYMENT').length;
        const averageEarning = totalRides > 0 ? totalEarnings / totalRides : 0;

        setSummary({
          totalEarnings,
          totalRides,
          averageEarning,
        });
      } else {
        setError('Failed to load earnings details');
      }
    } catch (err: any) {
      console.error('Error fetching earnings details:', err);
      setError(err.response?.data?.message || 'Failed to load earnings details');
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

  const getPeriodLabel = () => {
    switch (period) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'year':
        return 'This Year';
      default:
        return period;
    }
  };

  const renderEarningsItem = ({ item }: { item: EarningsItem }) => (
    <View style={styles.earningsItem}>
      <View style={styles.itemLeft}>
        <Text style={styles.itemDescription}>{item.description}</Text>
        <Text style={styles.itemDate}>{formatDate(item.completedAt)}</Text>
        <Text style={styles.itemType}>{item.type.replace('_', ' ')}</Text>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemAmount}>₹{item.amount.toFixed(2)}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading earnings details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchEarningsDetails}>
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
        <Text style={styles.title}>Earnings Details</Text>
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.periodLabel}>{getPeriodLabel()}</Text>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>₹{summary.totalEarnings.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Total Earnings</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.totalRides}</Text>
            <Text style={styles.summaryLabel}>Total Rides</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>₹{summary.averageEarning.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Average per Ride</Text>
          </View>
        </View>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Earnings Breakdown</Text>

        {earnings.length > 0 ? (
          <FlatList
            data={earnings}
            renderItem={renderEarningsItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No earnings found for this period</Text>
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
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
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
  earningsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  itemType: {
    fontSize: 10,
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
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

export default EarningsDetailsScreen;
