/**
 * RideTrackingScreen
 * Rider interface for tracking driver location and ride progress with Google Maps
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from '../../components/MockMapView';
import api from '../../services/api';
import { io, Socket } from 'socket.io-client';

interface RouteParams {
  bookingId: string;
  booking: {
    bookingId: string;
    driverId: {
      name: string;
      phone: string;
      vehicle: {
        model: string;
        color: string;
        licensePlate: string;
      };
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
  const mapRef = useRef<typeof MapView>(null);
  const socketRef = useRef<Socket | null>(null);

  const { bookingId, booking } = route.params as RouteParams;

  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
  } | null>(null);
  const [isRideActive, setIsRideActive] = useState<boolean>(false);
  const [isRideCompleted, setIsRideCompleted] = useState<boolean>(false);
  const [routeCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
  const [estimatedArrival, setEstimatedArrival] = useState<string>('');

  // Socket event handlers
  const handleRideStarted = (data: any) => {
    console.log('Ride started:', data);
    setIsRideActive(true);
    Alert.alert('Ride Started', 'Your ride has begun! Track your driver in real-time.');
  };

  const handleRideCompleted = (data: any) => {
    console.log('Ride completed:', data);
    setIsRideActive(false);
    setIsRideCompleted(true);
    Alert.alert('Ride Completed', 'You have arrived at your destination. Safe travels!');
    setTimeout(() => {
      navigation.navigate('Home' as never);
    }, 3000);
  };

  const handleRideCancelled = (data: any) => {
    console.log('Ride cancelled:', data);
    Alert.alert('Ride Cancelled', data.reason || 'Your ride has been cancelled.');
    setTimeout(() => {
      navigation.navigate('Home' as never);
    }, 2000);
  };

  // Initialize socket connection for real-time tracking
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
        console.log('Driver location update:', data);
        if (data.latitude && data.longitude) {
          setDriverLocation({
            latitude: data.latitude,
            longitude: data.longitude,
            speed: data.speed,
            heading: data.heading
          });

          // Update map to follow driver
          if (mapRef.current) {
            console.log('Would animate to driver location:', data.latitude, data.longitude);
          }
        }
      });

      socket.on('ride-started', handleRideStarted);
      socket.on('ride-completed', handleRideCompleted);
      socket.on('ride-cancelled', handleRideCancelled);

      socketRef.current = socket;
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [bookingId]);

  // Calculate estimated arrival time
  useEffect(() => {
    if (driverLocation && booking.sourceLocation.coordinates) {
      // Simple distance calculation (in a real app, you'd use Google Maps API)
      const distance = calculateDistance(
        driverLocation.latitude,
        driverLocation.longitude,
        booking.destinationLocation.coordinates.latitude,
        booking.destinationLocation.coordinates.longitude
      );

      // Estimate time based on average speed (assuming 30 km/h in city)
      const estimatedMinutes = Math.round((distance / 30) * 60);
      setEstimatedArrival(`${estimatedMinutes} min`);
    }
  }, [driverLocation, booking]);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Handle emergency
  const handleEmergency = () => {
    Alert.alert(
      'Emergency',
      'Are you in an emergency situation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Emergency',
          style: 'destructive',
          onPress: () => {
            // In a real app, this would call emergency services
            Alert.alert('Emergency', 'Emergency services have been notified.');
          }
        }
      ]
    );
  };

  // Handle call driver
  const handleCallDriver = () => {
    Alert.alert('Call Driver', `Calling ${booking.driverId.name}...`);
    // In a real app, this would initiate a phone call
  };

  // Render ride status
  const renderRideStatus = () => {
    if (isRideCompleted) {
      return (
        <View style={styles.statusCompleted}>
          <Ionicons name="checkmark-circle" size={24} color="#28CD41" />
          <Text style={styles.statusTextCompleted}>Ride Completed</Text>
        </View>
      );
    }

    if (isRideActive) {
      return (
        <View style={styles.statusActive}>
          <Ionicons name="navigate" size={24} color="#007AFF" />
          <Text style={styles.statusTextActive}>Ride in Progress</Text>
          {Boolean(estimatedArrival) && (
            <Text style={styles.etaText}>ETA: {estimatedArrival}</Text>
          )}
        </View>
      );
    }

    return (
      <View style={styles.statusWaiting}>
        <ActivityIndicator size="small" color="#FF9500" />
        <Text style={styles.statusTextWaiting}>Waiting for driver to start</Text>
      </View>
    );
  };

  // Get map region
  const getMapRegion = () => {
    if (driverLocation) {
      return {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
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

          {/* Driver Location Marker */}
          {driverLocation && (
            <Marker
              coordinate={{
                latitude: driverLocation.latitude,
                longitude: driverLocation.longitude
              }}
              title="Driver Location"
              description={`${booking.driverId.name} - ${booking.driverId.vehicle.model}`}
              pinColor="blue"
            >
              <View style={styles.driverMarker}>
                <Ionicons name="car" size={24} color="#FFF" />
              </View>
            </Marker>
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
        {/* Driver Info */}
        <View style={styles.driverInfo}>
          <View style={styles.driverAvatar}>
            <Ionicons name="person-circle" size={40} color="#007AFF" />
          </View>
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{booking.driverId.name}</Text>
            <Text style={styles.vehicleInfo}>
              {booking.driverId.vehicle.color} {booking.driverId.vehicle.model}
            </Text>
            <Text style={styles.licensePlate}>{booking.driverId.vehicle.licensePlate}</Text>
          </View>
          <TouchableOpacity
            style={styles.callButton}
            onPress={handleCallDriver}
          >
            <Ionicons name="call" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Ride Status */}
        <View style={styles.statusContainer}>
          {renderRideStatus()}
        </View>

        {/* Location Info */}
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
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={handleEmergency}
          >
            <Ionicons name="warning" size={20} color="#FFF" />
            <Text style={styles.emergencyButtonText}>Emergency</Text>
          </TouchableOpacity>
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
  driverMarker: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
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
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverAvatar: {
    marginRight: 12,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  licensePlate: {
    fontSize: 12,
    color: '#999',
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
  statusContainer: {
    marginBottom: 16,
  },
  statusWaiting: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
  },
  statusTextWaiting: {
    fontSize: 14,
    color: '#856404',
    marginLeft: 8,
    flex: 1,
  },
  statusActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1ECF1',
    padding: 12,
    borderRadius: 8,
  },
  statusTextActive: {
    fontSize: 14,
    color: '#0C5460',
    marginLeft: 8,
    flex: 1,
  },
  etaText: {
    fontSize: 12,
    color: '#0C5460',
    fontWeight: '600',
  },
  statusCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4EDDA',
    padding: 12,
    borderRadius: 8,
  },
  statusTextCompleted: {
    fontSize: 14,
    color: '#155724',
    marginLeft: 8,
    flex: 1,
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
  emergencyButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    minWidth: 200,
  },
  emergencyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default RideTrackingScreen;
