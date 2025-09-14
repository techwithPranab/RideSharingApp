/**
 * Ride Search Screen
 * Allows riders to search for available ride offers based on source, destination, date, time, seats, etc.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { rideAPI } from '../../services/api';

// Types
interface RideOffer {
  id: string;
  source: {
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  destination: {
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  schedule: {
    departureDate: string;
    departureTime: string;
    isFlexible: boolean;
    flexibilityMinutes: number;
  };
  driver: {
    id: string;
    firstName: string;
    lastName: string;
    averageRating: number;
    phoneNumber: string;
  };
  vehicle: {
    id: string;
    make: string;
    model: string;
    type: string;
    licensePlate: string;
  };
  pricing: {
    pricePerSeat: number;
    acceptsNegotiation: boolean;
    minimumPrice: number;
  };
  availableSeats: number;
  specialInstructions: string;
  distance?: number;
}

interface SearchFilters {
  source?: {
    name: string;
    latitude: number;
    longitude: number;
    radius?: number;
  };
  destination?: {
    name: string;
    latitude: number;
    longitude: number;
    radius?: number;
  };
  departureDate?: Date;
  departureTimeRange?: {
    start: Date;
    end: Date;
  };
  maxPrice?: number;
  minSeats?: number;
  vehicleType?: string;
}

const RideSearchScreen: React.FC = () => {
  const navigation = useNavigation();

  // Search form state
  const [sourceLocation, setSourceLocation] = useState('');
  const [destinationLocation, setDestinationLocation] = useState('');
  const departureDate = new Date();
  const timeRange = {
    start: new Date(),
    end: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours later
  };
  const [maxPrice, setMaxPrice] = useState('');
  const [seatsRequired, setSeatsRequired] = useState(1);

  // Search results and UI state
  const [rideOffers, setRideOffers] = useState<RideOffer[]>([]);
  const [searchResults, setSearchResults] = useState<RideOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Mock coordinates for demo (in real app, you'd get these from place selection)
  const sourceCoordinates = { latitude: 28.6139, longitude: 77.2090 };
  const destinationCoordinates = { latitude: 28.6333, longitude: 77.2315 };

  // Handle search
  const handleSearch = async () => {
    if (!sourceCoordinates || !destinationCoordinates) {
      Alert.alert('Error', 'Please select both source and destination locations');
      return;
    }

    if (seatsRequired < 1) {
      Alert.alert('Error', 'Please select at least 1 seat');
      return;
    }

    setSearching(true);

    try {
      const searchData = {
        source: {
          latitude: sourceCoordinates.latitude,
          longitude: sourceCoordinates.longitude,
          radius: 5000, // 5km radius
        },
        destination: {
          latitude: destinationCoordinates.latitude,
          longitude: destinationCoordinates.longitude,
          radius: 5000, // 5km radius
        },
        departureDate: departureDate.toISOString(),
        departureTimeRange: {
          start: timeRange.start.toISOString(),
          end: timeRange.end.toISOString(),
        },
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        minSeats: seatsRequired,
      };

      const response = await rideAPI.searchRideOffers(searchData);

      if (response.data.success && response.data.data) {
        // Handle different response formats
        let offers: RideOffer[] = [];
        const data = response.data.data as any;

        if (Array.isArray(data)) {
          offers = data;
        } else if (data && typeof data === 'object' && data.rideOffers) {
          offers = data.rideOffers;
        }

        setSearchResults(offers);
        setRideOffers(offers);
      } else {
        setSearchResults([]);
        setRideOffers([]);
      }
    } catch (error: any) {
      console.error('Search error:', error);
      Alert.alert('Search Failed', error.response?.data?.message || 'Failed to search ride offers');
      setSearchResults([]);
      setRideOffers([]);
    } finally {
      setSearching(false);
    }
  };

  // Handle booking
  const handleBookRide = async (offer: RideOffer) => {
    try {
      setLoading(true);

      const response = await rideAPI.bookRideOffer(offer.id, seatsRequired);

      if (response.data.success) {
        Alert.alert(
          'Booking Successful',
          `Your ${seatsRequired} seat(s) have been booked successfully!`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to booking confirmation or ride details
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert('Booking Failed', response.data.message || 'Failed to book the ride');
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      Alert.alert('Booking Failed', error.response?.data?.message || 'Failed to book the ride');
    } finally {
      setLoading(false);
    }
  };

  // Format date and time
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render ride offer card
  const renderRideOffer = (offer: RideOffer) => (
    <View key={offer.id} style={styles.offerCard}>
      {/* Route */}
      <View style={styles.routeContainer}>
        <Text style={styles.sourceText} numberOfLines={1}>
          {offer.source.name}
        </Text>
        <Icon name="arrow-forward" size={16} color="#666" style={styles.arrowIcon} />
        <Text style={styles.destinationText} numberOfLines={1}>
          {offer.destination.name}
        </Text>
      </View>

      {/* Schedule */}
      <View style={styles.scheduleContainer}>
        <Icon name="schedule" size={16} color="#666" />
        <Text style={styles.scheduleText}>
          {formatDate(new Date(offer.schedule.departureDate))} at {formatTime(new Date(offer.schedule.departureTime))}
        </Text>
        {offer.schedule.isFlexible && (
          <Text style={styles.flexibleText}>
            (±{offer.schedule.flexibilityMinutes}min)
          </Text>
        )}
      </View>

      {/* Driver and Vehicle Info */}
      <View style={styles.driverContainer}>
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>
            {offer.driver.firstName} {offer.driver.lastName}
          </Text>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>
              {offer.driver.averageRating.toFixed(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.vehicleText}>
          {offer.vehicle.make} {offer.vehicle.model} • {offer.vehicle.licensePlate}
        </Text>
      </View>

      {/* Pricing and Seats */}
      <View style={styles.bookingContainer}>
        <View style={styles.pricingInfo}>
          <Text style={styles.priceText}>
            ₹{offer.pricing.pricePerSeat}/seat
          </Text>
          <Text style={styles.seatsText}>
            {offer.availableSeats} seats available
          </Text>
        </View>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => handleBookRide(offer)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.bookButtonText}>Book Now</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Special Instructions */}
      {!!offer.specialInstructions && (
        <View style={styles.instructionsContainer}>
          <Icon name="info" size={14} color="#666" />
          <Text style={styles.instructionsText} numberOfLines={2}>
            {offer.specialInstructions}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Rides</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Search Form */}
        <View style={styles.searchForm}>
          {/* Location Inputs */}
          <TextInput
            style={styles.input}
            placeholder="From (Source location)"
            value={sourceLocation}
            onChangeText={setSourceLocation}
          />

          <TextInput
            style={styles.input}
            placeholder="To (Destination)"
            value={destinationLocation}
            onChangeText={setDestinationLocation}
          />

          {/* Date Selection */}
          <TouchableOpacity
            style={styles.input}
            onPress={() => Alert.alert('Date Picker', 'Date picker will be implemented')}
          >
            <Text style={styles.inputText}>
              {formatDate(departureDate)}
            </Text>
          </TouchableOpacity>

          {/* Time Range */}
          <View style={styles.timeRangeContainer}>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => Alert.alert('Time Picker', 'Time picker will be implemented')}
            >
              <Text style={styles.inputText}>
                From: {formatTime(timeRange.start)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => Alert.alert('Time Picker', 'Time picker will be implemented')}
            >
              <Text style={styles.inputText}>
                To: {formatTime(timeRange.end)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Additional Filters */}
          <View style={styles.filtersContainer}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Max price per seat"
              value={maxPrice}
              onChangeText={setMaxPrice}
              keyboardType="numeric"
            />

            <View style={[styles.input, styles.halfInput, styles.seatsContainer]}>
              <Text style={styles.inputText}>Seats: {seatsRequired}</Text>
              <View style={styles.seatsControls}>
                <TouchableOpacity
                  onPress={() => setSeatsRequired(Math.max(1, seatsRequired - 1))}
                  style={styles.seatsButton}
                >
                  <Icon name="remove" size={20} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSeatsRequired(seatsRequired + 1)}
                  style={styles.seatsButton}
                >
                  <Icon name="add" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Search Button */}
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={searching}
          >
            {searching ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="search" size={20} color="#fff" />
                <Text style={styles.searchButtonText}>Search Rides</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>
              {searchResults.length} ride{searchResults.length !== 1 ? 's' : ''} found
            </Text>
            {searchResults.map(renderRideOffer)}
          </View>
        )}

        {/* No Results */}
        {!searching && searchResults.length === 0 && rideOffers.length === 0 && (
          <View style={styles.noResultsContainer}>
            <Icon name="directions-car" size={64} color="#ccc" />
            <Text style={styles.noResultsTitle}>No rides found</Text>
            <Text style={styles.noResultsSubtitle}>
              Try adjusting your search criteria or search for a different route
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  searchForm: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  timeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  halfInput: {
    flex: 1,
    marginBottom: 0,
  },
  seatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seatsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seatsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    padding: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  offerCard: {
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
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sourceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  arrowIcon: {
    marginHorizontal: 8,
  },
  destinationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  scheduleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  scheduleText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  flexibleText: {
    fontSize: 12,
    color: '#28a745',
    fontStyle: 'italic',
  },
  driverContainer: {
    marginBottom: 12,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  vehicleText: {
    fontSize: 12,
    color: '#666',
  },
  bookingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pricingInfo: {
    flex: 1,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  seatsText: {
    fontSize: 12,
    color: '#666',
  },
  bookButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
  },
  instructionsText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default RideSearchScreen;
