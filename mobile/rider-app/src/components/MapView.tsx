/**
 * Google Maps Component for RideShare Rider App
 * Provides interactive map functionality for location selection and route display
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from './MockMapView';
import { APP_CONFIG, COLORS } from '../constants/config';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

interface MapLocation extends Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MapMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  description?: string;
  pinColor?: string;
}

interface MapProps {
  style?: any;
  initialRegion?: MapLocation;
  markers?: MapMarker[];
  routeCoordinates?: { latitude: number; longitude: number }[];
  onLocationSelect?: (location: MapLocation) => void;
  onMarkerPress?: (marker: MapMarker) => void;
  showUserLocation?: boolean;
  enableLocationSelection?: boolean;
  zoomEnabled?: boolean;
  scrollEnabled?: boolean;
  showsMyLocationButton?: boolean;
  showsCompass?: boolean;
  showsScale?: boolean;
  showsBuildings?: boolean;
  showsTraffic?: boolean;
  showsIndoors?: boolean;
}

const MapComponent: React.FC<MapProps> = ({
  style,
  initialRegion,
  markers = [],
  routeCoordinates = [],
  onLocationSelect,
  onMarkerPress,
  showUserLocation = true,
  enableLocationSelection = false,
  zoomEnabled = true,
  scrollEnabled = true,
  showsMyLocationButton = true,
  showsCompass = true,
  showsScale = false,
  showsBuildings = true,
  showsTraffic = false,
  showsIndoors = false,
}) => {
  const mapRef = useRef<typeof MapView>(null);
  const [currentLocation, setCurrentLocation] = useState<MapLocation | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);

  // Default region (Delhi, India)
  const defaultRegion: MapLocation = initialRegion || (APP_CONFIG.GOOGLE_MAPS_CONFIG.INITIAL_REGION as MapLocation);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        getCurrentLocation();
      } else {
        Alert.alert(
          'Location Permission Required',
          'Please enable location permissions to use map features.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const currentLoc: MapLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      setCurrentLocation(currentLoc);

      // If no initial region provided, use current location
      if (mapRef.current) {
        console.log('Would animate to region:', currentLoc);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  const handleMapPress = (event: any) => {
    if (!enableLocationSelection) return;

    const { coordinate } = event.nativeEvent;
    const location: MapLocation = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    setSelectedLocation(location);
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  const handleMarkerPress = (marker: MapMarker) => {
    if (onMarkerPress) {
      onMarkerPress(marker);
    }
  };

  const centerOnUserLocation = () => {
    if (currentLocation && mapRef.current) {
      console.log('Would animate to region:', currentLocation);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={defaultRegion}
        showsUserLocation={showUserLocation && locationPermission}
        showsMyLocationButton={showsMyLocationButton && locationPermission}
        showsCompass={showsCompass}
        showsScale={showsScale}
        showsBuildings={showsBuildings}
        showsTraffic={showsTraffic}
        showsIndoors={showsIndoors}
        zoomEnabled={zoomEnabled}
        scrollEnabled={scrollEnabled}
        onPress={handleMapPress}
        customMapStyle={mapStyle}
      >
        {/* Render markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title || ''}
            description={marker.description || ''}
            pinColor={marker.pinColor || COLORS.primary}
            onPress={() => handleMarkerPress(marker)}
          />
        ))}

        {/* Selected location marker */}
        {selectedLocation && enableLocationSelection && (
          <Marker
            coordinate={selectedLocation}
            title="Selected Location"
            pinColor={COLORS.secondary}
          />
        )}

        {/* Route polyline */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={COLORS.primary}
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}
      </MapView>

      {/* Custom location button if needed */}
      {showUserLocation && locationPermission && !showsMyLocationButton && (
        <TouchableOpacity
          style={styles.locationButton}
          onPress={centerOnUserLocation}
        >
          <Text style={styles.locationButtonText}>📍</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height * 0.6, // Default height, can be overridden by style prop
  },
  locationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: COLORS.white,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationButtonText: {
    fontSize: 24,
  },
});

// Custom map styling for better UX
const mapStyle = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
];

export default MapComponent;
