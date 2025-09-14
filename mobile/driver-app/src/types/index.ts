/**
 * TypeScript type definitions for the RideShare Driver App
 * Defines interfaces for Driver, Vehicle, Ride, and other core entities
 */

// Driver related types
export interface Driver {
  id: string;
  phoneNumber: string;
  email?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'driver';
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  averageRating: number;
  totalRatings: number;
  kycStatus: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  currentLocation?: Location;
  isOnline: boolean;
  isAvailable: boolean;
  drivingLicenseNumber?: string;
  vehicleIds: string[];
  vehicles?: Vehicle[];
  totalEarnings: number;
  totalTrips: number;
  totalDistance: number;
  totalHours: number;
  createdAt: string;
  updatedAt: string;
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
  registrationNumber: string;
  insuranceExpiry: string;
  permitExpiry: string;
  documents: VehicleDocument[];
  createdAt: string;
  updatedAt: string;
}

// Vehicle Document
export interface VehicleDocument {
  id: string;
  type: 'registration' | 'insurance' | 'permit' | 'fitness' | 'photo';
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  verifiedAt?: string;
}

// Location type
export interface Location {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
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
  pickupLocation: Location;
  dropoffLocation: Location;
  pickupAddress: string;
  dropoffAddress: string;
  createdAt: string;
  updatedAt: string;
}

export type RideStatus =
  | 'requested'
  | 'accepted'
  | 'driver_arrived'
  | 'started'
  | 'completed'
  | 'cancelled'
  | 'no_show';

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

// User type (rider)
export interface User {
  id: string;
  phoneNumber: string;
  email?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'rider';
  status: 'active' | 'inactive' | 'suspended';
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  averageRating: number;
  totalRatings: number;
  createdAt: string;
  updatedAt: string;
}

// Earnings and Statistics
export interface Earnings {
  id: string;
  driverId: string;
  date: string;
  totalRides: number;
  totalEarnings: number;
  cashEarnings: number;
  onlineEarnings: number;
  tips: number;
  bonuses: number;
  deductions: number;
  netEarnings: number;
  distance: number;
  hours: number;
}

export interface DriverStats {
  totalTrips: number;
  totalEarnings: number;
  totalDistance: number;
  totalHours: number;
  averageRating: number;
  totalRatings: number;
  todayTrips: number;
  todayEarnings: number;
  weeklyTrips: number;
  weeklyEarnings: number;
  monthlyTrips: number;
  monthlyEarnings: number;
}

// Document types
export interface DriverDocument {
  id: string;
  type: 'license' | 'aadhar' | 'pan' | 'photo' | 'address_proof';
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

// Notification
export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'ride_request' | 'ride_update' | 'payment' | 'document' | 'general';
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
export interface DriverLoginForm {
  email: string;
  password?: string;
  otp?: string;
}

export interface DriverRegisterForm {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  drivingLicenseNumber: string;
  vehicleDetails: {
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    type: string;
    capacity: number;
  };
}

export interface VehicleForm {
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  type: string;
  capacity: number;
  hasAC: boolean;
  hasMusic: boolean;
  hasWifi: boolean;
}

// Navigation types
export type RootStackParamList = {
  // Auth Stack
  Welcome: undefined;
  PhoneLogin: undefined;
  OTPVerification: { phoneNumber: string };
  Register: { phoneNumber: string };
  Documents: { driverId: string };

  // Main App
  MainTabs: undefined;

  // Ride Stack
  RideDetails: { rideId: string };
  RideTracking: { rideId: string };
  RideCompleted: { rideId: string };

  // Profile Stack
  Profile: undefined;
  EditProfile: undefined;
  VehicleManagement: undefined;
  DriverDocuments: undefined;
  Earnings: undefined;
  Settings: undefined;
  Support: undefined;

  // Other
  NotificationDetails: { notificationId: string };
};

export type TabParamList = {
  Home: undefined;
  Earnings: undefined;
  Profile: undefined;
};

// Hook types for Redux
export type AppSelector<T = any> = (state: any) => T;
