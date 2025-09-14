/**
 * Authentication slice for Driver App
 * Handles driver authentication state and login/logout
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { driverAPI } from '../../services/api';
import { Driver, DriverLoginForm, DriverRegisterForm } from '../../types';

// Auth state interface
interface AuthState {
  driver: Driver | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
}

// Initial state
const initialState: AuthState = {
  driver: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isOnline: false,
};

// Async thunks for API calls

/**
 * Driver login with OTP
 */
export const loginDriver = createAsyncThunk(
  'auth/loginDriver',
  async (credentials: DriverLoginForm, { rejectWithValue }) => {
    try {
      const response = await driverAPI.login(credentials);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Login failed');
    }
  }
);

/**
 * Driver registration
 */
export const registerDriver = createAsyncThunk(
  'auth/registerDriver',
  async (driverData: DriverRegisterForm, { rejectWithValue }) => {
    try {
      const response = await driverAPI.register(driverData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Registration failed');
    }
  }
);

/**
 * Send OTP to driver
 */
export const sendOTP = createAsyncThunk(
  'auth/sendOTP',
  async (email: string, { rejectWithValue }) => {
    try {
      console.log('Sending OTP to:', email);
      const response = await driverAPI.sendOTP(email);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to send OTP');
    }
  }
);

/**
 * Verify OTP
 */
export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async (data: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await driverAPI.verifyOTP(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'OTP verification failed');
    }
  }
);

/**
 * Update driver online status
 */
export const updateOnlineStatus = createAsyncThunk(
  'auth/updateOnlineStatus',
  async (isOnline: boolean, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const driverId = state.auth.driver?.id;

      if (!driverId) {
        throw new Error('Driver not authenticated');
      }

      const response = await driverAPI.updateOnlineStatus(driverId, isOnline);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to update status');
    }
  }
);

/**
 * Validate authentication state async thunk
 */
export const validateAuthAsync = createAsyncThunk(
  'auth/validateAuth',
  async (_, { getState }) => {
    const state = getState() as any;
    const { isAuthenticated, driver, token } = state.auth;
    
    // If isAuthenticated is true but driver or token is missing, clear everything
    if (isAuthenticated && (!driver || !token)) {
      console.log('Auth validation failed: Missing driver or token, clearing storage');
      await AsyncStorage.removeItem('driver_token');
      await AsyncStorage.removeItem('driver_id');
      return { shouldLogout: true };
    }
    
    return { shouldLogout: false };
  }
);

/**
 * Logout driver async thunk
 */
export const logoutDriverAsync = createAsyncThunk(
  'auth/logoutDriver',
  async () => {
    // Clear AsyncStorage
    await AsyncStorage.removeItem('driver_token');
    await AsyncStorage.removeItem('driver_id');
    return true;
  }
);

/**
 * Refresh driver token
 */
export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await driverAPI.refreshToken();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Token refresh failed');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Logout driver
    logoutDriver: (state) => {
      state.driver = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isOnline = false;
      state.error = null;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Set driver data (used when loading from storage)
    setDriver: (state, action: PayloadAction<Driver>) => {
      state.driver = action.payload;
      state.isAuthenticated = true;
    },

    // Validate authentication state
    validateAuth: (state) => {
      // If isAuthenticated is true but driver or token is missing, logout
      if (state.isAuthenticated && (!state.driver || !state.token)) {
        console.log('Auth validation failed: Missing driver or token, logging out');
        state.driver = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isOnline = false;
        state.error = null;
      }
    },

    // Update driver online status locally
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
      if (state.driver) {
        state.driver.isOnline = action.payload;
      }
    },

    // Update driver location
    updateDriverLocation: (state, action: PayloadAction<{ latitude: number; longitude: number; address?: string }>) => {
      if (state.driver) {
        const location: any = {
          type: 'Point',
          coordinates: [action.payload.longitude, action.payload.latitude],
        };
        if (action.payload.address) {
          location.address = action.payload.address;
        }
        state.driver.currentLocation = location;
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginDriver.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginDriver.fulfilled, (state, action) => {
        console.log('Login fulfilled with payload:', action.payload);
        
        // Handle both response formats: direct or wrapped in data
        const responseData = action.payload.data || action.payload;
        
        // Validate the response structure
        if (!responseData?.user || !responseData?.token) {
          console.error('Invalid login response:', action.payload);
          state.isLoading = false;
          state.error = 'Invalid server response. Please try again.';
          return;
        }

        state.isLoading = false;
        // Map backend response to frontend expected structure
        state.driver = {
          id: responseData.user.id,
          email: responseData.user.email,
          firstName: responseData.user.firstName,
          lastName: responseData.user.lastName,
          phoneNumber: responseData.user.phoneNumber || '',
          role: responseData.user.role,
          status: responseData.user.status || 'active',
          isPhoneVerified: responseData.user.isPhoneVerified || false,
          isEmailVerified: responseData.user.isEmailVerified || false,
          averageRating: responseData.user.averageRating || 0,
          totalRatings: 0,
          kycStatus: responseData.user.kycStatus || 'not_submitted',
          isOnline: false,
          isAvailable: false,
          vehicleIds: [],
          vehicles: [],
          totalEarnings: 0,
          totalTrips: 0,
          totalDistance: 0,
          totalHours: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        state.token = responseData.token;
        state.isAuthenticated = true;
        state.error = null;
        
        // Save to AsyncStorage for screens that need direct access
        AsyncStorage.setItem('driver_token', responseData.token);
        AsyncStorage.setItem('driver_id', responseData.user.id);
        
        console.log('Login successful, driver authenticated:', responseData.user.id);
      })
      .addCase(loginDriver.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Register
    builder
      .addCase(registerDriver.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerDriver.fulfilled, (state, action) => {
        console.log('Registration fulfilled with payload:', action.payload);
        
        // Handle both response formats: direct or wrapped in data
        const responseData = action.payload.data || action.payload;
        
        // Validate the response structure
        if (!responseData?.user || !responseData?.token) {
          console.error('Invalid registration response:', action.payload);
          state.isLoading = false;
          state.error = 'Invalid server response. Please try again.';
          return;
        }

        state.isLoading = false;
        // Map backend response to frontend expected structure
        state.driver = {
          id: responseData.user.id,
          email: responseData.user.email,
          firstName: responseData.user.firstName,
          lastName: responseData.user.lastName,
          phoneNumber: responseData.user.phoneNumber || '',
          role: responseData.user.role,
          status: responseData.user.status || 'active',
          isPhoneVerified: responseData.user.isPhoneVerified || false,
          isEmailVerified: responseData.user.isEmailVerified || false,
          averageRating: responseData.user.averageRating || 0,
          totalRatings: 0,
          kycStatus: responseData.user.kycStatus || 'not_submitted',
          isOnline: false,
          isAvailable: false,
          vehicleIds: [],
          vehicles: [],
          totalEarnings: 0,
          totalTrips: 0,
          totalDistance: 0,
          totalHours: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        state.token = responseData.token;
        state.isAuthenticated = true;
        state.error = null;
        
        // Save to AsyncStorage for screens that need direct access
        AsyncStorage.setItem('driver_token', responseData.token);
        AsyncStorage.setItem('driver_id', responseData.user.id);
        
        console.log('Registration successful, driver authenticated:', responseData.user.id);
      })
      .addCase(registerDriver.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Send OTP
    builder
      .addCase(sendOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendOTP.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(sendOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Verify OTP
    builder
      .addCase(verifyOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        console.log('OTP verification fulfilled with payload:', action.payload);
        
        // Handle both response formats: direct or wrapped in data
        const responseData = action.payload.data || action.payload;
        
        // Validate the response structure
        if (!responseData?.user || !responseData?.token) {
          console.error('Invalid OTP verification response:', action.payload);
          state.isLoading = false;
          state.error = 'Invalid server response. Please try again.';
          return;
        }

        state.isLoading = false;
        // Map backend response to frontend expected structure
        state.driver = {
          id: responseData.user.id,
          email: responseData.user.email,
          firstName: responseData.user.firstName,
          lastName: responseData.user.lastName,
          phoneNumber: responseData.user.phoneNumber || '',
          role: responseData.user.role,
          status: responseData.user.status || 'active',
          isPhoneVerified: responseData.user.isPhoneVerified || false,
          isEmailVerified: responseData.user.isEmailVerified || false,
          averageRating: responseData.user.averageRating || 0,
          totalRatings: 0,
          kycStatus: responseData.user.kycStatus || 'not_submitted',
          isOnline: false,
          isAvailable: false,
          vehicleIds: [],
          vehicles: [],
          totalEarnings: 0,
          totalTrips: 0,
          totalDistance: 0,
          totalHours: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        state.token = responseData.token;
        state.isAuthenticated = true;
        state.error = null;
        
        // Save to AsyncStorage for screens that need direct access
        AsyncStorage.setItem('driver_token', responseData.token);
        AsyncStorage.setItem('driver_id', responseData.user.id);
        
        console.log('OTP verification successful, driver authenticated:', responseData.user.id);
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        console.error('OTP verification rejected:', action.payload);
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update online status
    builder
      .addCase(updateOnlineStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateOnlineStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isOnline = action.payload.isOnline;
        if (state.driver) {
          state.driver.isOnline = action.payload.isOnline;
        }
        state.error = null;
      })
      .addCase(updateOnlineStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Refresh token
    builder
      .addCase(refreshToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        console.log('Token refresh fulfilled with payload:', action.payload);
        
        // Handle both response formats: direct or wrapped in data
        const responseData = action.payload.data || action.payload;
        
        // Validate the response structure
        if (!responseData?.token) {
          console.error('Invalid token refresh response:', action.payload);
          state.isLoading = false;
          state.error = 'Invalid server response. Please try again.';
          return;
        }

        state.isLoading = false;
        state.token = responseData.token;
        state.error = null;
        
        // Update AsyncStorage
        AsyncStorage.setItem('driver_token', responseData.token);
        
        console.log('Token refresh successful');
      })
      .addCase(refreshToken.rejected, (state, action) => {
        console.error('Token refresh rejected:', action.payload);
        state.isLoading = false;
        state.error = action.payload as string;
        // If token refresh fails, logout the driver
        state.driver = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isOnline = false;
      });

    // Logout async
    builder
      .addCase(logoutDriverAsync.fulfilled, (state) => {
        state.driver = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isOnline = false;
        state.error = null;
      });

    // Validate auth async
    builder
      .addCase(validateAuthAsync.fulfilled, (state, action) => {
        if (action.payload.shouldLogout) {
          state.driver = null;
          state.token = null;
          state.isAuthenticated = false;
          state.isOnline = false;
          state.error = null;
        }
      });
  },
});

export const {
  logoutDriver,
  clearError,
  setDriver,
  validateAuth,
  setOnlineStatus,
  updateDriverLocation,
} = authSlice.actions;

export default authSlice.reducer;
