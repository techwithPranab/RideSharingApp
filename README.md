# RideSharingApp - Complete Carpooling Solution

A comprehensive ride-sharing and carpooling mobile application built with React Native + Expo for mobile apps, Node.js + Express for backend, and MongoDB as the database.

## 📱 Features

### Rider App
- 🔐 **Phone OTP Authentication** (Firebase/Custom)
- 👤 **Profile Management** & Payment Methods
- 🗺️ **Search & Request Rides** with Google Maps
- 📍 **Live Driver Tracking** & ETA
- 🚗 **Real-time Ride Matching** (Pooling)
- 💰 **Fare Estimate** & Split Fare
- 💬 **In-app Masked Chat** & Call
- 🔔 **Push Notifications** & SMS
- 📋 **Trip History** & Receipts
- ⭐ **Rate & Review Drivers**
- 📅 **Scheduled & Recurring Rides**
- 🆘 **Emergency SOS Alerts**
- 👥 **Emergency Contact Management**

### Driver App
- 🆔 **Driver KYC** & Vehicle Document Upload
- 🟢 **Daily Availability Toggle**
- ✅ **Accept/Decline Rides**
- 🧭 **Navigation to Pickup/Drop Points**
- 📊 **Trip Status Updates**
- 💵 **Earnings Dashboard** & Payouts
- 💬 **In-app Communication**
- 📈 **Trip History** & Ratings
- 🆘 **Emergency Response Integration**

### Backend Services
- 🔒 **JWT Authentication**
- 👥 **User Management** (Riders & Drivers)
- 🚖 **Intelligent Ride Matching Algorithm**
- 💳 **Payment Integration** (Razorpay/UPI)
- 📲 **Notification Services**
- 👨‍💼 **Admin Dashboard**
- 🔄 **Real-time Updates** (Socket.IO)
- 🆘 **Emergency Services Integration**
- 📊 **Analytics & Reporting**
- 🔐 **Admin Role Management**

### Emergency Services
- 🆘 **SOS Alert System**: Instant emergency notifications
- 📞 **Automatic Emergency Calls**: Direct connection to local emergency services
- 👥 **Emergency Contacts**: Automatic notification to user's emergency contacts
- 📍 **Location Tracking**: Real-time location sharing during emergencies
- 🚨 **Emergency Response Protocol**: Coordinated response with local authorities
- 📊 **Incident Management**: Comprehensive emergency incident tracking and reporting

### Admin Features
- 👨‍💼 **Admin Dashboard**: Comprehensive admin panel for system management
- 👥 **User Management**: Admin controls for user accounts and permissions
- 🚖 **Ride Oversight**: Monitor and manage all rides in real-time
- 📊 **Analytics & Reporting**: Detailed analytics and business intelligence
- 🔒 **Role-based Access Control**: Secure admin authentication and authorization
- 🚫 **Account Suspension**: Admin capability to suspend user accounts
- 📈 **Subscription Management**: Admin oversight of subscription plans and users
- 📋 **Audit Logging**: Complete audit trail of admin actions

## 📖 Documentation

The project includes comprehensive documentation:

- **[Emergency Services Integration](docs/emergency-services.md)**: Complete guide to SOS alerts, emergency response protocols, and incident management
- **[Real-time Features](docs/realtime-features.md)**: Socket.IO implementation, location tracking, and messaging
- **[API Reference](docs/api-reference.md)**: Detailed API endpoint documentation
- **[Database Schema](docs/database-schema.md)**: MongoDB models and relationships
- **[Testing Guide](docs/testing.md)**: Unit tests, integration tests, and E2E testing
- **[Deployment Guide](docs/deployment.md)**: Production deployment and scaling
- **[Implementation Summary](docs/implementation-summary.md)**: Technical architecture and design decisions

## 🏗️ Architecture

```
RideSharingApp/
├── mobile/
│   ├── rider-app/          # Rider React Native App
│   └── driver-app/         # Driver React Native App
├── backend/                # Node.js + Express API
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic services
│   │   ├── middleware/    # Express middleware
│   │   ├── utils/         # Utility functions
│   │   └── config/        # Configuration files
├── database/              # MongoDB schemas & seeds
├── docs/                  # Documentation
└── tests/                 # Test suites
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB
- Expo CLI
- React Native development environment

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your environment variables
npm run dev
```

### Mobile Apps Setup
```bash
# Rider App
cd mobile/rider-app
npm install
expo start

# Driver App
cd mobile/driver-app
npm install
expo start
```

### Database Setup
```bash
cd database
npm run seed
```

## 🛠️ Tech Stack

- **Mobile**: React Native + Expo, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT, Firebase (OTP)
- **Maps**: Google Maps SDK, Directions API
- **Payment**: Razorpay Integration
- **Real-time**: Socket.IO
- **Notifications**: Firebase Cloud Messaging
- **Testing**: Jest, Detox
- **DevOps**: Docker, GitHub Actions

## 📋 Environment Variables

Create `.env` files in respective directories:

### Backend `.env`
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ridesharing
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
GOOGLE_MAPS_API_KEY=your_google_maps_key
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
FIREBASE_SERVER_KEY=your_firebase_server_key
MSG91_AUTH_KEY=your_msg91_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
EMERGENCY_SERVICES_API_URL=https://api.emergency-services.local
EMERGENCY_SERVICES_API_KEY=your_emergency_api_key
EMERGENCY_DISPATCH_API_URL=https://dispatch.local/api
EMERGENCY_DISPATCH_API_KEY=your_dispatch_api_key
EMERGENCY_DISPATCH_PHONE=+1-911
```

### Mobile Apps `.env`
```env
API_BASE_URL=http://localhost:3000/api
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "firstName": "John",
  "lastName": "Doe",
  "role": "rider",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "userId": "60d5ecb74b24c72b8c8b4567",
    "phoneNumber": "+1234567890"
  }
}
```

#### Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "phoneNumber": "+1234567890"
}
```

#### Verify OTP & Login
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "60d5ecb74b24c72b8c8b4567",
      "firstName": "John",
      "lastName": "Doe",
      "phoneNumber": "+1234567890",
      "role": "rider"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}
```

### Ride Management Endpoints

#### Create Ride
```http
POST /api/rides
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "pickupLocation": {
    "coordinates": [-122.4194, 37.7749],
    "address": "123 Main St, San Francisco, CA"
  },
  "dropoffLocation": {
    "coordinates": [-122.4089, 37.7849],
    "address": "456 Market St, San Francisco, CA"
  },
  "isPooled": false,
  "preferredVehicleType": "sedan",
  "specialInstructions": "Please wait at the main entrance",
  "paymentMethod": "card"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ride created successfully",
  "data": {
    "ride": {
      "id": "60d5ecb74b24c72b8c8b4567",
      "status": "accepted",
      "pickupLocation": {
        "coordinates": [-122.4194, 37.7749],
        "address": "123 Main St, San Francisco, CA"
      },
      "dropoffLocation": {
        "coordinates": [-122.4089, 37.7849],
        "address": "456 Market St, San Francisco, CA"
      },
      "driver": {
        "id": "60d5ecb74b24c72b8c8b4568",
        "firstName": "Mike",
        "lastName": "Johnson",
        "phoneNumber": "+1987654321",
        "averageRating": 4.8
      },
      "vehicle": {
        "id": "60d5ecb74b24c72b8c8b4569",
        "make": "Toyota",
        "model": "Camry",
        "licensePlate": "ABC123",
        "type": "sedan",
        "color": "White"
      },
      "estimatedFare": 25.50,
      "estimatedDistance": 2.5,
      "estimatedDuration": 15,
      "otp": "4829",
      "createdAt": "2025-09-13T10:30:00.000Z"
    }
  }
}
```

#### Search Available Drivers
```http
POST /api/rides/search
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "pickupLocation": {
    "coordinates": [-122.4194, 37.7749]
  },
  "dropoffLocation": {
    "coordinates": [-122.4089, 37.7849]
  },
  "preferredVehicleType": "sedan"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Available drivers found",
  "data": {
    "matches": [
      {
        "driver": {
          "id": "60d5ecb74b24c72b8c8b4568",
          "firstName": "Mike",
          "lastName": "Johnson",
          "phoneNumber": "+1987654321",
          "averageRating": 4.8,
          "currentLocation": {
            "coordinates": [-122.4150, 37.7800]
          }
        },
        "vehicle": {
          "id": "60d5ecb74b24c72b8c8b4569",
          "make": "Toyota",
          "model": "Camry",
          "licensePlate": "ABC123",
          "type": "sedan",
          "color": "White"
        },
        "estimatedFare": 25.50,
        "estimatedDistance": 2.5,
        "estimatedDuration": 15,
        "distance": 0.8
      }
    ],
    "estimatedFare": 25.50
  }
}
```

#### Get Ride Details
```http
GET /api/rides/:rideId
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ride": {
      "id": "60d5ecb74b24c72b8c8b4567",
      "status": "started",
      "isPooled": false,
      "capacity": 1,
      "driver": {
        "id": "60d5ecb74b24c72b8c8b4568",
        "firstName": "Mike",
        "lastName": "Johnson",
        "phoneNumber": "+1987654321",
        "averageRating": 4.8
      },
      "vehicle": {
        "id": "60d5ecb74b24c72b8c8b4569",
        "make": "Toyota",
        "model": "Camry",
        "licensePlate": "ABC123",
        "type": "sedan",
        "color": "White"
      },
      "passengers": [
        {
          "userId": {
            "id": "60d5ecb74b24c72b8c8b4570",
            "firstName": "John",
            "lastName": "Doe",
            "phoneNumber": "+1234567890",
            "avatar": "https://example.com/avatar.jpg"
          },
          "pickupLocation": {
            "coordinates": [-122.4194, 37.7749],
            "address": "123 Main St, San Francisco, CA"
          },
          "dropoffLocation": {
            "coordinates": [-122.4089, 37.7849],
            "address": "456 Market St, San Francisco, CA"
          },
          "fare": 25.50,
          "paymentStatus": "pending"
        }
      ],
      "estimatedDistance": 2.5,
      "estimatedDuration": 15,
      "baseFare": 20.00,
      "totalFare": 25.50,
      "driverEarnings": 21.93,
      "platformCommission": 3.57,
      "paymentMethod": "card",
      "otp": "4829",
      "startedAt": "2025-09-13T10:45:00.000Z",
      "requestedAt": "2025-09-13T10:30:00.000Z"
    }
  }
}
```

#### Update Ride Status
```http
PATCH /api/rides/:rideId/status
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "status": "started"
}
```

**Valid Status Transitions:**
- `requested` → `accepted`, `cancelled`
- `accepted` → `driver_arrived`, `started`, `cancelled`
- `driver_arrived` → `started`, `cancelled`
- `started` → `completed`, `cancelled`
- `completed` → (final state)
- `cancelled` → (final state)

**Response:**
```json
{
  "success": true,
  "message": "Ride status updated successfully",
  "data": {
    "ride": {
      "id": "60d5ecb74b24c72b8c8b4567",
      "status": "started",
      "updatedAt": "2025-09-13T10:45:00.000Z"
    }
  }
}
```

#### Cancel Ride
```http
PATCH /api/rides/:rideId/cancel
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "reason": "Changed plans"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ride cancelled successfully",
  "data": {
    "ride": {
      "id": "60d5ecb74b24c72b8c8b4567",
      "status": "cancelled",
      "cancelledAt": "2025-09-13T10:35:00.000Z",
      "cancellationReason": "Changed plans"
    }
  }
}
```

#### Get Ride History
```http
GET /api/rides/history?page=1&limit=10
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rides": [
      {
        "id": "60d5ecb74b24c72b8c8b4567",
        "status": "completed",
        "isPooled": false,
        "driver": {
          "id": "60d5ecb74b24c72b8c8b4568",
          "firstName": "Mike",
          "lastName": "Johnson",
          "phoneNumber": "+1987654321",
          "averageRating": 4.8
        },
        "vehicle": {
          "id": "60d5ecb74b24c72b8c8b4569",
          "make": "Toyota",
          "model": "Camry",
          "licensePlate": "ABC123",
          "type": "sedan"
        },
        "passengers": [
          {
            "userId": {
              "id": "60d5ecb74b24c72b8c8b4570",
              "firstName": "John",
              "lastName": "Doe",
              "avatar": "https://example.com/avatar.jpg"
            },
            "pickupLocation": {
              "coordinates": [-122.4194, 37.7749]
            },
            "dropoffLocation": {
              "coordinates": [-122.4089, 37.7849]
            },
            "fare": 25.50,
            "paymentStatus": "completed"
          }
        ],
        "estimatedDistance": 2.5,
        "estimatedDuration": 15,
        "totalFare": 25.50,
        "paymentMethod": "card",
        "startedAt": "2025-09-13T10:45:00.000Z",
        "completedAt": "2025-09-13T11:00:00.000Z",
        "requestedAt": "2025-09-13T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

#### Get Active Ride
```http
GET /api/rides/active
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ride": {
      "id": "60d5ecb74b24c72b8c8b4567",
      "status": "started",
      "isPooled": false,
      "capacity": 1,
      "driver": {
        "id": "60d5ecb74b24c72b8c8b4568",
        "firstName": "Mike",
        "lastName": "Johnson",
        "phoneNumber": "+1987654321",
        "averageRating": 4.8
      },
      "vehicle": {
        "id": "60d5ecb74b24c72b8c8b4569",
        "make": "Toyota",
        "model": "Camry",
        "licensePlate": "ABC123",
        "type": "sedan",
        "color": "White"
      },
      "passengers": [
        {
          "userId": {
            "id": "60d5ecb74b24c72b8c8b4570",
            "firstName": "John",
            "lastName": "Doe",
            "phoneNumber": "+1234567890",
            "avatar": "https://example.com/avatar.jpg"
          },
          "pickupLocation": {
            "coordinates": [-122.4194, 37.7749]
          },
          "dropoffLocation": {
            "coordinates": [-122.4089, 37.7849]
          },
          "fare": 25.50,
          "paymentStatus": "pending"
        }
      ],
      "estimatedDistance": 2.5,
      "estimatedDuration": 15,
      "baseFare": 20.00,
      "totalFare": 25.50,
      "driverEarnings": 21.93,
      "platformCommission": 3.57,
      "paymentMethod": "card",
      "otp": "4829",
      "startedAt": "2025-09-13T10:45:00.000Z",
      "requestedAt": "2025-09-13T10:30:00.000Z"
    }
  }
}
```

#### Rate Completed Ride
```http
POST /api/rides/:rideId/rate
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "rating": 5,
  "review": "Great driver, very safe journey!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ride rated successfully",
  "data": {
    "rating": {
      "rating": 5,
      "review": "Great driver, very safe journey!",
      "createdAt": "2025-09-13T11:05:00.000Z"
    }
  }
}
```

### Payment Endpoints

#### Create Payment Order
```http
POST /api/payments/create-order
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "rideId": "60d5ecb74b24c72b8c8b4567",
  "paymentMethod": "card"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment order created successfully",
  "data": {
    "order": {
      "id": "order_xyz123",
      "amount": 2550,
      "currency": "INR",
      "receipt": "receipt_123",
      "status": "created"
    },
    "razorpayKeyId": "rzp_test_abc123"
  }
}
```

#### Process Payment
```http
POST /api/payments/process
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "orderId": "order_xyz123",
  "paymentId": "pay_abc456",
  "signature": "signature_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "data": {
    "payment": {
      "id": "60d5ecb74b24c72b8c8b4571",
      "orderId": "order_xyz123",
      "paymentId": "pay_abc456",
      "amount": 2550,
      "currency": "INR",
      "status": "completed",
      "method": "card"
    }
  }
}
```

## 🔌 Real-time Features (Socket.IO)

### Connection Setup
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token-here'
  },
  transports: ['websocket', 'polling']
});

// Connection events
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

### Location Updates
```javascript
// Send location update (for both riders and drivers)
socket.emit('updateLocation', {
  lat: 37.7749,
  lng: -122.4194
});

// Listen for location update confirmation
socket.on('locationUpdated', (data) => {
  console.log('Location updated successfully:', data);
});

// Listen for location update errors
socket.on('locationUpdateError', (error) => {
  console.error('Location update failed:', error);
});
```

### Ride Status Updates
```javascript
// Send ride status update (driver only)
socket.emit('updateRideStatus', {
  rideId: '60d5ecb74b24c72b8c8b4567',
  status: 'started'
});

// Listen for ride status changes (both rider and driver)
socket.on('rideStatusChanged', (data) => {
  console.log('Ride status updated:', data);
  // data: { rideId, status, timestamp, updatedBy }
});

// Listen for ride status update errors
socket.on('rideStatusUpdateError', (error) => {
  console.error('Ride status update failed:', error);
});
```

### Driver Location Tracking
```javascript
// Start tracking a specific ride (rider only)
socket.emit('startRideTracking', {
  rideId: '60d5ecb74b24c72b8c8b4567'
});

// Listen for driver location updates (rider only)
socket.on('driverLocationUpdate', (data) => {
  console.log('Driver location:', data);
  // data: { rideId, location: { lat, lng }, timestamp }
});

// Listen for tracking errors
socket.on('trackingError', (error) => {
  console.error('Tracking error:', error);
});
```

### In-app Messaging
```javascript
// Send message to ride participants
socket.emit('sendMessage', {
  rideId: '60d5ecb74b24c72b8c8b4567',
  message: 'On my way to pickup location!',
  messageType: 'text'
});

// Listen for new messages
socket.on('newMessage', (data) => {
  console.log('New message received:', data);
  // data: { id, rideId, senderId, senderRole, message, messageType, timestamp }
});

// Listen for message errors
socket.on('messageError', (error) => {
  console.error('Message send failed:', error);
});
```

### Driver Availability
```javascript
// Update driver availability (driver only)
socket.emit('updateAvailability', {
  isAvailable: true
});

// Listen for availability update confirmation
socket.on('availabilityUpdated', (data) => {
  console.log('Availability updated:', data);
});

// Listen for availability update errors
socket.on('availabilityUpdateError', (error) => {
  console.error('Availability update failed:', error);
});
```

### Emergency/SOS Alerts
```javascript
// Send SOS alert
socket.emit('sosAlert', {
  rideId: '60d5ecb74b24c72b8c8b4567',
  location: {
    lat: 37.7749,
    lng: -122.4194
  },
  message: 'Emergency situation - please help!'
});

// Listen for SOS alerts
socket.on('sosTriggered', (data) => {
  console.log('SOS alert received:', data);
  // data: { rideId, userId, userRole, location, message, timestamp }
});

// Listen for SOS errors
socket.on('sosError', (error) => {
  console.error('SOS alert failed:', error);
});
```

## 🗄️ Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  phoneNumber: String, // Required, unique
  firstName: String,   // Required
  lastName: String,    // Required
  email: String,       // Optional
  role: 'rider' | 'driver', // Required
  avatar: String,      // Optional
  isVerified: Boolean, // Default: false
  kycStatus: 'pending' | 'approved' | 'rejected', // Default: 'pending'
  averageRating: Number, // 1-5 scale
  totalRides: Number,  // Default: 0
  currentLocation: {
    type: 'Point',
    coordinates: [longitude, latitude] // GeoJSON format
  },
  isAvailable: Boolean, // For drivers, Default: false
  vehicleIds: [ObjectId], // For drivers
  paymentMethods: [{
    type: 'card' | 'upi' | 'wallet',
    details: Object,
    isDefault: Boolean
  }],
  emergencyContacts: [String],
  lastActiveAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Ride Model
```javascript
{
  _id: ObjectId,
  rideId: String, // Unique readable ID (e.g., "R20250913001")
  isPooled: Boolean, // Default: false
  capacity: Number, // Maximum passengers, Default: 1
  driverId: ObjectId, // Reference to User
  vehicleId: ObjectId, // Reference to Vehicle
  passengers: [{
    userId: ObjectId, // Reference to User
    pickupLocation: {
      type: 'Point',
      coordinates: [longitude, latitude],
      address: String
    },
    dropoffLocation: {
      type: 'Point',
      coordinates: [longitude, latitude],
      address: String
    },
    fare: Number,
    paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded',
    joinedAt: Date,
    rating: Number, // 1-5 scale
    review: String
  }],
  route: [{
    location: {
      type: 'Point',
      coordinates: [longitude, latitude]
    },
    type: 'pickup' | 'dropoff',
    passengerId: ObjectId,
    estimatedTime: Date,
    actualTime: Date
  }],
  estimatedDistance: Number, // in kilometers
  actualDistance: Number,
  estimatedDuration: Number, // in minutes
  actualDuration: Number,
  baseFare: Number,
  totalFare: Number,
  driverEarnings: Number,
  platformCommission: Number,
  status: 'requested' | 'accepted' | 'driver_arrived' | 'started' | 'completed' | 'cancelled',
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded',
  paymentMethod: 'cash' | 'card' | 'upi' | 'wallet',
  paymentTransactionId: String,
  otp: String, // 4-digit OTP for ride verification
  specialInstructions: String,
  cancellationReason: String,
  sosAlerted: Boolean, // Default: false
  requestedAt: Date,
  acceptedAt: Date,
  startedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Vehicle Model
```javascript
{
  _id: ObjectId,
  driverId: ObjectId, // Reference to User
  make: String, // e.g., "Toyota"
  model: String, // e.g., "Camry"
  year: Number,
  licensePlate: String, // Required, unique
  type: 'sedan' | 'suv' | 'hatchback' | 'bike',
  color: String,
  capacity: Number, // Maximum passengers
  documents: {
    registration: {
      number: String,
      expiryDate: Date,
      verified: Boolean, // Default: false
      documentUrl: String
    },
    insurance: {
      provider: String,
      policyNumber: String,
      expiryDate: Date,
      verified: Boolean, // Default: false
      documentUrl: String
    },
    permit: {
      number: String,
      expiryDate: Date,
      verified: Boolean, // Default: false
      documentUrl: String
    }
  },
  status: 'pending' | 'active' | 'inactive' | 'suspended',
  averageRating: Number,
  totalRides: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Payment Model
```javascript
{
  _id: ObjectId,
  rideId: ObjectId, // Reference to Ride
  userId: ObjectId, // Reference to User (rider)
  driverId: ObjectId, // Reference to User (driver)
  orderId: String, // Razorpay order ID
  paymentId: String, // Razorpay payment ID
  amount: Number, // Amount in paisa (smallest currency unit)
  currency: String, // Default: 'INR'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded',
  method: 'card' | 'upi' | 'wallet' | 'netbanking' | 'cash',
  description: String,
  receipt: String,
  refundId: String, // Razorpay refund ID (if applicable)
  refundAmount: Number,
  metadata: Object, // Additional payment data
  createdAt: Date,
  updatedAt: Date
}
```

## 🧪 Testing

```bash
# Unit Tests
npm run test

# Integration Tests
npm run test:integration

# E2E Tests (Mobile)
npm run test:e2e

# API Tests (Postman + Newman)
./tests/e2e/run-api-tests.sh
```

### API Testing Framework
The project includes a comprehensive API testing framework using Postman and Newman:

- **Collection**: `tests/e2e/RideSharing_API_Postman_Collection.json`
- **Environment**: `tests/e2e/RideSharing_Postman_Environment.postman_environment.json`
- **Test Runner**: `./tests/e2e/run-api-tests.sh`
- **Results**: View HTML reports in `test-results/test-results.html`

**Features:**
- ✅ Complete authentication flow testing
- ✅ Subscription management validation
- ✅ Ride booking and management
- ✅ Payment processing
- ✅ Error scenarios and edge cases
- ✅ Load testing capabilities
- ✅ CI/CD integration with GitHub Actions

For detailed testing instructions, see `API_TESTING_README.md`.

## 🐳 Docker

```bash
# Build and run with Docker
docker-compose up --build
```

## 📖 API Documentation

API documentation is available at `/api/docs` when the server is running.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@ridesharingapp.com or join our Slack channel.
