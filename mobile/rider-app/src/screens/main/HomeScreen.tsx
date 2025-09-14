/**
 * Home Screen for RideShare Rider App
 * Main screen for requesting rides and viewing options
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { subscriptionAPI } from '../../services/api';
import { getActiveRide } from '../../store/slices/rideSlice';
import { SubscriptionValidation } from '../../types';

const getRideStatusText = (status: string) => {
  switch (status) {
    case 'requested':
      return 'Finding Driver';
    case 'accepted':
      return 'Driver Assigned';
    case 'driver_arrived':
      return 'Driver Arrived';
    case 'started':
      return 'In Progress';
    default:
      return 'Active Ride';
  }
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { currentRide } = useAppSelector(state => state.ride);
  const [subscriptionValidation, setSubscriptionValidation] = useState<SubscriptionValidation | null>(null);

  useEffect(() => {
    checkSubscriptionStatus();
    // Get active ride on component mount
    dispatch(getActiveRide());
  }, [dispatch]);

  const checkSubscriptionStatus = async () => {
    try {
      const response = await subscriptionAPI.validateSubscription();
      const result = response.data;

      if (result.success && result.data) {
        setSubscriptionValidation(result.data);
      }
    } catch (error) {
      console.warn('Error checking subscription status:', error);
      // Handle error silently as subscription is not critical for basic functionality
    }
  };

  const handleSearchRide = () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to search for rides.');
      return;
    }

    // Navigate to ride search form
    (navigation as any).navigate('RideSearchForm');
  };  const handleEmergency = () => {
    Alert.alert(
      'Emergency',
      'Are you in an emergency situation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Emergency', style: 'destructive' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>Good morning!</Text>
            <Text style={styles.userName}>{user?.firstName || 'Rider'}</Text>
          </View>
          <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergency}>
            <Text style={styles.emergencyIcon}>🚨</Text>
          </TouchableOpacity>
        </View>

        {/* Subscription Status Banner */}
        {subscriptionValidation && (
          <View style={styles.subscriptionBanner}>
            {subscriptionValidation.isValid ? (
              <View style={styles.activeSubscriptionBanner}>
                <Text style={styles.subscriptionIcon}>⭐</Text>
                <View style={styles.subscriptionTextContainer}>
                  <Text style={styles.subscriptionTitle}>Active Subscription</Text>
                  <Text style={styles.subscriptionSubtitle}>
                    {subscriptionValidation.discount}% discount on all rides
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.manageButton}
                  onPress={() => (navigation as any).navigate('SubscriptionManagement')}
                >
                  <Text style={styles.manageButtonText}>Manage</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.noSubscriptionBanner}
                onPress={() => (navigation as any).navigate('SubscriptionPlans')}
              >
                <Text style={styles.subscriptionIcon}>💎</Text>
                <View style={styles.subscriptionTextContainer}>
                  <Text style={styles.subscriptionTitle}>Save with Subscription</Text>
                  <Text style={styles.subscriptionSubtitle}>
                    Get up to 30% discount on rides
                  </Text>
                </View>
                <Text style={styles.subscriptionArrow}>›</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton} onPress={handleSearchRide}>
            <Text style={styles.quickActionIcon}>�</Text>
            <Text style={styles.quickActionText}>Search Ride</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionIcon}>🏠</Text>
            <Text style={styles.quickActionText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionIcon}>💼</Text>
            <Text style={styles.quickActionText}>Work</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionIcon}>⭐</Text>
            <Text style={styles.quickActionText}>Favorites</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Rides */}
        <View style={styles.upcomingRidesContainer}>
          <Text style={styles.sectionTitle}>Upcoming rides</Text>
          {currentRide && (currentRide.status === 'requested' || currentRide.status === 'accepted' || currentRide.status === 'driver_arrived' || currentRide.status === 'started') ? (
            <TouchableOpacity 
              style={styles.upcomingRideCard}
              onPress={() => (navigation as any).navigate('RideTracking', { rideId: currentRide.id })}
            >
              <View style={styles.rideCardHeader}>
                <View style={styles.rideStatusBadge}>
                  <Text style={styles.rideStatusText}>
                    {getRideStatusText(currentRide.status)}
                  </Text>
                </View>
                <Text style={styles.rideFare}>₹{currentRide.totalFare}</Text>
              </View>
              
              <View style={styles.rideLocations}>
                <View style={styles.locationRow}>
                  <View style={styles.pickupDot} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {currentRide.passengers[0]?.pickupLocation?.address || 'Pickup location'}
                  </Text>
                </View>
                <View style={styles.locationLine} />
                <View style={styles.locationRow}>
                  <View style={styles.dropoffDot} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {currentRide.passengers[0]?.dropoffLocation?.address || 'Dropoff location'}
                  </Text>
                </View>
              </View>

              {currentRide.driver && (
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>
                    {currentRide.driver.firstName} {currentRide.driver.lastName}
                  </Text>
                  <Text style={styles.vehicleInfo}>
                    {currentRide.vehicle?.make} {currentRide.vehicle?.model} • {currentRide.vehicle?.licensePlate}
                  </Text>
                </View>
              )}
              
              <Text style={styles.viewRideText}>Tap to view details →</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>🚗</Text>
              <Text style={styles.emptyStateText}>No upcoming rides</Text>
              <Text style={styles.emptyStateSubtext}>Request a ride to get started</Text>
            </View>
          )}
        </View>

        {/* Search Ride Button */}
        <View style={styles.requestButtonContainer}>
          <TouchableOpacity style={styles.requestButton} onPress={handleSearchRide}>
            <Text style={styles.requestButtonText}>Search Rides Now</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Rides */}
        <View style={styles.recentRidesContainer}>
          <Text style={styles.sectionTitle}>Recent rides</Text>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        {/* Placeholder for recent rides */}
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateEmoji}>🗺️</Text>
          <Text style={styles.emptyStateText}>No recent rides yet</Text>
          <Text style={styles.emptyStateSubtext}>Your ride history will appear here</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    flex: 1,
  },
  greetingText: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  emergencyButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emergencyIcon: {
    fontSize: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  rideTypeContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  rideTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedRideTypeCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  rideTypeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rideTypeIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  rideTypeInfo: {
    flex: 1,
  },
  rideTypeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  rideTypeDescription: {
    fontSize: 14,
    color: '#666',
  },
  rideTypeRight: {
    alignItems: 'flex-end',
  },
  rideTypePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  selectionIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e1e1e1',
  },
  selectedIndicator: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  requestButtonContainer: {
    marginBottom: 32,
  },
  requestButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  upcomingRidesContainer: {
    marginBottom: 32,
  },
  recentRidesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  subscriptionBanner: {
    marginBottom: 24,
  },
  activeSubscriptionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  noSubscriptionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  subscriptionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  subscriptionTextContainer: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  subscriptionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  manageButton: {
    backgroundColor: '#4caf50',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  manageButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  subscriptionArrow: {
    fontSize: 20,
    color: '#666',
  },
  // Upcoming ride card styles
  upcomingRideCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rideCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rideStatusBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rideStatusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  rideFare: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  rideLocations: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  pickupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginRight: 12,
  },
  dropoffDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  locationLine: {
    width: 2,
    height: 16,
    backgroundColor: '#e1e1e1',
    marginLeft: 6,
    marginVertical: 4,
  },
  driverInfo: {
    marginBottom: 8,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#666',
  },
  viewRideText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default HomeScreen;
