/**
 * Fare Calculation Service
 * Handles automatic fare calculation based on distance, fuel price, tolls, parking, and other factors
 */

export interface FareCalculationInput {
  distance: number; // in kilometers
  duration?: number; // in minutes
  fuelPrice: number; // per liter
  tollCharges?: number; // total toll charges
  parkingCharges?: number; // parking charges
  numberOfSeats: number;
  vehicleType: 'sedan' | 'suv' | 'hatchback' | 'bike';
  city: string;
  isPeakHour?: boolean;
  isNightTime?: boolean;
  waitingTime?: number; // in minutes
}

export interface FareBreakdown {
  baseFare: number;
  distanceFare: number;
  durationFare: number;
  fuelSurcharge: number;
  tollCharges: number;
  parkingCharges: number;
  seatSurcharge: number;
  peakHourSurcharge: number;
  nightTimeSurcharge: number;
  waitingCharges: number;
  taxes: number;
  totalFare: number;
}

export interface FareLimits {
  minimumFare: number;
  maximumFare: number;
  perKmRate: number;
  perMinuteRate: number;
  baseFare: number;
}

class FareCalculationService {
  // Fare configuration by city and vehicle type
  private static readonly FARE_CONFIG = {
    mumbai: {
      sedan: {
        baseFare: 50,
        perKmRate: 12,
        perMinuteRate: 1.5,
        fuelEfficiency: 15, // km per liter
        minimumFare: 80,
        maximumFare: 2000
      },
      suv: {
        baseFare: 70,
        perKmRate: 15,
        perMinuteRate: 2,
        fuelEfficiency: 12,
        minimumFare: 100,
        maximumFare: 2500
      },
      hatchback: {
        baseFare: 40,
        perKmRate: 10,
        perMinuteRate: 1.2,
        fuelEfficiency: 18,
        minimumFare: 60,
        maximumFare: 1500
      },
      bike: {
        baseFare: 25,
        perKmRate: 6,
        perMinuteRate: 0.8,
        fuelEfficiency: 40,
        minimumFare: 30,
        maximumFare: 500
      }
    },
    delhi: {
      sedan: {
        baseFare: 45,
        perKmRate: 11,
        perMinuteRate: 1.4,
        fuelEfficiency: 15,
        minimumFare: 70,
        maximumFare: 1800
      },
      suv: {
        baseFare: 65,
        perKmRate: 14,
        perMinuteRate: 1.8,
        fuelEfficiency: 12,
        minimumFare: 90,
        maximumFare: 2200
      },
      hatchback: {
        baseFare: 35,
        perKmRate: 9,
        perMinuteRate: 1.1,
        fuelEfficiency: 18,
        minimumFare: 55,
        maximumFare: 1300
      },
      bike: {
        baseFare: 20,
        perKmRate: 5,
        perMinuteRate: 0.7,
        fuelEfficiency: 40,
        minimumFare: 25,
        maximumFare: 400
      }
    },
    bangalore: {
      sedan: {
        baseFare: 40,
        perKmRate: 10,
        perMinuteRate: 1.3,
        fuelEfficiency: 16,
        minimumFare: 65,
        maximumFare: 1600
      },
      suv: {
        baseFare: 60,
        perKmRate: 13,
        perMinuteRate: 1.7,
        fuelEfficiency: 13,
        minimumFare: 85,
        maximumFare: 2000
      },
      hatchback: {
        baseFare: 30,
        perKmRate: 8,
        perMinuteRate: 1.0,
        fuelEfficiency: 19,
        minimumFare: 50,
        maximumFare: 1200
      },
      bike: {
        baseFare: 18,
        perKmRate: 4.5,
        perMinuteRate: 0.6,
        fuelEfficiency: 45,
        minimumFare: 22,
        maximumFare: 350
      }
    }
  };

  // Surcharge rates
  private static readonly SURCHARGES = {
    peakHour: 0.2, // 20% surcharge
    nightTime: 0.15, // 15% surcharge
    seatMultiplier: 0.1, // 10% per additional seat
    waitingChargePerMinute: 2, // ₹2 per minute waiting
    taxRate: 0.18 // 18% GST
  };

  /**
   * Calculate fare based on input parameters
   */
  static calculateFare(input: FareCalculationInput): FareBreakdown {
    const config = this.getFareConfig(input.city, input.vehicleType);
    if (!config) {
      throw new Error(`Fare configuration not found for ${input.city} - ${input.vehicleType}`);
    }

    // Base fare
    const baseFare = config.baseFare;

    // Distance fare
    const distanceFare = input.distance * config.perKmRate;

    // Duration fare (if provided)
    const durationFare = input.duration ? input.duration * config.perMinuteRate : 0;

    // Fuel surcharge (based on distance and fuel efficiency)
    const fuelConsumption = input.distance / config.fuelEfficiency;
    const fuelSurcharge = fuelConsumption * input.fuelPrice;

    // Additional charges
    const tollCharges = input.tollCharges || 0;
    const parkingCharges = input.parkingCharges || 0;

    // Seat surcharge (for additional passengers beyond 1)
    const additionalSeats = Math.max(0, input.numberOfSeats - 1);
    const seatSurcharge = baseFare * additionalSeats * this.SURCHARGES.seatMultiplier;

    // Time-based surcharges
    const peakHourSurcharge = input.isPeakHour ? (baseFare + distanceFare) * this.SURCHARGES.peakHour : 0;
    const nightTimeSurcharge = input.isNightTime ? (baseFare + distanceFare) * this.SURCHARGES.nightTime : 0;

    // Waiting charges
    const waitingCharges = input.waitingTime ? input.waitingTime * this.SURCHARGES.waitingChargePerMinute : 0;

    // Subtotal before tax
    const subtotal = baseFare + distanceFare + durationFare + fuelSurcharge +
                    tollCharges + parkingCharges + seatSurcharge +
                    peakHourSurcharge + nightTimeSurcharge + waitingCharges;

    // Apply minimum fare
    const fareAfterMin = Math.max(subtotal, config.minimumFare);

    // Apply maximum fare
    const fareAfterMax = Math.min(fareAfterMin, config.maximumFare);

    // Calculate taxes
    const taxes = fareAfterMax * this.SURCHARGES.taxRate;

    // Final total
    const totalFare = fareAfterMax + taxes;

    return {
      baseFare,
      distanceFare,
      durationFare,
      fuelSurcharge,
      tollCharges,
      parkingCharges,
      seatSurcharge,
      peakHourSurcharge,
      nightTimeSurcharge,
      waitingCharges,
      taxes,
      totalFare: Math.round(totalFare * 100) / 100 // Round to 2 decimal places
    };
  }

  /**
   * Get fare configuration for a city and vehicle type
   */
  private static getFareConfig(city: string, vehicleType: string): any {
    const cityConfig = this.FARE_CONFIG[city.toLowerCase() as keyof typeof this.FARE_CONFIG];
    if (!cityConfig) return null;

    return cityConfig[vehicleType as keyof typeof cityConfig];
  }

  /**
   * Get fare limits for a city and vehicle type
   */
  static getFareLimits(city: string, vehicleType: string): FareLimits | null {
    const config = this.getFareConfig(city, vehicleType);
    if (!config) return null;

    return {
      minimumFare: config.minimumFare,
      maximumFare: config.maximumFare,
      perKmRate: config.perKmRate,
      perMinuteRate: config.perMinuteRate,
      baseFare: config.baseFare
    };
  }

  /**
   * Estimate fare for a route (simplified version for quick estimates)
   */
  static estimateFare(
    distance: number,
    city: string,
    vehicleType: string,
    numberOfSeats: number = 1
  ): { estimatedFare: number; breakdown: Partial<FareBreakdown> } {
    const config = this.getFareConfig(city, vehicleType);
    if (!config) {
      throw new Error(`Fare configuration not found for ${city} - ${vehicleType}`);
    }

    // Simple estimation
    const baseFare = config.baseFare;
    const distanceFare = distance * config.perKmRate;
    const seatSurcharge = baseFare * Math.max(0, numberOfSeats - 1) * this.SURCHARGES.seatMultiplier;
    const subtotal = baseFare + distanceFare + seatSurcharge;
    const estimatedFare = Math.max(subtotal, config.minimumFare);
    const finalFare = Math.min(estimatedFare, config.maximumFare);

    return {
      estimatedFare: Math.round(finalFare * 100) / 100,
      breakdown: {
        baseFare,
        distanceFare,
        seatSurcharge,
        totalFare: finalFare
      }
    };
  }

  /**
   * Check if current time is peak hour
   * @param city - Reserved for future city-specific peak hour logic
   */
  static isPeakHour(_city: string, dateTime: Date = new Date()): boolean {
    const hour = dateTime.getHours();
    const day = dateTime.getDay();

    // Weekend peak hours
    if (day === 0 || day === 6) {
      return hour >= 18 && hour <= 22; // 6 PM - 10 PM
    }

    // Weekday peak hours
    return (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19); // 8-10 AM, 5-7 PM
  }

  /**
   * Check if current time is night time
   */
  static isNightTime(dateTime: Date = new Date()): boolean {
    const hour = dateTime.getHours();
    return hour >= 22 || hour <= 5; // 10 PM - 5 AM
  }

  /**
   * Get fuel price for a city (this could be fetched from an external API)
   */
  static getFuelPrice(city: string): number {
    const fuelPrices: { [key: string]: number } = {
      mumbai: 105,
      delhi: 98,
      bangalore: 102,
      chennai: 100,
      kolkata: 95,
      hyderabad: 99,
      pune: 103,
      ahmedabad: 97
    };

    return fuelPrices[city.toLowerCase()] || 100; // Default ₹100 per liter
  }

  /**
   * Validate fare calculation input
   */
  static validateInput(input: FareCalculationInput): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (input.distance <= 0) {
      errors.push('Distance must be greater than 0');
    }

    if (input.distance > 500) {
      errors.push('Distance cannot exceed 500 km');
    }

    if (input.fuelPrice <= 0) {
      errors.push('Fuel price must be greater than 0');
    }

    if (input.numberOfSeats < 1 || input.numberOfSeats > 7) {
      errors.push('Number of seats must be between 1 and 7');
    }

    if (!['sedan', 'suv', 'hatchback', 'bike'].includes(input.vehicleType)) {
      errors.push('Invalid vehicle type');
    }

    if (input.duration && input.duration < 0) {
      errors.push('Duration cannot be negative');
    }

    if (input.waitingTime && input.waitingTime < 0) {
      errors.push('Waiting time cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default FareCalculationService;
