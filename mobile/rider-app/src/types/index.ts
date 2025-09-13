/**
 * TypeScript type definitions for the RideShare Rider App
 * Defines interfaces for User, Ride, Vehicle, and other core entities
 */

// User related types
export interface User {
  id: string;
  phoneNumber: string;
  email?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'rider' | 'driver' | 'admin';
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  averageRating: number;
  totalRatings: number;
  kycStatus: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  currentLocation?: Location;
  homeAddress?: string;
  workAddress?: string;
  referralCode?: string;
  createdAt: string;
  updatedAt: string;
}

// Location type
export interface Location {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
}

// Vehicle type
export interface Vehicle {
  id: string;
  driverId: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  type: 'hatchback' | 'sedan' | 'suv' | 'auto' | 'bike';
  capacity: number;
  hasAC: boolean;
  hasMusic: boolean;
  hasWifi: boolean;
  averageRating: number;
  status: 'active' | 'inactive' | 'maintenance' | 'pending_verification';
}

// Ride related types
export interface Ride {
  id: string;
  rideId: string;
  isPooled: boolean;
  capacity: number;
  driverId: string;
  driver?: Driver;
  vehicleId: string;
  vehicle?: Vehicle;
  passengers: Passenger[];
  estimatedDistance: number;
  estimatedDuration: number;
  baseFare: number;
  totalFare: number;
  status: RideStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: 'cash' | 'card' | 'upi' | 'wallet';
  requestedAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  otp?: string;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

export type RideStatus =
  | 'requested'
  | 'accepted'
  | 'driver_arrived'
  | 'started'
  | 'completed'
  | 'cancelled';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded';

export interface Passenger {
  userId: string;
  user?: User;
  pickupLocation: Location;
  dropoffLocation: Location;
  fare: number;
  paymentStatus: PaymentStatus;
  joinedAt: string;
  rating?: number;
  review?: string;
}

export interface Driver extends User {
  drivingLicenseNumber?: string;
  vehicleIds: string[];
  vehicles?: Vehicle[];
  isAvailable: boolean;
  totalEarnings?: number;
  totalTrips?: number;
}

// Address and Places
export interface Address {
  id?: string;
  name: string;
  address: string;
  location: Location;
  type: 'home' | 'work' | 'other';
}

export interface Place {
  placeId: string;
  name: string;
  address: string;
  location: Location;
}

// Ride Request
export interface RideRequest {
  pickupLocation: Location;
  dropoffLocation: Location;
  pickupAddress: string;
  dropoffAddress: string;
  isPooled: boolean;
  estimatedFare?: number;
  estimatedDistance?: number;
  estimatedDuration?: number;
  specialInstructions?: string;
}

// Payment Method
export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  details: {
    cardNumber?: string; // last 4 digits
    upiId?: string;
    walletProvider?: string;
  };
  isDefault: boolean;
  isActive: boolean;
}

// Trip History
export interface TripHistory {
  id: string;
  rideId: string;
  driver: Driver;
  vehicle: Vehicle;
  pickupLocation: Location;
  dropoffLocation: Location;
  pickupAddress: string;
  dropoffAddress: string;
  fare: number;
  distance: number;
  duration: number;
  status: RideStatus;
  completedAt: string;
  rating?: number;
  review?: string;
}

// Notification
export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'ride_update' | 'payment' | 'promotion' | 'general';
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export interface PaginatedResponse<T = any> extends APIResponse {
  data: {
    items: T[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Form types
export interface LoginForm {
  phoneNumber: string;
  otp: string;
}

export interface RegisterForm {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  referralCode?: string;
}

export interface ProfileForm {
  firstName: string;
  lastName: string;
  email?: string;
  homeAddress?: string;
  workAddress?: string;
}

// Navigation types
export type RootStackParamList = {
  // Auth Stack
  Welcome: undefined;
  PhoneLogin: undefined;
  OTPVerification: { phoneNumber: string };
  Register: { phoneNumber: string };

  // Main App
  MainTabs: undefined;

  // Ride Stack
  RideRequest: undefined;
  SearchingDriver: { rideRequest: RideRequest };
  RideTracking: { rideId: string };
  RideCompleted: { rideId: string };

  // Profile Stack
  Profile: undefined;
  EditProfile: undefined;
  PaymentMethods: undefined;
  TripHistory: undefined;
  AddressBook: undefined;
  Support: undefined;

  // Subscription Stack
  SubscriptionPlans: undefined;
  SubscriptionPurchase: { planId: string };
  SubscriptionManagement: undefined;

  // Other
  PlaceSearch: { onPlaceSelect: (place: Place) => void };
};

export type TabParamList = {
  Home: undefined;
  History: undefined;
  Profile: undefined;
};

export type PaymentMethodType = 'card' | 'upi' | 'wallet';

// Subscription related types
export interface SubscriptionPlan {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  price: number;
  currency: string;
  features: {
    unlimitedRides: boolean;
    discountPercentage: number;
    priorityBooking: boolean;
    maxRides?: number;
    validDays: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  plan?: SubscriptionPlan;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  ridesUsed: number;
  maxRides?: number;
  paymentMethod: PaymentMethodType;
  totalPaid: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPurchase {
  planId: string;
  paymentMethod: PaymentMethodType;
  autoRenew?: boolean;
}

export interface SubscriptionValidation {
  isValid: boolean;
  discount?: number;
  subscription?: Subscription;
  message?: string;
}

// Hook types for Redux
export type AppSelector<T = any> = (state: any) => T;
