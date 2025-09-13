import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, PaginatedResponse } from '../types';

// Base URL for the API - should be configured based on environment
const BASE_URL = 'http://localhost:5000/api'; // Update this with your actual backend URL

// Create axios instance for admin API
export const adminApi = axios.create({
  baseURL: `${BASE_URL}/admin`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
adminApi.interceptors.request.use(
  async (config: AxiosRequestConfig): Promise<AxiosRequestConfig> => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
adminApi.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response;
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('adminToken');
      // You might want to redirect to login screen here
    }
    return Promise.reject(error);
  }
);

// Generic API methods
export const apiService = {
  get: <T>(url: string, params?: any): Promise<ApiResponse<T>> =>
    adminApi.get(url, { params }).then((res: AxiosResponse<ApiResponse<T>>) => res.data),

  post: <T>(url: string, data?: any): Promise<ApiResponse<T>> =>
    adminApi.post(url, data).then((res: AxiosResponse<ApiResponse<T>>) => res.data),

  put: <T>(url: string, data?: any): Promise<ApiResponse<T>> =>
    adminApi.put(url, data).then((res: AxiosResponse<ApiResponse<T>>) => res.data),

  delete: <T>(url: string): Promise<ApiResponse<T>> =>
    adminApi.delete(url).then((res: AxiosResponse<ApiResponse<T>>) => res.data),

  getPaginated: <T>(url: string, params?: any): Promise<PaginatedResponse<T>> =>
    adminApi.get(url, { params }).then((res: AxiosResponse<PaginatedResponse<T>>) => res.data),
};

// Admin-specific API endpoints
export const adminEndpoints = {
  // Authentication
  login: (credentials: { email: string; password: string }) =>
    apiService.post('/auth/login', credentials),

  logout: () => apiService.post('/auth/logout'),

  // Dashboard
  getDashboardStats: () => apiService.get('/dashboard/stats'),

  // Rides management
  getRides: (params?: any) => apiService.getPaginated('/rides', params),
  getRideById: (id: string) => apiService.get(`/rides/${id}`),
  updateRideStatus: (id: string, data: any) => apiService.put(`/rides/${id}/status`, data),
  getActiveRides: () => apiService.get('/rides/active'),
  getRideStats: () => apiService.get('/rides/statistics/overview'),

  // User management
  getUsers: (params?: any) => apiService.getPaginated('/users', params),
  getUserById: (id: string) => apiService.get(`/users/${id}`),
  updateUser: (id: string, data: any) => apiService.put(`/users/${id}`, data),
  suspendUser: (id: string, reason: string) => apiService.put(`/users/${id}/suspend`, { reason }),
  activateUser: (id: string) => apiService.put(`/users/${id}/activate`),

  // Driver management
  getDrivers: (params?: any) => apiService.getPaginated('/drivers', params),
  getDriverById: (id: string) => apiService.get(`/drivers/${id}`),
  verifyDriver: (id: string) => apiService.put(`/drivers/${id}/verify`),
  rejectDriver: (id: string, reason: string) => apiService.put(`/drivers/${id}/reject`, { reason }),

  // Vehicle management
  getVehicles: (params?: any) => apiService.getPaginated('/vehicles', params),
  getVehicleById: (id: string) => apiService.get(`/vehicles/${id}`),
  verifyVehicle: (id: string) => apiService.put(`/vehicles/${id}/verify`),
  rejectVehicle: (id: string, reason: string) => apiService.put(`/vehicles/${id}/reject`, { reason }),

  // Payment management
  getPayments: (params?: any) => apiService.getPaginated('/payments', params),
  getPaymentById: (id: string) => apiService.get(`/payments/${id}`),
  processRefund: (id: string, amount: number, reason: string) =>
    apiService.post(`/payments/${id}/refund`, { amount, reason }),

  // System configuration
  getSystemConfig: () => apiService.get('/system-config'),
  updateSystemConfig: (data: any) => apiService.put('/system-config', data),

  // Email notifications
  sendEmail: (data: any) => apiService.post('/email/send', data),
  getEmailTemplates: () => apiService.get('/email/templates'),
  updateEmailTemplate: (id: string, data: any) => apiService.put(`/email/templates/${id}`, data),
};

export default adminApi;
