/**
 * Booking service for managing ride bookings
 * Handles booking creation, cancellation, refunds, and notifications
 */

import Booking, { IBooking, BookingStatus } from '../models/Booking';
import { RideOffer, RideOfferStatus } from '../models/RideOffer';
import { User } from '../models/User';
import { Types } from 'mongoose';
import FareCalculationService, { FareCalculationInput } from './fareCalculationService';

interface BookingData {
  rideOfferId: string;
  riderId: string;
  seatsBooked: number;
  paymentMethodId?: string;
}

interface BookingResponse {
  success: boolean;
  message: string;
  booking?: IBooking;
  error?: string;
}

interface BookingListResponse {
  success: boolean;
  bookings?: IBooking[];
  error?: string;
}

export class BookingService {
  /**
   * Create a new booking for a ride offer
   */
  static async createBooking(bookingData: BookingData): Promise<BookingResponse> {
    try {
      const { rideOfferId, riderId, seatsBooked, paymentMethodId } = bookingData;

      // Find the ride offer
      const rideOffer = await RideOffer.findOne({ offerId: rideOfferId }).populate('driverId');
      if (!rideOffer) {
        return { success: false, message: 'Ride offer not found' };
      }

      if (rideOffer.status !== RideOfferStatus.PUBLISHED) {
        return { success: false, message: 'Ride offer is not available for booking' };
      }

      if (rideOffer.availableSeats < seatsBooked) {
        return { success: false, message: 'Not enough seats available' };
      }

      // Check if rider exists
      const rider = await User.findById(riderId);
      if (!rider) {
        return { success: false, message: 'Rider not found' };
      }

      // Calculate total amount using fare calculation service
      const fareInput: FareCalculationInput = {
        distance: this.calculateDistance(rideOffer.source.coordinates, rideOffer.destination.coordinates),
        fuelPrice: FareCalculationService.getFuelPrice('mumbai'), // Default to Mumbai, can be made dynamic
        numberOfSeats: seatsBooked,
        vehicleType: 'sedan', // Default vehicle type, can be enhanced
        city: 'mumbai', // Can be determined from location
        isPeakHour: FareCalculationService.isPeakHour('mumbai', new Date()),
        isNightTime: FareCalculationService.isNightTime(new Date()),
        tollCharges: 0, // Can be added to ride offer model later
        parkingCharges: 0, // Can be added to ride offer model later
        waitingTime: 0
      };

      const fareBreakdown = FareCalculationService.calculateFare(fareInput);
      const totalAmount = fareBreakdown.totalFare;

      // Create the booking
      const booking = new Booking({
        rideOfferId: rideOffer._id,
        riderId: new Types.ObjectId(riderId),
        driverId: rideOffer.driverId._id,
        seatsBooked,
        totalAmount,
        paymentMethodId,
        sourceLocation: rideOffer.source,
        destinationLocation: rideOffer.destination,
        departureDateTime: rideOffer.schedule.departureDate,
        estimatedArrival: rideOffer.schedule.departureDate // Will be calculated properly later
      });

      await booking.save();

      // Update ride offer availability
      rideOffer.availableSeats -= seatsBooked;
      rideOffer.bookedSeats += seatsBooked;
      rideOffer.totalBookings += 1;

      // If all seats are booked, mark as active
      if (rideOffer.availableSeats === 0) {
        rideOffer.status = RideOfferStatus.ACTIVE;
      }

      await rideOffer.save();

      return {
        success: true,
        message: 'Booking created successfully',
        booking: await booking.populate(['riderId', 'driverId', 'rideOfferId'])
      };
    } catch (error) {
      console.error('Error creating booking:', error);
      return {
        success: false,
        message: 'Failed to create booking',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Cancel a booking by rider
   */
  static async cancelBookingByRider(
    bookingId: string,
    riderId: string,
    reason: string
  ): Promise<BookingResponse> {
    try {
      const booking = await Booking.findOne({ 
        bookingId, 
        riderId: new Types.ObjectId(riderId) 
      }).populate(['rideOfferId', 'driverId']);

      if (!booking) {
        return { success: false, message: 'Booking not found' };
      }

      if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED) {
        return { success: false, message: 'Cannot cancel this booking' };
      }

      // Check cancellation time policy (e.g., allow cancellation up to 2 hours before departure)
      const now = new Date();
      const departureTime = new Date(booking.departureDateTime);
      const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilDeparture < 2) {
        return { 
          success: false, 
          message: 'Cannot cancel within 2 hours of departure time' 
        };
      }

      // Cancel the booking
      await booking.cancel(reason, 'rider');

      // Update ride offer availability
      const rideOffer = await RideOffer.findById(booking.rideOfferId);
      if (!rideOffer) {
        return { success: false, message: 'Associated ride offer not found' };
      }

      rideOffer.availableSeats += booking.seatsBooked;
      rideOffer.bookedSeats -= booking.seatsBooked;
      rideOffer.totalBookings -= 1;

      // If ride was marked as active due to full booking, revert to published
      if (rideOffer.status === RideOfferStatus.ACTIVE && rideOffer.availableSeats > 0) {
        rideOffer.status = RideOfferStatus.PUBLISHED;
      }

      await rideOffer.save();

      return {
        success: true,
        message: 'Booking cancelled successfully',
        booking
      };
    } catch (error) {
      console.error('Error cancelling booking:', error);
      return {
        success: false,
        message: 'Failed to cancel booking',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Cancel all bookings for a ride offer (when driver cancels)
   */
  static async cancelBookingsByDriver(
    rideOfferId: string,
    driverId: string,
    reason: string
  ): Promise<{ success: boolean; message: string; cancelledBookings?: IBooking[] }> {
    try {
      // Find all confirmed bookings for this ride offer
      const bookings = await Booking.find({
        rideOfferId: new Types.ObjectId(rideOfferId),
        driverId: new Types.ObjectId(driverId),
        status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] }
      }).populate(['riderId', 'rideOfferId']);

      if (bookings.length === 0) {
        return { 
          success: true, 
          message: 'No active bookings to cancel',
          cancelledBookings: []
        };
      }

      const cancelledBookings: IBooking[] = [];

      // Cancel each booking
      for (const booking of bookings) {
        await booking.cancel(reason, 'driver');
        cancelledBookings.push(booking);
      }

      // Send notifications to all affected riders
      // This will be implemented when we add notification service
      for (const booking of cancelledBookings) {
        console.log(`Notification needed: Ride cancelled by driver for booking ${booking.bookingId}`);
      }

      return {
        success: true,
        message: `Successfully cancelled ${cancelledBookings.length} booking(s)`,
        cancelledBookings
      };
    } catch (error) {
      console.error('Error cancelling bookings by driver:', error);
      return {
        success: false,
        message: 'Failed to cancel bookings'
      };
    }
  }

  /**
   * Get bookings for a rider
   */
  static async getRiderBookings(
    riderId: string,
    status?: BookingStatus
  ): Promise<BookingListResponse> {
    try {
      const query: any = { riderId: new Types.ObjectId(riderId) };
      if (status) {
        query.status = status;
      }

      const bookings = await Booking.find(query)
        .populate(['rideOfferId', 'driverId'])
        .sort({ createdAt: -1 });

      return {
        success: true,
        bookings
      };
    } catch (error) {
      console.error('Error fetching rider bookings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get bookings for a driver
   */
  static async getDriverBookings(
    driverId: string,
    status?: BookingStatus
  ): Promise<BookingListResponse> {
    try {
      const query: any = { driverId: new Types.ObjectId(driverId) };
      if (status) {
        query.status = status;
      }

      const bookings = await Booking.find(query)
        .populate(['riderId', 'rideOfferId'])
        .sort({ createdAt: -1 });

      return {
        success: true,
        bookings
      };
    } catch (error) {
      console.error('Error fetching driver bookings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Confirm payment for a booking
   */
  static async confirmPayment(
    bookingId: string,
    paymentIntentId: string
  ): Promise<BookingResponse> {
    try {
      const booking = await Booking.findOne({ bookingId });
      if (!booking) {
        return { success: false, message: 'Booking not found' };
      }

      await booking.confirmPayment(paymentIntentId);

      return {
        success: true,
        message: 'Payment confirmed successfully',
        booking
      };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return {
        success: false,
        message: 'Failed to confirm payment',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process refund for a booking
   */
  static async processRefund(
    bookingId: string,
    refundAmount?: number
  ): Promise<BookingResponse> {
    try {
      const booking = await Booking.findOne({ bookingId });
      if (!booking) {
        return { success: false, message: 'Booking not found' };
      }

      await booking.processRefund(refundAmount);

      return {
        success: true,
        message: 'Refund processed successfully',
        booking
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      return {
        success: false,
        message: 'Failed to process refund',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  /**
   * Get booking by ID for authorized user
   */
  static async getBookingById(
    bookingId: string,
    userId: string
  ): Promise<BookingResponse> {
    try {
      const booking = await Booking.findOne({ 
        bookingId,
        $or: [
          { riderId: new Types.ObjectId(userId) },
          { driverId: new Types.ObjectId(userId) }
        ]
      }).populate(['riderId', 'driverId', 'rideOfferId']);

      if (!booking) {
        return { success: false, message: 'Booking not found or access denied' };
      }

      return {
        success: true,
        message: 'Booking retrieved successfully',
        booking
      };
    } catch (error) {
      console.error('Error fetching booking by ID:', error);
      return {
        success: false,
        message: 'Failed to fetch booking',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private static calculateDistance(coord1: { latitude: number; longitude: number }, coord2: { latitude: number; longitude: number }): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

export default BookingService;
