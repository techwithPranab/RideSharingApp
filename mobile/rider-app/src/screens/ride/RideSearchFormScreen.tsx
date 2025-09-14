/**
 * Ride Search Form Screen
 * Allows users to search for available ride offers by specifying source, destination, date, and number of seats
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppSelector } from '../../hooks/redux';
import { rideAPI } from '../../services/api';

interface SearchFormData {
  source: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  destination: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  departureDate: Date;
  seats: number;
  maxPrice?: number;
}

const RideSearchFormScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAppSelector(state => state.auth);

  const [searchForm, setSearchForm] = useState<SearchFormData>({
    source: { address: '' },
    destination: { address: '' },
    departureDate: new Date(),
    seats: 1,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLocationSelect = (type: 'source' | 'destination') => {
    (navigation as any).navigate('PlaceSearch', {
      type: type === 'source' ? 'pickup' : 'dropoff',
      onSelect: (location: { latitude: number; longitude: number }, address: string) => {
        setSearchForm(prev => ({
          ...prev,
          [type]: {
            address,
            latitude: location.latitude,
            longitude: location.longitude,
          },
        }));
      },
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSearchForm(prev => ({ ...prev, departureDate: selectedDate }));
    }
  };

  const handleSeatChange = (increment: boolean) => {
    setSearchForm(prev => ({
      ...prev,
      seats: increment 
        ? Math.min(prev.seats + 1, 8) 
        : Math.max(prev.seats - 1, 1)
    }));
  };

  const handleSearchRides = async () => {
    if (!searchForm.source.address || !searchForm.destination.address) {
      Alert.alert('Missing Information', 'Please select both source and destination locations.');
      return;
    }

    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to search for rides.');
      return;
    }

    setIsLoading(true);

    try {
      const searchData = {
        source: searchForm.source.latitude && searchForm.source.longitude ? {
          latitude: searchForm.source.latitude,
          longitude: searchForm.source.longitude,
          radius: 5000, // 5km radius
        } : undefined,
        destination: searchForm.destination.latitude && searchForm.destination.longitude ? {
          latitude: searchForm.destination.latitude,
          longitude: searchForm.destination.longitude,
          radius: 5000, // 5km radius
        } : undefined,
        departureDate: searchForm.departureDate.toISOString().split('T')[0], // YYYY-MM-DD format
        minSeats: searchForm.seats,
        maxPrice: searchForm.maxPrice,
      };

      const response = await rideAPI.searchRideOffers(searchData);
      const rideOffers = response.data.data || [];

      // Navigate to search results screen
      (navigation as any).navigate('RideSearchResults', {
        searchData: searchForm,
        rideOffers,
      });

    } catch (error: unknown) {
      console.error('Error searching rides:', error);
      const message = error instanceof Error && 'response' in error
        ? (error as any).response?.data?.message || 'Failed to search rides. Please try again.'
        : 'Failed to search rides. Please try again.';
      Alert.alert('Search Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Rides</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Location Selection */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Trip Details</Text>

          <TouchableOpacity
            style={styles.locationInput}
            onPress={() => handleLocationSelect('source')}
          >
            <View style={styles.locationIcon}>
              <Text style={styles.locationIconText}>📍</Text>
            </View>
            <View style={styles.locationDetails}>
              <Text style={styles.locationLabel}>From</Text>
              <Text style={styles.locationAddress}>
                {searchForm.source.address || 'Select pickup location'}
              </Text>
            </View>
            <Text style={styles.locationArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.locationDivider} />

          <TouchableOpacity
            style={styles.locationInput}
            onPress={() => handleLocationSelect('destination')}
          >
            <View style={styles.locationIcon}>
              <Text style={styles.locationIconText}>🏁</Text>
            </View>
            <View style={styles.locationDetails}>
              <Text style={styles.locationLabel}>To</Text>
              <Text style={styles.locationAddress}>
                {searchForm.destination.address || 'Select destination'}
              </Text>
            </View>
            <Text style={styles.locationArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Date Selection */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Travel Date</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.dateIcon}>
              <Text style={styles.dateIconText}>📅</Text>
            </View>
            <View style={styles.dateDetails}>
              <Text style={styles.dateLabel}>Departure Date</Text>
              <Text style={styles.dateValue}>
                {formatDate(searchForm.departureDate)}
              </Text>
            </View>
            <Text style={styles.locationArrow}>›</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={searchForm.departureDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Seat Selection */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Passengers</Text>
          <View style={styles.seatSelector}>
            <View style={styles.seatInfo}>
              <Text style={styles.seatLabel}>Number of seats</Text>
              <Text style={styles.seatSubtitle}>Including yourself</Text>
            </View>
            <View style={styles.seatControls}>
              <TouchableOpacity
                style={[styles.seatButton, searchForm.seats <= 1 && styles.seatButtonDisabled]}
                onPress={() => handleSeatChange(false)}
                disabled={searchForm.seats <= 1}
              >
                <Text style={styles.seatButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.seatCount}>{searchForm.seats}</Text>
              <TouchableOpacity
                style={[styles.seatButton, searchForm.seats >= 8 && styles.seatButtonDisabled]}
                onPress={() => handleSeatChange(true)}
                disabled={searchForm.seats >= 8}
              >
                <Text style={styles.seatButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Price Filter (Optional) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Price Filter (Optional)</Text>
          <View style={styles.priceInput}>
            <Text style={styles.priceLabel}>Maximum price per seat</Text>
            <TextInput
              style={styles.priceTextInput}
              placeholder="Enter max price (₹)"
              value={searchForm.maxPrice?.toString() || ''}
              onChangeText={(text) => {
                const price = parseInt(text) || undefined;
                setSearchForm(prev => ({ ...prev, maxPrice: price }));
              }}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Search Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.searchButton, isLoading && styles.searchButtonDisabled]}
            onPress={handleSearchRides}
            disabled={isLoading}
          >
            <Text style={styles.searchButtonText}>
              {isLoading ? 'Searching...' : 'Search Available Rides'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Search Tips</Text>
          <Text style={styles.tipsText}>• Book in advance for better prices and availability</Text>
          <Text style={styles.tipsText}>• Be flexible with your departure time</Text>
          <Text style={styles.tipsText}>• Check driver ratings and reviews</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationIconText: {
    fontSize: 16,
  },
  locationDetails: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 16,
    color: '#333',
  },
  locationArrow: {
    fontSize: 16,
    color: '#666',
  },
  locationDivider: {
    height: 1,
    backgroundColor: '#e1e1e1',
    marginVertical: 8,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dateIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dateIconText: {
    fontSize: 16,
  },
  dateDetails: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  seatSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seatInfo: {
    flex: 1,
  },
  seatLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  seatSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  seatControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatButtonDisabled: {
    backgroundColor: '#ccc',
  },
  seatButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  seatCount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  priceInput: {
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  priceTextInput: {
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    marginVertical: 24,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#ccc',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  tipsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
});

export default RideSearchFormScreen;
