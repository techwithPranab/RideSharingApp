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
import { useAppSelector } from '../../hooks/redux';
import { subscriptionAPI } from '../../services/api';
import { SubscriptionValidation } from '../../types';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAppSelector(state => state.auth);
  const [selectedRideType, setSelectedRideType] = useState<'regular' | 'pooled'>('regular');
  const [subscriptionValidation, setSubscriptionValidation] = useState<SubscriptionValidation | null>(null);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const response = await subscriptionAPI.validateSubscription();
      const result = response.data;

      if (result.success && result.data) {
        setSubscriptionValidation(result.data);
      }
    } catch (error) {
      // Error handled silently - could implement user notification here
    }
  };

  const handleRequestRide = () => {
    (navigation as any).navigate('RideRequest');
  };

  const handleEmergency = () => {
    Alert.alert(
      'Emergency',
      'Are you in an emergency situation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Emergency', style: 'destructive' },
      ]
    );
  };

  const rideTypeOptions = [
    {
      id: 'regular',
      title: 'Regular Ride',
      description: 'Private ride just for you',
      price: '₹150-250',
      icon: '🚗',
    },
    {
      id: 'pooled',
      title: 'Pooled Ride',
      description: 'Share ride with others',
      price: '₹80-150',
      icon: '🚐',
    },
  ];

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
          <TouchableOpacity style={styles.quickActionButton} onPress={handleRequestRide}>
            <Text style={styles.quickActionIcon}>📍</Text>
            <Text style={styles.quickActionText}>Set Destination</Text>
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

        {/* Ride Type Selection */}
        <View style={styles.rideTypeContainer}>
          <Text style={styles.sectionTitle}>Choose your ride</Text>

          {rideTypeOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.rideTypeCard,
                selectedRideType === option.id && styles.selectedRideTypeCard,
              ]}
              onPress={() => setSelectedRideType(option.id as 'regular' | 'pooled')}
            >
              <View style={styles.rideTypeLeft}>
                <Text style={styles.rideTypeIcon}>{option.icon}</Text>
                <View style={styles.rideTypeInfo}>
                  <Text style={styles.rideTypeTitle}>{option.title}</Text>
                  <Text style={styles.rideTypeDescription}>{option.description}</Text>
                </View>
              </View>
              <View style={styles.rideTypeRight}>
                <Text style={styles.rideTypePrice}>{option.price}</Text>
                <View style={[
                  styles.selectionIndicator,
                  selectedRideType === option.id && styles.selectedIndicator,
                ]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Request Ride Button */}
        <View style={styles.requestButtonContainer}>
          <TouchableOpacity style={styles.requestButton} onPress={handleRequestRide}>
            <Text style={styles.requestButtonText}>Request Ride</Text>
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
});

export default HomeScreen;
