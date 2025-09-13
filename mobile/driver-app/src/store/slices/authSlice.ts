/**
 * Authentication slice for Driver App
 * Handles driver authentication state and login/logout
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
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
      return response.data.data;
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
      return response.data.data;
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
  async (phoneNumber: string, { rejectWithValue }) => {
    try {
      const response = await driverAPI.sendOTP(phoneNumber);
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
  async (data: { phoneNumber: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await driverAPI.verifyOTP(data);
      return response.data.data;
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
 * Refresh driver token
 */
export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await driverAPI.refreshToken();
      return response.data.data;
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
        state.isLoading = false;
        state.driver = action.payload.driver;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
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
        state.isLoading = false;
        state.driver = action.payload.driver;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
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
        state.isLoading = false;
        state.driver = action.payload.driver;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
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
        state.isLoading = false;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // If token refresh fails, logout the driver
        state.driver = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isOnline = false;
      });
  },
});

export const {
  logoutDriver,
  clearError,
  setDriver,
  setOnlineStatus,
  updateDriverLocation,
} = authSlice.actions;

export default authSlice.reducer;
