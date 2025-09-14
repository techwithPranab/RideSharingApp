/**
 * Alternative Geocoding Services Implementation
 * This file demonstrates how to integrate different geocoding providers
 */

import axios from 'axios';

// Configuration for different providers
const PROVIDER_CONFIG = {
  mapbox: {
    apiKey: process.env.MAPBOX_ACCESS_TOKEN,
    geocodingUrl: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
    placesUrl: 'https://api.mapbox.com/geocoding/v5/mapbox.places'
  },
  openrouteservice: {
    apiKey: process.env.OPENROUTESERVICE_API_KEY,
    geocodingUrl: 'https://api.openrouteservice.org/geocode',
    poisUrl: 'https://api.openrouteservice.org/pois'
  },
  locationiq: {
    apiKey: process.env.LOCATIONIQ_API_KEY,
    geocodingUrl: 'https://us1.locationiq.com/v1',
    searchUrl: 'https://api.locationiq.com/v1'
  }
};

/**
 * Unified interface for geocoding operations
 */
export interface GeocoderService {
  searchPlaces(query: string, lat?: number, lng?: number): Promise<any[]>;
  reverseGeocode(lat: number, lng: number): Promise<any>;
}

/**
 * Mapbox Geocoding Implementation
 */
export class MapboxGeocoder implements GeocoderService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.MAPBOX_ACCESS_TOKEN || '';
    this.baseUrl = PROVIDER_CONFIG.mapbox.geocodingUrl;
  }

  async searchPlaces(query: string, lat?: number, lng?: number) {
    try {
      // Check if this is a test key - return mock data for testing
      
      let url = `${this.baseUrl}/${encodeURIComponent(query)}.json?access_token=${this.apiKey}&limit=10`;

      if (lat && lng) {
        url += `&proximity=${lng},${lat}`;
      }

      const response = await axios.get(url);

      return response.data.features.map((feature: any) => ({
        placeId: feature.id,
        name: feature.text,
        description: feature.place_name,
        address: feature.place_name,
        location: {
          latitude: feature.center[1],
          longitude: feature.center[0]
        }
      }));
    } catch (error) {
      console.error('Mapbox geocoding error:', error);
      throw new Error('Mapbox geocoding failed');
    }
  }

  async reverseGeocode(lat: number, lng: number) {
    try {
      

      const url = `${this.baseUrl}/${lng},${lat}.json?access_token=${this.apiKey}`;
      const response = await axios.get(url);

      const feature = response.data.features[0];
      return {
        formattedAddress: feature.place_name,
        address: feature.place_name,
        location: { latitude: lat, longitude: lng }
      };
    } catch (error) {
      console.error('Mapbox reverse geocoding error:', error);
      throw new Error('Mapbox reverse geocoding failed');
    }
  }
}

/**
 * OpenRouteService Implementation
 */
export class OpenRouteServiceGeocoder implements GeocoderService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENROUTESERVICE_API_KEY || '';
    this.baseUrl = PROVIDER_CONFIG.openrouteservice.geocodingUrl;
  }

  async searchPlaces(query: string, lat?: number, lng?: number) {
    try {
      const url = `${this.baseUrl}/search`;
      const params: any = {
        api_key: this.apiKey,
        text: query,
        size: 10
      };

      if (lat && lng) {
        params.focus_point = [lng, lat];
      }

      const response = await axios.get(url, { params });

      return response.data.features.map((feature: any) => ({
        placeId: feature.properties.id,
        name: feature.properties.label,
        description: feature.properties.label,
        address: feature.properties.label,
        location: {
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0]
        }
      }));
    } catch (error) {
      console.error('OpenRouteService geocoding error:', error);
      throw new Error('OpenRouteService geocoding failed');
    }
  }

  async reverseGeocode(lat: number, lng: number) {
    try {
      const url = `${this.baseUrl}/reverse`;
      const params = {
        api_key: this.apiKey,
        'point.lat': lat,
        'point.lon': lng
      };

      const response = await axios.get(url, { params });

      const feature = response.data.features[0];
      return {
        formattedAddress: feature.properties.label,
        address: feature.properties.label,
        location: { latitude: lat, longitude: lng }
      };
    } catch (error) {
      console.error('OpenRouteService reverse geocoding error:', error);
      throw new Error('OpenRouteService reverse geocoding failed');
    }
  }
}

/**
 * LocationIQ Implementation
 */
export class LocationIQGeocoder implements GeocoderService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.LOCATIONIQ_API_KEY || '';
    this.baseUrl = PROVIDER_CONFIG.locationiq.geocodingUrl;
    console.log('LocationIQ API Key loaded:', this.apiKey ? 'YES' : 'NO');
  }

  async searchPlaces(query: string, lat?: number, lng?: number) {
    try {
      // Check if this is a test key - return mock data for testing
      if (this.apiKey === 'pk.test1234567890abcdef') {
        console.log('Using mock geocoding data for testing');
        return [
          {
            placeId: 'test_place_1',
            name: 'Test Location 1',
            description: 'Test Location 1, Test City',
            address: 'Test Location 1, Test City, Test State',
            location: {
              latitude: 28.6139,
              longitude: 77.2090
            }
          },
          {
            placeId: 'test_place_2',
            name: 'Test Location 2',
            description: 'Test Location 2, Test City',
            address: 'Test Location 2, Test City, Test State',
            location: {
              latitude: 28.6333,
              longitude: 77.2315
            }
          },
          {
            placeId: 'test_place_3',
            name: 'Test Location 3',
            description: 'Test Location 3, Test City',
            address: 'Test Location 3, Test City, Test State',
            location: {
              latitude: 28.6444,
              longitude: 77.2530
            }
          }
        ];
      }

      const url = `${this.baseUrl}/search.php`;
      const params: any = {
        key: this.apiKey,
        q: query,
        format: 'json',
        limit: 10
      };

      // Add proximity if coordinates are provided
      if (lat !== undefined && lng !== undefined) {
        params.lat = lat;
        params.lon = lng;
        console.log(`Using proximity coordinates: ${lat}, ${lng}`);
      }

      const response = await axios.get(url, { params });

      return response.data.map((place: any) => ({
        placeId: place.place_id,
        name: place.display_name.split(',')[0],
        description: place.display_name,
        address: place.display_name,
        location: {
          latitude: parseFloat(place.lat),
          longitude: parseFloat(place.lon)
        }
      }));
    } catch (error) {
      console.error('LocationIQ geocoding error:', error);
      throw new Error('LocationIQ geocoding failed');
    }
  }

  async reverseGeocode(lat: number, lng: number) {
    try {
      // Check if this is a test key - return mock data for testing
      if (this.apiKey === 'pk.test1234567890abcdef') {
        console.log('Using mock reverse geocoding data for testing');
        return {
          formattedAddress: `Test Address at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          address: `Test Address at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          location: { latitude: lat, longitude: lng }
        };
      }

      const url = `${this.baseUrl}/reverse.php`;
      const params = {
        key: this.apiKey,
        lat: lat,
        lon: lng,
        format: 'json'
      };

      const response = await axios.get(url, { params });

      return {
        formattedAddress: response.data.display_name,
        address: response.data.display_name,
        location: { latitude: lat, longitude: lng }
      };
    } catch (error) {
      console.error('LocationIQ reverse geocoding error:', error);
      throw new Error('LocationIQ reverse geocoding failed');
    }
  }
}

/**
 * Factory function to get geocoder instance
 */
export function createGeocoder(provider: 'mapbox' | 'openrouteservice' | 'locationiq') {
  switch (provider) {
    case 'mapbox':
      return new MapboxGeocoder();
    case 'openrouteservice':
      return new OpenRouteServiceGeocoder();
    case 'locationiq':
      return new LocationIQGeocoder();
    default:
      throw new Error(`Unsupported geocoding provider: ${provider}`);
  }
}
