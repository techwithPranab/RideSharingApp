/**
 * Unit tests for Location Service
 * Tests location utilities and GPS functionality
 */

import * as Location from 'expo-location';
import { locationService } from '../../../../../../mobile/rider-app/src/services/locationService';

// Mock expo-location
jest.mock('expo-location');

describe('LocationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentLocation', () => {
    it('should get current location successfully', async () => {
      const mockLocation = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 10
        },
        timestamp: Date.now()
      };

      Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Location.getCurrentPositionAsync.mockResolvedValue(mockLocation);

      const result = await locationService.getCurrentLocation();

      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({
        accuracy: Location.Accuracy.High
      });

      expect(result).toEqual({
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
        timestamp: mockLocation.timestamp
      });
    });

    it('should throw error when permission denied', async () => {
      Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });

      await expect(locationService.getCurrentLocation()).rejects.toThrow(
        'Location permission denied'
      );

      expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
    });

    it('should handle location fetch error', async () => {
      Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Location.getCurrentPositionAsync.mockRejectedValue(new Error('GPS unavailable'));

      await expect(locationService.getCurrentLocation()).rejects.toThrow('GPS unavailable');
    });
  });

  describe('watchLocation', () => {
    it('should start watching location successfully', async () => {
      const mockWatcher = {
        remove: jest.fn()
      };

      const mockLocationUpdate = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 5
        },
        timestamp: Date.now()
      };

      Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Location.watchPositionAsync.mockResolvedValue(mockWatcher);

      const mockCallback = jest.fn();
      const result = await locationService.watchLocation(mockCallback);

      expect(Location.watchPositionAsync).toHaveBeenCalledWith(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10
        },
        expect.any(Function)
      );

      expect(result).toBe(mockWatcher);

      // Simulate location update
      const watchCallback = Location.watchPositionAsync.mock.calls[0][1];
      watchCallback(mockLocationUpdate);

      expect(mockCallback).toHaveBeenCalledWith({
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 5,
        timestamp: mockLocationUpdate.timestamp
      });
    });

    it('should handle watch error callback', async () => {
      Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Location.watchPositionAsync.mockRejectedValue(new Error('Watch failed'));

      const mockCallback = jest.fn();
      const mockErrorCallback = jest.fn();

      await expect(
        locationService.watchLocation(mockCallback, mockErrorCallback)
      ).rejects.toThrow('Watch failed');

      expect(mockErrorCallback).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('stopWatchingLocation', () => {
    it('should stop watching location', () => {
      const mockWatcher = {
        remove: jest.fn()
      };

      locationService.stopWatchingLocation(mockWatcher);

      expect(mockWatcher.remove).toHaveBeenCalled();
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      const point1 = { latitude: 37.7749, longitude: -122.4194 }; // San Francisco
      const point2 = { latitude: 37.7849, longitude: -122.4094 }; // Nearby point

      const distance = locationService.calculateDistance(point1, point2);

      expect(typeof distance).toBe('number');
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(2); // Should be less than 2km
    });

    it('should return 0 for same coordinates', () => {
      const point1 = { latitude: 37.7749, longitude: -122.4194 };
      const point2 = { latitude: 37.7749, longitude: -122.4194 };

      const distance = locationService.calculateDistance(point1, point2);

      expect(distance).toBe(0);
    });

    it('should calculate long distance correctly', () => {
      const sanFrancisco = { latitude: 37.7749, longitude: -122.4194 };
      const newYork = { latitude: 40.7128, longitude: -74.0060 };

      const distance = locationService.calculateDistance(sanFrancisco, newYork);

      expect(distance).toBeGreaterThan(4000); // Should be > 4000km
      expect(distance).toBeLessThan(5000); // Should be < 5000km
    });
  });

  describe('isLocationWithinRadius', () => {
    it('should return true for locations within radius', () => {
      const center = { latitude: 37.7749, longitude: -122.4194 };
      const point = { latitude: 37.7759, longitude: -122.4184 }; // Very close
      const radiusKm = 1;

      const result = locationService.isLocationWithinRadius(center, point, radiusKm);

      expect(result).toBe(true);
    });

    it('should return false for locations outside radius', () => {
      const center = { latitude: 37.7749, longitude: -122.4194 };
      const point = { latitude: 37.8749, longitude: -122.3194 }; // Far away
      const radiusKm = 1;

      const result = locationService.isLocationWithinRadius(center, point, radiusKm);

      expect(result).toBe(false);
    });

    it('should handle edge case at exact radius', () => {
      const center = { latitude: 37.7749, longitude: -122.4194 };
      const point = { latitude: 37.7849, longitude: -122.4094 };
      
      // Calculate actual distance first
      const actualDistance = locationService.calculateDistance(center, point);
      
      const result = locationService.isLocationWithinRadius(center, point, actualDistance);
      expect(result).toBe(true);
    });
  });

  describe('formatLocationString', () => {
    it('should format location string correctly', () => {
      const location = {
        latitude: 37.7749295,
        longitude: -122.4194155
      };

      const result = locationService.formatLocationString(location);

      expect(result).toBe('37.7749, -122.4194');
    });

    it('should handle precision parameter', () => {
      const location = {
        latitude: 37.7749295,
        longitude: -122.4194155
      };

      const result = locationService.formatLocationString(location, 6);

      expect(result).toBe('37.774930, -122.419416');
    });
  });

  describe('isValidCoordinate', () => {
    it('should validate correct coordinates', () => {
      expect(locationService.isValidCoordinate(37.7749, -122.4194)).toBe(true);
      expect(locationService.isValidCoordinate(0, 0)).toBe(true);
      expect(locationService.isValidCoordinate(-90, -180)).toBe(true);
      expect(locationService.isValidCoordinate(90, 180)).toBe(true);
    });

    it('should reject invalid coordinates', () => {
      expect(locationService.isValidCoordinate(91, 0)).toBe(false); // Invalid latitude
      expect(locationService.isValidCoordinate(-91, 0)).toBe(false); // Invalid latitude
      expect(locationService.isValidCoordinate(0, 181)).toBe(false); // Invalid longitude
      expect(locationService.isValidCoordinate(0, -181)).toBe(false); // Invalid longitude
      expect(locationService.isValidCoordinate(NaN, 0)).toBe(false); // NaN latitude
      expect(locationService.isValidCoordinate(0, NaN)).toBe(false); // NaN longitude
    });
  });

  describe('getLocationPermissionStatus', () => {
    it('should return permission status', async () => {
      Location.requestForegroundPermissionsAsync.mockResolvedValue({ 
        status: 'granted',
        canAskAgain: true
      });

      const result = await locationService.getLocationPermissionStatus();

      expect(result).toEqual({
        status: 'granted',
        canAskAgain: true
      });
    });
  });

  describe('reverseGeocode', () => {
    it('should reverse geocode coordinates to address', async () => {
      const mockAddress = [{
        street: '123 Main St',
        city: 'San Francisco',
        region: 'CA',
        postalCode: '94102',
        country: 'US',
        name: '123 Main St'
      }];

      Location.reverseGeocodeAsync.mockResolvedValue(mockAddress);

      const result = await locationService.reverseGeocode(37.7749, -122.4194);

      expect(Location.reverseGeocodeAsync).toHaveBeenCalledWith({
        latitude: 37.7749,
        longitude: -122.4194
      });

      expect(result).toBe('123 Main St, San Francisco, CA 94102, US');
    });

    it('should handle reverse geocode failure', async () => {
      Location.reverseGeocodeAsync.mockRejectedValue(new Error('Geocoding failed'));

      const result = await locationService.reverseGeocode(37.7749, -122.4194);

      expect(result).toBe('Unknown location');
    });

    it('should handle empty geocode result', async () => {
      Location.reverseGeocodeAsync.mockResolvedValue([]);

      const result = await locationService.reverseGeocode(37.7749, -122.4194);

      expect(result).toBe('Unknown location');
    });
  });

  describe('getBearing', () => {
    it('should calculate bearing between two points', () => {
      const start = { latitude: 37.7749, longitude: -122.4194 };
      const end = { latitude: 37.7849, longitude: -122.4094 };

      const bearing = locationService.getBearing(start, end);

      expect(typeof bearing).toBe('number');
      expect(bearing).toBeGreaterThanOrEqual(0);
      expect(bearing).toBeLessThan(360);
    });

    it('should return 0 for same coordinates', () => {
      const point = { latitude: 37.7749, longitude: -122.4194 };

      const bearing = locationService.getBearing(point, point);

      expect(bearing).toBe(0);
    });
  });

  describe('locationCache', () => {
    it('should cache recent locations', async () => {
      const mockLocation = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 10
        },
        timestamp: Date.now()
      };

      Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Location.getCurrentPositionAsync.mockResolvedValue(mockLocation);

      // First call should fetch from GPS
      const result1 = await locationService.getCurrentLocation();
      expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(1);

      // Second call within cache time should use cache
      const result2 = await locationService.getCurrentLocation();
      expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(1); // Still 1, not 2

      expect(result1).toEqual(result2);
    });
  });
});
