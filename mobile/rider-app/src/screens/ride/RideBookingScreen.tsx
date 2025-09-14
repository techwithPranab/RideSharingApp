/**
 * Ride Booking Screen
 * Allows users to confirm and book a selected ride offer
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
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppSelector } from '../../hooks/redux';
import { rideAPI } from '../../services/api';

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
  amenities: string[];
  preferences: {
    smokingAllowed: boolean;
    petsAllowed: boolean;
    musicPreference: string;
  };
}

const RideBookingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAppSelector(state => state.auth);

  const { rideOffer, requestedSeats } = route.params as {
    rideOffer: RideOffer;
    requestedSeats: number;
    searchData: any;
  };

  const [isBooking, setIsBooking] = useState(false);

  const totalCost = rideOffer.pricePerSeat * requestedSeats;

  const handleConfirmBooking = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to book this ride.');
      return;
    }

    setIsBooking(true);

    try {
      await rideAPI.bookRideOffer(rideOffer._id, requestedSeats);
      
      Alert.alert(
        'Booking Confirmed!',
        'Your ride has been successfully booked. You will receive a confirmation message shortly.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to home or show booking confirmation
              navigation.navigate('MainTabs' as never);
            }
          }
        ]
      );
    } catch (error: unknown) {
      console.error('Error booking ride:', error);
      const message = error instanceof Error && 'response' in error
        ? (error as any).response?.data?.message || 'Failed to book ride. Please try again.'
        : 'Failed to book ride. Please try again.';
      Alert.alert('Booking Failed', message);
    } finally {
      setIsBooking(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Booking</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* Trip Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trip Details</Text>
          <View style={styles.routeInfo}>
            <Text style={styles.routeText}>
              {rideOffer.startLocation.address}
            </Text>
            <Text style={styles.routeArrow}>↓</Text>
            <Text style={styles.routeText}>
              {rideOffer.endLocation.address}
            </Text>
          </View>
          <View style={styles.tripInfo}>
            <Text style={styles.tripDetailText}>
              📅 {formatDate(rideOffer.departureTime)} • {formatTime(rideOffer.departureTime)}
            </Text>
            <Text style={styles.tripDetailText}>
              🕒 {formatDuration(rideOffer.estimatedDuration)} • {rideOffer.distance.toFixed(1)} km
            </Text>
          </View>
        </View>

        {/* Driver Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Driver Information</Text>
          <View style={styles.driverSection}>
            {rideOffer.driver.profilePicture ? (
              <Image
                source={{ uri: rideOffer.driver.profilePicture }}
                style={styles.driverAvatar}
              />
            ) : (
              <View style={styles.driverAvatarPlaceholder}>
                <Text style={styles.driverInitials}>
                  {rideOffer.driver.firstName[0]}{rideOffer.driver.lastName[0]}
                </Text>
              </View>
            )}
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>
                {rideOffer.driver.firstName} {rideOffer.driver.lastName}
              </Text>
              <View style={styles.driverStats}>
                <Text style={styles.rating}>⭐ {rideOffer.driver.rating.toFixed(1)}</Text>
                <Text style={styles.totalRides}>• {rideOffer.driver.totalRides} rides</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Vehicle Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vehicle Details</Text>
          <Text style={styles.vehicleInfo}>
            🚗 {rideOffer.vehicle.year} {rideOffer.vehicle.make} {rideOffer.vehicle.model}
          </Text>
          <Text style={styles.vehicleInfo}>
            🎨 {rideOffer.vehicle.color} • {rideOffer.vehicle.licensePlate}
          </Text>
        </View>

        {/* Amenities */}
        {rideOffer.amenities.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Amenities</Text>
            <View style={styles.amenitiesContainer}>
              {rideOffer.amenities.map((amenity) => (
                <View key={amenity} style={styles.amenityTag}>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Booking Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Passengers:</Text>
            <Text style={styles.summaryValue}>{requestedSeats}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Price per seat:</Text>
            <Text style={styles.summaryValue}>₹{rideOffer.pricePerSeat}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Cost:</Text>
            <Text style={styles.totalValue}>₹{totalCost}</Text>
          </View>
        </View>

        {/* Policies */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Important Information</Text>
          <Text style={styles.policyText}>
            • Please arrive at the pickup point 5 minutes before departure
          </Text>
          <Text style={styles.policyText}>
            • Cancellation allowed up to 2 hours before departure
          </Text>
          <Text style={styles.policyText}>
            • Contact driver directly for any pickup location changes
          </Text>
          <Text style={styles.policyText}>
            • Smoking: {rideOffer.preferences.smokingAllowed ? 'Allowed' : 'Not allowed'}
          </Text>
          <Text style={styles.policyText}>
            • Pets: {rideOffer.preferences.petsAllowed ? 'Allowed' : 'Not allowed'}
          </Text>
        </View>
      </ScrollView>

      {/* Booking Button */}
      <View style={styles.bookingFooter}>
        <View style={styles.priceSection}>
          <Text style={styles.totalPrice}>₹{totalCost}</Text>
          <Text style={styles.priceSubtitle}>Total for {requestedSeats} passenger{requestedSeats > 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          style={[styles.confirmButton, isBooking && styles.confirmButtonDisabled]}
          onPress={handleConfirmBooking}
          disabled={isBooking}
        >
          <Text style={styles.confirmButtonText}>
            {isBooking ? 'Booking...' : 'Confirm Booking'}
          </Text>
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  routeInfo: {
    marginBottom: 16,
  },
  routeText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  routeArrow: {
    fontSize: 20,
    color: '#666',
    textAlign: 'center',
    marginVertical: 4,
  },
  tripInfo: {
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
    paddingTop: 16,
  },
  tripDetailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  driverSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  driverAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  driverInitials: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
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
  vehicleInfo: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityTag: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  amenityText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
    paddingTop: 12,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '700',
  },
  policyText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  bookingFooter: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceSection: {
    flex: 1,
    marginRight: 16,
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  priceSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
    minWidth: 120,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RideBookingScreen;
