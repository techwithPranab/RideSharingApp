/**
 * App configuration constants for Driver App
 */

// API Configuration
export const API_BASE_URL = 'http://localhost:3000/api'; // Change to production URL when deploying

// Google Maps API Key (should be in environment variables)
export const GOOGLE_MAPS_API_KEY = 'your-google-maps-api-key';

// App Configuration
export const APP_CONFIG = {
  // Driver Configuration
  MIN_DRIVER_AGE: 18,
  MAX_DRIVER_AGE: 65,
  MIN_VEHICLE_YEAR: 2010,

  // Ride Configuration
  MAX_RIDE_DISTANCE: 100, // km
  MIN_RIDE_DISTANCE: 0.5, // km
  DEFAULT_PICKUP_RADIUS: 2, // km
  RIDE_TIMEOUT: 300000, // 5 minutes in milliseconds
  DRIVER_RESPONSE_TIMEOUT: 30000, // 30 seconds

  // Location Configuration
  LOCATION_UPDATE_INTERVAL: 5000, // 5 seconds when online
  LOCATION_ACCURACY: 50, // meters
  OFFLINE_LOCATION_UPDATE_INTERVAL: 30000, // 30 seconds when offline

  // Earnings Configuration
  DRIVER_COMMISSION: 0.20, // 20% commission
  MIN_WITHDRAWAL: 100, // minimum withdrawal amount
  MAX_DAILY_HOURS: 12, // maximum driving hours per day

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

  // Status Colors
  online: '#4CAF50',
  offline: '#9E9E9E',
  busy: '#FF9800',
  error: '#F44336',
  warning: '#FF9800',
  success: '#4CAF50',
  info: '#2196F3',

  // Ride Status Colors
  rideRequested: '#FF9800',
  rideAccepted: '#2196F3',
  rideArrived: '#9C27B0',
  rideStarted: '#4CAF50',
  rideCompleted: '#2E7D32',

  // Grays
  black: '#000000',
  darkGray: '#333333',
  gray: '#666666',
  lightGray: '#CCCCCC',
  veryLightGray: '#F5F5F5',
  white: '#FFFFFF',

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

// Vehicle Types
export const VEHICLE_TYPES = [
  { label: 'Hatchback', value: 'hatchback' },
  { label: 'Sedan', value: 'sedan' },
  { label: 'SUV', value: 'suv' },
  { label: 'Auto Rickshaw', value: 'auto' },
  { label: 'Bike', value: 'bike' },
];

// Document Types
export const DOCUMENT_TYPES = {
  DRIVER: [
    { label: 'Driving License', value: 'license' },
    { label: 'Aadhar Card', value: 'aadhar' },
    { label: 'PAN Card', value: 'pan' },
    { label: 'Profile Photo', value: 'photo' },
    { label: 'Address Proof', value: 'address_proof' },
  ],
  VEHICLE: [
    { label: 'Registration Certificate', value: 'registration' },
    { label: 'Insurance', value: 'insurance' },
    { label: 'Permit', value: 'permit' },
    { label: 'Fitness Certificate', value: 'fitness' },
    { label: 'Vehicle Photo', value: 'photo' },
  ],
};

// Ride Status Labels
export const RIDE_STATUS_LABELS = {
  requested: 'New Request',
  accepted: 'Accepted',
  driver_arrived: 'Arrived at Pickup',
  started: 'Ride Started',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

// Payment Methods
export const PAYMENT_METHODS = [
  { label: 'Cash', value: 'cash' },
  { label: 'Card', value: 'card' },
  { label: 'UPI', value: 'upi' },
  { label: 'Wallet', value: 'wallet' },
];

// Earnings Periods
export const EARNINGS_PERIODS = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'Custom Range', value: 'custom' },
];
