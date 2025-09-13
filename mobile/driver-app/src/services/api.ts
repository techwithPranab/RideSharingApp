/**
 * API service for Driver App
 * Handles all API calls to the backend
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';
import { Driver, DriverLoginForm, DriverRegisterForm } from '../types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('driver_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, clear storage and redirect to login
      await AsyncStorage.removeItem('driver_token');
      // You might want to dispatch a logout action here
    }
    return Promise.reject(error);
  }
);

// Driver API endpoints
export const driverAPI = {
  // Authentication
  login: (credentials: DriverLoginForm): Promise<AxiosResponse> =>
    api.post('/driver/login', credentials),

  register: (driverData: DriverRegisterForm): Promise<AxiosResponse> =>
    api.post('/driver/register', driverData),

  sendOTP: (phoneNumber: string): Promise<AxiosResponse> =>
    api.post('/driver/send-otp', { phoneNumber }),

  verifyOTP: (data: { phoneNumber: string; otp: string }): Promise<AxiosResponse> =>
    api.post('/driver/verify-otp', data),

  refreshToken: (): Promise<AxiosResponse> =>
    api.post('/driver/refresh-token'),

  // Profile
  getProfile: (driverId: string): Promise<AxiosResponse> =>
    api.get(`/driver/${driverId}`),

  updateProfile: (driverId: string, data: Partial<Driver>): Promise<AxiosResponse> =>
    api.put(`/driver/${driverId}`, data),

  updateOnlineStatus: (driverId: string, isOnline: boolean): Promise<AxiosResponse> =>
    api.put(`/driver/${driverId}/status`, { isOnline }),

  // Documents
  uploadDocument: (driverId: string, documentType: string, file: any): Promise<AxiosResponse> =>
    api.post(`/driver/${driverId}/documents`, { documentType, file }),

  getDocuments: (driverId: string): Promise<AxiosResponse> =>
    api.get(`/driver/${driverId}/documents`),

  // Vehicles
  getVehicles: (driverId: string): Promise<AxiosResponse> =>
    api.get(`/driver/${driverId}/vehicles`),

  addVehicle: (driverId: string, vehicleData: any): Promise<AxiosResponse> =>
    api.post(`/driver/${driverId}/vehicles`, vehicleData),

  updateVehicle: (driverId: string, vehicleId: string, vehicleData: any): Promise<AxiosResponse> =>
    api.put(`/driver/${driverId}/vehicles/${vehicleId}`, vehicleData),

  // Rides
  getAvailableRides: (driverId: string, location: { latitude: number; longitude: number }): Promise<AxiosResponse> =>
    api.get('/rides/available', { params: { driverId, ...location } }),

  acceptRide: (rideId: string, driverId: string): Promise<AxiosResponse> =>
    api.post(`/rides/${rideId}/accept`, { driverId }),

  rejectRide: (rideId: string, driverId: string, reason?: string): Promise<AxiosResponse> =>
    api.post(`/rides/${rideId}/reject`, { driverId, reason }),

  startRide: (rideId: string): Promise<AxiosResponse> =>
    api.post(`/rides/${rideId}/start`),

  completeRide: (rideId: string, data: { distance: number; duration: number }): Promise<AxiosResponse> =>
    api.post(`/rides/${rideId}/complete`, data),

  getRideHistory: (driverId: string, page: number = 1, limit: number = 20): Promise<AxiosResponse> =>
    api.get(`/driver/${driverId}/rides`, { params: { page, limit } }),

  // Earnings
  getEarnings: (driverId: string, period: string): Promise<AxiosResponse> =>
    api.get(`/driver/${driverId}/earnings`, { params: { period } }),

  getEarningsHistory: (driverId: string, page: number = 1, limit: number = 20): Promise<AxiosResponse> =>
    api.get(`/driver/${driverId}/earnings/history`, { params: { page, limit } }),

  requestWithdrawal: (driverId: string, amount: number): Promise<AxiosResponse> =>
    api.post(`/driver/${driverId}/withdrawals`, { amount }),

  // Statistics
  getStats: (driverId: string): Promise<AxiosResponse> =>
    api.get(`/driver/${driverId}/stats`),

  // Notifications
  getNotifications: (driverId: string, page: number = 1, limit: number = 20): Promise<AxiosResponse> =>
    api.get(`/driver/${driverId}/notifications`, { params: { page, limit } }),

  markNotificationRead: (notificationId: string): Promise<AxiosResponse> =>
    api.put(`/notifications/${notificationId}/read`),

  // Location updates
  updateLocation: (driverId: string, location: { latitude: number; longitude: number; address?: string }): Promise<AxiosResponse> =>
    api.post(`/driver/${driverId}/location`, location),
};

// Ride API endpoints (shared with rider app)
export const rideAPI = {
  /**
   * Get ride by ID
   */
  getRide: (rideId: string): Promise<AxiosResponse> =>
    api.get(`/rides/${rideId}`),

  /**
   * Get active ride
   */
  getActiveRide: (): Promise<AxiosResponse> =>
    api.get('/rides/active'),

  /**
   * Get ride history
   */
  getRideHistory: (page = 1, limit = 20): Promise<AxiosResponse> =>
    api.get(`/rides/history?page=${page}&limit=${limit}`),
};

export default api;
