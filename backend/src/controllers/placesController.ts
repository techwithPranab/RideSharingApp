/**
 * Places Controller
 * Handles geocoding and places search using LocationIQ API
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { geocodingManager } from '../services/migrationHelper';

/**
 * Search for places using LocationIQ geocoding service
 */
export const searchPlaces = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { query, lat, lng } = req.query;

    if (!query || typeof query !== 'string') {
      return next(new AppError('Search query is required', 400));
    }

    // Parse coordinates if provided
    const latitude = lat ? parseFloat(lat as string) : undefined;
    const longitude = lng ? parseFloat(lng as string) : undefined;

    logger.info(`Searching places for query: ${query}`, { lat: latitude, lng: longitude });

    // Use the geocoding manager to search places
    const places = await geocodingManager.searchPlaces(query, latitude, longitude);

    logger.info(`Found ${places.length} places for query: ${query}`);

    res.status(200).json({
      success: true,
      data: places,
      count: places.length
    });

  } catch (error) {
    logger.error('Search places error:', error);
    return next(new AppError('Failed to search places', 500));
  }
};

/**
 * Get detailed information about a specific place
 * Note: LocationIQ doesn't provide detailed place information like Google Places
 * This returns basic information based on the place ID
 */
export const getPlaceDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { placeId } = req.params;

    if (!placeId) {
      return next(new AppError('Place ID is required', 400));
    }

    logger.info(`Getting place details for placeId: ${placeId}`);

    // For LocationIQ, we'll return basic information
    // In a production app, you might want to cache place details or use a different service
    const mockPlaceDetails = {
      placeId: placeId,
      name: 'Place Details',
      address: 'Address not available with LocationIQ',
      location: {
        latitude: 0,
        longitude: 0
      },
      phoneNumber: null,
      website: null,
      rating: null,
      reviews: null,
      note: 'Detailed place information is not available with LocationIQ. Consider using a different provider for place details.'
    };

    res.status(200).json({
      success: true,
      data: mockPlaceDetails
    });

  } catch (error) {
    logger.error('Get place details error:', error);
    return next(new AppError('Failed to get place details', 500));
  }
};

/**
 * Convert coordinates to address (reverse geocoding)
 */
export const reverseGeocode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return next(new AppError('Latitude and longitude are required', 400));
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);

    logger.info(`Reverse geocoding coordinates: ${latitude}, ${longitude}`);

    // Use the geocoding manager for reverse geocoding
    const addressData = await geocodingManager.reverseGeocode(latitude, longitude);

    logger.info(`Reverse geocoding successful for coordinates: ${latitude}, ${longitude}`);

    res.status(200).json({
      success: true,
      data: addressData
    });

  } catch (error) {
    logger.error('Reverse geocoding error:', error);
    return next(new AppError('Failed to reverse geocode coordinates', 500));
  }
};
