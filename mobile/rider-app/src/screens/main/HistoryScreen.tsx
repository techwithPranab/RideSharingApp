/**
 * History Screen for RideShare Rider App
 * Shows user's trip history and past rides
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { getRideHistory } from '../../store/slices/rideSlice';

interface TripItemProps {
  trip: {
    id: string;
    rideId: string;
    driver: {
      firstName: string;
      lastName: string;
      averageRating: number;
    };
    vehicle: {
      make: string;
      model: string;
      licensePlate: string;
    };
    pickupAddress: string;
    dropoffAddress: string;
    fare: number;
    distance: number;
    duration: number;
    status: string;
    completedAt: string;
    rating?: number;
  };
}

const TripItem: React.FC<TripItemProps> = ({ trip }) => {
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
    switch (status.toLowerCase()) {
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#FF9800';
    }
  };

  return (
    <TouchableOpacity style={styles.tripItem}>
      <View style={styles.tripHeader}>
        <View style={styles.tripInfo}>
          <Text style={styles.tripDate}>{formatDate(trip.completedAt)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) }]}>
            <Text style={styles.statusText}>{trip.status}</Text>
          </View>
        </View>
        <Text style={styles.tripFare}>₹{trip.fare}</Text>
      </View>

      <View style={styles.tripDetails}>
        <View style={styles.locationContainer}>
          <View style={styles.locationDot} />
          <Text style={styles.locationText} numberOfLines={1}>
            {trip.pickupAddress}
          </Text>
        </View>
        <View style={styles.locationLine} />
        <View style={styles.locationContainer}>
          <View style={[styles.locationDot, styles.dropoffDot]} />
          <Text style={styles.locationText} numberOfLines={1}>
            {trip.dropoffAddress}
          </Text>
        </View>
      </View>

      <View style={styles.driverInfo}>
        <View style={styles.driverDetails}>
          <Text style={styles.driverName}>
            {trip.driver.firstName} {trip.driver.lastName}
          </Text>
          <Text style={styles.vehicleInfo}>
            {trip.vehicle.make} {trip.vehicle.model} • {trip.vehicle.licensePlate}
          </Text>
        </View>
        <View style={styles.tripStats}>
          <Text style={styles.tripStat}>{trip.distance} km</Text>
          <Text style={styles.tripStat}>{Math.round(trip.duration / 60)} min</Text>
        </View>
      </View>

      {trip.rating && (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingText}>⭐ {trip.rating}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const HistoryScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { rideHistory, isLoading } = useAppSelector(state => state.ride);

  useEffect(() => {
    dispatch(getRideHistory({}));
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(getRideHistory({}));
  };

  if (isLoading && rideHistory.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading trip history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trip History</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {rideHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🗂️</Text>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptySubtitle}>
            Your completed rides will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={rideHistory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TripItem trip={item} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onRefresh={handleRefresh}
          refreshing={isLoading}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  filterText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: {
    padding: 16,
  },
  tripItem: {
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
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tripInfo: {
    flex: 1,
  },
  tripDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  tripFare: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  tripDetails: {
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginRight: 12,
  },
  dropoffDot: {
    backgroundColor: '#4CAF50',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverDetails: {
    flex: 1,
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
  tripStats: {
    alignItems: 'flex-end',
  },
  tripStat: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  ratingContainer: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  ratingText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
  },
});

export default HistoryScreen;
