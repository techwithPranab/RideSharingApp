export enum RideStatus {
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  DRIVER_ARRIVED = 'DRIVER_ARRIVED',
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: 'rider' | 'driver' | 'admin';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  _id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
  capacity: number;
  driverId: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface Ride {
  _id: string;
  rideId: string;
  status: RideStatus;
  riderId: User;
  driverId: User;
  vehicleId: Vehicle;
  passengers: Array<{
    userId: User;
    fare: number;
    rating?: number;
  }>;
  pickupLocation: Location;
  dropoffLocation: Location;
  totalFare: number;
  estimatedDistance: number;
  estimatedDuration: number;
  actualDistance?: number;
  actualDuration?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  passengerCount: number;
  totalPassengerFare: number;
  averageRating?: number;
  timeElapsed?: number;
  estimatedTimeRemaining?: number;
}

export interface RideStats {
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  completionRate: string;
  totalRevenue: number;
  averageRideDuration: number;
  averageFare: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalCount: number;
  };
}
