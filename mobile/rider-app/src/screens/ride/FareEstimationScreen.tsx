/**
 * FareEstimationScreen
 * Screen for calculating and displaying fare estimates for rides
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../../services/api';

interface RouteParams {
  sourceLocation: {
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  destinationLocation: {
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  vehicleType?: string;
  numberOfSeats?: number;
}

interface FareBreakdown {
  baseFare: number;
  distanceFare: number;
  durationFare: number;
  fuelSurcharge: number;
  tollCharges: number;
  parkingCharges: number;
  seatSurcharge: number;
  peakHourSurcharge: number;
  nightTimeSurcharge: number;
  waitingCharges: number;
  taxes: number;
  totalFare: number;
}

interface FareEstimate {
  estimatedFare: number;
  breakdown: Partial<FareBreakdown>;
}

const FareEstimationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { sourceLocation, destinationLocation, vehicleType = 'sedan', numberOfSeats = 1 } = route.params as RouteParams;

  const [fareEstimate, setFareEstimate] = useState<FareEstimate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedSeats, setSelectedSeats] = useState<number>(numberOfSeats);
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>(vehicleType);

  // Calculate distance
  const calculateDistance = (coord1: { latitude: number; longitude: number }, coord2: { latitude: number; longitude: number }): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Fetch fare estimate
  const fetchFareEstimate = async () => {
    try {
      setIsLoading(true);
      const distance = calculateDistance(sourceLocation.coordinates, destinationLocation.coordinates);

      const response = await api.get('/fares/estimate', {
        params: {
          distance: distance.toFixed(2),
          city: 'mumbai', // Can be made dynamic based on location
          vehicleType: selectedVehicleType,
          numberOfSeats: selectedSeats
        }
      });

      if (response.data.success) {
        setFareEstimate(response.data.data);
      } else {
        Alert.alert('Error', response.data.error?.message || 'Failed to calculate fare');
      }
    } catch (error: any) {
      console.error('Error fetching fare estimate:', error);
      Alert.alert('Error', 'Failed to calculate fare. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch fare estimate when component mounts or parameters change
  useEffect(() => {
    fetchFareEstimate();
  }, [selectedSeats, selectedVehicleType]);

  // Handle seat selection
  const handleSeatChange = (seats: number) => {
    if (seats >= 1 && seats <= 7) {
      setSelectedSeats(seats);
    }
  };

  // Handle vehicle type change
  const handleVehicleTypeChange = (type: string) => {
    setSelectedVehicleType(type);
  };

  // Handle booking
  const handleBookRide = () => {
    // Navigate to booking screen with fare information
    // For now, just show an alert since BookingScreen might not exist yet
    Alert.alert(
      'Book Ride',
      `Booking ride for ${formatCurrency(fareEstimate?.estimatedFare || 0)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            // TODO: Navigate to actual booking screen
            Alert.alert('Success', 'Ride booked successfully!');
          }
        }
      ]
    );
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
  };

  // Extract the fare breakdown content to avoid nested ternary
  const renderFareBreakdown = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Calculating fare...</Text>
        </View>
      );
    }

    if (!fareEstimate) return null;

    return (
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Fare Breakdown</Text>

        <View style={styles.fareBreakdown}>
          {fareEstimate.breakdown.baseFare && (
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Base Fare</Text>
              <Text style={styles.fareValue}>{formatCurrency(fareEstimate.breakdown.baseFare)}</Text>
            </View>
          )}

          {fareEstimate.breakdown.distanceFare && (
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Distance Fare</Text>
              <Text style={styles.fareValue}>{formatCurrency(fareEstimate.breakdown.distanceFare)}</Text>
            </View>
          )}

          {fareEstimate.breakdown.seatSurcharge && fareEstimate.breakdown.seatSurcharge > 0 && (
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Additional Seats</Text>
              <Text style={styles.fareValue}>{formatCurrency(fareEstimate.breakdown.seatSurcharge)}</Text>
            </View>
          )}

          {fareEstimate.breakdown.fuelSurcharge && (
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Fuel Surcharge</Text>
              <Text style={styles.fareValue}>{formatCurrency(fareEstimate.breakdown.fuelSurcharge)}</Text>
            </View>
          )}

          {fareEstimate.breakdown.taxes && (
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Taxes (18% GST)</Text>
              <Text style={styles.fareValue}>{formatCurrency(fareEstimate.breakdown.taxes)}</Text>
            </View>
          )}

          <View style={styles.fareDivider} />

          <View style={styles.totalFareRow}>
            <Text style={styles.totalFareLabel}>Total Fare</Text>
            <Text style={styles.totalFareValue}>{formatCurrency(fareEstimate.estimatedFare)}</Text>
          </View>
        </View>

        <Text style={styles.fareNote}>
          * Final fare may vary based on actual route, tolls, parking, and time of travel
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fare Estimate</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Route Information */}
        <View style={styles.routeCard}>
          <View style={styles.locationContainer}>
            <View style={styles.locationItem}>
              <Ionicons name="location" size={20} color="#28CD41" />
              <View style={styles.locationDetails}>
                <Text style={styles.locationName}>{sourceLocation.name}</Text>
                <Text style={styles.locationAddress}>{sourceLocation.address}</Text>
              </View>
            </View>
            <View style={styles.routeLine}>
              <View style={styles.dottedLine} />
            </View>
            <View style={styles.locationItem}>
              <Ionicons name="location" size={20} color="#FF3B30" />
              <View style={styles.locationDetails}>
                <Text style={styles.locationName}>{destinationLocation.name}</Text>
                <Text style={styles.locationAddress}>{destinationLocation.address}</Text>
              </View>
            </View>
          </View>
          <View style={styles.distanceInfo}>
            <Text style={styles.distanceText}>
              Distance: {calculateDistance(sourceLocation.coordinates, destinationLocation.coordinates).toFixed(1)} km
            </Text>
          </View>
        </View>

        {/* Vehicle Type Selection */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Select Vehicle Type</Text>
          <View style={styles.vehicleOptions}>
            {[
              { type: 'sedan', name: 'Sedan', icon: 'car' },
              { type: 'suv', name: 'SUV', icon: 'car-sport' },
              { type: 'hatchback', name: 'Hatchback', icon: 'car-outline' },
              { type: 'bike', name: 'Bike', icon: 'bicycle' }
            ].map((vehicle) => (
              <TouchableOpacity
                key={vehicle.type}
                style={[
                  styles.vehicleOption,
                  selectedVehicleType === vehicle.type && styles.selectedVehicleOption
                ]}
                onPress={() => handleVehicleTypeChange(vehicle.type)}
              >
                <Ionicons
                  name={vehicle.icon as any}
                  size={24}
                  color={selectedVehicleType === vehicle.type ? '#007AFF' : '#666'}
                />
                <Text style={[
                  styles.vehicleName,
                  selectedVehicleType === vehicle.type && styles.selectedVehicleText
                ]}>
                  {vehicle.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Seat Selection */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Number of Seats</Text>
          <View style={styles.seatSelector}>
            <TouchableOpacity
              style={styles.seatButton}
              onPress={() => handleSeatChange(selectedSeats - 1)}
              disabled={selectedSeats <= 1}
            >
              <Ionicons name="remove" size={20} color={selectedSeats <= 1 ? '#CCC' : '#333'} />
            </TouchableOpacity>
            <Text style={styles.seatCount}>{selectedSeats}</Text>
            <TouchableOpacity
              style={styles.seatButton}
              onPress={() => handleSeatChange(selectedSeats + 1)}
              disabled={selectedSeats >= 7}
            >
              <Ionicons name="add" size={20} color={selectedSeats >= 7 ? '#CCC' : '#333'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Fare Breakdown */}
        {renderFareBreakdown()}

        {/* Book Ride Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleBookRide}
            disabled={isLoading || !fareEstimate}
          >
            <Text style={styles.bookButtonText}>
              Book Ride - {fareEstimate ? formatCurrency(fareEstimate.estimatedFare) : 'Calculating...'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  routeCard: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationContainer: {
    marginBottom: 12,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  locationDetails: {
    marginLeft: 12,
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  routeLine: {
    marginLeft: 10,
    height: 20,
    justifyContent: 'center',
  },
  dottedLine: {
    width: 1,
    height: 20,
    borderLeftWidth: 1,
    borderLeftColor: '#DDD',
    borderStyle: 'dashed',
  },
  distanceInfo: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
  },
  sectionCard: {
    backgroundColor: '#FFF',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  vehicleOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  vehicleOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    minWidth: 70,
  },
  selectedVehicleOption: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  vehicleName: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  selectedVehicleText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  seatSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatCount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  fareBreakdown: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  fareLabel: {
    fontSize: 14,
    color: '#666',
  },
  fareValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  fareDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 12,
  },
  totalFareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalFareLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalFareValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  fareNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  bookButton: {
    backgroundColor: '#28CD41',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default FareEstimationScreen;
