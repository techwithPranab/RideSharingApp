/**
 * Auth slice for managing authentication state
 * Handles login, logout, token management, and auth status
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { authAPI } from '../../services/api';
import { User } from '../../types';

// Auth state interface
interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  user: null,
  isLoading: false,
  error: null,
};

// Async thunks for API calls

/**
 * Register new user
 */
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: {
    phoneNumber: string;
    firstName: string;
    lastName: string;
    role: 'rider' | 'driver';
    email?: string;
    referralCode?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

/**
 * Login with phone and OTP
 */
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: {
    phoneNumber: string;
    otp: string;
  }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      const data = response.data?.data;
      if (!data || !data.user || !data.token) {
        throw new Error('Invalid response data');
      }
      const { user, token } = data;

      // Store token in AsyncStorage
      await AsyncStorage.setItem('token', token);

      return { user, token };
    } catch (error: unknown) {
      const message = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.error?.message || 'Login failed'
        : 'Login failed';
      return rejectWithValue(message);
    }
  }
);

/**
 * Send OTP for login
 */
export const sendOTP = createAsyncThunk(
  'auth/sendOTP',
  async (phoneNumber: string, { rejectWithValue }) => {
    try {
      const response = await authAPI.sendOTP(phoneNumber);
      return response.data.message;
    } catch (error: unknown) {
      const message = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.error?.message || 'Failed to send OTP'
        : 'Failed to send OTP';
      return rejectWithValue(message);
    }
  }
);

/**
 * Verify phone number with OTP
 */
export const verifyPhone = createAsyncThunk(
  'auth/verifyPhone',
  async (data: {
    phoneNumber: string;
    otp: string;
  }, { rejectWithValue }) => {
    try {
      const response = await authAPI.verifyPhone(data);
      const responseData = response.data?.data;
      if (!responseData || !responseData.user || !responseData.token) {
        throw new Error('Invalid response data');
      }
      const { user, token } = responseData;

      // Store token in AsyncStorage
      await AsyncStorage.setItem('token', token);

      return { user, token };
    } catch (error: unknown) {
      const message = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.error?.message || 'Phone verification failed'
        : 'Phone verification failed';
      return rejectWithValue(message);
    }
  }
);

/**
 * Logout user
 */
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
      // Remove token from AsyncStorage
      await AsyncStorage.removeItem('token');
      return true;
    } catch (error: unknown) {
      // Even if API call fails, remove local token
      await AsyncStorage.removeItem('token');
      const message = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.error?.message || 'Logout failed'
        : 'Logout failed';
      return rejectWithValue(message);
    }
  }
);

/**
 * Load token from storage and verify
 */
export const loadToken = createAsyncThunk(
  'auth/loadToken',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      // Verify token by fetching user profile
      const response = await authAPI.getProfile();
      const user = response.data?.data?.user;
      if (!user) {
        throw new Error('Invalid user data');
      }

      return { user, token };
    } catch (error: unknown) {
      // Remove invalid token
      await AsyncStorage.removeItem('token');
      return rejectWithValue('Token verification failed');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Clear auth state
    clearAuth: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.error = null;
    },

    // Update user data
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Register user
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        // Don't set as authenticated yet, need phone verification
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Login user
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
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

    // Verify phone
    builder
      .addCase(verifyPhone.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyPhone.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(verifyPhone.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Logout user
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        // Still clear auth state even if logout API fails
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.error = action.payload as string;
      });

    // Load token
    builder
      .addCase(loadToken.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(loadToken.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.error = null; // Don't show error for token load failure
      });
  },
});

export const { clearError, clearAuth, updateUser } = authSlice.actions;
export default authSlice.reducer;
