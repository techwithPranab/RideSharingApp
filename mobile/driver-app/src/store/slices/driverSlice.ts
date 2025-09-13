/**
 * Driver slice for managing driver profile and data
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { driverAPI } from '../../services/api';
import { Driver, Vehicle, DriverStats, Earnings } from '../../types';

// Driver state interface
interface DriverState {
  profile: Driver | null;
  vehicles: Vehicle[];
  stats: DriverStats | null;
  earnings: Earnings[];
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: DriverState = {
  profile: null,
  vehicles: [],
  stats: null,
  earnings: [],
  isLoading: false,
  error: null,
};

// Async thunks for API calls

/**
 * Get driver profile
 */
export const getDriverProfile = createAsyncThunk(
  'driver/getProfile',
  async (driverId: string, { rejectWithValue }) => {
    try {
      const response = await driverAPI.getProfile(driverId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to get profile');
    }
  }
);

/**
 * Update driver profile
 */
export const updateDriverProfile = createAsyncThunk(
  'driver/updateProfile',
  async ({ driverId, data }: { driverId: string; data: Partial<Driver> }, { rejectWithValue }) => {
    try {
      const response = await driverAPI.updateProfile(driverId, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to update profile');
    }
  }
);

/**
 * Get driver vehicles
 */
export const getDriverVehicles = createAsyncThunk(
  'driver/getVehicles',
  async (driverId: string, { rejectWithValue }) => {
    try {
      const response = await driverAPI.getVehicles(driverId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to get vehicles');
    }
  }
);

/**
 * Add driver vehicle
 */
export const addDriverVehicle = createAsyncThunk(
  'driver/addVehicle',
  async ({ driverId, vehicleData }: { driverId: string; vehicleData: any }, { rejectWithValue }) => {
    try {
      const response = await driverAPI.addVehicle(driverId, vehicleData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to add vehicle');
    }
  }
);

/**
 * Update driver vehicle
 */
export const updateDriverVehicle = createAsyncThunk(
  'driver/updateVehicle',
  async ({ driverId, vehicleId, vehicleData }: { driverId: string; vehicleId: string; vehicleData: any }, { rejectWithValue }) => {
    try {
      const response = await driverAPI.updateVehicle(driverId, vehicleId, vehicleData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to update vehicle');
    }
  }
);

/**
 * Get driver statistics
 */
export const getDriverStats = createAsyncThunk(
  'driver/getStats',
  async (driverId: string, { rejectWithValue }) => {
    try {
      const response = await driverAPI.getStats(driverId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to get stats');
    }
  }
);

/**
 * Get driver earnings
 */
export const getDriverEarnings = createAsyncThunk(
  'driver/getEarnings',
  async ({ driverId, period }: { driverId: string; period: string }, { rejectWithValue }) => {
    try {
      const response = await driverAPI.getEarnings(driverId, period);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to get earnings');
    }
  }
);

// Driver slice
const driverSlice = createSlice({
  name: 'driver',
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Set driver profile (used when loading from auth)
    setProfile: (state, action: PayloadAction<Driver>) => {
      state.profile = action.payload;
    },

    // Update driver profile locally
    updateProfileLocal: (state, action: PayloadAction<Partial<Driver>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },

    // Clear driver state
    clearDriver: (state) => {
      state.profile = null;
      state.vehicles = [];
      state.stats = null;
      state.earnings = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Get profile
    builder
      .addCase(getDriverProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getDriverProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.error = null;
      })
      .addCase(getDriverProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update profile
    builder
      .addCase(updateDriverProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateDriverProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.error = null;
      })
      .addCase(updateDriverProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get vehicles
    builder
      .addCase(getDriverVehicles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getDriverVehicles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.vehicles = action.payload;
        state.error = null;
      })
      .addCase(getDriverVehicles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Add vehicle
    builder
      .addCase(addDriverVehicle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addDriverVehicle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.vehicles.push(action.payload);
        state.error = null;
      })
      .addCase(addDriverVehicle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update vehicle
    builder
      .addCase(updateDriverVehicle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateDriverVehicle.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.vehicles.findIndex(v => v.id === action.payload.id);
        if (index !== -1) {
          state.vehicles[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateDriverVehicle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get stats
    builder
      .addCase(getDriverStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getDriverStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(getDriverStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get earnings
    builder
      .addCase(getDriverEarnings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getDriverEarnings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.earnings = action.payload;
        state.error = null;
      })
      .addCase(getDriverEarnings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setProfile, updateProfileLocal, clearDriver } = driverSlice.actions;
export default driverSlice.reducer;
