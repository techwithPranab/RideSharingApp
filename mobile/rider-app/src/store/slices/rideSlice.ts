/**
 * Ride slice for managing ride-related state
 * Handles ride requests, tracking, and history
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { rideAPI } from '../../services/api';
import { Ride, RideRequest, TripHistory, RideStatus, Driver, Location, Vehicle } from '../../types';

// Ride state interface
interface RideState {
  currentRide: Ride | null;
  rideHistory: TripHistory[];
  fareEstimate: {
    amount: number;
    distance: number;
    duration: number;
  } | null;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: RideState = {
  currentRide: null,
  rideHistory: [],
  fareEstimate: null,
  isLoading: false,
  error: null,
};

// Async thunks for API calls

/**
 * Request a ride
 */
export const requestRide = createAsyncThunk(
  'ride/requestRide',
  async (rideData: RideRequest, { rejectWithValue }) => {
    try {
      const response = await rideAPI.requestRide(rideData);
      return response.data.data;
    } catch (error: unknown) {
      const message = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.error?.message || 'Failed to request ride'
        : 'Failed to request ride';
      return rejectWithValue(message);
    }
  }
);

/**
 * Get ride by ID
 */
export const getRide = createAsyncThunk(
  'ride/getRide',
  async (rideId: string, { rejectWithValue }) => {
    try {
      const response = await rideAPI.getRide(rideId);
      return response.data.data;
    } catch (error: unknown) {
      const message = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.error?.message || 'Failed to get ride details'
        : 'Failed to get ride details';
      return rejectWithValue(message);
    }
  }
);

/**
 * Cancel ride
 */
export const cancelRide = createAsyncThunk(
  'ride/cancelRide',
  async ({ rideId, reason }: { rideId: string; reason?: string }, { rejectWithValue }) => {
    try {
      await rideAPI.cancelRide(rideId, reason);
      return rideId;
    } catch (error: unknown) {
      const message = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.error?.message || 'Failed to cancel ride'
        : 'Failed to cancel ride';
      return rejectWithValue(message);
    }
  }
);

/**
 * Rate and review ride
 */
export const rateRide = createAsyncThunk(
  'ride/rateRide',
  async ({ rideId, rating, review }: { rideId: string; rating: number; review?: string }, { rejectWithValue }) => {
    try {
      await rideAPI.rateRide(rideId, rating, review);
      return { rideId, rating, review };
    } catch (error: unknown) {
      const message = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.error?.message || 'Failed to rate ride'
        : 'Failed to rate ride';
      return rejectWithValue(message);
    }
  }
);

/**
 * Get ride history
 */
export const getRideHistory = createAsyncThunk(
  'ride/getRideHistory',
  async ({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await rideAPI.getRideHistory(page, limit);
      return response.data.data;
    } catch (error: unknown) {
      const message = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.error?.message || 'Failed to get ride history'
        : 'Failed to get ride history';
      return rejectWithValue(message);
    }
  }
);

/**
 * Get active ride
 */
export const getActiveRide = createAsyncThunk(
  'ride/getActiveRide',
  async (_, { rejectWithValue }) => {
    try {
      const response = await rideAPI.getActiveRide();
      return response.data.data;
    } catch (error: unknown) {
      const message = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.error?.message || 'Failed to get active ride'
        : 'Failed to get active ride';
      return rejectWithValue(message);
    }
  }
);

/**
 * Get fare estimate
 */
export const getFareEstimate = createAsyncThunk(
  'ride/getFareEstimate',
  async (data: {
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
    isPooled?: boolean;
  }, { rejectWithValue }) => {
    try {
      const response = await rideAPI.getFareEstimate(data);
      return response.data.data;
    } catch (error: unknown) {
      const message = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.error?.message || 'Failed to get fare estimate'
        : 'Failed to get fare estimate';
      return rejectWithValue(message);
    }
  }
);

// Ride slice
const rideSlice = createSlice({
  name: 'ride',
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Set current ride
    setCurrentRide: (state, action: PayloadAction<Ride | null>) => {
      state.currentRide = action.payload;
    },

    // Update ride status
    updateRideStatus: (state, action: PayloadAction<{ rideId: string; status: RideStatus }>) => {
      if (state.currentRide && state.currentRide.id === action.payload.rideId) {
        state.currentRide.status = action.payload.status;
      }
    },

    // Clear ride state
    clearRide: (state) => {
      state.currentRide = null;
      state.fareEstimate = null;
      state.error = null;
    },

    // Clear fare estimate
    clearFareEstimate: (state) => {
      state.fareEstimate = null;
    },
  },
  extraReducers: (builder) => {
    // Request ride
    builder
      .addCase(requestRide.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestRide.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentRide = action.payload || null;
        state.error = null;
      })
      .addCase(requestRide.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get ride
    builder
      .addCase(getRide.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getRide.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentRide = action.payload || null;
        state.error = null;
      })
      .addCase(getRide.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Cancel ride
    builder
      .addCase(cancelRide.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelRide.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.currentRide && state.currentRide.id === action.payload) {
          state.currentRide.status = 'cancelled';
        }
        state.error = null;
      })
      .addCase(cancelRide.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Rate ride
    builder
      .addCase(rateRide.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rateRide.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(rateRide.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get ride history
    builder
      .addCase(getRideHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getRideHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        // Map Ride[] to TripHistory[] since API returns Ride objects but we need TripHistory format
        state.rideHistory = (action.payload || []).map((ride: Ride) => ({
          id: ride.id,
          rideId: ride.rideId,
          driver: ride.driver || {} as Driver,
          vehicle: ride.vehicle || {} as Vehicle,
          pickupLocation: ride.passengers[0]?.pickupLocation || {} as Location,
          dropoffLocation: ride.passengers[0]?.dropoffLocation || {} as Location,
          pickupAddress: ride.passengers[0]?.pickupLocation?.address || '',
          dropoffAddress: ride.passengers[0]?.dropoffLocation?.address || '',
          fare: ride.totalFare,
          distance: ride.estimatedDistance,
          duration: ride.estimatedDuration,
          status: ride.status,
          completedAt: ride.completedAt || '',
          rating: ride.passengers[0]?.rating,
          review: ride.passengers[0]?.review,
        }));
        state.error = null;
      })
      .addCase(getRideHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get active ride
    builder
      .addCase(getActiveRide.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getActiveRide.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentRide = action.payload || null;
        state.error = null;
      })
      .addCase(getActiveRide.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get fare estimate
    builder
      .addCase(getFareEstimate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getFareEstimate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.fareEstimate = action.payload || null;
        state.error = null;
      })
      .addCase(getFareEstimate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCurrentRide, updateRideStatus, clearRide, clearFareEstimate } = rideSlice.actions;
export default rideSlice.reducer;
