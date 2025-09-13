/**
 * Unit tests for API Service
 * Tests HTTP client functionality and API endpoints
 */

import axios from 'axios';
import { apiService } from '../../../../../../mobile/rider-app/src/services/api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('request', () => {
    it('should make successful GET request', async () => {
      const mockResponse = {
        data: { message: 'Success' },
        status: 200,
        statusText: 'OK'
      };

      mockedAxios.request.mockResolvedValue(mockResponse);

      const result = await apiService.request({
        method: 'GET',
        url: '/test-endpoint'
      });

      expect(mockedAxios.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/test-endpoint',
        baseURL: expect.any(String),
        headers: expect.any(Object),
        timeout: 10000
      });

      expect(result).toEqual(mockResponse);
    });

    it('should make POST request with data', async () => {
      const mockResponse = {
        data: { id: 1, name: 'Test' },
        status: 201,
        statusText: 'Created'
      };

      const requestData = { name: 'Test' };

      mockedAxios.request.mockResolvedValue(mockResponse);

      const result = await apiService.request({
        method: 'POST',
        url: '/test-endpoint',
        data: requestData
      });

      expect(mockedAxios.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/test-endpoint',
        data: requestData,
        baseURL: expect.any(String),
        headers: expect.any(Object),
        timeout: 10000
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle request error', async () => {
      const errorMessage = 'Network Error';
      const mockError = new Error(errorMessage);

      mockedAxios.request.mockRejectedValue(mockError);

      await expect(apiService.request({
        method: 'GET',
        url: '/test-endpoint'
      })).rejects.toThrow(errorMessage);
    });

    it('should include authorization header when token provided', async () => {
      const mockResponse = { data: {}, status: 200 };
      const token = 'test-token';

      mockedAxios.request.mockResolvedValue(mockResponse);

      await apiService.request({
        method: 'GET',
        url: '/test-endpoint',
        headers: { Authorization: `Bearer ${token}` }
      });

      expect(mockedAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`
          })
        })
      );
    });
  });

  describe('get', () => {
    it('should make GET request', async () => {
      const mockResponse = { data: { items: [] }, status: 200 };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await apiService.get('/test-endpoint');

      expect(mockedAxios.get).toHaveBeenCalledWith('/test-endpoint', {
        baseURL: expect.any(String),
        headers: expect.any(Object),
        timeout: 10000
      });

      expect(result).toEqual(mockResponse);
    });

    it('should make GET request with params', async () => {
      const mockResponse = { data: { items: [] }, status: 200 };
      const params = { page: 1, limit: 10 };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await apiService.get('/test-endpoint', { params });

      expect(mockedAxios.get).toHaveBeenCalledWith('/test-endpoint', {
        params,
        baseURL: expect.any(String),
        headers: expect.any(Object),
        timeout: 10000
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('post', () => {
    it('should make POST request', async () => {
      const mockResponse = { data: { id: 1 }, status: 201 };
      const requestData = { name: 'Test' };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await apiService.post('/test-endpoint', requestData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/test-endpoint', requestData, {
        baseURL: expect.any(String),
        headers: expect.any(Object),
        timeout: 10000
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('put', () => {
    it('should make PUT request', async () => {
      const mockResponse = { data: { id: 1, updated: true }, status: 200 };
      const requestData = { name: 'Updated Test' };

      mockedAxios.put.mockResolvedValue(mockResponse);

      const result = await apiService.put('/test-endpoint/1', requestData);

      expect(mockedAxios.put).toHaveBeenCalledWith('/test-endpoint/1', requestData, {
        baseURL: expect.any(String),
        headers: expect.any(Object),
        timeout: 10000
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('delete', () => {
    it('should make DELETE request', async () => {
      const mockResponse = { data: { deleted: true }, status: 200 };

      mockedAxios.delete.mockResolvedValue(mockResponse);

      const result = await apiService.delete('/test-endpoint/1');

      expect(mockedAxios.delete).toHaveBeenCalledWith('/test-endpoint/1', {
        baseURL: expect.any(String),
        headers: expect.any(Object),
        timeout: 10000
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Authentication endpoints', () => {
    describe('login', () => {
      it('should login user successfully', async () => {
        const loginData = {
          email: 'test@example.com',
          password: 'password123'
        };

        const mockResponse = {
          data: {
            user: { id: 1, email: 'test@example.com' },
            token: 'jwt-token'
          },
          status: 200
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const result = await apiService.login(loginData);

        expect(mockedAxios.post).toHaveBeenCalledWith('/auth/login', loginData, expect.any(Object));
        expect(result).toEqual(mockResponse);
      });

      it('should handle login failure', async () => {
        const loginData = {
          email: 'test@example.com',
          password: 'wrongpassword'
        };

        const mockError = {
          response: {
            data: { message: 'Invalid credentials' },
            status: 401
          }
        };

        mockedAxios.post.mockRejectedValue(mockError);

        await expect(apiService.login(loginData)).rejects.toEqual(mockError);
      });
    });

    describe('register', () => {
      it('should register user successfully', async () => {
        const registerData = {
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User'
        };

        const mockResponse = {
          data: {
            user: { id: 2, email: 'newuser@example.com', name: 'New User' },
            token: 'jwt-token'
          },
          status: 201
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const result = await apiService.register(registerData);

        expect(mockedAxios.post).toHaveBeenCalledWith('/auth/register', registerData, expect.any(Object));
        expect(result).toEqual(mockResponse);
      });
    });

    describe('logout', () => {
      it('should logout user', async () => {
        const mockResponse = {
          data: { message: 'Logged out successfully' },
          status: 200
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const result = await apiService.logout();

        expect(mockedAxios.post).toHaveBeenCalledWith('/auth/logout', {}, expect.any(Object));
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('Ride endpoints', () => {
    describe('getRides', () => {
      it('should get user rides', async () => {
        const mockResponse = {
          data: {
            rides: [
              { id: 1, status: 'completed' },
              { id: 2, status: 'active' }
            ]
          },
          status: 200
        };

        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await apiService.getRides();

        expect(mockedAxios.get).toHaveBeenCalledWith('/rides', expect.any(Object));
        expect(result).toEqual(mockResponse);
      });

      it('should get rides with filters', async () => {
        const filters = { status: 'active', page: 1 };
        const mockResponse = {
          data: { rides: [{ id: 2, status: 'active' }] },
          status: 200
        };

        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await apiService.getRides(filters);

        expect(mockedAxios.get).toHaveBeenCalledWith('/rides', {
          params: filters,
          ...expect.any(Object)
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('createRide', () => {
      it('should create new ride', async () => {
        const rideData = {
          pickupLocation: { latitude: 37.7749, longitude: -122.4194 },
          dropoffLocation: { latitude: 37.7849, longitude: -122.4094 },
          vehicleType: 'sedan'
        };

        const mockResponse = {
          data: {
            ride: { id: 3, ...rideData, status: 'requested' }
          },
          status: 201
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const result = await apiService.createRide(rideData);

        expect(mockedAxios.post).toHaveBeenCalledWith('/rides', rideData, expect.any(Object));
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getRideDetails', () => {
      it('should get ride details', async () => {
        const rideId = 1;
        const mockResponse = {
          data: {
            ride: {
              id: 1,
              status: 'active',
              driver: { id: 1, name: 'John Doe' },
              pickupLocation: { latitude: 37.7749, longitude: -122.4194 },
              dropoffLocation: { latitude: 37.7849, longitude: -122.4094 }
            }
          },
          status: 200
        };

        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await apiService.getRideDetails(rideId);

        expect(mockedAxios.get).toHaveBeenCalledWith(`/rides/${rideId}`, expect.any(Object));
        expect(result).toEqual(mockResponse);
      });
    });

    describe('cancelRide', () => {
      it('should cancel ride', async () => {
        const rideId = 1;
        const mockResponse = {
          data: { message: 'Ride cancelled successfully' },
          status: 200
        };

        mockedAxios.put.mockResolvedValue(mockResponse);

        const result = await apiService.cancelRide(rideId);

        expect(mockedAxios.put).toHaveBeenCalledWith(`/rides/${rideId}/cancel`, {}, expect.any(Object));
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('Payment endpoints', () => {
    describe('getPaymentMethods', () => {
      it('should get user payment methods', async () => {
        const mockResponse = {
          data: {
            paymentMethods: [
              { id: 1, type: 'card', last4: '4242' },
              { id: 2, type: 'wallet', balance: 50.00 }
            ]
          },
          status: 200
        };

        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await apiService.getPaymentMethods();

        expect(mockedAxios.get).toHaveBeenCalledWith('/payments/methods', expect.any(Object));
        expect(result).toEqual(mockResponse);
      });
    });

    describe('addPaymentMethod', () => {
      it('should add payment method', async () => {
        const paymentData = {
          type: 'card',
          cardNumber: '4242424242424242',
          expiryMonth: 12,
          expiryYear: 2025,
          cvv: '123'
        };

        const mockResponse = {
          data: {
            paymentMethod: { id: 3, type: 'card', last4: '4242' }
          },
          status: 201
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const result = await apiService.addPaymentMethod(paymentData);

        expect(mockedAxios.post).toHaveBeenCalledWith('/payments/methods', paymentData, expect.any(Object));
        expect(result).toEqual(mockResponse);
      });
    });

    describe('processPayment', () => {
      it('should process payment', async () => {
        const paymentData = {
          rideId: 1,
          paymentMethodId: 1,
          amount: 25.50
        };

        const mockResponse = {
          data: {
            payment: {
              id: 1,
              status: 'completed',
              amount: 25.50,
              transactionId: 'txn_123'
            }
          },
          status: 200
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const result = await apiService.processPayment(paymentData);

        expect(mockedAxios.post).toHaveBeenCalledWith('/payments/process', paymentData, expect.any(Object));
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      networkError.name = 'NetworkError';

      mockedAxios.get.mockRejectedValue(networkError);

      await expect(apiService.get('/test')).rejects.toThrow('Network Error');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Timeout');
      timeoutError.code = 'ECONNABORTED';

      mockedAxios.get.mockRejectedValue(timeoutError);

      await expect(apiService.get('/test')).rejects.toThrow('Timeout');
    });

    it('should handle server errors', async () => {
      const serverError = {
        response: {
          data: { message: 'Internal Server Error' },
          status: 500
        }
      };

      mockedAxios.get.mockRejectedValue(serverError);

      await expect(apiService.get('/test')).rejects.toEqual(serverError);
    });

    it('should handle unauthorized errors', async () => {
      const authError = {
        response: {
          data: { message: 'Unauthorized' },
          status: 401
        }
      };

      mockedAxios.get.mockRejectedValue(authError);

      await expect(apiService.get('/test')).rejects.toEqual(authError);
    });
  });

  describe('Request configuration', () => {
    it('should set correct base URL', async () => {
      const mockResponse = { data: {}, status: 200 };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await apiService.get('/test');

      expect(mockedAxios.get).toHaveBeenCalledWith('/test', expect.objectContaining({
        baseURL: expect.stringContaining('api')
      }));
    });

    it('should set correct headers', async () => {
      const mockResponse = { data: {}, status: 200 };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await apiService.get('/test');

      expect(mockedAxios.get).toHaveBeenCalledWith('/test', expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      }));
    });

    it('should set correct timeout', async () => {
      const mockResponse = { data: {}, status: 200 };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await apiService.get('/test');

      expect(mockedAxios.get).toHaveBeenCalledWith('/test', expect.objectContaining({
        timeout: 10000
      }));
    });
  });
});
