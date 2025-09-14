/**
 * Fare Calculation Controller
 * Handles fare calculation API endpoints
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import FareCalculationService, { FareCalculationInput } from '../services/fareCalculationService';

class FareCalculationController {
  /**
   * Calculate fare for a ride
   */
  calculateFare = asyncHandler(async (req: Request, res: Response) => {
    const input: FareCalculationInput = req.body;

    // Validate input
    const validation = FareCalculationService.validateInput(input);
    if (!validation.isValid) {
      return ApiResponse.error(res, 'Invalid input parameters', 400);
    }

    // Calculate fare
    const fareBreakdown = FareCalculationService.calculateFare(input);

    return ApiResponse.success(res, {
      fareBreakdown,
      input
    });
  });

  /**
   * Get fare estimate for quick calculations
   */
  getFareEstimate = asyncHandler(async (req: Request, res: Response) => {
    const { distance, city, vehicleType, numberOfSeats } = req.query;

    if (!distance || !city || !vehicleType) {
      return ApiResponse.error(res, 'Missing required parameters: distance, city, vehicleType', 400);
    }

    const distanceNum = parseFloat(distance as string);
    const seatsNum = numberOfSeats ? parseInt(numberOfSeats as string) : 1;

    if (isNaN(distanceNum) || distanceNum <= 0) {
      return ApiResponse.error(res, 'Invalid distance parameter', 400);
    }

    try {
      const estimate = FareCalculationService.estimateFare(
        distanceNum,
        city as string,
        vehicleType as string,
        seatsNum
      );

      return ApiResponse.success(res, estimate);
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 400);
    }
  });

  /**
   * Get fare limits for a city and vehicle type
   */
  getFareLimits = asyncHandler(async (req: Request, res: Response) => {
    const { city, vehicleType } = req.params;

    if (!city || !vehicleType) {
      return ApiResponse.error(res, 'Missing required parameters: city, vehicleType', 400);
    }

    const limits = FareCalculationService.getFareLimits(city, vehicleType);

    if (!limits) {
      return ApiResponse.error(res, `Fare configuration not found for ${city} - ${vehicleType}`, 404);
    }

    return ApiResponse.success(res, limits);
  });

  /**
   * Get fuel price for a city
   */
  getFuelPrice = asyncHandler(async (req: Request, res: Response) => {
    const { city } = req.params;

    if (!city) {
      return ApiResponse.error(res, 'Missing required parameter: city', 400);
    }

    const fuelPrice = FareCalculationService.getFuelPrice(city);

    return ApiResponse.success(res, { fuelPrice });
  });

  /**
   * Check if current time is peak hour
   */
  checkPeakHour = asyncHandler(async (req: Request, res: Response) => {
    const { city } = req.query;
    const dateTime = req.query.dateTime ? new Date(req.query.dateTime as string) : new Date();

    const isPeakHour = FareCalculationService.isPeakHour(city as string || '', dateTime);

    return ApiResponse.success(res, {
      isPeakHour,
      dateTime: dateTime.toISOString()
    });
  });

  /**
   * Check if current time is night time
   */
  checkNightTime = asyncHandler(async (req: Request, res: Response) => {
    const dateTime = req.query.dateTime ? new Date(req.query.dateTime as string) : new Date();

    const isNightTime = FareCalculationService.isNightTime(dateTime);

    return ApiResponse.success(res, {
      isNightTime,
      dateTime: dateTime.toISOString()
    });
  });

  /**
   * Get supported cities and vehicle types
   */
  getSupportedOptions = asyncHandler(async (_req: Request, res: Response) => {
    const cities = ['mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'pune', 'ahmedabad'];
    const vehicleTypes = ['sedan', 'suv', 'hatchback', 'bike'];

    return ApiResponse.success(res, {
      cities,
      vehicleTypes
    });
  });

  /**
   * Calculate fare for a booking (used internally by booking service)
   */
  calculateBookingFare = asyncHandler(async (req: Request, res: Response) => {
    const {
      sourceLocation,
      destinationLocation,
      vehicleType,
      numberOfSeats,
      departureDateTime,
      tollCharges,
      parkingCharges,
      waitingTime
    } = req.body;

    if (!sourceLocation || !destinationLocation || !vehicleType) {
      return ApiResponse.error(res, 'Missing required parameters', 400);
    }

    // Calculate distance (in a real app, this would use Google Maps API)
    const distance = this.calculateDistance(
      sourceLocation.coordinates,
      destinationLocation.coordinates
    );

    // Determine city (simplified - would use reverse geocoding in real app)
    const city = this.determineCity(sourceLocation);

    // Get fuel price
    const fuelPrice = FareCalculationService.getFuelPrice(city);

    // Check time-based surcharges
    const departureTime = new Date(departureDateTime);
    const isPeakHour = FareCalculationService.isPeakHour(city, departureTime);
    const isNightTime = FareCalculationService.isNightTime(departureTime);

    const fareInput: FareCalculationInput = {
      distance,
      fuelPrice,
      numberOfSeats: numberOfSeats || 1,
      vehicleType,
      city,
      isPeakHour,
      isNightTime,
      tollCharges,
      parkingCharges,
      waitingTime
    };

    // Validate input
    const validation = FareCalculationService.validateInput(fareInput);
    if (!validation.isValid) {
      return ApiResponse.error(res, 'Invalid fare calculation parameters', 400);
    }

    // Calculate fare
    const fareBreakdown = FareCalculationService.calculateFare(fareInput);

    return ApiResponse.success(res, {
      fareBreakdown,
      input: fareInput
    });
  });

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(coord1: { latitude: number; longitude: number }, coord2: { latitude: number; longitude: number }): number {
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

  /**
   * Determine city from location (simplified version)
   */
  private determineCity(_location: any): string {
    // In a real app, this would use reverse geocoding
    // For now, return a default city
    return 'mumbai';
  }
}

export default new FareCalculationController();
