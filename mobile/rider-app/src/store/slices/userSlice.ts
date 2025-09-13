/**
 * User slice for managing user-related state
 * Handles user profile, addresses, and preferences
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { userAPI } from '../../services/api';
import { User, Address } from '../../types';

// User state interface
interface UserState {
  profile: User | null;
  addresses: Address[];
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: UserState = {
  profile: null,
  addresses: [],
  isLoading: false,
  error: null,
};

// Async thunks for API calls

/**
 * Update user profile
 */
export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await userAPI.updateProfile(userData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to update profile');
    }
  }
);

/**
 * Update user location
 */
export const updateLocation = createAsyncThunk(
  'user/updateLocation',
  async (location: { latitude: number; longitude: number; address?: string }, { rejectWithValue }) => {
    try {
      const response = await userAPI.updateLocation(location);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to update location');
    }
  }
);

/**
 * Load saved addresses
 */
export const loadAddresses = createAsyncThunk(
  'user/loadAddresses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAPI.getSavedAddresses();
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to load addresses');
    }
  }
);

/**
 * Add saved address
 */
export const addAddress = createAsyncThunk(
  'user/addAddress',
  async (address: Omit<Address, 'id'>, { rejectWithValue }) => {
    try {
      const response = await userAPI.addSavedAddress(address);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to add address');
    }
  }
);

/**
 * Delete saved address
 */
export const deleteAddress = createAsyncThunk(
  'user/deleteAddress',
  async (addressId: string, { rejectWithValue }) => {
    try {
      await userAPI.deleteSavedAddress(addressId);
      return addressId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to delete address');
    }
  }
);

// User slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Set user profile (used when loading from auth)
    setProfile: (state, action: PayloadAction<User>) => {
      state.profile = action.payload;
    },

    // Update user profile locally
    updateProfileLocal: (state, action: PayloadAction<Partial<User>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },

    // Clear user state
    clearUser: (state) => {
      state.profile = null;
      state.addresses = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Update profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload || null;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update location
    builder
      .addCase(updateLocation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateLocation.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(updateLocation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load addresses
    builder
      .addCase(loadAddresses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadAddresses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.addresses = action.payload || [];
        state.error = null;
      })
      .addCase(loadAddresses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Add address
    builder
      .addCase(addAddress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.isLoading = false;
        state.addresses.push(action.payload);
        state.error = null;
      })
      .addCase(addAddress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete address
    builder
      .addCase(deleteAddress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.isLoading = false;
        state.addresses = state.addresses.filter(addr => addr.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setProfile, updateProfileLocal, clearUser } = userSlice.actions;
export default userSlice.reducer;
