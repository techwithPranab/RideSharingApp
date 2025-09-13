/**
 * Notification Manager for RideShare App
 * Manages in-app notifications and provides subscription-related notifications
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import Notification, { NotificationData } from '../components/Notification';

interface NotificationContextType {
  showNotification: (notification: Omit<NotificationData, 'id'>) => void;
  showSubscriptionSuccess: (planName: string) => void;
  showSubscriptionExpiryWarning: (daysLeft: number) => void;
  showSubscriptionExpired: () => void;
  showDiscountApplied: (discountPercent: number, savedAmount: number) => void;
  showRenewalReminder: (daysLeft: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const showNotification = useCallback((notification: Omit<NotificationData, 'id'>) => {
    const id = Date.now().toString();
    const newNotification: NotificationData = {
      id,
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Auto remove notifications after duration
  React.useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    notifications.forEach(notification => {
      const timer = setTimeout(() => {
        dismissNotification(notification.id);
      }, notification.duration || 4000);
      timers.push(timer);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [notifications, dismissNotification]);

  // Subscription-specific notification methods
  const showSubscriptionSuccess = useCallback((planName: string) => {
    showNotification({
      type: 'success',
      title: 'Subscription Activated!',
      message: `Welcome to ${planName}! Your subscription is now active.`,
      duration: 5000,
    });
  }, [showNotification]);

  const showSubscriptionExpiryWarning = useCallback((daysLeft: number) => {
    showNotification({
      type: 'warning',
      title: 'Subscription Expiring Soon',
      message: `Your subscription expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Renew now to continue saving.`,
      duration: 6000,
      actionText: 'Renew',
      onAction: () => {
        // Navigate to subscription management
        console.log('Navigate to subscription renewal');
      },
    });
  }, [showNotification]);

  const showSubscriptionExpired = useCallback(() => {
    showNotification({
      type: 'error',
      title: 'Subscription Expired',
      message: 'Your subscription has expired. Renew to continue getting discounts.',
      duration: 6000,
      actionText: 'Renew Now',
      onAction: () => {
        // Navigate to subscription plans
        console.log('Navigate to subscription plans');
      },
    });
  }, [showNotification]);

  const showDiscountApplied = useCallback((discountPercent: number, savedAmount: number) => {
    showNotification({
      type: 'success',
      title: 'Discount Applied!',
      message: `${discountPercent}% subscription discount saved you ₹${savedAmount}`,
      duration: 4000,
    });
  }, [showNotification]);

  const showRenewalReminder = useCallback((daysLeft: number) => {
    showNotification({
      type: 'info',
      title: 'Renewal Reminder',
      message: `Don't forget to renew your subscription in ${daysLeft} day${daysLeft > 1 ? 's' : ''} to keep your benefits.`,
      duration: 5000,
    });
  }, [showNotification]);

  const value = useMemo<NotificationContextType>(() => ({
    showNotification,
    showSubscriptionSuccess,
    showSubscriptionExpiryWarning,
    showSubscriptionExpired,
    showDiscountApplied,
    showRenewalReminder,
  }), [showNotification, showSubscriptionSuccess, showSubscriptionExpiryWarning, showSubscriptionExpired, showDiscountApplied, showRenewalReminder]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 }}>
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            notification={notification}
            onDismiss={dismissNotification}
          />
        ))}
      </View>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
