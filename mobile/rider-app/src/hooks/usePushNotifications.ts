/**
 * Push Notification Hook for Rider App
 * Manages push notification setup and handling
 */

import { useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';
import { pushNotificationService } from '../services/pushNotificationService';
import { useNotifications } from '../components/NotificationProvider';

export const usePushNotifications = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { showNotification } = useNotifications();

  // Initialize push notifications
  const initializeNotifications = useCallback(async () => {
    try {
      const token = await pushNotificationService.initialize();
      if (token) {
        console.log('Push notifications initialized with token:', token);
        // Here you would typically send the token to your backend
        // await api.registerPushToken(token);
      }
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }, []);

  // Handle notification received
  const handleNotificationReceived = useCallback((notification: Notifications.Notification) => {
    const { title, body, data } = notification.request.content;

    // Show in-app notification
    showNotification({
      type: 'info',
      title: title || 'Notification',
      message: body || '',
      duration: 5000,
    });

    // Handle specific notification types
    switch (data?.type) {
      case 'driver_assigned':
        showNotification({
          type: 'success',
          title: 'Driver Assigned!',
          message: body || '',
          duration: 6000,
        });
        break;
      case 'driver_arrived':
        showNotification({
          type: 'info',
          title: 'Driver Arrived',
          message: body || '',
          duration: 6000,
        });
        break;
      case 'ride_started':
        showNotification({
          type: 'success',
          title: 'Ride Started',
          message: body || '',
          duration: 4000,
        });
        break;
      case 'ride_completed':
        showNotification({
          type: 'success',
          title: 'Ride Completed',
          message: body || '',
          duration: 5000,
        });
        break;
      case 'booking_confirmed':
        showNotification({
          type: 'success',
          title: 'Booking Confirmed!',
          message: body || '',
          duration: 5000,
        });
        break;
      case 'ride_cancelled':
        showNotification({
          type: 'warning',
          title: 'Ride Cancelled',
          message: body || '',
          duration: 6000,
        });
        break;
      case 'payment_processed':
        showNotification({
          type: 'info',
          title: 'Payment Processed',
          message: body || '',
          duration: 4000,
        });
        break;
    }
  }, [showNotification]);

  // Handle notification response (when user taps on notification)
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const { data } = response.notification.request.content;

    // Navigate based on notification type
    switch (data?.type) {
      case 'driver_assigned':
        navigation.navigate('RideTracking');
        break;
      case 'driver_arrived':
        navigation.navigate('RideTracking');
        break;
      case 'ride_started':
        navigation.navigate('RideTracking');
        break;
      case 'ride_completed':
        navigation.navigate('RideCompleted');
        break;
      case 'booking_confirmed':
        navigation.navigate('RideTracking');
        break;
      case 'booking_reminder':
        navigation.navigate('RideTracking');
        break;
    }
  }, [navigation]);

  // Set up notification listeners
  useEffect(() => {
    pushNotificationService.setupListeners(
      handleNotificationReceived,
      handleNotificationResponse
    );

    return () => {
      pushNotificationService.cleanup();
    };
  }, [handleNotificationReceived, handleNotificationResponse]);

  // Initialize on mount
  useEffect(() => {
    initializeNotifications();
  }, [initializeNotifications]);

  return {
    initializeNotifications,
    sendNotification: pushNotificationService.sendLocalNotification.bind(pushNotificationService),
    scheduleNotification: pushNotificationService.scheduleNotification.bind(pushNotificationService),
    cancelNotification: pushNotificationService.cancelNotification.bind(pushNotificationService),
    cancelAllNotifications: pushNotificationService.cancelAllNotifications.bind(pushNotificationService),
    getBadgeCount: pushNotificationService.getBadgeCount.bind(pushNotificationService),
    setBadgeCount: pushNotificationService.setBadgeCount.bind(pushNotificationService),
  };
};
