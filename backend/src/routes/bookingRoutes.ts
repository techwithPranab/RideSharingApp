/**
 * Booking routes for ride booking management
 * Handles booking creation, cancellation, and retrieval
 */

import express from 'express';
import BookingController from '../controllers/bookingController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All booking routes require authentication
router.use(protect);

// Create a new booking
router.post('/', BookingController.createBooking);

// Get rider's bookings
router.get('/rider', BookingController.getRiderBookings);

// Get driver's bookings
router.get('/driver', BookingController.getDriverBookings);

// Get cancellation policy
router.get('/policy/cancellation', BookingController.getCancellationPolicy);

// Get booking with cancellation info
router.get('/:bookingId/cancellation-info', BookingController.getBookingCancellationInfo);

// Cancel booking by rider
router.put('/:bookingId/cancel', BookingController.cancelBooking);

// Confirm payment for booking
router.put('/:bookingId/confirm-payment', BookingController.confirmPayment);

// Process refund for booking (admin/system use)
router.put('/:bookingId/refund', BookingController.processRefund);

export default router;
