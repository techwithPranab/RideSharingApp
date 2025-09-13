/**
 * Redux store configuration for Driver App
 */

import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';

// Import slices
import authSlice from './slices/authSlice';
import driverSlice from './slices/driverSlice';
import rideSlice from './slices/rideSlice';
import appSlice from './slices/appSlice';

// Persist configuration
const persistConfig = {
  key: 'driver-app-root',
  storage: AsyncStorage,
  whitelist: ['auth', 'driver'], // Only persist auth and driver data
};

// Root reducer
const rootReducer = combineReducers({
  auth: authSlice,
  driver: driverSlice,
  ride: rideSlice,
  app: appSlice,
});

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Store configuration
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

// Persistor
export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
