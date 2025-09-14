/**
 * Navigation types for Driver App
 */

import { NavigatorScreenParams } from '@react-navigation/native';

// Authentication stack params
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  OTPVerification: { email: string; isLogin: boolean };
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

// Main tab navigator params
export type MainTabParamList = {
  Dashboard: undefined;
  Rides: undefined;
  OfferRide: undefined;
  Earnings: undefined;
  Profile: undefined;
};

// Dashboard stack params
export type DashboardStackParamList = {
  DashboardHome: undefined;
  RideDetails: { rideId: string };
  DriverStatus: undefined;
};

// Rides stack params
export type RidesStackParamList = {
  RidesHome: undefined;
  RideDetails: { rideId: string };
  RideHistory: undefined;
  ActiveRide: { rideId: string };
};

// Offer Ride stack params
export type OfferRideStackParamList = {
  OfferRideHome: undefined;
  CreateRideOffer: undefined;
  SelectLocation: { locationType: 'source' | 'destination' | 'stop'; currentLocation?: any };
  AddStops: { source: any; destination: any };
  SetSchedule: { 
    source: any; 
    destination: any; 
    stops?: any[];
  };
  SetPricing: { 
    source: any; 
    destination: any; 
    stops?: any[];
    schedule: {
      departureDate: string; // ISO string
      departureTime: string; // ISO string
      isFlexible: boolean;
      flexibilityMinutes: number;
      recurring: {
        isRecurring: boolean;
        days: string[];
        endDate?: string; // ISO string if present
      };
    };
    seats: number;
  };
  ReviewOffer: { 
    rideOffer: any;
  };
  MyOffers: undefined;
  OfferDetails: { offerId: string };
  CancelRideOffer: { 
    offerId: string; 
    rideOffer: {
      source: { name: string };
      destination: { name: string };
      departureDateTime: string;
      pricing: { pricePerSeat: number; seats: number };
      bookedSeats: number;
    };
  };
};

// Earnings stack params
export type EarningsStackParamList = {
  EarningsHome: undefined;
  EarningsDetails: { period: string };
  PayoutHistory: undefined;
  WeeklyEarnings: undefined;
};

// Profile stack params
export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  VehicleManagement: undefined;
  Documents: undefined;
  Settings: undefined;
  Support: undefined;
};

// Root stack params
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Loading: undefined;
};

// Modal stack params
export type ModalStackParamList = {
  Main: NavigatorScreenParams<RootStackParamList>;
  RideRequest: { rideId: string };
  Rating: { rideId: string; riderId: string };
  Emergency: undefined;
};
