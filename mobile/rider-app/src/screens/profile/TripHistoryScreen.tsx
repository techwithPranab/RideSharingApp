/**
 * Trip History Screen for RideShare Rider App
 * Shows user's trip history with filtering and search
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '../../hooks/navigation';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/config';
import { TripHistory } from '../../types';
import { rideAPI } from '../../services/api';

const TripHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const [trips, setTrips] = useState<TripHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  // Mock data for now - replace with actual API call
  useEffect(() => {
    loadTripHistory();
  }, []);

  const loadTripHistory = async () => {
    setIsLoading(true);
    try {
      const response = await rideAPI.getRideHistory();
      const tripsData = response.data.data || [];

      // Transform API response to match our TripHistory interface
      const transformedTrips: TripHistory[] = tripsData.map((trip: any) => ({
        id: trip.id,
        rideId: trip.id,
        driver: trip.driver || {
          id: 'unknown',
          phoneNumber: '',
          firstName: 'Unknown',
          lastName: 'Driver',
          role: 'driver',
          status: 'active',
          isPhoneVerified: false,
          isEmailVerified: false,
          averageRating: 0,
          totalRatings: 0,
          kycStatus: 'pending',
          vehicleIds: [],
          isAvailable: false,
          createdAt: '',
          updatedAt: ''
        },
        vehicle: trip.vehicle || {
          id: 'unknown',
          driverId: 'unknown',
          make: 'Unknown',
          model: 'Vehicle',
          year: 2020,
          color: 'Unknown',
          licensePlate: 'UNKNOWN',
          type: 'sedan',
          capacity: 4,
          hasAC: false,
          hasMusic: false,
          hasWifi: false,
          averageRating: 0,
          status: 'active'
        },
        pickupLocation: trip.pickupLocation || {
          type: 'Point',
          coordinates: [0, 0],
          address: 'Unknown'
        },
        dropoffLocation: trip.dropoffLocation || {
          type: 'Point',
          coordinates: [0, 0],
          address: 'Unknown'
        },
        pickupAddress: trip.pickupLocation?.address || 'Unknown pickup',
        dropoffAddress: trip.dropoffLocation?.address || 'Unknown dropoff',
        fare: trip.totalFare || 0,
        distance: trip.estimatedDistance || 0,
        duration: trip.estimatedDuration || 0,
        status: trip.status || 'completed',
        completedAt: trip.completedAt || trip.requestedAt || new Date().toISOString(),
        rating: trip.passengers?.[0]?.rating || undefined,
        review: trip.passengers?.[0]?.review || undefined
      }));

      setTrips(transformedTrips);
    } catch (error) {
      console.error('Failed to load trip history:', error);
      // Show empty state on error
      setTrips([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTripHistory();
    setRefreshing(false);
  };

  const filteredTrips = trips.filter(trip => {
    if (filter === 'all') return true;
    return trip.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return COLORS.success;
      case 'cancelled':
        return COLORS.error;
      default:
        return COLORS.primary;
    }
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

  const renderTripItem = ({ item }: { item: TripHistory }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => {
        // Navigate to trip details screen (to be implemented)
        console.log('Trip details:', item.id);
      }}
    >
      <View style={styles.tripHeader}>
        <View style={styles.tripInfo}>
          <Text style={styles.tripDate}>{formatDate(item.completedAt)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.tripFare}>₹{item.fare}</Text>
      </View>

      <View style={styles.tripDetails}>
        <View style={styles.locationContainer}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {item.pickupAddress}
          </Text>
        </View>
        <View style={styles.locationDivider} />
        <View style={styles.locationContainer}>
          <Text style={styles.locationIcon}>🏁</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {item.dropoffAddress}
          </Text>
        </View>
      </View>

      <View style={styles.tripFooter}>
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>
            {item.driver.firstName} {item.driver.lastName}
          </Text>
          <Text style={styles.vehicleInfo}>
            {item.vehicle.make} {item.vehicle.model} • {item.vehicle.licensePlate}
          </Text>
        </View>
        <View style={styles.tripStats}>
          <Text style={styles.tripStat}>{item.distance} km</Text>
          <Text style={styles.tripStat}>{item.duration} min</Text>
          {item.rating && (
            <Text style={styles.tripRating}>⭐ {item.rating}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🗂️</Text>
      <Text style={styles.emptyTitle}>No Trips Yet</Text>
      <Text style={styles.emptyDescription}>
        Your completed rides will appear here
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip History</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'completed', 'cancelled'] as const).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterTab,
              filter === filterType && styles.filterTabActive,
            ]}
            onPress={() => setFilter(filterType)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === filterType && styles.filterTabTextActive,
              ]}
            >
              {filterType === 'all' ? 'All' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Trip List */}
      <FlatList
        data={filteredTrips}
        renderItem={renderTripItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
      />
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
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: COLORS.white,
  },
  listContainer: {
    padding: SPACING.md,
  },
  tripCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  tripInfo: {
    flex: 1,
  },
  tripDate: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    fontWeight: '600',
  },
  tripFare: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  tripDetails: {
    marginBottom: SPACING.md,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xs,
  },
  locationIcon: {
    fontSize: FONT_SIZES.md,
    marginRight: SPACING.sm,
    width: 20,
    textAlign: 'center',
  },
  locationText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    flex: 1,
  },
  locationDivider: {
    height: 20,
    width: 2,
    backgroundColor: COLORS.border,
    marginLeft: 10,
    marginVertical: SPACING.xs,
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  vehicleInfo: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  tripStats: {
    alignItems: 'flex-end',
  },
  tripStat: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  tripRating: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default TripHistoryScreen;
