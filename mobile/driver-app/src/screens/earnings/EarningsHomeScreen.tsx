/**
 * Earnings Home Screen Component
 * Displays driver's earnings overview with backend integration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import types
import { EarningsStackParamList } from '../../navigation/types';

// Import API
import { driverAPI } from '../../services/api';

type EarningsHomeScreenNavigationProp = StackNavigationProp<EarningsStackParamList, 'EarningsHome'>;

interface EarningsData {
  totalEarnings: number;
  totalRides: number;
  averageEarning: number;
  period: string;
  earnings: Array<{
    id: string;
    amount: number;
    rideId: string;
    completedAt: string;
    description: string;
  }>;
}

const EarningsHomeScreen: React.FC = () => {
  const navigation = useNavigation<EarningsHomeScreenNavigationProp>();
  const [loading, setLoading] = useState(true);
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async (period: string = 'today') => {
    try {
      setLoading(true);
      setError(null);

      const driverId = await AsyncStorage.getItem('driver_id');
      if (!driverId) {
        setError('Driver ID not found');
        return;
      }

      const response = await driverAPI.getEarnings(driverId, period);
      if (response.data.success) {
        setEarningsData(response.data.data.earnings);
      } else {
        setError('Failed to load earnings data');
      }
    } catch (err: any) {
      console.error('Error fetching earnings:', err);
      setError(err.response?.data?.message || 'Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (period: string) => {
    navigation.navigate('EarningsDetails', { period });
  };

  const handleViewPayoutHistory = () => {
    navigation.navigate('PayoutHistory');
  };

  const handleRefresh = () => {
    fetchEarnings();
  };

  const handlePeriodChange = (period: string) => {
    fetchEarnings(period);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading earnings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Earnings</Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {['today', 'week', 'month', 'year'].map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              earningsData?.period === period && styles.periodButtonActive
            ]}
            onPress={() => handlePeriodChange(period)}
          >
            <Text style={[
              styles.periodButtonText,
              earningsData?.period === period && styles.periodButtonTextActive
            ]}>
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Earnings Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>₹{earningsData?.totalEarnings?.toFixed(2) || '0.00'}</Text>
          <Text style={styles.summaryLabel}>Total Earnings</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{earningsData?.totalRides || 0}</Text>
          <Text style={styles.summaryLabel}>Total Rides</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>₹{earningsData?.averageEarning?.toFixed(2) || '0.00'}</Text>
          <Text style={styles.summaryLabel}>Average per Ride</Text>
        </View>
      </View>

      {/* Recent Earnings */}
      <View style={styles.recentEarningsContainer}>
        <Text style={styles.sectionTitle}>Recent Earnings</Text>
        {earningsData?.earnings && earningsData.earnings.length > 0 ? (
          earningsData.earnings.slice(0, 5).map((earning) => (
            <View key={earning.id} style={styles.earningItem}>
              <View style={styles.earningInfo}>
                <Text style={styles.earningDescription}>{earning.description}</Text>
                <Text style={styles.earningDate}>
                  {new Date(earning.completedAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.earningAmount}>₹{earning.amount.toFixed(2)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noEarningsText}>No earnings for this period</Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.content}>
        <TouchableOpacity style={styles.button} onPress={() => handleViewDetails(earningsData?.period || 'today')}>
          <Text style={styles.buttonText}>View Detailed Earnings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleViewPayoutHistory}>
          <Text style={styles.buttonText}>View Payout History</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.withdrawButton]} onPress={() => Alert.alert('Coming Soon', 'Withdrawal feature will be available soon')}>
          <Text style={styles.buttonText}>Request Withdrawal</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  recentEarningsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  earningItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  earningInfo: {
    flex: 1,
  },
  earningDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  earningDate: {
    fontSize: 12,
    color: '#666',
  },
  earningAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  noEarningsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  content: {
    padding: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  withdrawButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EarningsHomeScreen;
