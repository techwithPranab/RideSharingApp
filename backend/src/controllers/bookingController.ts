/**
 * Booking controller for handling ride booking operations
 * Provides endpoints for creating, cancelling, and managing bookings
 */

import { Request, Response } from 'express';
import BookingService from '../services/bookingService';
import { ApiResponse } from '../utils/apiResponse';
import { BookingStatus } from '../models/Booking';

export class BookingController {
  /**
   * Create a new booking
   * POST /api/bookings
   */
  static async createBooking(req: Request, res: Response): Promise<void> {
    try {
      const { rideOfferId, seatsBooked, paymentMethodId } = req.body;
      const riderId = req.user?.id;

      if (!riderId) {
        ApiResponse.error(res, 'Authentication required', 401);
        return;
      }

      if (!rideOfferId || !seatsBooked) {
        ApiResponse.error(res, 'Ride offer ID and seats are required', 400);
        return;
      }

      if (seatsBooked < 1 || seatsBooked > 6) {
        ApiResponse.error(res, 'Seats must be between 1 and 6', 400);
        return;
      }

      const result = await BookingService.createBooking({
        rideOfferId,
        riderId,
        seatsBooked,
        paymentMethodId
      });

      if (!result.success) {
        ApiResponse.error(res, result.message, 400);
        return;
      }

      ApiResponse.success(res, result.booking, 201);
    } catch (error) {
      console.error('Error in createBooking:', error);
      ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Cancel a booking by rider
   * PUT /api/bookings/:bookingId/cancel
   */
  static async cancelBooking(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const { reason } = req.body;
      const riderId = req.user?.id;

      if (!riderId) {
        ApiResponse.error(res, 'Authentication required', 401);
        return;
      }

      if (!reason) {
        ApiResponse.error(res, 'Cancellation reason is required', 400);
        return;
      }

      const result = await BookingService.cancelBookingByRider(
        bookingId,
        riderId,
        reason
      );

      if (!result.success) {
        ApiResponse.error(res, result.message, 400);
        return;
      }

      ApiResponse.success(res, result.booking);
    } catch (error) {
      console.error('Error in cancelBooking:', error);
      ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Get rider bookings
   * GET /api/bookings/rider
   */
  static async getRiderBookings(req: Request, res: Response): Promise<void> {
    try {
      const riderId = req.user?.id;
      const status = req.query.status as BookingStatus;

      if (!riderId) {
        ApiResponse.error(res, 'Authentication required', 401);
        return;
      }

      const result = await BookingService.getRiderBookings(riderId, status);

      if (!result.success) {
        ApiResponse.error(res, 'Failed to fetch bookings', 500);
        return;
      }

      ApiResponse.success(res, result.bookings);
    } catch (error) {
      console.error('Error in getRiderBookings:', error);
      ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Get driver bookings
   * GET /api/bookings/driver
   */
  static async getDriverBookings(req: Request, res: Response): Promise<void> {
    try {
      const driverId = req.user?.id;
      const status = req.query.status as BookingStatus;

      if (!driverId) {
        ApiResponse.error(res, 'Authentication required', 401);
        return;
      }

      const result = await BookingService.getDriverBookings(driverId, status);

      if (!result.success) {
        ApiResponse.error(res, 'Failed to fetch bookings', 500);
        return;
      }

      ApiResponse.success(res, result.bookings);
    } catch (error) {
      console.error('Error in getDriverBookings:', error);
      ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Confirm payment for a booking
   * PUT /api/bookings/:bookingId/confirm-payment
   */
  static async confirmPayment(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        ApiResponse.error(res, 'Payment intent ID is required', 400);
        return;
      }

      const result = await BookingService.confirmPayment(
        bookingId,
        paymentIntentId
      );

      if (!result.success) {
        ApiResponse.error(res, result.message, 400);
        return;
      }

      ApiResponse.success(res, result.booking);
    } catch (error) {
      console.error('Error in confirmPayment:', error);
      ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Process refund for a booking
   * PUT /api/bookings/:bookingId/refund
   */
  static async processRefund(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const { refundAmount } = req.body;

      const result = await BookingService.processRefund(
        bookingId,
        refundAmount
      );

      if (!result.success) {
        ApiResponse.error(res, result.message, 400);
        return;
      }

      ApiResponse.success(res, result.booking);
    } catch (error) {
      console.error('Error in processRefund:', error);
      ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Get booking details by ID
   * GET /api/bookings/:bookingId
   */
  static async getBookingById(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        ApiResponse.error(res, 'Authentication required', 401);
        return;
      }

      const booking = await BookingService.getBookingById(bookingId, userId);

      if (!booking.success) {
        ApiResponse.error(res, booking.message, 404);
        return;
      }

      ApiResponse.success(res, booking.booking);
    } catch (error) {
      console.error('Error in getBookingById:', error);
      ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Get cancellation policy
   * GET /api/bookings/cancellation-policy
   */
  static async getCancellationPolicy(res: Response): Promise<void> {
    try {
      const { CANCELLATION_POLICY } = await import('../models/Booking');

      ApiResponse.success(res, {
        policy: CANCELLATION_POLICY,
        explanation: {
          freeCancellation: `Free cancellation up to ${CANCELLATION_POLICY.FREE_CANCELLATION_HOURS} hours before departure`,
          partialRefund: `50% refund between ${CANCELLATION_POLICY.NO_REFUND_HOURS} and ${CANCELLATION_POLICY.PARTIAL_REFUND_HOURS} hours before departure`,
          noRefund: `No refund within ${CANCELLATION_POLICY.NO_REFUND_HOURS} hour of departure`
        }
      });
    } catch (error) {
      console.error('Error getting cancellation policy:', error);
      ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Get booking with cancellation info
   * GET /api/bookings/:bookingId/cancellation-info
   */
  static async getBookingCancellationInfo(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        ApiResponse.error(res, 'Authentication required', 401);
        return;
      }

      const booking = await BookingService.getBookingById(bookingId, userId);

      if (!booking.success || !booking.booking) {
        ApiResponse.error(res, booking.message || 'Booking not found', 404);
        return;
      }

      const { CANCELLATION_POLICY } = await import('../models/Booking');
      const bookingData = booking.booking;

      // Calculate cancellation info
      const refundInfo = bookingData.calculateRefundAmount();
      const now = new Date();
      const departureTime = new Date(bookingData.departureDateTime);
      const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      ApiResponse.success(res, {
        booking: {
          ...bookingData,
          hoursUntilDeparture: Math.max(0, hoursUntilDeparture)
        },
        cancellationInfo: {
          canCancel: bookingData.status === BookingStatus.CONFIRMED || bookingData.status === BookingStatus.PENDING,
          refundInfo,
          policy: CANCELLATION_POLICY
        }
      });
    } catch (error) {
      console.error('Error getting cancellation info:', error);
      ApiResponse.error(res, 'Internal server error', 500);
    }
  }
}

export default BookingController;
