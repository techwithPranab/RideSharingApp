/**
 * Location utilities
 * Functions for handling location data, distance calculations, etc.
 */

import { PermissionsAndroid, Platform } from 'react-native';
import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  formattedAddress?: string;
}

export const locationUtils = {
  /**
   * Request location permissions
   */
  requestPermissions: async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      // iOS permissions are handled automatically by the system
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location to provide ride services.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Location permission error:', err);
      return false;
    }
  },

  /**
   * Get current location
   */
  getCurrentLocation: (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            reject(new Error('Location permission denied'));
            return;
          }

          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy || undefined,
            timestamp: position.timestamp,
          });
        } catch (error: any) {
          reject(new Error(error.message || 'Failed to get location'));
        }
      })();
    });
  },

  /**
   * Watch location changes
   */
  watchLocation: (
    callback: (location: LocationData) => void,
    errorCallback?: (error: any) => void
  ): Promise<{ remove: () => void }> => {
    return Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || undefined,
          timestamp: position.timestamp,
        });
      }
    ).catch((error) => {
      errorCallback?.(error);
      throw error;
    });
  },

  /**
   * Stop watching location
   */
  stopWatchingLocation: (watcher: { remove: () => void }): void => {
    watcher.remove();
  },

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance: (
    point1: LocationData,
    point2: LocationData
  ): number => {
    const R = 6371; // Earth's radius in kilometers

    const dLat = toRadians(point2.latitude - point1.latitude);
    const dLon = toRadians(point2.longitude - point1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(point1.latitude)) *
        Math.cos(toRadians(point2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance; // Returns distance in kilometers
  },

  /**
   * Calculate bearing between two points
   */
  calculateBearing: (
    point1: LocationData,
    point2: LocationData
  ): number => {
    const dLon = toRadians(point2.longitude - point1.longitude);
    const lat1 = toRadians(point1.latitude);
    const lat2 = toRadians(point2.latitude);

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    const bearing = Math.atan2(y, x);
    return (toDegrees(bearing) + 360) % 360; // Normalize to 0-360 degrees
  },

  /**
   * Check if location is within bounds
   */
  isWithinBounds: (
    location: LocationData,
    bounds: {
      northEast: LocationData;
      southWest: LocationData;
    }
  ): boolean => {
    return (
      location.latitude >= bounds.southWest.latitude &&
      location.latitude <= bounds.northEast.latitude &&
      location.longitude >= bounds.southWest.longitude &&
      location.longitude <= bounds.northEast.longitude
    );
  },

  /**
   * Format location for display
   */
  formatLocation: (location: LocationData): string => {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  },

  /**
   * Validate location coordinates
   */
  isValidLocation: (location: LocationData): boolean => {
    return (
      location &&
      typeof location.latitude === 'number' &&
      typeof location.longitude === 'number' &&
      location.latitude >= -90 &&
      location.latitude <= 90 &&
      location.longitude >= -180 &&
      location.longitude <= 180
    );
  },
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

/**
 * Convert radians to degrees
 */
const toDegrees = (radians: number): number => {
  return (radians * 180) / Math.PI;
};
