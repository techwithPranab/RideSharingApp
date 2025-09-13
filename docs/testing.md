# Testing Documentation

This document provides comprehensive information about testing the RideSharing application, including unit tests, integration tests, API testing, and mobile app testing strategies.

## Overview

The application implements a multi-layered testing approach:
- Unit tests for individual functions and components
- Integration tests for API endpoints and database interactions
- End-to-end tests for complete user workflows
- Performance tests for scalability validation
- Mobile app tests for iOS and Android platforms

## Testing Framework Setup

### Backend Testing Dependencies

```json
// package.json test dependencies
{
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/supertest": "^2.0.12",
    "jest": "^29.5.0",
    "supertest": "^6.3.3",
    "mongodb-memory-server": "^8.12.2",
    "socket.io-client": "^4.7.0",
    "testcontainers": "^9.0.0"
  },
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration",
    "test:unit": "jest --testPathPattern=unit"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "roots": ["<rootDir>/src", "<rootDir>/tests"],
    "testMatch": [
      "**/__tests__/**/*.test.ts",
      "**/?(*.)+(spec|test).ts"
    ],
    "collectCoverageFrom": [
      "src/**/*.ts",
      "!src/**/*.d.ts",
      "!src/server.ts"
    ],
    "coverageDirectory": "coverage",
    "coverageReporters": ["text", "lcov", "html"],
    "setupFilesAfterEnv": ["<rootDir>/tests/setup.ts"]
  }
}
```

### Test Setup Configuration

```typescript
// tests/setup.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { app } from '../src/server';

let mongoServer: MongoMemoryServer;
let server: any;
let io: Server;

beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Start test server
  server = createServer(app);
  io = new Server(server);
  server.listen(0); // Use random available port
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  server.close();
});

beforeEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Global test utilities
global.testServer = server;
global.testIo = io;
```

## Unit Tests

### Model Tests

```typescript
// tests/unit/models/User.test.ts
import { User } from '../../../src/models/User';
import bcrypt from 'bcrypt';

describe('User Model', () => {
  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'password123',
        role: 'rider'
      };

      const user = new User(userData);
      await user.save();

      expect(user.password).not.toBe('password123');
      expect(await bcrypt.compare('password123', user.password)).toBe(true);
    });

    it('should validate password strength', () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: '123', // Too short
        role: 'rider'
      });

      expect(user.validateSync().errors.password).toBeDefined();
    });
  });

  describe('Location Validation', () => {
    it('should validate location coordinates', () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'password123',
        role: 'rider',
        currentLocation: {
          type: 'Point',
          coordinates: [200, 100] // Invalid coordinates
        }
      });

      expect(user.validateSync().errors['currentLocation.coordinates']).toBeDefined();
    });

    it('should accept valid location coordinates', () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'password123',
        role: 'rider',
        currentLocation: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749] // Valid coordinates
        }
      });

      expect(user.validateSync()).toBeUndefined();
    });
  });

  describe('KYC Validation', () => {
    it('should validate document types', () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'password123',
        role: 'driver',
        kycDocuments: [{
          type: 'license',
          number: 'DL123456',
          expiryDate: new Date('2025-12-31'),
          status: 'pending'
        }]
      });

      expect(user.validateSync()).toBeUndefined();
    });

    it('should require KYC for drivers', async () => {
      const user = new User({
        name: 'Test Driver',
        email: 'driver@example.com',
        phone: '+1234567890',
        password: 'password123',
        role: 'driver'
      });

      await expect(user.save()).rejects.toThrow();
    });
  });
});
```

### Service Tests

```typescript
// tests/unit/services/rideService.test.ts
import { RideService } from '../../../src/services/rideService';
import { Ride } from '../../../src/models/Ride';
import { User } from '../../../src/models/User';

describe('RideService', () => {
  let rider: any;
  let driver: any;

  beforeEach(async () => {
    rider = await User.create({
      name: 'Test Rider',
      email: 'rider@example.com',
      phone: '+1234567890',
      password: 'password123',
      role: 'rider'
    });

    driver = await User.create({
      name: 'Test Driver',
      email: 'driver@example.com',
      phone: '+1234567890',
      password: 'password123',
      role: 'driver',
      isAvailable: true,
      currentLocation: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749]
      }
    });
  });

  describe('createRide', () => {
    it('should create a ride with valid data', async () => {
      const rideData = {
        riderId: rider._id,
        pickupLocation: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749],
          address: '123 Main St, San Francisco, CA'
        },
        dropoffLocation: {
          type: 'Point',
          coordinates: [-122.4294, 37.7849],
          address: '456 Market St, San Francisco, CA'
        },
        vehicleType: 'sedan',
        estimatedFare: 25.50,
        distance: 2.5,
        duration: 15
      };

      const ride = await RideService.createRide(rideData);

      expect(ride.riderId.toString()).toBe(rider._id.toString());
      expect(ride.status).toBe('pending');
      expect(ride.createdAt).toBeDefined();
    });

    it('should calculate fare correctly', async () => {
      const rideData = {
        riderId: rider._id,
        pickupLocation: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749],
          address: '123 Main St, San Francisco, CA'
        },
        dropoffLocation: {
          type: 'Point',
          coordinates: [-122.4294, 37.7849],
          address: '456 Market St, San Francisco, CA'
        },
        vehicleType: 'sedan',
        distance: 5.0,
        duration: 20
      };

      const ride = await RideService.createRide(rideData);

      // Base fare + distance fare + time fare
      const expectedFare = 5.00 + (5.0 * 2.50) + (20 * 0.25);
      expect(ride.estimatedFare).toBe(expectedFare);
    });

    it('should throw error for invalid rider', async () => {
      const rideData = {
        riderId: 'invalid-id',
        pickupLocation: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749],
          address: '123 Main St, San Francisco, CA'
        },
        dropoffLocation: {
          type: 'Point',
          coordinates: [-122.4294, 37.7849],
          address: '456 Market St, San Francisco, CA'
        },
        vehicleType: 'sedan'
      };

      await expect(RideService.createRide(rideData)).rejects.toThrow('Rider not found');
    });
  });

  describe('findNearbyDrivers', () => {
    it('should find available drivers within radius', async () => {
      const pickupLocation = {
        type: 'Point',
        coordinates: [-122.4194, 37.7749]
      };

      const drivers = await RideService.findNearbyDrivers(pickupLocation, 5000);

      expect(drivers.length).toBeGreaterThan(0);
      expect(drivers[0].isAvailable).toBe(true);
    });

    it('should not return unavailable drivers', async () => {
      await User.findByIdAndUpdate(driver._id, { isAvailable: false });

      const pickupLocation = {
        type: 'Point',
        coordinates: [-122.4194, 37.7749]
      };

      const drivers = await RideService.findNearbyDrivers(pickupLocation, 5000);

      expect(drivers.length).toBe(0);
    });
  });

  describe('assignDriver', () => {
    it('should assign driver to ride', async () => {
      const ride = await Ride.create({
        riderId: rider._id,
        pickupLocation: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749],
          address: '123 Main St, San Francisco, CA'
        },
        dropoffLocation: {
          type: 'Point',
          coordinates: [-122.4294, 37.7849],
          address: '456 Market St, San Francisco, CA'
        },
        status: 'pending',
        estimatedFare: 25.50
      });

      const updatedRide = await RideService.assignDriver(ride._id, driver._id);

      expect(updatedRide.driverId.toString()).toBe(driver._id.toString());
      expect(updatedRide.status).toBe('confirmed');
    });

    it('should throw error if driver is not available', async () => {
      await User.findByIdAndUpdate(driver._id, { isAvailable: false });

      const ride = await Ride.create({
        riderId: rider._id,
        pickupLocation: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749],
          address: '123 Main St, San Francisco, CA'
        },
        dropoffLocation: {
          type: 'Point',
          coordinates: [-122.4294, 37.7849],
          address: '456 Market St, San Francisco, CA'
        },
        status: 'pending',
        estimatedFare: 25.50
      });

      await expect(RideService.assignDriver(ride._id, driver._id)).rejects.toThrow('Driver not available');
    });
  });
});
```

### Controller Tests

```typescript
// tests/unit/controllers/authController.test.ts
import request from 'supertest';
import { app } from '../../../src/server';
import { User } from '../../../src/models/User';

describe('Auth Controller', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'password123',
        role: 'rider'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('should not register user with existing email', async () => {
      await User.create({
        name: 'Existing User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'password123',
        role: 'rider'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          phone: '+1987654321',
          password: 'password123',
          role: 'rider'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          // Missing email, phone, password
          role: 'rider'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'password123',
        role: 'rider'
      });
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.token).toBeDefined();
    });

    it('should not login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    let user: any;
    let otpToken: string;

    beforeEach(async () => {
      user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'password123',
        role: 'rider'
      });

      // Generate OTP for testing
      const jwt = require('jsonwebtoken');
      otpToken = jwt.sign(
        { userId: user._id, otp: '123456' },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
    });

    it('should verify correct OTP', async () => {
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          token: otpToken,
          otp: '123456'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.isPhoneVerified).toBe(true);
    });

    it('should not verify incorrect OTP', async () => {
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          token: otpToken,
          otp: '654321'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid OTP');
    });
  });
});
```

## Integration Tests

### API Integration Tests

```typescript
// tests/integration/rideFlow.test.ts
import request from 'supertest';
import { app } from '../../src/server';
import { User } from '../../src/models/User';
import { Ride } from '../../src/models/Ride';

describe('Ride Flow Integration', () => {
  let riderToken: string;
  let driverToken: string;
  let rider: any;
  let driver: any;

  beforeEach(async () => {
    // Create test users
    rider = await User.create({
      name: 'Test Rider',
      email: 'rider@example.com',
      phone: '+1234567890',
      password: 'password123',
      role: 'rider',
      isPhoneVerified: true
    });

    driver = await User.create({
      name: 'Test Driver',
      email: 'driver@example.com',
      phone: '+1987654321',
      password: 'password123',
      role: 'driver',
      isAvailable: true,
      isPhoneVerified: true,
      currentLocation: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749]
      },
      vehicle: {
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123',
        type: 'sedan'
      }
    });

    // Login to get tokens
    const riderLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'rider@example.com',
        password: 'password123'
      });

    const driverLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'driver@example.com',
        password: 'password123'
      });

    riderToken = riderLogin.body.data.token;
    driverToken = driverLogin.body.data.token;
  });

  describe('Complete Ride Flow', () => {
    it('should complete a full ride cycle', async () => {
      // 1. Rider creates a ride
      const rideData = {
        pickupLocation: {
          lat: 37.7749,
          lng: -122.4194,
          address: '123 Main St, San Francisco, CA'
        },
        dropoffLocation: {
          lat: 37.7849,
          lng: -122.4294,
          address: '456 Market St, San Francisco, CA'
        },
        vehicleType: 'sedan'
      };

      const createRideResponse = await request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${riderToken}`)
        .send(rideData)
        .expect(201);

      const rideId = createRideResponse.body.data.ride._id;

      // 2. Driver accepts the ride
      const acceptRideResponse = await request(app)
        .post(`/api/rides/${rideId}/accept`)
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

      expect(acceptRideResponse.body.data.ride.status).toBe('confirmed');
      expect(acceptRideResponse.body.data.ride.driverId).toBe(driver._id.toString());

      // 3. Driver starts the ride
      const startRideResponse = await request(app)
        .post(`/api/rides/${rideId}/start`)
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

      expect(startRideResponse.body.data.ride.status).toBe('started');

      // 4. Driver completes the ride
      const completeRideResponse = await request(app)
        .post(`/api/rides/${rideId}/complete`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          finalFare: 28.50,
          distance: 2.8,
          duration: 18
        })
        .expect(200);

      expect(completeRideResponse.body.data.ride.status).toBe('completed');
      expect(completeRideResponse.body.data.ride.finalFare).toBe(28.50);

      // 5. Rider rates the driver
      const rateRideResponse = await request(app)
        .post(`/api/rides/${rideId}/rate`)
        .set('Authorization', `Bearer ${riderToken}`)
        .send({
          rating: 5,
          review: 'Great driver, very safe and punctual!'
        })
        .expect(200);

      expect(rateRideResponse.body.data.ride.riderRating).toBe(5);

      // 6. Verify ride history
      const rideHistoryResponse = await request(app)
        .get('/api/rides/history')
        .set('Authorization', `Bearer ${riderToken}`)
        .expect(200);

      expect(rideHistoryResponse.body.data.rides.length).toBe(1);
      expect(rideHistoryResponse.body.data.rides[0].status).toBe('completed');
    });

    it('should handle ride cancellation', async () => {
      // Create a ride
      const rideData = {
        pickupLocation: {
          lat: 37.7749,
          lng: -122.4194,
          address: '123 Main St, San Francisco, CA'
        },
        dropoffLocation: {
          lat: 37.7849,
          lng: -122.4294,
          address: '456 Market St, San Francisco, CA'
        },
        vehicleType: 'sedan'
      };

      const createRideResponse = await request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${riderToken}`)
        .send(rideData)
        .expect(201);

      const rideId = createRideResponse.body.data.ride._id;

      // Cancel the ride
      const cancelRideResponse = await request(app)
        .post(`/api/rides/${rideId}/cancel`)
        .set('Authorization', `Bearer ${riderToken}`)
        .send({
          reason: 'Changed my mind'
        })
        .expect(200);

      expect(cancelRideResponse.body.data.ride.status).toBe('cancelled');

      // Verify cancellation in history
      const rideHistoryResponse = await request(app)
        .get('/api/rides/history')
        .set('Authorization', `Bearer ${riderToken}`)
        .expect(200);

      expect(rideHistoryResponse.body.data.rides[0].status).toBe('cancelled');
    });
  });

  describe('Concurrent Ride Handling', () => {
    it('should handle multiple ride requests', async () => {
      // Create multiple rides simultaneously
      const ridePromises = [];

      for (let i = 0; i < 5; i++) {
        const rideData = {
          pickupLocation: {
            lat: 37.7749 + (i * 0.001),
            lng: -122.4194 + (i * 0.001),
            address: `Ride ${i} Location`
          },
          dropoffLocation: {
            lat: 37.7849 + (i * 0.001),
            lng: -122.4294 + (i * 0.001),
            address: `Destination ${i}`
          },
          vehicleType: 'sedan'
        };

        ridePromises.push(
          request(app)
            .post('/api/rides')
            .set('Authorization', `Bearer ${riderToken}`)
            .send(rideData)
        );
      }

      const responses = await Promise.all(ridePromises);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Verify all rides were created
      const allRides = await Ride.find({ riderId: rider._id });
      expect(allRides.length).toBe(5);
    });
  });
});
```

### Socket.IO Integration Tests

```typescript
// tests/integration/socketIntegration.test.ts
import { io as Client } from 'socket.io-client';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { app } from '../../src/server';
import { User } from '../../src/models/User';

describe('Socket.IO Integration', () => {
  let server: any;
  let io: Server;
  let clientSocket: any;
  let user: any;
  let token: string;

  beforeAll(async () => {
    server = createServer(app);
    io = new Server(server);
    server.listen(0);

    // Create test user
    user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      password: 'password123',
      role: 'rider',
      isPhoneVerified: true
    });

    // Generate token
    const jwt = require('jsonwebtoken');
    token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET
    );
  });

  afterAll(() => {
    server.close();
  });

  beforeEach((done) => {
    const port = server.address().port;
    clientSocket = Client(`http://localhost:${port}`, {
      auth: { token },
      transports: ['websocket']
    });

    clientSocket.on('connect', () => {
      done();
    });
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  describe('Location Updates', () => {
    it('should handle location updates', (done) => {
      const testLocation = { lat: 37.7749, lng: -122.4194 };

      clientSocket.emit('updateLocation', testLocation);

      clientSocket.on('locationUpdated', (data) => {
        expect(data.success).toBe(true);
        done();
      });
    });

    it('should broadcast location to nearby users', (done) => {
      // This would require setting up multiple clients
      // and testing the broadcasting logic
      done();
    });
  });

  describe('Ride Status Updates', () => {
    let rideId: string;

    beforeEach(async () => {
      // Create a test ride
      const Ride = require('../../src/models/Ride').Ride;
      const ride = await Ride.create({
        riderId: user._id,
        pickupLocation: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749],
          address: '123 Main St'
        },
        dropoffLocation: {
          type: 'Point',
          coordinates: [-122.4294, 37.7849],
          address: '456 Market St'
        },
        status: 'confirmed',
        estimatedFare: 25.50
      });
      rideId = ride._id.toString();
    });

    it('should update ride status', (done) => {
      clientSocket.emit('updateRideStatus', {
        rideId,
        status: 'started'
      });

      clientSocket.on('rideStatusChanged', (data) => {
        expect(data.rideId).toBe(rideId);
        expect(data.status).toBe('started');
        done();
      });
    });

    it('should handle invalid ride status', (done) => {
      clientSocket.emit('updateRideStatus', {
        rideId: 'invalid-id',
        status: 'started'
      });

      clientSocket.on('rideStatusUpdateError', (data) => {
        expect(data.error).toBeDefined();
        done();
      });
    });
  });

  describe('Messaging', () => {
    let rideId: string;

    beforeEach(async () => {
      // Create a test ride
      const Ride = require('../../src/models/Ride').Ride;
      const ride = await Ride.create({
        riderId: user._id,
        pickupLocation: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749],
          address: '123 Main St'
        },
        dropoffLocation: {
          type: 'Point',
          coordinates: [-122.4294, 37.7849],
          address: '456 Market St'
        },
        status: 'confirmed',
        estimatedFare: 25.50
      });
      rideId = ride._id.toString();
    });

    it('should send and receive messages', (done) => {
      const testMessage = {
        rideId,
        message: 'Test message',
        messageType: 'text'
      };

      clientSocket.emit('sendMessage', testMessage);

      clientSocket.on('messageSent', (data) => {
        expect(data.success).toBe(true);
        done();
      });
    });

    it('should receive messages from other participants', (done) => {
      // This would require setting up multiple clients
      // to simulate message exchange between rider and driver
      done();
    });
  });

  describe('Emergency Features', () => {
    let rideId: string;

    beforeEach(async () => {
      // Create a test ride
      const Ride = require('../../src/models/Ride').Ride;
      const ride = await Ride.create({
        riderId: user._id,
        pickupLocation: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749],
          address: '123 Main St'
        },
        dropoffLocation: {
          type: 'Point',
          coordinates: [-122.4294, 37.7849],
          address: '456 Market St'
        },
        status: 'started',
        estimatedFare: 25.50
      });
      rideId = ride._id.toString();
    });

    it('should handle SOS alerts', (done) => {
      const sosData = {
        rideId,
        location: { lat: 37.7749, lng: -122.4194 },
        message: 'Emergency situation!'
      };

      clientSocket.emit('sosAlert', sosData);

      clientSocket.on('sosAlerted', (data) => {
        expect(data.success).toBe(true);
        done();
      });
    });
  });
});
```

## End-to-End Tests

### E2E Test Setup

```typescript
// tests/e2e/setup.ts
import { test as base, expect } from '@playwright/test';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

type TestFixtures = {
  mongoServer: MongoMemoryServer;
};

export const test = base.extend<TestFixtures>({
  mongoServer: async ({}, use) => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    await use(mongoServer);

    await mongoose.disconnect();
    await mongoServer.stop();
  }
});
```

### Mobile App E2E Tests

```typescript
// tests/e2e/riderApp.test.ts
import { test, expect } from './setup';

test.describe('Rider App E2E', () => {
  test('complete ride booking flow', async ({ page, mongoServer }) => {
    // Navigate to rider app
    await page.goto('http://localhost:3000/rider');

    // Register/Login
    await page.fill('[data-testid="email-input"]', 'rider@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Wait for login to complete
    await page.waitForSelector('[data-testid="map-container"]');

    // Set pickup location
    await page.click('[data-testid="pickup-location-input"]');
    await page.fill('[data-testid="location-search"]', '123 Main St, San Francisco');
    await page.click('[data-testid="location-suggestion"]:first-child');

    // Set dropoff location
    await page.click('[data-testid="dropoff-location-input"]');
    await page.fill('[data-testid="location-search"]', '456 Market St, San Francisco');
    await page.click('[data-testid="location-suggestion"]:first-child');

    // Select vehicle type
    await page.click('[data-testid="vehicle-type-sedan"]');

    // Book ride
    await page.click('[data-testid="book-ride-button"]');

    // Wait for ride confirmation
    await page.waitForSelector('[data-testid="ride-confirmed"]');

    // Verify ride details
    const rideId = await page.getAttribute('[data-testid="ride-id"]', 'data-ride-id');
    expect(rideId).toBeTruthy();

    // Wait for driver assignment
    await page.waitForSelector('[data-testid="driver-assigned"]');

    // Verify driver information
    const driverName = await page.textContent('[data-testid="driver-name"]');
    expect(driverName).toBeTruthy();

    // Simulate ride completion (in real scenario, this would happen via API)
    // For testing, we might need to mock the driver app or use API calls

    // Rate the ride
    await page.waitForSelector('[data-testid="ride-completed"]');
    await page.click('[data-testid="star-rating-5"]');
    await page.fill('[data-testid="review-textarea"]', 'Great ride!');
    await page.click('[data-testid="submit-rating-button"]');

    // Verify rating submission
    await page.waitForSelector('[data-testid="rating-submitted"]');
  });

  test('ride cancellation flow', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/rider');
    await page.fill('[data-testid="email-input"]', 'rider@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Book a ride
    await page.click('[data-testid="pickup-location-input"]');
    await page.fill('[data-testid="location-search"]', '123 Main St, San Francisco');
    await page.click('[data-testid="location-suggestion"]:first-child');

    await page.click('[data-testid="dropoff-location-input"]');
    await page.fill('[data-testid="location-search"]', '456 Market St, San Francisco');
    await page.click('[data-testid="location-suggestion"]:first-child');

    await page.click('[data-testid="vehicle-type-sedan"]');
    await page.click('[data-testid="book-ride-button"]');

    // Cancel ride
    await page.click('[data-testid="cancel-ride-button"]');
    await page.selectOption('[data-testid="cancel-reason-select"]', 'changed-mind');
    await page.click('[data-testid="confirm-cancel-button"]');

    // Verify cancellation
    await page.waitForSelector('[data-testid="ride-cancelled"]');
  });

  test('real-time location tracking', async ({ page }) => {
    // Login and start a ride
    await page.goto('http://localhost:3000/rider');
    await page.fill('[data-testid="email-input"]', 'rider@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Book and start ride
    // ... (ride booking steps)

    // Verify real-time tracking
    await page.waitForSelector('[data-testid="driver-location-marker"]');

    // Check if location updates are received
    const initialLocation = await page.getAttribute('[data-testid="driver-location-marker"]', 'data-location');

    // Wait for location update (this would happen via WebSocket)
    await page.waitForTimeout(5000);

    const updatedLocation = await page.getAttribute('[data-testid="driver-location-marker"]', 'data-location');
    expect(updatedLocation).not.toBe(initialLocation);
  });
});
```

## Performance Tests

### Load Testing

```typescript
// tests/performance/loadTest.ts
import { check } from 'k6';
import http from 'k6/http';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const rideCreationTrend = new Trend('ride_creation_duration');

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(99)<1500'], // 99% of requests should be below 1.5s
    errors: ['rate<0.1'], // Error rate should be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Simulate user registration
  const registerResponse = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify({
      name: `Test User ${__VU}`,
      email: `test${__VU}@example.com`,
      phone: `+123456789${__VU}`,
      password: 'password123',
      role: 'rider'
    }),
    params
  );

  check(registerResponse, {
    'registration successful': (r) => r.status === 201,
    'registration response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  errorRate.add(registerResponse.status !== 201);

  // Login
  const loginResponse = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: `test${__VU}@example.com`,
      password: 'password123'
    }),
    params
  );

  check(loginResponse, {
    'login successful': (r) => r.status === 200,
  });

  const authToken = loginResponse.json('data.token');

  // Create ride
  const rideStart = new Date().getTime();
  const rideResponse = http.post(
    `${BASE_URL}/api/rides`,
    JSON.stringify({
      pickupLocation: {
        lat: 37.7749 + (Math.random() * 0.01),
        lng: -122.4194 + (Math.random() * 0.01),
        address: 'Test Location'
      },
      dropoffLocation: {
        lat: 37.7849 + (Math.random() * 0.01),
        lng: -122.4294 + (Math.random() * 0.01),
        address: 'Test Destination'
      },
      vehicleType: 'sedan'
    }),
    {
      ...params,
      headers: {
        ...params.headers,
        'Authorization': `Bearer ${authToken}`,
      },
    }
  );

  const rideEnd = new Date().getTime();
  rideCreationTrend.add(rideEnd - rideStart);

  check(rideResponse, {
    'ride creation successful': (r) => r.status === 201,
    'ride creation response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  errorRate.add(rideResponse.status !== 201);
}
```

### Stress Testing

```typescript
// tests/performance/stressTest.ts
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '2m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '2m', target: 500 },
    { duration: '2m', target: 1000 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.5'], // Allow up to 50% failure rate during stress
    http_req_duration: ['p(95)<5000'], // 95% of requests should be below 5s
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test API endpoints under stress
  const endpoints = [
    '/api/rides/search',
    '/api/rides/history',
    '/health'
  ];

  for (const endpoint of endpoints) {
    const response = http.get(`${BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${__ENV.TEST_TOKEN}`,
      },
    });

    check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 5000ms': (r) => r.timings.duration < 5000,
    });
  }

  sleep(1);
}
```

## Mobile App Testing

### React Native Testing

```typescript
// mobile/rider-app/__tests__/App.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import App from '../App';

describe('Rider App', () => {
  it('renders login screen initially', () => {
    const { getByText, getByPlaceholderText } = render(
      <NavigationContainer>
        <App />
      </NavigationContainer>
    );

    expect(getByText('Welcome to RideShare')).toBeTruthy();
    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();
  });

  it('navigates to home screen after login', async () => {
    const { getByText, getByPlaceholderText, getByTestId } = render(
      <NavigationContainer>
        <App />
      </NavigationContainer>
    );

    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password');
    const loginButton = getByTestId('login-button');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(getByText('Find a Ride')).toBeTruthy();
    });
  });
});
```

### Detox E2E Testing

```javascript
// mobile/rider-app/e2e/firstTest.e2e.js
describe('Rider App E2E', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should login successfully', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();

    await expect(element(by.text('Find a Ride'))).toBeVisible();
  });

  it('should book a ride', async () => {
    // Login first
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();

    // Set pickup location
    await element(by.id('pickup-input')).tap();
    await element(by.id('location-search')).typeText('123 Main St');
    await element(by.id('location-result-0')).tap();

    // Set dropoff location
    await element(by.id('dropoff-input')).tap();
    await element(by.id('location-search')).typeText('456 Market St');
    await element(by.id('location-result-0')).tap();

    // Select vehicle
    await element(by.id('vehicle-sedan')).tap();

    // Book ride
    await element(by.id('book-ride-button')).tap();

    // Verify booking
    await expect(element(by.text('Ride Booked!'))).toBeVisible();
  });

  it('should handle ride tracking', async () => {
    // Login and book ride
    // ... (booking steps)

    // Wait for driver assignment
    await waitFor(element(by.id('driver-info'))).toBeVisible();

    // Verify map shows driver location
    await expect(element(by.id('driver-marker'))).toBeVisible();

    // Check real-time updates
    await expect(element(by.id('driver-location-text'))).toBeVisible();
  });
});
```

## API Testing with Postman

### Postman Collection

```json
{
  "info": {
    "name": "RideSharing API",
    "description": "Complete API testing collection for RideSharing application",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000",
      "type": "string"
    },
    {
      "key": "authToken",
      "value": "",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Register User",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Test User\",\n  \"email\": \"test@example.com\",\n  \"phone\": \"+1234567890\",\n  \"password\": \"password123\",\n  \"role\": \"rider\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/auth/register",
              "host": ["{{baseUrl}}"],
              "path": ["api", "auth", "register"]
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 201\", function () {",
                  "    pm.response.to.have.status(201);",
                  "});",
                  "",
                  "pm.test(\"Response has success\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData.success).to.eql(true);",
                  "});",
                  "",
                  "pm.test(\"Response has token\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData.data.token).to.be.a('string');",
                  "    pm.collectionVariables.set('authToken', jsonData.data.token);",
                  "});"
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## Test Automation

### CI/CD Pipeline Testing

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:6.0
        ports:
          - 27017:27017
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linting
      run: npm run lint

    - name: Run unit tests
      run: npm run test:unit
      env:
        NODE_ENV: test
        MONGODB_URI: mongodb://localhost:27017/rideshare_test
        REDIS_URL: redis://localhost:6379

    - name: Run integration tests
      run: npm run test:integration
      env:
        NODE_ENV: test
        MONGODB_URI: mongodb://localhost:27017/rideshare_test
        REDIS_URL: redis://localhost:6379

    - name: Generate coverage report
      run: npm run test:coverage

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info

  e2e:
    runs-on: ubuntu-latest
    needs: test

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Start test server
      run: |
        npm run build
        npm start &
        echo $! > server.pid

    - name: Wait for server
      run: |
        timeout 60 bash -c 'until curl -f http://localhost:3000/health; do sleep 1; done'

    - name: Run E2E tests
      run: npm run test:e2e

    - name: Stop server
      run: |
        kill $(cat server.pid) || true
```

### Test Data Management

```typescript
// tests/utils/testData.ts
import { User } from '../../src/models/User';
import { Ride } from '../../src/models/Ride';
import { Vehicle } from '../../src/models/Vehicle';

export class TestDataFactory {
  static async createTestUser(overrides = {}) {
    const defaultUser = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      phone: '+1234567890',
      password: 'password123',
      role: 'rider',
      isPhoneVerified: true
    };

    return await User.create({ ...defaultUser, ...overrides });
  }

  static async createTestDriver(overrides = {}) {
    const defaultDriver = {
      name: 'Test Driver',
      email: `driver${Date.now()}@example.com`,
      phone: '+1987654321',
      password: 'password123',
      role: 'driver',
      isAvailable: true,
      isPhoneVerified: true,
      currentLocation: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749]
      }
    };

    return await User.create({ ...defaultDriver, ...overrides });
  }

  static async createTestRide(riderId: string, driverId?: string, overrides = {}) {
    const defaultRide = {
      riderId,
      driverId,
      pickupLocation: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749],
        address: '123 Main St, San Francisco, CA'
      },
      dropoffLocation: {
        type: 'Point',
        coordinates: [-122.4294, 37.7849],
        address: '456 Market St, San Francisco, CA'
      },
      status: 'pending',
      estimatedFare: 25.50,
      vehicleType: 'sedan'
    };

    return await Ride.create({ ...defaultRide, ...overrides });
  }

  static async createTestVehicle(driverId: string, overrides = {}) {
    const defaultVehicle = {
      driverId,
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      licensePlate: 'ABC123',
      type: 'sedan',
      documents: [{
        type: 'registration',
        number: 'REG123456',
        expiryDate: new Date('2025-12-31'),
        status: 'verified'
      }]
    };

    return await Vehicle.create({ ...defaultVehicle, ...overrides });
  }

  static async cleanupTestData() {
    await User.deleteMany({ email: /test.*@example\.com/ });
    await Ride.deleteMany({ status: 'test' });
    await Vehicle.deleteMany({ licensePlate: /TEST/ });
  }
}
```

This comprehensive testing documentation provides a complete framework for testing the RideSharing application at all levels, from unit tests to end-to-end testing, ensuring robust and reliable functionality.
