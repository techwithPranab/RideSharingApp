/**
 * App configuration constants
 */

// API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || (__DEV__
  ? 'http://localhost:5000/api'
  : 'https://your-production-api.com/api');

export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || (__DEV__
  ? 'http://localhost:5000'
  : 'https://your-production-api.com');

// Google Maps API Key (should be in environment variables)
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'your-google-maps-api-key';

// App Configuration
export const APP_CONFIG = {
  // Ride Configuration
  MAX_RIDE_DISTANCE: 100, // km
  MIN_RIDE_DISTANCE: 0.5, // km
  DEFAULT_PICKUP_RADIUS: 2, // km
  RIDE_TIMEOUT: 300000, // 5 minutes in milliseconds

  // Location Configuration
  LOCATION_UPDATE_INTERVAL: 10000, // 10 seconds
  LOCATION_ACCURACY: 100, // meters

  // Google Maps Configuration
  GOOGLE_MAPS_CONFIG: {
    INITIAL_REGION: {
      latitude: 28.6139, // Delhi coordinates as default
      longitude: 77.2090,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    },
    DEFAULT_ZOOM: 15,
    MAX_ZOOM: 20,
    MIN_ZOOM: 10,
    SEARCH_RADIUS: 5000, // meters for place search
  },

  // UI Configuration
  MAP_PADDING: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },

  // Animation Duration
  ANIMATION_DURATION: 300,

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
};

// Colors
export const COLORS = {
  primary: '#2E86AB',
  primaryDark: '#1A5F7A',
  secondary: '#F24236',
  accent: '#F6AE2D',

  // Grays
  black: '#000000',
  darkGray: '#333333',
  gray: '#666666',
  lightGray: '#CCCCCC',
  veryLightGray: '#F5F5F5',
  white: '#FFFFFF',

  // Status Colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Background
  background: '#FFFFFF',
  surface: '#F8F9FA',

  // Text
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',

  // Border
  border: '#DEE2E6',
  divider: '#E9ECEF',
};

// Font Sizes
export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  title: 28,
  header: 32,
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border Radius
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 50,
};

// Shadow
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};
