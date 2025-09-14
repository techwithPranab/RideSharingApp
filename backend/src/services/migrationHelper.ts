/**
 * Migration Helper: Switch from Google Places to Alternative Providers
 * This utility helps you migrate from Google Places API to other providers
 */

import { createGeocoder, GeocoderService } from './geocodingService';

// Configuration for different providers
export const GEOCODING_PROVIDERS = {
  google: {
    name: 'Google Places API',
    status: 'current',
    apiKey: process.env.GOOGLE_PLACES_API_KEY
  },
  locationiq: {
    name: 'LocationIQ',
    status: 'recommended',
    apiKey: process.env.LOCATIONIQ_API_KEY,
    freeTier: '10,000 requests/month',
    pricing: '$4.99/month for 100K requests'
  },
  mapbox: {
    name: 'Mapbox',
    status: 'alternative',
    apiKey: process.env.MAPBOX_ACCESS_TOKEN,
    freeTier: '100,000 requests/month',
    pricing: '$0.75 per 1,000 requests'
  },
  openrouteservice: {
    name: 'OpenRouteService',
    status: 'budget',
    apiKey: process.env.OPENROUTESERVICE_API_KEY,
    freeTier: '2,000 requests/day',
    pricing: '€3.99/month unlimited'
  }
} as const;

type ProviderKey = keyof typeof GEOCODING_PROVIDERS;

/**
 * Geocoding Service Manager
 * Handles provider switching and fallbacks
 */
export class GeocodingManager {
  private readonly primaryProvider: string;
  private readonly fallbackProvider: string;
  private readonly services: Map<string, GeocoderService> = new Map();

  constructor(primary: string = 'locationiq', fallback: string = 'mapbox') {
    this.primaryProvider = primary;
    this.fallbackProvider = fallback;
  }

  /**
   * Get geocoding service with fallback support
   */
  private getService(provider: string): GeocoderService {
    if (!this.services.has(provider)) {
      try {
        const service = createGeocoder(provider as any);
        this.services.set(provider, service);
      } catch (error) {
        throw new Error(`Failed to initialize ${provider} service: ${error}`);
      }
    }
    return this.services.get(provider)!;
  }

  /**
   * Search places with automatic fallback
   */
  async searchPlaces(query: string, lat?: number, lng?: number) {
    try {
      const service = this.getService(this.primaryProvider);
      return await service.searchPlaces(query, lat, lng);
    } catch (error) {
      console.warn(`${this.primaryProvider} failed, trying ${this.fallbackProvider}:`, error);

      try {
        const fallbackService = this.getService(this.fallbackProvider);
        return await fallbackService.searchPlaces(query, lat, lng);
      } catch (fallbackError) {
        console.error(`Both providers failed:`, fallbackError);
        throw new Error('All geocoding services are unavailable');
      }
    }
  }

  /**
   * Reverse geocode with automatic fallback
   */
  async reverseGeocode(lat: number, lng: number) {
    try {
      const service = this.getService(this.primaryProvider);
      return await service.reverseGeocode(lat, lng);
    } catch (error) {
      console.warn(`${this.primaryProvider} failed, trying ${this.fallbackProvider}:`, error);

      try {
        const fallbackService = this.getService(this.fallbackProvider);
        return await fallbackService.reverseGeocode(lat, lng);
      } catch (fallbackError) {
        console.error(`Both providers failed:`, fallbackError);
        throw new Error('All geocoding services are unavailable');
      }
    }
  }

  /**
   * Get current provider status
   */
  getStatus() {
    const primary = GEOCODING_PROVIDERS[this.primaryProvider as ProviderKey];
    const fallback = GEOCODING_PROVIDERS[this.fallbackProvider as ProviderKey];

    return {
      primary: {
        name: primary.name,
        status: primary.status
      },
      fallback: {
        name: fallback.name,
        status: fallback.status
      }
    };
  }
}

/**
 * Migration utility functions
 */
export class MigrationHelper {

  /**
   * Test if a provider is working
   */
  static async testProvider(provider: string): Promise<boolean> {
    try {
      const service = createGeocoder(provider as any);
      // Test with a simple query
      await service.searchPlaces('New Delhi', 28.6139, 77.2090);
      return true;
    } catch (error) {
      console.error(`Provider ${provider} test failed:`, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Compare response formats between providers
   */
  static async compareProviders(query: string, lat?: number, lng?: number) {
    const results: any = {};

    for (const provider of ['locationiq', 'mapbox', 'openrouteservice']) {
      try {
        const service = createGeocoder(provider as any);
        const startTime = Date.now();
        const data = await service.searchPlaces(query, lat, lng);
        const responseTime = Date.now() - startTime;

        results[provider] = {
          success: true,
          resultCount: data.length,
          responseTime: `${responseTime}ms`,
          sampleResult: data[0]
        };
      } catch (error) {
        results[provider] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return results;
  }

  /**
   * Generate migration report
   */
  static generateReport() {
    return {
      currentSetup: 'Google Places API',
      recommendedAlternative: 'LocationIQ',
      migrationSteps: [
        '1. Sign up for LocationIQ account',
        '2. Get API key from dashboard',
        '3. Add LOCATIONIQ_API_KEY to environment variables',
        '4. Update placesController.ts to use new service',
        '5. Test all endpoints thoroughly',
        '6. Monitor usage and set up billing alerts'
      ],
      costSavings: 'Up to 80% compared to Google Maps',
      implementationTime: '2-4 hours'
    };
  }
}

// Export singleton instance
export const geocodingManager = new GeocodingManager();
