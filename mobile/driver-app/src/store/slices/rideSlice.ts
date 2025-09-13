/**
 * Ride slice for managing ride requests and active rides
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { driverAPI } from '../../services/api';
import { Ride } from '../../types';

// Ride state interface
interface RideState {
  availableRides: Ride[];
  activeRide: Ride | null;
  rideHistory: Ride[];
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: RideState = {
  availableRides: [],
  activeRide: null,
  rideHistory: [],
  isLoading: false,
  error: null,
};

// Async thunks for API calls

/**
 * Get available rides
 */
export const getAvailableRides = createAsyncThunk(
  'ride/getAvailable',
  async ({ driverId, location }: { driverId: string; location: { latitude: number; longitude: number } }, { rejectWithValue }) => {
    try {
      const response = await driverAPI.getAvailableRides(driverId, location);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to get available rides');
    }
  }
);

/**
 * Accept ride
 */
export const acceptRide = createAsyncThunk(
  'ride/accept',
  async ({ rideId, driverId }: { rideId: string; driverId: string }, { rejectWithValue }) => {
    try {
      const response = await driverAPI.acceptRide(rideId, driverId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to accept ride');
    }
  }
);

/**
 * Reject ride
 */
export const rejectRide = createAsyncThunk(
  'ride/reject',
  async ({ rideId, driverId, reason }: { rideId: string; driverId: string; reason?: string }, { rejectWithValue }) => {
    try {
      const response = await driverAPI.rejectRide(rideId, driverId, reason);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to reject ride');
    }
  }
);

/**
 * Start ride
 */
export const startRide = createAsyncThunk(
  'ride/start',
  async (rideId: string, { rejectWithValue }) => {
    try {
      const response = await driverAPI.startRide(rideId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to start ride');
    }
  }
);

/**
 * Complete ride
 */
export const completeRide = createAsyncThunk(
  'ride/complete',
  async ({ rideId, data }: { rideId: string; data: { distance: number; duration: number } }, { rejectWithValue }) => {
    try {
      const response = await driverAPI.completeRide(rideId, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to complete ride');
    }
  }
);

/**
 * Get ride history
 */
export const getRideHistory = createAsyncThunk(
  'ride/getHistory',
  async ({ driverId, page, limit }: { driverId: string; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await driverAPI.getRideHistory(driverId, page, limit);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to get ride history');
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

    // Set active ride
    setActiveRide: (state, action: PayloadAction<Ride | null>) => {
      state.activeRide = action.payload;
    },

    // Update ride status
    updateRideStatus: (state, action: PayloadAction<{ rideId: string; status: string }>) => {
      const { rideId, status } = action.payload;

      // Update in available rides
      const availableIndex = state.availableRides.findIndex(ride => ride.id === rideId);
      if (availableIndex !== -1 && state.availableRides[availableIndex]) {
        state.availableRides[availableIndex].status = status as any;
      }

      // Update active ride
      if (state.activeRide?.id === rideId) {
        state.activeRide.status = status as any;
      }

      // Update in history
      const historyIndex = state.rideHistory.findIndex(ride => ride.id === rideId);
      if (historyIndex !== -1 && state.rideHistory[historyIndex]) {
        state.rideHistory[historyIndex].status = status as any;
      }
    },

    // Clear ride state
    clearRides: (state) => {
      state.availableRides = [];
      state.activeRide = null;
      state.rideHistory = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Get available rides
    builder
      .addCase(getAvailableRides.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAvailableRides.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableRides = action.payload;
        state.error = null;
      })
      .addCase(getAvailableRides.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Accept ride
    builder
      .addCase(acceptRide.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(acceptRide.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeRide = action.payload;
        // Remove from available rides
        state.availableRides = state.availableRides.filter(ride => ride.id !== action.payload.id);
        state.error = null;
      })
      .addCase(acceptRide.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Start ride
    builder
      .addCase(startRide.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startRide.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.activeRide) {
          state.activeRide.status = 'started';
        }
        state.error = null;
      })
      .addCase(startRide.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Complete ride
    builder
      .addCase(completeRide.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(completeRide.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.activeRide) {
          state.activeRide.status = 'completed';
          state.rideHistory.unshift(state.activeRide);
          state.activeRide = null;
        }
        state.error = null;
      })
      .addCase(completeRide.rejected, (state, action) => {
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
        state.rideHistory = action.payload;
        state.error = null;
      })
      .addCase(getRideHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setActiveRide, updateRideStatus, clearRides } = rideSlice.actions;
export default rideSlice.reducer;
