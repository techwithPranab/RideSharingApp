/**
 * Active Ride Screen Component
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Import types
import { RidesStackParamList } from '../../navigation/types';
import { rideAPI } from '../../services/api';

type ActiveRideScreenNavigationProp = StackNavigationProp<RidesStackParamList, 'ActiveRide'>;
type ActiveRideScreenRouteProp = RouteProp<RidesStackParamList, 'ActiveRide'>;

interface ActiveRideData {
  id: string;
  riderName: string;
  pickupLocation: string;
  dropoffLocation: string;
  fare: number;
  subscriptionDiscount: number;
  hasActiveSubscription: boolean;
  startTime: string;
  estimatedDuration: number;
  distance: number;
  status: 'pickup' | 'in-transit' | 'arrived';
}

const ActiveRideScreen: React.FC = () => {
  const navigation = useNavigation<ActiveRideScreenNavigationProp>();
  const route = useRoute<ActiveRideScreenRouteProp>();
  const { rideId } = route.params;

  const [rideData, setRideData] = useState<ActiveRideData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveRideDetails();
  }, [rideId]);

  const loadActiveRideDetails = async () => {
    try {
      // Get active ride from API
      const response = await rideAPI.getActiveRide();
      const rideData = response.data.data;

      if (rideData) {
        setRideData({
          id: rideData.id,
          riderName: rideData.passengers?.[0]?.userId?.firstName + ' ' + rideData.passengers?.[0]?.userId?.lastName || 'Unknown Rider',
          pickupLocation: rideData.passengers?.[0]?.pickupLocation?.address || 'Unknown pickup',
          dropoffLocation: rideData.passengers?.[0]?.dropoffLocation?.address || 'Unknown dropoff',
          fare: rideData.totalFare || 0,
          subscriptionDiscount: rideData.appliedSubscriptionId ? 15 : 0, // Default discount if subscription applied
          hasActiveSubscription: !!rideData.appliedSubscriptionId,
          startTime: rideData.startedAt ? new Date(rideData.startedAt).toLocaleTimeString() : new Date().toLocaleTimeString(),
          estimatedDuration: rideData.estimatedDuration || 0,
          distance: rideData.estimatedDistance || 0,
          status: rideData.status === 'STARTED' ? 'in-transit' : 'pickup'
        });
      } else {
        setRideData(null);
      }
    } catch (error) {
      console.error('Error loading active ride details:', error);
      Alert.alert('Error', 'Failed to load ride details');
      setRideData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleArrivedAtPickup = () => {
    Alert.alert(
      'Arrived at Pickup',
      'Have you arrived at the pickup location?',
      [
        { text: 'Not yet', style: 'cancel' },
        { text: 'Yes, arrived', onPress: () => {
          setRideData(prev => prev ? { ...prev, status: 'in-transit' } : null);
          Alert.alert('Success', 'Rider notified of your arrival!');
        }},
      ]
    );
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pickup':
        return 'Going to pickup location';
      case 'in-transit':
        return 'Ride in progress';
      case 'arrived':
        return 'Arrived at destination';
      default:
        return 'Unknown status';
    }
  };

  const handleCompleteRide = () => {
    Alert.alert(
      'Complete Ride',
      'Have you completed the ride?',
      [
        { text: 'Not yet', style: 'cancel' },
        { text: 'Complete', onPress: async () => {
          try {
            // Call API to complete the ride
            // await rideAPI.completeRide(rideId);
            Alert.alert('Ride Completed', 'Payment will be processed shortly.');
            navigation.goBack();
          } catch (error) {
            console.error('Error completing ride:', error);
            Alert.alert('Error', 'Failed to complete ride. Please try again.');
          }
        }},
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Active Ride</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading ride details...</Text>
        </View>
      </View>
    );
  }

  if (!rideData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Active Ride</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load ride details</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Active Ride</Text>
      </View>

      <View style={styles.content}>
        {/* Rider Info with Subscription Badge */}
        <View style={styles.riderCard}>
          <View style={styles.riderInfo}>
            <View style={styles.riderAvatar}>
              <Text style={styles.avatarText}>
                {rideData.riderName.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View style={styles.riderDetails}>
              <Text style={styles.riderName}>{rideData.riderName}</Text>
              {rideData.hasActiveSubscription && (
                <View style={styles.subscriptionBadge}>
                  <Text style={styles.subscriptionIcon}>⭐</Text>
                  <Text style={styles.subscriptionText}>
                    Premium Rider
                  </Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.callButton}>
            <Text style={styles.callButtonText}>📞 Call</Text>
          </TouchableOpacity>
        </View>

        {/* Ride Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Ride Status</Text>
          <View style={styles.statusIndicator}>
            <View style={[
              styles.statusDot,
              rideData.status === 'pickup' && styles.statusPickup,
              rideData.status === 'in-transit' && styles.statusTransit,
              rideData.status === 'arrived' && styles.statusArrived,
            ]} />
            <Text style={styles.statusText}>
              {getStatusText(rideData.status)}
            </Text>
          </View>
        </View>

        {/* Route Information */}
        <View style={styles.routeCard}>
          <Text style={styles.cardTitle}>Route</Text>
          <View style={styles.routeItem}>
            <View style={styles.routeIcon}>
              <Text style={styles.routeIconText}>📍</Text>
            </View>
            <View style={styles.routeDetails}>
              <Text style={styles.routeLabel}>Pickup</Text>
              <Text style={styles.routeAddress}>{rideData.pickupLocation}</Text>
            </View>
          </View>
          <View style={styles.routeDivider} />
          <View style={styles.routeItem}>
            <View style={styles.routeIcon}>
              <Text style={styles.routeIconText}>🏁</Text>
            </View>
            <View style={styles.routeDetails}>
              <Text style={styles.routeLabel}>Dropoff</Text>
              <Text style={styles.routeAddress}>{rideData.dropoffLocation}</Text>
            </View>
          </View>
        </View>

        {/* Fare Information */}
        <View style={styles.fareCard}>
          <Text style={styles.cardTitle}>Earnings</Text>
          <View style={styles.fareContainer}>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Base Fare:</Text>
              <Text style={styles.fareValue}>₹{rideData.fare}</Text>
            </View>
            {rideData.hasActiveSubscription && rideData.subscriptionDiscount > 0 && (
              <View style={styles.discountRow}>
                <Text style={styles.discountLabel}>
                  Subscription Discount ({rideData.subscriptionDiscount}%):
                </Text>
                <Text style={styles.discountValue}>
                  -₹{Math.round((rideData.fare * rideData.subscriptionDiscount) / 100)}
                </Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Your Earnings:</Text>
              <Text style={styles.totalValue}>
                ₹{rideData.hasActiveSubscription
                  ? Math.round(rideData.fare * (1 - rideData.subscriptionDiscount / 100))
                  : rideData.fare
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {rideData.status === 'pickup' && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleArrivedAtPickup}
            >
              <Text style={styles.primaryButtonText}>Arrived at Pickup</Text>
            </TouchableOpacity>
          )}

          {rideData.status === 'in-transit' && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCompleteRide}
            >
              <Text style={styles.primaryButtonText}>Complete Ride</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => Alert.alert('Emergency', 'Emergency contact initiated')}
          >
            <Text style={styles.secondaryButtonText}>🚨 Emergency</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  riderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  riderAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  riderDetails: {
    flex: 1,
  },
  riderName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  subscriptionIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  subscriptionText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
  },
  callButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  callButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusPickup: {
    backgroundColor: '#FF9500',
  },
  statusTransit: {
    backgroundColor: '#34C759',
  },
  statusArrived: {
    backgroundColor: '#007AFF',
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  routeIconText: {
    fontSize: 18,
  },
  routeDetails: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  routeDivider: {
    height: 20,
    width: 2,
    backgroundColor: '#007AFF',
    marginLeft: 19,
    marginBottom: 12,
  },
  fareCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fareContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fareLabel: {
    fontSize: 16,
    color: '#666',
  },
  fareValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#E8F5E8',
    padding: 8,
    borderRadius: 6,
  },
  discountLabel: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  discountValue: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  actionContainer: {
    marginTop: 16,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rideId: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ActiveRideScreen;
