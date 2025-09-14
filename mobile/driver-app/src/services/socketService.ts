/**
 * Socket.IO service for Driver App
 * Handles real-time communication with the backend
 */

import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOCKET_URL } from '../constants/config';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  /**
   * Initialize socket connection
   */
  async connect(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('driver_token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      this.socket = io(SOCKET_URL, {
        auth: {
          token,
        },
        transports: ['websocket'],
        timeout: 10000,
      });

      this.setupEventListeners();
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('Failed to connect to socket:', error);
      throw error;
    }
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to socket server');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from socket server:', reason);
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.handleReconnect();
    });

    // Ride events
    this.socket.on('newRideRequest', (data) => {
      console.log('New ride request:', data);
      // Emit custom event for the app to handle
      this.emit('rideRequest', data);
    });

    this.socket.on('rideStatusChanged', (data) => {
      console.log('Ride status changed:', data);
      this.emit('rideStatusUpdate', data);
    });

    this.socket.on('rideCancelled', (data) => {
      console.log('Ride cancelled:', data);
      this.emit('rideCancelled', data);
    });

    // Location events
    this.socket.on('locationUpdated', (data) => {
      console.log('Location updated:', data);
    });

    this.socket.on('locationUpdateError', (error) => {
      console.error('Location update error:', error);
    });

    // Message events
    this.socket.on('newMessage', (data) => {
      console.log('New message:', data);
      this.emit('newMessage', data);
    });

    // Availability events
    this.socket.on('availabilityUpdated', (data) => {
      console.log('Availability updated:', data);
    });

    this.socket.on('availabilityUpdateError', (error) => {
      console.error('Availability update error:', error);
    });

    // Emergency events
    this.socket.on('sosTriggered', (data) => {
      console.log('SOS triggered:', data);
      this.emit('sosAlert', data);
    });

    // Error events
    this.socket.on('rideStatusUpdateError', (error) => {
      console.error('Ride status update error:', error);
    });

    this.socket.on('messageError', (error) => {
      console.error('Message error:', error);
    });

    this.socket.on('sosError', (error) => {
      console.error('SOS error:', error);
    });
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
    }
  }

  /**
   * Update driver location
   */
  updateLocation(latitude: number, longitude: number): void {
    if (this.socket?.connected) {
      this.socket.emit('updateLocation', { lat: latitude, lng: longitude });
    } else {
      console.warn('Socket not connected, cannot update location');
    }
  }

  /**
   * Update ride status
   */
  updateRideStatus(rideId: string, status: string): void {
    if (this.socket?.connected) {
      this.socket.emit('updateRideStatus', { rideId, status });
    } else {
      console.warn('Socket not connected, cannot update ride status');
    }
  }

  /**
   * Update driver availability
   */
  updateAvailability(isAvailable: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('updateAvailability', { isAvailable });
    } else {
      console.warn('Socket not connected, cannot update availability');
    }
  }

  /**
   * Send message
   */
  sendMessage(rideId: string, message: string, messageType = 'text'): void {
    if (this.socket?.connected) {
      this.socket.emit('sendMessage', { rideId, message, messageType });
    } else {
      console.warn('Socket not connected, cannot send message');
    }
  }

  /**
   * Send SOS alert
   */
  sendSOSAlert(rideId: string, latitude: number, longitude: number, message?: string): void {
    if (this.socket?.connected) {
      this.socket.emit('sosAlert', {
        rideId,
        location: { lat: latitude, lng: longitude },
        message,
      });
    } else {
      console.warn('Socket not connected, cannot send SOS alert');
    }
  }

  /**
   * Start ride tracking
   */
  startRideTracking(rideId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('startRideTracking', { rideId });
    } else {
      console.warn('Socket not connected, cannot start ride tracking');
    }
  }

  /**
   * Listen for custom events
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  /**
   * Emit custom event
   */
  private emit(event: string, ...args: any[]): void {
    if (this.socket) {
      this.socket.emit(event, ...args);
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
