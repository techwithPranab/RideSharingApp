/**
 * Ride Details Screen (Rides Stack)
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
import { useSelector } from 'react-redux';

// Import types
import { RidesStackParamList } from '../../navigation/types';
import { Ride } from '../../types';
import { driverAPI, rideAPI } from '../../services/api';

type RideDetailsScreenNavigationProp = StackNavigationProp<RidesStackParamList, 'RideDetails'>;
type RideDetailsScreenRouteProp = RouteProp<RidesStackParamList, 'RideDetails'>;

const RideDetailsScreen: React.FC = () => {
  const navigation = useNavigation<RideDetailsScreenNavigationProp>();
  const route = useRoute<RideDetailsScreenRouteProp>();
  const { rideId } = route.params;

  const [rideData, setRideData] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Get driver ID from Redux store
  const driverId = useSelector((state: any) => state.auth.driver?.id);

  useEffect(() => {
    loadRideDetails();
  }, [rideId]);

  const loadRideDetails = async () => {
    try {
      setLoading(true);
      const response = await rideAPI.getRide(rideId);
      
      if (response.data.success && response.data.data) {
        setRideData(response.data.data);
      } else {
        throw new Error('Failed to load ride details');
      }
    } catch (error: any) {
      console.error('Error loading ride details:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to load ride details';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAcceptRide = async () => {
    if (!driverId) {
      Alert.alert('Error', 'Driver not authenticated');
      return;
    }

    setActionLoading(true);
    try {
      await driverAPI.acceptRide(rideId, driverId);

      // Update ride status locally
      setRideData(prev => prev ? { ...prev, status: 'accepted' as const } : null);

      Alert.alert('Success', 'Ride accepted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to active ride screen or refresh the screen
            navigation.goBack();
          }
        }
      ]);
    } catch (error: any) {
      console.error('Error accepting ride:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to accept ride';
      Alert.alert('Error', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const executeDeclineRide = async () => {
    if (!driverId) {
      Alert.alert('Error', 'Driver not authenticated');
      return;
    }

    setActionLoading(true);
    try {
      await driverAPI.rejectRide(rideId, driverId, 'Driver declined');

      Alert.alert('Ride Declined', 'You have declined this ride.', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back to available rides
            navigation.goBack();
          }
        }
      ]);
    } catch (error: any) {
      console.error('Error declining ride:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to decline ride';
      Alert.alert('Error', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineRide = () => {
    Alert.alert(
      'Decline Ride',
      'Are you sure you want to decline this ride?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            executeDeclineRide();
          }
        },
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
          <Text style={styles.title}>Ride Details</Text>
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
          <Text style={styles.title}>Ride Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load ride details</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadRideDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
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
        <Text style={styles.title}>Ride Details</Text>
      </View>

      <View style={styles.content}>
        {/* Rider Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rider Information</Text>
          {rideData.passengers && rideData.passengers.length > 0 ? (
            rideData.passengers.map((passenger, index) => (
              <View key={passenger.userId} style={styles.riderInfo}>
                <View style={styles.riderAvatar}>
                  <Text style={styles.avatarText}>
                    {(() => {
                      if (passenger.user?.firstName && passenger.user?.lastName) {
                        return `${passenger.user.firstName[0]}${passenger.user.lastName[0]}`;
                      } else if (passenger.user?.firstName) {
                        return passenger.user.firstName[0];
                      } else {
                        return 'R';
                      }
                    })()}
                  </Text>
                </View>
                <View style={styles.riderDetails}>
                  <Text style={styles.riderName}>
                    {passenger.user
                      ? `${passenger.user.firstName} ${passenger.user.lastName}`
                      : 'Rider'
                    }
                  </Text>
                  <Text style={styles.passengerFare}>Fare: ₹{passenger.fare}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.placeholderText}>No passenger information available</Text>
          )}
        </View>

        {/* Ride Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ride Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>From:</Text>
            <Text style={styles.detailValue}>{rideData.pickupAddress}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>To:</Text>
            <Text style={styles.detailValue}>{rideData.dropoffAddress}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Distance:</Text>
            <Text style={styles.detailValue}>{rideData.estimatedDistance} km</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>{rideData.estimatedDuration} min</Text>
          </View>
        </View>

        {/* Fare Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fare Information</Text>
          <View style={styles.fareContainer}>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Base Fare:</Text>
              <Text style={styles.fareValue}>₹{rideData.baseFare}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Fare:</Text>
              <Text style={styles.totalValue}>₹{rideData.totalFare}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {rideData.status === 'requested' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={handleDeclineRide}
              disabled={actionLoading}
            >
              <Text style={styles.declineButtonText}>
                {actionLoading ? 'Processing...' : 'Decline'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAcceptRide}
              disabled={actionLoading}
            >
              <Text style={styles.acceptButtonText}>
                {actionLoading ? 'Processing...' : 'Accept Ride'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {rideData.status === 'accepted' && (
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>Ride Accepted</Text>
            <TouchableOpacity style={styles.completeButton}>
              <Text style={styles.completeButtonText}>Complete Ride</Text>
            </TouchableOpacity>
          </View>
        )}
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
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
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
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
  passengerFare: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  declineButton: {
    backgroundColor: '#FF3B30',
  },
  declineButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  completeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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

export default RideDetailsScreen;
