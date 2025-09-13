/**
 * App slice for managing general app state
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// App state interface
interface AppState {
  isOnline: boolean;
  isLocationEnabled: boolean;
  isNotificationEnabled: boolean;
  currentLocation: {
    latitude: number;
    longitude: number;
  } | null;
  appVersion: string;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: AppState = {
  isOnline: true,
  isLocationEnabled: true,
  isNotificationEnabled: true,
  currentLocation: null,
  appVersion: '1.0.0',
  isLoading: false,
  error: null,
};

// App slice
const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    // Set online status
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },

    // Set location enabled status
    setLocationEnabled: (state, action: PayloadAction<boolean>) => {
      state.isLocationEnabled = action.payload;
    },

    // Set notification enabled status
    setNotificationEnabled: (state, action: PayloadAction<boolean>) => {
      state.isNotificationEnabled = action.payload;
    },

    // Update current location
    updateCurrentLocation: (state, action: PayloadAction<{ latitude: number; longitude: number }>) => {
      state.currentLocation = action.payload;
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Reset app state
    resetAppState: (state) => {
      state.isOnline = true;
      state.isLocationEnabled = true;
      state.isNotificationEnabled = true;
      state.currentLocation = null;
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const {
  setOnlineStatus,
  setLocationEnabled,
  setNotificationEnabled,
  updateCurrentLocation,
  setLoading,
  setError,
  clearError,
  resetAppState,
} = appSlice.actions;

export default appSlice.reducer;
