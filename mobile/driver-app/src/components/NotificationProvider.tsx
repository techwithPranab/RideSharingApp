/**
 * Notification Manager for Driver App
 * Manages in-app notifications for driver-specific events
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
  actionText?: string;
  onAction?: () => void;
}

interface NotificationContextType {
  showNotification: (notification: Omit<NotificationData, 'id'>) => void;
  showRideRequest: (riderName: string, pickupLocation: string) => void;
  showRideAccepted: (riderName: string) => void;
  showRideCompleted: (fare: number) => void;
  showPaymentReceived: (amount: number) => void;
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

  // Driver-specific notification methods
  const showRideRequest = useCallback((riderName: string, pickupLocation: string) => {
    showNotification({
      type: 'info',
      title: 'New Ride Request!',
      message: `${riderName} wants a ride from ${pickupLocation}`,
      duration: 6000,
      actionText: 'View Request',
      onAction: () => {
        // Navigation would be handled by the component using this
      },
    });
  }, [showNotification]);

  const showRideAccepted = useCallback((riderName: string) => {
    showNotification({
      type: 'success',
      title: 'Ride Accepted',
      message: `You accepted ${riderName}'s ride request`,
      duration: 4000,
    });
  }, [showNotification]);

  const showRideCompleted = useCallback((fare: number) => {
    showNotification({
      type: 'success',
      title: 'Ride Completed',
      message: `Ride completed! You earned ₹${fare}`,
      duration: 5000,
    });
  }, [showNotification]);

  const showPaymentReceived = useCallback((amount: number) => {
    showNotification({
      type: 'success',
      title: 'Payment Received',
      message: `₹${amount} has been added to your wallet`,
      duration: 4000,
    });
  }, [showNotification]);

  const value = useMemo<NotificationContextType>(() => ({
    showNotification,
    showRideRequest,
    showRideAccepted,
    showRideCompleted,
    showPaymentReceived,
  }), [showNotification, showRideRequest, showRideAccepted, showRideCompleted, showPaymentReceived]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* For now, we'll just use console.log for notifications since we don't have a UI component */}
      {notifications.map(notification => {
        console.log('Notification:', notification.title, notification.message);
        return null;
      })}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
