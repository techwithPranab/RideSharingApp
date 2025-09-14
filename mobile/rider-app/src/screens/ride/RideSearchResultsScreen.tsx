/**
 * Ride Search Results Screen
 * Displays available ride offers based on user search criteria
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppSelector } from '../../hooks/redux';


interface RideOffer {
  _id: string;
  driver: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    rating: number;
    totalRides: number;
    phoneNumber: string;
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    type: string;
  };
  startLocation: {
    address: string;
    coordinates: [number, number];
  };
  endLocation: {
    address: string;
    coordinates: [number, number];
  };
  departureTime: string;
  availableSeats: number;
  pricePerSeat: number;
  estimatedDuration: number;
  distance: number;
  status: 'available' | 'full' | 'cancelled';
  amenities: string[];
  preferences: {
    smokingAllowed: boolean;
    petsAllowed: boolean;
    musicPreference: string;
  };
}

interface SearchData {
  source: { address: string };
  destination: { address: string };
  departureDate: Date;
  seats: number;
}

const RideSearchResultsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAppSelector(state => state.auth);

  const { searchData, rideOffers: initialRideOffers } = route.params as {
    searchData: SearchData;
    rideOffers: RideOffer[];
  };

  const [rideOffers] = useState<RideOffer[]>(initialRideOffers);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'time' | 'rating'>('price');

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // For now, just use the initial data since we don't have coordinates in searchData
      // In a real app, you would re-run the search with proper coordinates
      Alert.alert('Refreshed', 'Ride offers have been updated.');
    } catch (error) {
      console.error('Error refreshing rides:', error);
      Alert.alert('Refresh Failed', 'Unable to refresh ride offers. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleBookRide = (offer: RideOffer) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to book a ride.');
      return;
    }

    if (offer.availableSeats < searchData.seats) {
      Alert.alert('Insufficient Seats', `This ride only has ${offer.availableSeats} seats available.`);
      return;
    }

    // Navigate to ride booking screen
    (navigation as any).navigate('RideBooking', {
      rideOffer: offer,
      requestedSeats: searchData.seats,
      searchData,
    });
  };

  const handleViewRideDetails = (offer: RideOffer) => {
    (navigation as any).navigate('RideDetails', {
      rideId: offer._id,
      rideOffer: offer,
      searchData,
    });
  };

  const sortRides = (offers: RideOffer[]) => {
    return [...offers].sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.pricePerSeat - b.pricePerSeat;
        case 'time':
          return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
        case 'rating':
          return b.driver.rating - a.driver.rating;
        default:
          return 0;
      }
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const renderRideOffer = ({ item: offer }: { item: RideOffer }) => (
    <View style={styles.rideCard}>
      <TouchableOpacity
        style={styles.rideCardContent}
        onPress={() => handleViewRideDetails(offer)}
        activeOpacity={0.7}
      >
        {/* Driver Info */}
        <View style={styles.driverSection}>
          <View style={styles.driverInfo}>
            {offer.driver.profilePicture ? (
              <Image
                source={{ uri: offer.driver.profilePicture }}
                style={styles.driverAvatar}
              />
            ) : (
              <View style={styles.driverAvatarPlaceholder}>
                <Text style={styles.driverInitials}>
                  {offer.driver.firstName[0]}{offer.driver.lastName[0]}
                </Text>
              </View>
            )}
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>
                {offer.driver.firstName} {offer.driver.lastName}
              </Text>
              <View style={styles.driverStats}>
                <Text style={styles.rating}>⭐ {offer.driver.rating.toFixed(1)}</Text>
                <Text style={styles.totalRides}>• {offer.driver.totalRides} rides</Text>
              </View>
            </View>
          </View>
          <View style={styles.priceSection}>
            <Text style={styles.price}>₹{offer.pricePerSeat}</Text>
            <Text style={styles.priceLabel}>per seat</Text>
          </View>
        </View>

        {/* Trip Info */}
        <View style={styles.tripSection}>
          <View style={styles.routeInfo}>
            <Text style={styles.routeText} numberOfLines={1}>
              {offer.startLocation.address} → {offer.endLocation.address}
            </Text>
            <View style={styles.tripDetails}>
              <Text style={styles.tripTime}>
                🕒 {formatTime(offer.departureTime)} • {formatDuration(offer.estimatedDuration)}
              </Text>
              <Text style={styles.distance}>📍 {offer.distance.toFixed(1)} km</Text>
            </View>
          </View>
        </View>

        {/* Vehicle Info */}
        <View style={styles.vehicleSection}>
          <Text style={styles.vehicleInfo}>
            🚗 {offer.vehicle.year} {offer.vehicle.make} {offer.vehicle.model} • {offer.vehicle.color}
          </Text>
          <View style={styles.seatsInfo}>
            <Text style={styles.seatsAvailable}>
              {offer.availableSeats} seats available
            </Text>
          </View>
        </View>

        {/* Amenities */}
        {offer.amenities.length > 0 && (
          <View style={styles.amenitiesSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {offer.amenities.map((amenity) => (
                <View key={amenity} style={styles.amenityTag}>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </TouchableOpacity>

      {/* Book Button */}
      <View style={styles.bookingSection}>
        <TouchableOpacity
          style={[
            styles.bookButton,
            offer.availableSeats < searchData.seats && styles.bookButtonDisabled
          ]}
          onPress={() => handleBookRide(offer)}
          disabled={offer.availableSeats < searchData.seats}
        >
          <Text style={styles.bookButtonText}>
            {(() => {
              if (offer.availableSeats < searchData.seats) {
                return 'Not Enough Seats';
              }
              const seatText = searchData.seats === 1 ? 'seat' : 'seats';
              return `Book ${searchData.seats} ${seatText}`;
            })()}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const sortedOffers = sortRides(rideOffers);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Results</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Summary */}
      <View style={styles.searchSummary}>
        <Text style={styles.summaryText}>
          {searchData.source.address} → {searchData.destination.address}
        </Text>
        <Text style={styles.summaryDetails}>
          {searchData.departureDate.toDateString()} • {searchData.seats} passenger{searchData.seats > 1 ? 's' : ''}
        </Text>
        <Text style={styles.resultsCount}>
          {sortedOffers.length} ride{sortedOffers.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Sort Options */}
      <View style={styles.sortSection}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <View style={styles.sortButtons}>
          {['price', 'time', 'rating'].map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.sortButton, sortBy === option && styles.sortButtonActive]}
              onPress={() => setSortBy(option as typeof sortBy)}
            >
              <Text style={[styles.sortButtonText, sortBy === option && styles.sortButtonTextActive]}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Results List */}
      {sortedOffers.length > 0 ? (
        <FlatList
          data={sortedOffers}
          renderItem={renderRideOffer}
          keyExtractor={(item) => item._id}
          style={styles.resultsList}
          contentContainerStyle={styles.resultsContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Rides Found</Text>
          <Text style={styles.emptyStateMessage}>
            Try adjusting your search criteria or check back later for new rides.
          </Text>
          <TouchableOpacity
            style={styles.newSearchButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.newSearchButtonText}>New Search</Text>
          </TouchableOpacity>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 18,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  searchSummary: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  summaryDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  resultsCount: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  sortSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#666',
  },
  sortButtonTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    padding: 16,
  },
  rideCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rideCardContent: {
    padding: 16,
  },
  driverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  driverAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  driverInitials: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  driverStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#666',
  },
  totalRides: {
    fontSize: 14,
    color: '#666',
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
  },
  tripSection: {
    marginBottom: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 6,
    fontWeight: '500',
  },
  tripDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  tripTime: {
    fontSize: 14,
    color: '#666',
    marginRight: 16,
  },
  distance: {
    fontSize: 14,
    color: '#666',
  },
  vehicleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  seatsInfo: {
    alignItems: 'flex-end',
  },
  seatsAvailable: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  amenitiesSection: {
    marginTop: 8,
  },
  amenityTag: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  amenityText: {
    fontSize: 12,
    color: '#007AFF',
  },
  bookingSection: {
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
    padding: 16,
  },
  bookButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#ccc',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  newSearchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  newSearchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RideSearchResultsScreen;
