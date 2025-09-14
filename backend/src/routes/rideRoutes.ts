/**
 * Ride routes for handling ride-related API endpoints
 * Defines all routes for ride operations
 */

import { Router } from 'express';
import { RideController } from '../controllers/rideController';
import { protect } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all ride routes
router.use(protect);

/**
 * @route POST /api/rides/request
 * @desc Create a new ride request
 * @access Private (Riders only)
 */
router.post('/request', RideController.createRide);

/**
 * @route POST /api/rides/fare-estimate
 * @desc Get fare estimate for a route
 * @access Private (Riders only)
 */
router.post('/fare-estimate', RideController.getFareEstimate);

/**
 * @route GET /api/rides/active
 * @desc Get active ride for user
 * @access Private
 */
router.get('/active', RideController.getActiveRide);

/**
 * @route GET /api/rides/history
 * @desc Get user's ride history
 * @access Private
 */
router.get('/history', RideController.getRideHistory);

/**
 * @route GET /api/rides/:rideId
 * @desc Get ride details
 * @access Private (Ride participants only)
 */
router.get('/:rideId', RideController.getRide);

/**
 * @route PATCH /api/rides/:rideId/status
 * @desc Update ride status
 * @access Private (Authorized users only)
 */
router.patch('/:rideId/status', RideController.updateRideStatus);

/**
 * @route PATCH /api/rides/:rideId/cancel
 * @desc Cancel a ride
 * @access Private (Authorized users only)
 */
router.patch('/:rideId/cancel', RideController.cancelRide);

/**
 * @route POST /api/rides/:rideId/rate
 * @desc Rate a completed ride
 * @access Private (Passengers only)
 */
router.post('/:rideId/rate', RideController.rateRide);

export default router;
