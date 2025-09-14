/**
 * Push Notification Service for Rider App
 * Handles push notifications for ride bookings, driver assignments, and other events
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationData {
  title: string;
  body: string;
  data?: any;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high' | 'max';
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = PushNotificationService.createInstance();
    }
    return PushNotificationService.instance;
  }

  private static createInstance(): PushNotificationService {
    return new PushNotificationService();
  }

  /**
   * Initialize push notifications
   */
  async initialize(): Promise<string | null> {
    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permissions not granted');
        return null;
      }

      // Get push token
      const token = await Notifications.getExpoPushTokenAsync();
      console.log('Push token:', token.data);

      // Set up notification channels for Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      return token.data;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return null;
    }
  }

  /**
   * Set up Android notification channels
   */
  private async setupAndroidChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('ride-updates', {
      name: 'Ride Updates',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync('driver-updates', {
      name: 'Driver Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync('general', {
      name: 'General',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      showBadge: true,
    });
  }

  /**
   * Set up notification listeners
   */
  setupListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
  ): void {
    // Clean up existing listeners
    this.cleanup();

    // Set up new listeners
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      if (onNotificationResponse) {
        onNotificationResponse(response);
      }
    });
  }

  /**
   * Send local notification
   */
  async sendLocalNotification(notificationData: PushNotificationData): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data || {},
          sound: notificationData.sound || 'default',
          priority: notificationData.priority || 'default',
        },
        trigger: null, // Send immediately
      });

      return notificationId;
    } catch (error) {
      console.error('Error sending local notification:', error);
      throw error;
    }
  }

  /**
   * Schedule notification for later
   */
  async scheduleNotification(
    notificationData: PushNotificationData,
    secondsFromNow: number
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data || {},
          sound: notificationData.sound || 'default',
          priority: notificationData.priority || 'default',
        },
        trigger: {
          seconds: secondsFromNow,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  /**
   * Cancel specific notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }

    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
  }

  /**
   * Ride-specific notification methods for riders
   */
  async notifyDriverAssigned(driverName: string, vehicleInfo: string, eta: string): Promise<void> {
    await this.sendLocalNotification({
      title: 'Driver Assigned!',
      body: `${driverName} (${vehicleInfo}) will pick you up in ${eta}`,
      data: { type: 'driver_assigned', driverName, vehicleInfo, eta },
      sound: 'default',
      priority: 'high',
    });
  }

  async notifyDriverArrived(driverName: string, vehicleInfo: string): Promise<void> {
    await this.sendLocalNotification({
      title: 'Driver Arrived',
      body: `${driverName} with ${vehicleInfo} has arrived at your pickup location`,
      data: { type: 'driver_arrived', driverName, vehicleInfo },
      sound: 'default',
      priority: 'max',
    });
  }

  async notifyRideStarted(driverName: string): Promise<void> {
    await this.sendLocalNotification({
      title: 'Ride Started',
      body: `Your ride with ${driverName} has begun. Safe travels!`,
      data: { type: 'ride_started', driverName },
      sound: 'default',
      priority: 'default',
    });
  }

  async notifyRideCompleted(fare: number, driverName: string): Promise<void> {
    await this.sendLocalNotification({
      title: 'Ride Completed',
      body: `Your ride with ${driverName} is complete. Total fare: ₹${fare}`,
      data: { type: 'ride_completed', fare, driverName },
      sound: 'default',
      priority: 'default',
    });
  }

  async notifyBookingConfirmed(bookingId: string, rideTime: string): Promise<void> {
    await this.sendLocalNotification({
      title: 'Booking Confirmed!',
      body: `Your ride is confirmed for ${rideTime}. Booking ID: ${bookingId}`,
      data: { type: 'booking_confirmed', bookingId, rideTime },
      sound: 'default',
      priority: 'high',
    });
  }

  async notifyBookingReminder(rideTime: string, pickupLocation: string): Promise<void> {
    await this.sendLocalNotification({
      title: 'Ride Reminder',
      body: `Your ride is scheduled for ${rideTime} from ${pickupLocation}`,
      data: { type: 'booking_reminder', rideTime, pickupLocation },
      sound: 'default',
      priority: 'high',
    });
  }

  async notifyDriverCancelled(reason?: string): Promise<void> {
    const reasonText = reason ? ` Reason: ${reason}` : '';
    await this.sendLocalNotification({
      title: 'Ride Cancelled',
      body: `Your driver has cancelled the ride.${reasonText}`,
      data: { type: 'ride_cancelled', reason },
      sound: 'default',
      priority: 'high',
    });
  }

  async notifyPaymentProcessed(amount: number, method: string): Promise<void> {
    await this.sendLocalNotification({
      title: 'Payment Processed',
      body: `₹${amount} has been charged to your ${method}`,
      data: { type: 'payment_processed', amount, method },
      sound: 'default',
      priority: 'default',
    });
  }
}

// Export singleton instance
export const pushNotificationService = PushNotificationService.getInstance();
