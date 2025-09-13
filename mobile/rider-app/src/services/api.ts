/**
 * API Service for RideShare Rider App
 * Handles HTTP requests to the backend API
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';
import { APIResponse, User, Ride, LoginForm, RegisterForm, SubscriptionPlan, Subscription, SubscriptionPurchase, SubscriptionValidation, Address, RideRequest, PaymentMethod, PaymentMethodType } from '../types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error instanceof Error ? error : new Error('Request failed'));
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    // Handle token expiration
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      // You might want to dispatch a logout action here
      // store.dispatch(clearAuth());
    }

    return Promise.reject(error instanceof Error ? error : new Error('Request failed'));
  }
);

// Auth API endpoints
export const authAPI = {
  /**
   * Register new user
   */
  register: (userData: RegisterForm): Promise<AxiosResponse<APIResponse<User>>> =>
    api.post('/auth/register', userData),

  /**
   * Login with phone and OTP
   */
  login: (credentials: LoginForm): Promise<AxiosResponse<APIResponse<{ user: User; token: string }>>> =>
    api.post('/auth/login', credentials),

  /**
   * Send OTP to phone number
   */
  sendOTP: (phoneNumber: string): Promise<AxiosResponse<APIResponse<string>>> =>
    api.post('/auth/send-otp', { phoneNumber }),

  /**
   * Verify phone number with OTP
   */
  verifyPhone: (data: { phoneNumber: string; otp: string }): Promise<AxiosResponse<APIResponse<{ user: User; token: string }>>> =>
    api.post('/auth/verify-phone', data),

  /**
   * Get user profile
   */
  getProfile: (): Promise<AxiosResponse<APIResponse<{ user: User }>>> =>
    api.get('/auth/me'),

  /**
   * Logout user
   */
  logout: (): Promise<AxiosResponse<APIResponse<void>>> =>
    api.post('/auth/logout'),

  /**
   * Refresh token
   */
  refreshToken: (): Promise<AxiosResponse<APIResponse<{ token: string }>>> =>
    api.post('/auth/refresh-token'),
};

// User API endpoints
export const userAPI = {
  /**
   * Update user profile
   */
  updateProfile: (userData: Partial<User>): Promise<AxiosResponse<APIResponse<User>>> =>
    api.put('/users/profile', userData),

  /**
   * Update user location
   */
  updateLocation: (location: { latitude: number; longitude: number; address?: string }): Promise<AxiosResponse<APIResponse<void>>> =>
    api.put('/users/location', location),

  /**
   * Get saved addresses
   */
  getSavedAddresses: (): Promise<AxiosResponse<APIResponse<any[]>>> =>
    api.get('/users/addresses'),

  /**
   * Add saved address
   */
  addSavedAddress: (address: Omit<Address, 'id'>): Promise<AxiosResponse<APIResponse<Address>>> =>
    api.post('/users/addresses', address),

  /**
   * Delete saved address
   */
  deleteSavedAddress: (addressId: string): Promise<AxiosResponse<APIResponse<void>>> =>
    api.delete(`/users/addresses/${addressId}`),
};

// Ride API endpoints
export const rideAPI = {
  /**
   * Request a ride
   */
  requestRide: (rideData: RideRequest): Promise<AxiosResponse<APIResponse<Ride>>> =>
    api.post('/rides/request', rideData),

  /**
   * Get ride by ID
   */
  getRide: (rideId: string): Promise<AxiosResponse<APIResponse<Ride>>> =>
    api.get(`/rides/${rideId}`),

  /**
   * Cancel ride
   */
  cancelRide: (rideId: string, reason?: string): Promise<AxiosResponse<APIResponse<void>>> =>
    api.put(`/rides/${rideId}/cancel`, { reason }),

  /**
   * Rate and review ride
   */
  rateRide: (rideId: string, rating: number, review?: string): Promise<AxiosResponse<APIResponse<void>>> =>
    api.put(`/rides/${rideId}/rate`, { rating, review }),

  /**
   * Get ride history
   */
  getRideHistory: (page = 1, limit = 20): Promise<AxiosResponse<APIResponse<Ride[]>>> =>
    api.get(`/rides/history?page=${page}&limit=${limit}`),

  /**
   * Get active ride
   */
  getActiveRide: (): Promise<AxiosResponse<APIResponse<Ride | null>>> =>
    api.get('/rides/active'),

  /**
   * Get fare estimate
   */
  getFareEstimate: (data: {
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
    isPooled?: boolean;
  }): Promise<AxiosResponse<APIResponse<any>>> =>
    api.post('/rides/fare-estimate', data),
};

// Payment API endpoints
export const paymentAPI = {
  /**
   * Get payment methods
   */
  getPaymentMethods: (): Promise<AxiosResponse<APIResponse<any[]>>> =>
    api.get('/payments/methods'),

  /**
   * Add payment method
   */
  addPaymentMethod: (method: {
    type: PaymentMethodType;
    details: {
      cardNumber?: string;
      expiryMonth?: number;
      expiryYear?: number;
      cvv?: string;
      upiId?: string;
      walletProvider?: string;
    };
  }): Promise<AxiosResponse<APIResponse<PaymentMethod>>> =>
    api.post('/payments/methods', method),

  /**
   * Delete payment method
   */
  deletePaymentMethod: (methodId: string): Promise<AxiosResponse<APIResponse<void>>> =>
    api.delete(`/payments/methods/${methodId}`),

  /**
   * Set default payment method
   */
  setDefaultPaymentMethod: (methodId: string): Promise<AxiosResponse<APIResponse<void>>> =>
    api.put(`/payments/methods/${methodId}/default`),

  /**
   * Process payment
   */
  processPayment: (data: {
    rideId: string;
    paymentMethodId: string;
    amount: number;
  }): Promise<AxiosResponse<APIResponse<{
    paymentId: string;
    status: string;
    transactionId: string;
  }>>> =>
    api.post('/payments/process', data),

  /**
   * Get payment history
   */
  getPaymentHistory: (page = 1, limit = 20): Promise<AxiosResponse<APIResponse<any[]>>> =>
    api.get(`/payments/history?page=${page}&limit=${limit}`),
};

// Places API (for address search)
export const placesAPI = {
  /**
   * Search places using Google Places API
   */
  searchPlaces: (query: string, location?: { lat: number; lng: number }): Promise<AxiosResponse<APIResponse<any[]>>> =>
    api.get('/places/search', {
      params: { query, lat: location?.lat, lng: location?.lng }
    }),

  /**
   * Get place details
   */
  getPlaceDetails: (placeId: string): Promise<AxiosResponse<APIResponse<any>>> =>
    api.get(`/places/details/${placeId}`),

  /**
   * Reverse geocode coordinates to address
   */
  reverseGeocode: (lat: number, lng: number): Promise<AxiosResponse<APIResponse<any>>> =>
    api.get('/places/reverse-geocode', { params: { lat, lng } }),
};

// Notification API endpoints
export const notificationAPI = {
  /**
   * Get notifications
   */
  getNotifications: (page = 1, limit = 20): Promise<AxiosResponse<APIResponse<any[]>>> =>
    api.get(`/notifications?page=${page}&limit=${limit}`),

  /**
   * Mark notification as read
   */
  markAsRead: (notificationId: string): Promise<AxiosResponse<APIResponse<void>>> =>
    api.put(`/notifications/${notificationId}/read`),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: (): Promise<AxiosResponse<APIResponse<void>>> =>
    api.put('/notifications/read-all'),
};

// Subscription API endpoints
export const subscriptionAPI = {
  /**
   * Get all available subscription plans
   */
  getPlans: (): Promise<AxiosResponse<APIResponse<SubscriptionPlan[]>>> =>
    api.get('/subscriptions/plans'),

  /**
   * Get user's active subscription
   */
  getActiveSubscription: (): Promise<AxiosResponse<APIResponse<Subscription | null>>> =>
    api.get('/subscriptions/active'),

  /**
   * Get user's subscription history
   */
  getSubscriptionHistory: (page = 1, limit = 20): Promise<AxiosResponse<APIResponse<Subscription[]>>> =>
    api.get(`/subscriptions/history?page=${page}&limit=${limit}`),

  /**
   * Purchase a subscription
   */
  purchaseSubscription: (purchaseData: SubscriptionPurchase): Promise<AxiosResponse<APIResponse<Subscription>>> =>
    api.post('/subscriptions/purchase', purchaseData),

  /**
   * Cancel a subscription
   */
  cancelSubscription: (subscriptionId: string, reason?: string): Promise<AxiosResponse<APIResponse<Subscription>>> =>
    api.post(`/subscriptions/${subscriptionId}/cancel`, { reason }),

  /**
   * Validate subscription for ride booking
   */
  validateSubscription: (): Promise<AxiosResponse<APIResponse<SubscriptionValidation>>> =>
    api.post('/subscriptions/validate'),
};

export default api;
