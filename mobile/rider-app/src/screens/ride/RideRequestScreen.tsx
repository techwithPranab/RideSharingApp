/**
 * Ride Request Screen
 * Full ride booking functionality with location selection and ride type options
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
import { useNavigation } from '../../hooks/navigation';
import { useAppSelector } from '../../hooks/redux';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/config';
import { Button, Card } from '../../components';
import { formatters, locationUtils, type LocationData } from '../../utils';
import { rideAPI, subscriptionAPI } from '../../services/api';
import { SubscriptionValidation, RideRequest, Location } from '../../types';

interface RideRequestState {
  pickupLocation: LocationData | null;
  dropoffLocation: LocationData | null;
  pickupAddress: string;
  dropoffAddress: string;
  rideType: 'regular' | 'pooled';
  scheduledTime?: Date;
}

const RideRequestScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAppSelector(state => state.auth);

  const [rideRequest, setRideRequest] = useState<RideRequestState>({
    pickupLocation: null,
    dropoffLocation: null,
    pickupAddress: '',
    dropoffAddress: '',
    rideType: 'regular',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);
  const [subscriptionValidation, setSubscriptionValidation] = useState<SubscriptionValidation | null>(null);
  const [discountedFare, setDiscountedFare] = useState<number | null>(null);

  // Get current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Calculate fare when locations change
  useEffect(() => {
    if (rideRequest.pickupLocation && rideRequest.dropoffLocation) {
      calculateFare();
      validateSubscription();
    }
  }, [rideRequest.pickupLocation, rideRequest.dropoffLocation, rideRequest.rideType]);

  const getCurrentLocation = async () => {
    try {
      const hasPermission = await locationUtils.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Location Permission',
          'Location permission is required to request rides. Please enable it in settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      const location = await locationUtils.getCurrentLocation();
      setRideRequest(prev => ({
        ...prev,
        pickupLocation: location,
        pickupAddress: 'Current Location',
      }));
    } catch (error) {
      // Error getting location handled with alert
      console.warn('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get your current location. Please try again.');
    }
  };

  const calculateFare = async () => {
    if (!rideRequest.pickupLocation || !rideRequest.dropoffLocation) return;

    try {
      const response = await rideAPI.getFareEstimate({
        pickupLat: rideRequest.pickupLocation.latitude,
        pickupLng: rideRequest.pickupLocation.longitude,
        dropoffLat: rideRequest.dropoffLocation.latitude,
        dropoffLng: rideRequest.dropoffLocation.longitude,
        isPooled: rideRequest.rideType === 'pooled'
      });

      const estimate = response.data.data.estimate;
      setEstimatedFare(estimate.totalFare);
      setEstimatedDuration(estimate.estimatedDuration);
    } catch (error) {
      // Error calculating fare handled with fallback calculation
      console.warn('Error calculating fare estimate:', error);
      // Fallback to basic calculation if API fails
      const distance = locationUtils.calculateDistance(
        rideRequest.pickupLocation,
        rideRequest.dropoffLocation
      );
      const baseFare = 50; // Base fare in rupees
      const perKmRate = 15; // Rate per kilometer
      const estimatedFare = baseFare + (distance * perKmRate);
      setEstimatedFare(estimatedFare);
      setEstimatedDuration(distance * 2); // Rough estimate: 2 minutes per km
    }
  };

  const validateSubscription = async () => {
    try {
      const response = await subscriptionAPI.validateSubscription();
      const result = response.data;

      if (result.success && result.data) {
        setSubscriptionValidation(result.data);

        // Calculate discounted fare if subscription is valid
        if (result.data.isValid && result.data.discount && estimatedFare) {
          const discountAmount = (estimatedFare * result.data.discount) / 100;
          setDiscountedFare(Math.round(estimatedFare - discountAmount));

          // Show discount notification
          Alert.alert(
            '💰 Discount Applied!',
            `${result.data.discount}% subscription discount saved you ₹${discountAmount}!`,
            [{ text: 'Great!' }]
          );
        } else {
          setDiscountedFare(null);
        }
      }
    } catch (error) {
      // Error validating subscription handled silently
      console.warn('Error validating subscription:', error);
      setSubscriptionValidation(null);
      setDiscountedFare(null);
    }
  };

  const handleLocationSelect = (type: 'pickup' | 'dropoff') => {
    // Navigate to place search screen
    (navigation as any).navigate('PlaceSearch', {
      type,
      onSelect: (location: Location, address: string) => {
        setRideRequest(prev => ({
          ...prev,
          [type === 'pickup' ? 'pickupLocation' : 'dropoffLocation']: location,
          [type === 'pickup' ? 'pickupAddress' : 'dropoffAddress']: address,
        }));
      },
    });
  };

  const handleRideTypeChange = (type: 'regular' | 'pooled') => {
    setRideRequest(prev => ({ ...prev, rideType: type }));
  };

  const handleRequestRide = async () => {
    if (!rideRequest.pickupLocation || !rideRequest.dropoffLocation) {
      Alert.alert('Error', 'Please select both pickup and dropoff locations.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Please log in to request a ride.');
      return;
    }

    setIsLoading(true);

    try {
      const distance = locationUtils.calculateDistance(
        rideRequest.pickupLocation,
        rideRequest.dropoffLocation
      );

      const rideData: RideRequest = {
        pickupLocation: {
          type: 'Point',
          coordinates: [rideRequest.pickupLocation.longitude, rideRequest.pickupLocation.latitude],
          address: rideRequest.pickupAddress,
        },
        dropoffLocation: {
          type: 'Point',
          coordinates: [rideRequest.dropoffLocation.longitude, rideRequest.dropoffLocation.latitude],
          address: rideRequest.dropoffAddress,
        },
        pickupAddress: rideRequest.pickupAddress,
        dropoffAddress: rideRequest.dropoffAddress,
        isPooled: rideRequest.rideType === 'pooled',
        estimatedFare: discountedFare || estimatedFare || undefined,
        estimatedDistance: distance,
        estimatedDuration: estimatedDuration || undefined,
      };

      const response = await rideAPI.requestRide(rideData);
      const ride = response.data.data; // Access the ride data from APIResponse

      Alert.alert(
        'Ride Requested',
        'Your ride has been requested successfully! You will be notified when a driver accepts.',
        [
          {
            text: 'View Ride',
            onPress: () => {
              (navigation as any).navigate('RideDetails', {
                rideId: ride?.id,
              });
            },
          },
          { text: 'OK', style: 'default' },
        ]
      );

      // Reset form
      setRideRequest({
        pickupLocation: null,
        dropoffLocation: null,
        pickupAddress: '',
        dropoffAddress: '',
        rideType: 'regular',
      });
      setEstimatedFare(null);
      setEstimatedDuration(null);

    } catch (error: unknown) {
      // Error requesting ride handled with alert
      const message = error instanceof Error && typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to request ride. Please try again.'
        : 'Failed to request ride. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const rideTypeOptions = [
    {
      id: 'regular' as const,
      title: 'Regular Ride',
      description: 'Private ride just for you',
      icon: '🚗',
      selected: rideRequest.rideType === 'regular',
    },
    {
      id: 'pooled' as const,
      title: 'Pooled Ride',
      description: 'Share ride with others',
      icon: '🚐',
      selected: rideRequest.rideType === 'pooled',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Ride</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Location Selection */}
        <Card style={styles.locationCard}>
          <Text style={styles.sectionTitle}>Locations</Text>

          <TouchableOpacity
            style={styles.locationInput}
            onPress={() => handleLocationSelect('pickup')}
          >
            <View style={styles.locationIcon}>
              <Text style={styles.locationIconText}>📍</Text>
            </View>
            <View style={styles.locationDetails}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.locationAddress}>
                {rideRequest.pickupAddress || 'Select pickup location'}
              </Text>
            </View>
            <Text style={styles.locationArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.locationDivider} />

          <TouchableOpacity
            style={styles.locationInput}
            onPress={() => handleLocationSelect('dropoff')}
          >
            <View style={styles.locationIcon}>
              <Text style={styles.locationIconText}>🏁</Text>
            </View>
            <View style={styles.locationDetails}>
              <Text style={styles.locationLabel}>Dropoff</Text>
              <Text style={styles.locationAddress}>
                {rideRequest.dropoffAddress || 'Select dropoff location'}
              </Text>
            </View>
            <Text style={styles.locationArrow}>›</Text>
          </TouchableOpacity>
        </Card>

        {/* Ride Type Selection */}
        <Card style={styles.rideTypeCard}>
          <Text style={styles.sectionTitle}>Choose your ride</Text>

          {rideTypeOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.rideTypeOption,
                option.selected && styles.selectedRideType,
              ]}
              onPress={() => handleRideTypeChange(option.id)}
            >
              <View style={styles.rideTypeLeft}>
                <Text style={styles.rideTypeIcon}>{option.icon}</Text>
                <View style={styles.rideTypeInfo}>
                  <Text style={styles.rideTypeTitle}>{option.title}</Text>
                  <Text style={styles.rideTypeDescription}>{option.description}</Text>
                </View>
              </View>
              <View style={[
                styles.selectionIndicator,
                option.selected && styles.selectedIndicator,
              ]} />
            </TouchableOpacity>
          ))}
        </Card>

        {/* Fare Estimate */}
        {estimatedFare && (
          <Card style={styles.fareCard}>
            <Text style={styles.sectionTitle}>Fare Estimate</Text>
            <View style={styles.fareDetails}>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Original Fare</Text>
                <Text style={styles.originalFare}>
                  {formatters.currency(estimatedFare)}
                </Text>
              </View>

              {subscriptionValidation?.isValid && subscriptionValidation.discount && discountedFare ? (
                <View style={styles.discountSection}>
                  <View style={styles.fareRow}>
                    <Text style={styles.discountLabel}>
                      Subscription Discount ({subscriptionValidation.discount}%)
                    </Text>
                    <Text style={styles.discountAmount}>
                      -{formatters.currency(estimatedFare - discountedFare)}
                    </Text>
                  </View>
                  <View style={styles.fareRow}>
                    <Text style={styles.finalFareLabel}>Final Fare</Text>
                    <Text style={styles.finalFare}>
                      {formatters.currency(discountedFare)}
                    </Text>
                  </View>
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>
                      You save {formatters.currency(estimatedFare - discountedFare)}!
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Estimated Fare</Text>
                  <Text style={styles.fareAmount}>
                    {formatters.currency(estimatedFare)}
                  </Text>
                </View>
              )}

              {estimatedDuration && (
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Estimated Time</Text>
                  <Text style={styles.fareValue}>
                    {formatters.duration(estimatedDuration)}
                  </Text>
                </View>
              )}
            </View>

            {/* Subscription Status */}
            {subscriptionValidation && (
              <View style={styles.subscriptionStatus}>
                {subscriptionValidation.isValid ? (
                  <View style={styles.activeSubscription}>
                    <Text style={styles.subscriptionIcon}>⭐</Text>
                    <Text style={styles.subscriptionText}>
                      Active subscription applied
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.noSubscription}
                    onPress={() => (navigation as any).navigate('SubscriptionPlans')}
                  >
                    <Text style={styles.subscriptionIcon}>💎</Text>
                    <Text style={styles.subscriptionText}>
                      Get subscription for discounts
                    </Text>
                    <Text style={styles.subscriptionArrow}>›</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Card>
        )}

        {/* Request Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Request Ride"
            onPress={handleRequestRide}
            loading={isLoading}
            disabled={!rideRequest.pickupLocation || !rideRequest.dropoffLocation}
            style={styles.requestButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  locationCard: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  locationIconText: {
    fontSize: FONT_SIZES.lg,
  },
  locationDetails: {
    flex: 1,
  },
  locationLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  locationAddress: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  locationArrow: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textSecondary,
  },
  locationDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  rideTypeCard: {
    marginBottom: SPACING.md,
  },
  rideTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  selectedRideType: {
    backgroundColor: COLORS.primary + '10',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  rideTypeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rideTypeIcon: {
    fontSize: FONT_SIZES.xxxl,
    marginRight: SPACING.md,
  },
  rideTypeInfo: {
    flex: 1,
  },
  rideTypeTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  rideTypeDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  selectionIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  selectedIndicator: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  fareCard: {
    marginBottom: SPACING.md,
  },
  fareDetails: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  fareLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  fareAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.primary,
  },
  fareValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  originalFare: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  discountSection: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
  },
  discountLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  discountAmount: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  finalFareLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  finalFare: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  savingsBadge: {
    backgroundColor: '#34C759',
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
  },
  savingsText: {
    fontSize: FONT_SIZES.sm,
    color: '#fff',
    fontWeight: '600',
  },
  subscriptionStatus: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  activeSubscription: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  noSubscription: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  subscriptionIcon: {
    fontSize: FONT_SIZES.lg,
    marginRight: SPACING.sm,
  },
  subscriptionText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  subscriptionArrow: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
  },
  buttonContainer: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  requestButton: {
    marginHorizontal: SPACING.md,
  },
});

export default RideRequestScreen;
