/**
 * Ride tracking routes for real-time ride tracking functionality
 * Handles ride start, location updates, and completion
 */

import express from 'express';
import RideTrackingController from '../controllers/rideTrackingController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All ride tracking routes require authentication
router.use(protect);

// Start a ride
router.post('/:bookingId/start', RideTrackingController.startRide);

// Get ride tracking data
router.get('/:rideId/tracking', RideTrackingController.getRideTracking);

// Update driver location
router.put('/:rideId/location', RideTrackingController.updateLocation);

// Complete a ride
router.put('/:rideId/complete', RideTrackingController.completeRide);

// Get active rides for current user
router.get('/active', RideTrackingController.getActiveRides);

// Cancel ride tracking
router.put('/:rideId/cancel-tracking', RideTrackingController.cancelRideTracking);

export default router;
