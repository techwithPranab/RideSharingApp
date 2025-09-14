/**
 * Fare Calculation Routes
 * Routes for fare calculation endpoints
 */

import express from 'express';
import fareCalculationController from '../controllers/fareCalculationController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All fare calculation routes require authentication
router.use(protect);

/**
 * @route POST /api/fares/calculate
 * @desc Calculate fare for a ride
 * @access Private
 */
router.post('/calculate', fareCalculationController.calculateFare);

/**
 * @route GET /api/fares/estimate
 * @desc Get fare estimate for quick calculations
 * @access Private
 */
router.get('/estimate', fareCalculationController.getFareEstimate);

/**
 * @route GET /api/fares/limits/:city/:vehicleType
 * @desc Get fare limits for a city and vehicle type
 * @access Private
 */
router.get('/limits/:city/:vehicleType', fareCalculationController.getFareLimits);

/**
 * @route GET /api/fares/fuel-price/:city
 * @desc Get fuel price for a city
 * @access Private
 */
router.get('/fuel-price/:city', fareCalculationController.getFuelPrice);

/**
 * @route GET /api/fares/peak-hour
 * @desc Check if current time is peak hour
 * @access Private
 */
router.get('/peak-hour', fareCalculationController.checkPeakHour);

/**
 * @route GET /api/fares/night-time
 * @desc Check if current time is night time
 * @access Private
 */
router.get('/night-time', fareCalculationController.checkNightTime);

/**
 * @route GET /api/fares/options
 * @desc Get supported cities and vehicle types
 * @access Private
 */
router.get('/options', fareCalculationController.getSupportedOptions);

/**
 * @route POST /api/fares/booking
 * @desc Calculate fare for a booking (used internally)
 * @access Private
 */
router.post('/booking', fareCalculationController.calculateBookingFare);

export default router;
