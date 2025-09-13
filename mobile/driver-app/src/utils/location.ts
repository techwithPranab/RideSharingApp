/**
 * Location utility functions
 */

import { Location } from '../types';

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Get address from coordinates (placeholder - would integrate with Google Maps API)
 */
export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  // This would typically call a geocoding API
  // For now, return a placeholder
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
};

/**
 * Get coordinates from address (placeholder - would integrate with Google Maps API)
 */
export const getCoordinatesFromAddress = async (
  address: string
): Promise<{ latitude: number; longitude: number } | null> => {
  // This would typically call a geocoding API
  // For now, return null
  return null;
};

/**
 * Check if location is within a certain radius
 */
export const isLocationWithinRadius = (
  centerLat: number,
  centerLon: number,
  targetLat: number,
  targetLon: number,
  radiusKm: number
): boolean => {
  const distance = calculateDistance(centerLat, centerLon, targetLat, targetLon);
  return distance <= radiusKm;
};

/**
 * Format location for display
 */
export const formatLocation = (location: Location): string => {
  if (location.address) {
    return location.address;
  }
  return `${location.coordinates[1].toFixed(4)}, ${location.coordinates[0].toFixed(4)}`;
};

/**
 * Create location object
 */
export const createLocation = (
  latitude: number,
  longitude: number,
  address?: string
): Location => {
  const location: any = {
    type: 'Point',
    coordinates: [longitude, latitude],
  };
  if (address) {
    location.address = address;
  }
  return location;
};

/**
 * Get bearing between two points
 */
export const getBearing = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const dLon = toRadians(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRadians(lat2));
  const x = Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
            Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLon);
  const bearing = Math.atan2(y, x);
  return (toRadians(bearing) * 180 / Math.PI + 360) % 360;
};

/**
 * Get compass direction from bearing
 */
export const getCompassDirection = (bearing: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index] || 'N';
};
