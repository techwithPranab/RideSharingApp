/**
 * App slice for managing general app state
 * Handles loading states, notifications, and app-wide settings
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '../../types';

// App state interface
interface AppState {
  isLoading: boolean;
  notifications: Notification[];
  unreadNotificationsCount: number;
  appSettings: {
    enableNotifications: boolean;
    enableLocation: boolean;
    language: string;
    theme: 'light' | 'dark' | 'system';
  };
  error: string | null;
}

// Initial state
const initialState: AppState = {
  isLoading: false,
  notifications: [],
  unreadNotificationsCount: 0,
  appSettings: {
    enableNotifications: true,
    enableLocation: true,
    language: 'en',
    theme: 'system',
  },
  error: null,
};

// App slice
const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Set error
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },

    // Add notification
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadNotificationsCount += 1;
      }
    },

    // Mark notification as read
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadNotificationsCount = Math.max(0, state.unreadNotificationsCount - 1);
      }
    },

    // Mark all notifications as read
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.isRead = true;
      });
      state.unreadNotificationsCount = 0;
    },

    // Clear notifications
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadNotificationsCount = 0;
    },

    // Update app settings
    updateAppSettings: (state, action: PayloadAction<Partial<AppState['appSettings']>>) => {
      state.appSettings = { ...state.appSettings, ...action.payload };
    },

    // Clear app state
    clearApp: (state) => {
      state.notifications = [];
      state.unreadNotificationsCount = 0;
      state.error = null;
    },
  },
});

export const {
  setLoading,
  clearError,
  setError,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications,
  updateAppSettings,
  clearApp,
} = appSlice.actions;

export default appSlice.reducer;
