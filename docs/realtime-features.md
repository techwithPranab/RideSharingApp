# Real-time Features Documentation

This document provides comprehensive information about the real-time features implemented in the RideSharing application using Socket.IO.

## Overview

The application uses Socket.IO for real-time bidirectional communication between clients (mobile apps) and the server. This enables features like:
- Live location tracking
- Real-time ride status updates
- In-app messaging
- Driver availability updates
- Emergency/SOS alerts

## Architecture

### Socket.IO Server Setup

```javascript
import { Server } from 'socket.io';
import http from 'http';

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middleware for authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userRole = decoded.role;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});
```

### Connection Management

```javascript
// Store active connections
const activeConnections = new Map();

// User locations cache
const userLocations = new Map();

// Connection handling
io.on('connection', (socket) => {
  const userId = socket.userId;
  activeConnections.set(userId, socket);

  console.log(`User ${userId} connected`);

  // Handle disconnection
  socket.on('disconnect', () => {
    activeConnections.delete(userId);
    userLocations.delete(userId);
    console.log(`User ${userId} disconnected`);
  });
});
```

## Client-Side Integration

### React Native Socket.IO Client

```javascript
import io from 'socket.io-client';

// Socket connection setup
const socket = io('http://localhost:3000', {
  auth: {
    token: userToken
  },
  transports: ['websocket'],
  forceNew: true
});

// Connection event handlers
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

### Connection States

```javascript
socket.on('connect', () => {
  setConnectionStatus('connected');
});

socket.on('disconnect', (reason) => {
  setConnectionStatus('disconnected');
  if (reason === 'io server disconnect') {
    // Server disconnected, manual reconnection needed
    socket.connect();
  }
});

socket.on('reconnect', (attemptNumber) => {
  console.log(`Reconnected after ${attemptNumber} attempts`);
  setConnectionStatus('connected');
});

socket.on('reconnect_error', (error) => {
  console.error('Reconnection failed:', error);
  setConnectionStatus('error');
});
```

## Real-time Events

### 1. Location Updates

#### Send Location Update
```javascript
// Client sends location update
socket.emit('updateLocation', {
  lat: 37.7749,
  lng: -122.4194
});

// Server responds with confirmation
socket.on('locationUpdated', (data) => {
  console.log('Location updated successfully');
});

// Handle location update errors
socket.on('locationUpdateError', (error) => {
  console.error('Location update failed:', error);
});
```

#### Server-side Location Handling
```javascript
socket.on('updateLocation', async (data) => {
  try {
    const { lat, lng } = data;
    const userId = socket.userId;

    // Update user location in database
    await User.findByIdAndUpdate(userId, {
      currentLocation: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      lastActiveAt: new Date()
    });

    // Cache location for real-time tracking
    userLocations.set(userId, {
      lat,
      lng,
      timestamp: new Date()
    });

    // If user is a driver, notify nearby riders
    if (socket.userRole === 'driver') {
      await notifyNearbyRiders(userId, { lat, lng });
    }

    socket.emit('locationUpdated', { success: true });
  } catch (error) {
    socket.emit('locationUpdateError', {
      error: 'Failed to update location'
    });
  }
});
```

### 2. Ride Status Updates

#### Update Ride Status
```javascript
// Client sends ride status update
socket.emit('updateRideStatus', {
  rideId: '60d5ecb74b24c72b8c8b4567',
  status: 'started'
});

// Server responds with status update
socket.on('rideStatusChanged', (data) => {
  console.log('Ride status updated:', data);
  // Update UI with new status
});

// Handle status update errors
socket.on('rideStatusUpdateError', (error) => {
  console.error('Status update failed:', error);
});
```

#### Server-side Status Update Handling
```javascript
socket.on('updateRideStatus', async (data) => {
  try {
    const { rideId, status } = data;
    const userId = socket.userId;
    const userRole = socket.userRole;

    // Update ride status
    const ride = await RideService.updateRideStatus(rideId, status, userId, userRole);

    // Notify all ride participants
    const participants = [ride.driverId, ...ride.passengers.map(p => p.userId)];

    participants.forEach(participantId => {
      const participantSocket = activeConnections.get(participantId.toString());
      if (participantSocket) {
        participantSocket.emit('rideStatusChanged', {
          rideId: ride._id,
          status: ride.status,
          timestamp: new Date(),
          updatedBy: userId
        });
      }
    });

    socket.emit('rideStatusUpdated', { success: true, rideId, status });
  } catch (error) {
    socket.emit('rideStatusUpdateError', {
      error: error.message || 'Failed to update ride status'
    });
  }
});
```

### 3. In-app Messaging

#### Send Message
```javascript
// Client sends message
socket.emit('sendMessage', {
  rideId: '60d5ecb74b24c72b8c8b4567',
  message: 'On my way to pickup location!',
  messageType: 'text'
});

// Server confirms message sent
socket.on('messageSent', (data) => {
  console.log('Message sent successfully');
});

// Handle message errors
socket.on('messageError', (error) => {
  console.error('Message send failed:', error);
});
```

#### Receive Messages
```javascript
// Listen for incoming messages
socket.on('newMessage', (data) => {
  console.log('New message received:', data);
  // Add message to chat UI
  addMessageToChat({
    id: data.id,
    senderId: data.senderId,
    senderRole: data.senderRole,
    message: data.message,
    messageType: data.messageType,
    timestamp: data.timestamp
  });
});
```

#### Server-side Message Handling
```javascript
socket.on('sendMessage', async (data) => {
  try {
    const { rideId, message, messageType = 'text' } = data;
    const userId = socket.userId;
    const userRole = socket.userRole;

    // Verify user is participant in ride
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return socket.emit('messageError', { error: 'Ride not found' });
    }

    const isParticipant = ride.driverId?.toString() === userId ||
                         ride.passengers.some(p => p.userId.toString() === userId);

    if (!isParticipant) {
      return socket.emit('messageError', { error: 'Unauthorized' });
    }

    // Create message data
    const messageData = {
      id: Date.now().toString(),
      rideId,
      senderId: userId,
      senderRole: userRole,
      message,
      messageType,
      timestamp: new Date()
    };

    // Send to all ride participants
    const participants = [ride.driverId?.toString(), ...ride.passengers.map(p => p.userId.toString())]
                         .filter(Boolean);

    participants.forEach(participantId => {
      const participantSocket = activeConnections.get(participantId);
      if (participantSocket) {
        participantSocket.emit('newMessage', messageData);
      }
    });

    socket.emit('messageSent', { success: true, messageId: messageData.id });
  } catch (error) {
    socket.emit('messageError', { error: 'Failed to send message' });
  }
});
```

### 4. Driver Availability

#### Update Availability
```javascript
// Driver updates availability
socket.emit('updateAvailability', {
  isAvailable: true
});

// Server confirms availability update
socket.on('availabilityUpdated', (data) => {
  console.log('Availability updated:', data.isAvailable);
});

// Handle availability update errors
socket.on('availabilityUpdateError', (error) => {
  console.error('Availability update failed:', error);
});
```

#### Server-side Availability Handling
```javascript
socket.on('updateAvailability', async (data) => {
  try {
    const { isAvailable } = data;
    const userId = socket.userId;

    if (socket.userRole !== 'driver') {
      return socket.emit('availabilityUpdateError', {
        error: 'Only drivers can update availability'
      });
    }

    // Update driver availability
    await User.findByIdAndUpdate(userId, {
      isAvailable,
      lastActiveAt: new Date()
    });

    socket.emit('availabilityUpdated', {
      success: true,
      isAvailable
    });
  } catch (error) {
    socket.emit('availabilityUpdateError', {
      error: 'Failed to update availability'
    });
  }
});
```

### 5. Emergency/SOS Alerts

#### Send SOS Alert
```javascript
// Send emergency alert
socket.emit('sosAlert', {
  rideId: '60d5ecb74b24c72b8c8b4567',
  location: {
    lat: 37.7749,
    lng: -122.4194
  },
  message: 'Emergency situation - please help!'
});

// Server confirms SOS alert
socket.on('sosAlerted', (data) => {
  console.log('SOS alert sent successfully');
});

// Handle SOS errors
socket.on('sosError', (error) => {
  console.error('SOS alert failed:', error);
});
```

#### Receive SOS Alerts
```javascript
// Listen for SOS alerts
socket.on('sosTriggered', (data) => {
  console.log('SOS alert received:', data);
  // Show emergency notification
  showEmergencyAlert(data);
});
```

#### Server-side SOS Handling
```javascript
socket.on('sosAlert', async (data) => {
  try {
    const { rideId, location, message } = data;
    const userId = socket.userId;
    const userRole = socket.userRole;

    // Verify user is participant in ride
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return socket.emit('sosError', { error: 'Ride not found' });
    }

    const isParticipant = ride.driverId?.toString() === userId ||
                         ride.passengers.some(p => p.userId.toString() === userId);

    if (!isParticipant) {
      return socket.emit('sosError', { error: 'Unauthorized' });
    }

    // Update ride with SOS alert
    ride.sosAlerted = true;
    await ride.save();

    // Create SOS alert data
    const sosData = {
      rideId,
      userId,
      userRole,
      location,
      message: message || 'Emergency alert triggered',
      timestamp: new Date()
    };

    // Log emergency alert
    logger.error(`SOS ALERT: ${JSON.stringify(sosData)}`);

    // Notify all ride participants
    const participants = [ride.driverId?.toString(), ...ride.passengers.map(p => p.userId.toString())]
                         .filter(Boolean);

    participants.forEach(participantId => {
      const participantSocket = activeConnections.get(participantId);
      if (participantSocket) {
        participantSocket.emit('sosTriggered', sosData);
      }
    });

    // TODO: Integrate with emergency services
    // await notifyEmergencyServices(sosData);

    socket.emit('sosAlerted', { success: true });
  } catch (error) {
    socket.emit('sosError', { error: 'Failed to send SOS alert' });
  }
});
```

### 6. Ride Tracking

#### Start Ride Tracking
```javascript
// Start tracking a specific ride
socket.emit('startRideTracking', {
  rideId: '60d5ecb74b24c72b8c8b4567'
});

// Server confirms tracking started
socket.on('trackingStarted', (data) => {
  console.log('Ride tracking started');
});

// Handle tracking errors
socket.on('trackingError', (error) => {
  console.error('Tracking start failed:', error);
});
```

#### Receive Driver Location Updates
```javascript
// Listen for driver location updates during ride
socket.on('driverLocationUpdate', (data) => {
  console.log('Driver location:', data);
  // Update map with driver location
  updateDriverLocationOnMap(data.location);
});
```

#### Server-side Tracking Handling
```javascript
socket.on('startRideTracking', async (data) => {
  try {
    const { rideId } = data;
    const userId = socket.userId;

    // Verify user is participant in ride
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return socket.emit('trackingError', { error: 'Ride not found' });
    }

    const isParticipant = ride.driverId?.toString() === userId ||
                         ride.passengers.some(p => p.userId.toString() === userId);

    if (!isParticipant) {
      return socket.emit('trackingError', { error: 'Unauthorized' });
    }

    // Join ride-specific room for targeted updates
    socket.join(`ride-${rideId}`);

    socket.emit('trackingStarted', { success: true, rideId });
  } catch (error) {
    socket.emit('trackingError', { error: 'Failed to start tracking' });
  }
});
```

## Advanced Features

### Room-based Communication

```javascript
// Join ride-specific room
socket.emit('startRideTracking', { rideId: '60d5ecb74b24c72b8c8b4567' });

// Send message to ride room
socket.to(`ride-${rideId}`).emit('rideMessage', messageData);

// Leave room when ride ends
socket.leave(`ride-${rideId}`);
```

### Connection Persistence

```javascript
// Handle connection recovery
socket.on('connect', () => {
  // Rejoin active rooms
  if (activeRideId) {
    socket.emit('startRideTracking', { rideId: activeRideId });
  }

  // Resend pending location updates
  if (pendingLocation) {
    socket.emit('updateLocation', pendingLocation);
  }
});
```

### Heartbeat Mechanism

```javascript
// Client-side heartbeat
setInterval(() => {
  if (socket.connected) {
    socket.emit('heartbeat', { timestamp: Date.now() });
  }
}, 30000); // Every 30 seconds

// Server-side heartbeat response
socket.on('heartbeat', (data) => {
  socket.emit('heartbeat_ack', {
    serverTime: Date.now(),
    clientTime: data.timestamp
  });
});
```

## Error Handling

### Connection Error Handling

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);

  // Implement exponential backoff
  const retryDelay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
  setTimeout(() => {
    socket.connect();
    reconnectAttempts++;
  }, retryDelay);
});

socket.on('reconnect_failed', () => {
  console.error('Failed to reconnect after maximum attempts');
  // Show offline mode or retry button
});
```

### Event Error Handling

```javascript
// Wrap all socket event handlers with error handling
const safeEmit = (event, data) => {
  try {
    socket.emit(event, data);
  } catch (error) {
    console.error(`Error emitting ${event}:`, error);
    // Implement retry logic or fallback
  }
};
```

## Performance Optimization

### Connection Pooling

```javascript
// Limit concurrent connections per user
const userConnections = new Map();

io.use((socket, next) => {
  const userId = socket.userId;
  const userConnectionCount = userConnections.get(userId) || 0;

  if (userConnectionCount >= 3) { // Max 3 connections per user
    return next(new Error('Maximum connections exceeded'));
  }

  userConnections.set(userId, userConnectionCount + 1);
  socket.on('disconnect', () => {
    userConnections.set(userId, userConnectionCount);
  });

  next();
});
```

### Message Batching

```javascript
// Batch location updates
let locationUpdateQueue = [];
let locationUpdateTimer = null;

const batchLocationUpdate = (location) => {
  locationUpdateQueue.push(location);

  if (locationUpdateTimer) clearTimeout(locationUpdateTimer);

  locationUpdateTimer = setTimeout(() => {
    if (locationUpdateQueue.length > 0) {
      const latestLocation = locationUpdateQueue[locationUpdateQueue.length - 1];
      socket.emit('updateLocation', latestLocation);
      locationUpdateQueue = [];
    }
  }, 1000); // Send latest location every 1 second
};
```

### Memory Management

```javascript
// Clean up stale connections
setInterval(() => {
  const now = Date.now();
  const staleThreshold = 5 * 60 * 1000; // 5 minutes

  for (const [userId, socket] of activeConnections.entries()) {
    if (now - socket.lastActivity > staleThreshold) {
      socket.disconnect(true);
      activeConnections.delete(userId);
    }
  }
}, 60 * 1000); // Check every minute
```

## Security Considerations

### Authentication

```javascript
// JWT token validation
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.status !== 'active') {
      return next(new Error('Invalid user'));
    }

    socket.userId = user._id.toString();
    socket.userRole = user.role;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});
```

### Rate Limiting

```javascript
// Implement rate limiting for socket events
const eventLimits = {
  updateLocation: { max: 10, window: 60000 }, // 10 per minute
  sendMessage: { max: 30, window: 60000 },    // 30 per minute
  updateRideStatus: { max: 20, window: 60000 } // 20 per minute
};

const userEventCounts = new Map();

io.use((socket, next) => {
  socket.use((packet, next) => {
    const event = packet[0];
    const userId = socket.userId;

    if (eventLimits[event]) {
      const limit = eventLimits[event];
      const key = `${userId}:${event}`;
      const count = userEventCounts.get(key) || { count: 0, resetTime: Date.now() + limit.window };

      if (Date.now() > count.resetTime) {
        count.count = 0;
        count.resetTime = Date.now() + limit.window;
      }

      if (count.count >= limit.max) {
        return next(new Error('Rate limit exceeded'));
      }

      count.count++;
      userEventCounts.set(key, count);
    }

    next();
  });

  next();
});
```

### Input Validation

```javascript
// Validate socket event data
socket.use((packet, next) => {
  const [event, data] = packet;

  try {
    switch (event) {
      case 'updateLocation':
        if (!data.lat || !data.lng ||
            data.lat < -90 || data.lat > 90 ||
            data.lng < -180 || data.lng > 180) {
          return next(new Error('Invalid location data'));
        }
        break;

      case 'sendMessage':
        if (!data.message || data.message.length > 500) {
          return next(new Error('Invalid message data'));
        }
        break;
    }
    next();
  } catch (error) {
    next(new Error('Data validation failed'));
  }
});
```

## Monitoring and Debugging

### Connection Monitoring

```javascript
// Track connection statistics
const connectionStats = {
  totalConnections: 0,
  activeConnections: 0,
  messagesSent: 0,
  messagesReceived: 0
};

io.on('connection', (socket) => {
  connectionStats.totalConnections++;
  connectionStats.activeConnections++;

  socket.on('disconnect', () => {
    connectionStats.activeConnections--;
  });

  // Track message statistics
  socket.onAny((event, data) => {
    connectionStats.messagesReceived++;
  });

  socket.onAnyOutgoing((event, data) => {
    connectionStats.messagesSent++;
  });
});
```

### Debug Logging

```javascript
// Enable debug logging
if (process.env.NODE_ENV === 'development') {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.userId})`);

    socket.onAny((event, ...args) => {
      console.log(`[${socket.userId}] ${event}:`, args);
    });

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });
}
```

## Testing

### Unit Testing Socket Events

```javascript
const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');

describe('Socket Events', () => {
  let io, server, clientSocket;

  beforeAll((done) => {
    server = createServer();
    io = new Server(server);
    server.listen(() => {
      const port = server.address().port;
      clientSocket = Client(`http://localhost:${port}`);
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
  });

  test('should handle location updates', (done) => {
    clientSocket.emit('updateLocation', { lat: 37.7749, lng: -122.4194 });

    clientSocket.on('locationUpdated', (data) => {
      expect(data.success).toBe(true);
      done();
    });
  });
});
```

### Load Testing

```javascript
const { io: Client } = require('socket.io-client');
const { performance } = require('perf_hooks');

async function loadTest() {
  const clients = [];
  const startTime = performance.now();

  // Create multiple client connections
  for (let i = 0; i < 1000; i++) {
    const client = Client('http://localhost:3000', {
      auth: { token: 'test-token' }
    });
    clients.push(client);
  }

  // Wait for all connections
  await Promise.all(clients.map(client =>
    new Promise(resolve => client.on('connect', resolve))
  ));

  const endTime = performance.now();
  console.log(`Created ${clients.length} connections in ${endTime - startTime}ms`);

  // Clean up
  clients.forEach(client => client.close());
}
```

## Deployment Considerations

### Scaling

```javascript
// Redis adapter for multi-server scaling
const redisAdapter = require('socket.io-redis');
io.adapter(redisAdapter({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
}));
```

### Production Configuration

```javascript
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6, // 1MB
  allowEIO3: false, // Disable Engine.IO v3
  cookie: {
    name: 'io',
    httpOnly: true,
    sameSite: 'strict'
  }
});
```

### Health Monitoring

```javascript
// Health check endpoint
app.get('/socket-health', (req, res) => {
  const stats = {
    connectedSockets: io.sockets.sockets.size,
    rooms: Object.keys(io.sockets.adapter.rooms).length,
    uptime: process.uptime()
  };
  res.json(stats);
});
```

This comprehensive real-time implementation provides a robust foundation for live features in the ride-sharing application, ensuring reliable communication between riders, drivers, and the server.
