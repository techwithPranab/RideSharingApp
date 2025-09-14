/**
 * Places Routes
 * Handles Google Places API integration for location search and geocoding
 */

import express from 'express';
import { param, query } from 'express-validator';
import { searchPlaces, getPlaceDetails, reverseGeocode } from '../controllers/placesController';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

/**
 * @route GET /api/places/search
 * @desc Search for places using Google Places API
 * @access Public
 */
router.get('/search', [
  query('query').isString().isLength({ min: 1 }).withMessage('Search query is required'),
  query('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  query('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  validateRequest
], searchPlaces);

/**
 * @route GET /api/places/details/:placeId
 * @desc Get detailed information about a specific place
 * @access Public
 */
router.get('/details/:placeId', [
  param('placeId').isString().isLength({ min: 1 }).withMessage('Place ID is required'),
  validateRequest
], getPlaceDetails);

/**
 * @route GET /api/places/reverse-geocode
 * @desc Convert coordinates to address (reverse geocoding)
 * @access Public
 */
router.get('/reverse-geocode', [
  query('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  query('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  validateRequest
], reverseGeocode);

export default router;
