/**
 * RideTrackingScreen
 * Driver interface for starting rides and tracking progress with Google Maps
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import api from '../../services/api';
import { io, Socket } from 'socket.io-client';

interface RouteParams {
  bookingId: string;
  booking: {
    bookingId: string;
    riderId: {
      name: string;
      phone: string;
    };
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
    departureDateTime: string;
  };
}

const { width, height } = Dimensions.get('window');

const RideTrackingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const { bookingId, booking } = route.params as RouteParams;

  const [isRideStarted, setIsRideStarted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [routeCoordinates] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [rideStatus, setRideStatus] = useState<'not_started' | 'starting' | 'in_progress' | 'completed'>('not_started');

  // Initialize socket connection
  useEffect(() => {
    const initSocket = () => {
      const socket = io(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000', {
        auth: {
          token: (api.defaults.headers.common['Authorization'] as string)?.replace('Bearer ', '')
        }
      });

      socket.on('connect', () => {
        console.log('Connected to ride tracking socket');
        socket.emit('join-ride', bookingId);
      });

      socket.on('location-update', (data: any) => {
        console.log('Location update received:', data);
      });

      socket.on('ride-completed', (data: any) => {
        console.log('Ride completed:', data);
        setRideStatus('completed');
        Alert.alert('Ride Completed', 'The ride has been completed successfully.');
      });

      socketRef.current = socket;
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [bookingId]);

  // Request location permissions and start tracking
  useEffect(() => {
    const requestLocationPermission = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to track rides.');
        return;
      }

      // Get initial location
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);

      // Start location tracking
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (newLocation) => {
          setCurrentLocation(newLocation);
          updateLocationOnServer(newLocation);
        }
      );
    };

    requestLocationPermission();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // Update location on server
  const updateLocationOnServer = async (location: Location.LocationObject) => {
    if (!isRideStarted) return;

    try {
      await api.put(`/rides/${bookingId}/location`, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        speed: location.coords.speed,
        heading: location.coords.heading
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  // Start the ride
  const handleStartRide = async () => {
    if (!currentLocation) {
      Alert.alert('Error', 'Unable to get current location. Please try again.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post(`/rides/${bookingId}/start`, {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        speed: currentLocation.coords.speed,
        heading: currentLocation.coords.heading
      });

      if (response.data.success) {
        setIsRideStarted(true);
        setRideStatus('in_progress');

        // Fit map to show route
        if (mapRef.current) {
          const coordinates = [
            {
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude
            },
            {
              latitude: booking.destinationLocation.coordinates.latitude,
              longitude: booking.destinationLocation.coordinates.longitude
            }
          ];

          mapRef.current.fitToCoordinates(coordinates, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true
          });
        }

        Alert.alert('Ride Started', 'The ride has been started. Safe driving!');
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Error starting ride:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to start ride. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Complete the ride
  const handleCompleteRide = async () => {
    if (!currentLocation) {
      Alert.alert('Error', 'Unable to get current location.');
      return;
    }

    Alert.alert(
      'Complete Ride',
      'Are you sure you want to complete this ride?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          style: 'destructive',
          onPress: () => completeRideProcess()
        }
      ]
    );
  };

  const completeRideProcess = () => {
    const performCompletion = async () => {
      setIsLoading(true);
      try {
        await api.put(`/rides/${bookingId}/complete`, {
          latitude: currentLocation!.coords.latitude,
          longitude: currentLocation!.coords.longitude
        });

        setRideStatus('completed');
        Alert.alert('Success', 'Ride completed successfully!');

        // Navigate back after a short delay
        setTimeout(() => {
          navigation.navigate('RidesHome' as never);
        }, 2000);
      } catch (error: any) {
        console.error('Error completing ride:', error);
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to complete ride.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    performCompletion();
  };

  // Get map region
  const getMapRegion = () => {
    if (currentLocation) {
      return {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      };
    }

    return {
      latitude: booking.sourceLocation.coordinates.latitude,
      longitude: booking.sourceLocation.coordinates.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={getMapRegion()}
          showsUserLocation={true}
          followsUserLocation={true}
          showsMyLocationButton={true}
          zoomEnabled={true}
          scrollEnabled={true}
        >
          {/* Source Marker */}
          <Marker
            coordinate={{
              latitude: booking.sourceLocation.coordinates.latitude,
              longitude: booking.sourceLocation.coordinates.longitude
            }}
            title="Pickup Location"
            description={booking.sourceLocation.name}
            pinColor="green"
          />

          {/* Destination Marker */}
          <Marker
            coordinate={{
              latitude: booking.destinationLocation.coordinates.latitude,
              longitude: booking.destinationLocation.coordinates.longitude
            }}
            title="Drop-off Location"
            description={booking.destinationLocation.name}
            pinColor="red"
          />

          {/* Current Location Marker (if ride started) */}
          {isRideStarted && currentLocation && (
            <Marker
              coordinate={{
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude
              }}
              title="Current Location"
              pinColor="blue"
            />
          )}

          {/* Route Polyline */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#007AFF"
              strokeWidth={4}
            />
          )}
        </MapView>
      </View>

      {/* Ride Information Panel */}
      <View style={styles.infoPanel}>
        <View style={styles.rideHeader}>
          <View style={styles.riderInfo}>
            <Ionicons name="person-circle" size={40} color="#007AFF" />
            <View style={styles.riderDetails}>
              <Text style={styles.riderName}>{booking.riderId.name}</Text>
              <Text style={styles.riderPhone}>{booking.riderId.phone}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => {
              // Handle call functionality
              Alert.alert('Call', `Calling ${booking.riderId.name}...`);
            }}
          >
            <Ionicons name="call" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.locationInfo}>
          <View style={styles.locationItem}>
            <Ionicons name="location" size={16} color="#28CD41" />
            <Text style={styles.locationText} numberOfLines={2}>
              {booking.sourceLocation.name}
            </Text>
          </View>
          <View style={styles.locationDivider}>
            <View style={styles.dottedLine} />
          </View>
          <View style={styles.locationItem}>
            <Ionicons name="location" size={16} color="#FF3B30" />
            <Text style={styles.locationText} numberOfLines={2}>
              {booking.destinationLocation.name}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {!isRideStarted ? (
            <TouchableOpacity
              style={[styles.startButton, isLoading && styles.disabledButton]}
              onPress={handleStartRide}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Ionicons name="play" size={20} color="#FFF" />
                  <Text style={styles.startButtonText}>Start Ride</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.completeButton, isLoading && styles.disabledButton]}
              onPress={handleCompleteRide}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#FFF" />
                  <Text style={styles.completeButtonText}>Complete Ride</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  infoPanel: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  rideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  riderDetails: {
    marginLeft: 12,
    flex: 1,
  },
  riderName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  riderPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  callButton: {
    backgroundColor: '#007AFF',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationInfo: {
    marginBottom: 20,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
  locationDivider: {
    marginLeft: 8,
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
  buttonContainer: {
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#28CD41',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    minWidth: 200,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  completeButton: {
    backgroundColor: '#FF9500',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    minWidth: 200,
  },
  completeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default RideTrackingScreen;
