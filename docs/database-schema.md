# Database Schema Documentation

This document provides comprehensive information about the MongoDB database schema used in the RideSharing application.

## Overview

The application uses MongoDB with Mongoose ODM for data persistence. The database is designed to support:
- User management (riders and drivers)
- Ride booking and management
- Payment processing
- Vehicle management
- Real-time location tracking

## Database Configuration

### Connection
```javascript
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
});
```

### Environment Variables
```env
MONGODB_URI=mongodb://localhost:27017/ridesharing
MONGODB_TEST_URI=mongodb://localhost:27017/ridesharing_test
```

## Collections

### 1. Users Collection

**Collection Name:** `users`

**Purpose:** Stores information about all users (riders and drivers)

**Schema Definition:**
```javascript
{
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true,
    index: true
  },
  role: {
    type: String,
    enum: ['rider', 'driver'],
    required: true,
    index: true
  },
  avatar: {
    type: String,
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  kycStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalRides: {
    type: Number,
    default: 0,
    min: 0
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    },
    address: String
  },
  isAvailable: {
    type: Boolean,
    default: false,
    index: true
  },
  vehicleIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  }],
  paymentMethods: [{
    type: {
      type: String,
      enum: ['card', 'upi', 'wallet'],
      required: true
    },
    details: {
      // Encrypted payment details
      type: Object,
      required: true
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  emergencyContacts: [{
    type: String,
    trim: true,
    maxlength: 15
  }],
  otp: {
    code: String,
    expiresAt: Date,
    attempts: {
      type: Number,
      default: 0,
      max: 3
    }
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    index: true
  }
}
```

**Indexes:**
```javascript
// Compound indexes for performance
UserSchema.index({ role: 1, isAvailable: 1 });
UserSchema.index({ kycStatus: 1, role: 1 });
UserSchema.index({ phoneNumber: 1, status: 1 });

// Geospatial index for location queries
UserSchema.index({ currentLocation: '2dsphere' });

// Text index for search
UserSchema.index({ firstName: 'text', lastName: 'text', phoneNumber: 'text' });
```

**Sample Document:**
```json
{
  "_id": "60d5ecb74b24c72b8c8b4567",
  "phoneNumber": "+1234567890",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "role": "rider",
  "avatar": "https://cdn.example.com/avatars/john.jpg",
  "isVerified": true,
  "kycStatus": "approved",
  "averageRating": 4.8,
  "totalRides": 25,
  "currentLocation": {
    "type": "Point",
    "coordinates": [-122.4194, 37.7749],
    "address": "123 Main St, San Francisco, CA"
  },
  "paymentMethods": [
    {
      "type": "card",
      "details": {
        "last4": "4242",
        "brand": "visa",
        "expiryMonth": 12,
        "expiryYear": 2025
      },
      "isDefault": true,
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "emergencyContacts": ["+1987654321", "+1123456789"],
  "lastActiveAt": "2025-09-13T10:30:00.000Z",
  "status": "active",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-09-13T10:30:00.000Z"
}
```

### 2. Rides Collection

**Collection Name:** `rides`

**Purpose:** Stores all ride information including requests, active rides, and completed trips

**Schema Definition:**
```javascript
{
  rideId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  isPooled: {
    type: Boolean,
    default: false,
    index: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 6,
    default: 1
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  passengers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    pickupLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true,
        index: '2dsphere'
      },
      address: String
    },
    dropoffLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true,
        index: '2dsphere'
      },
      address: String
    },
    fare: {
      type: Number,
      required: true,
      min: 0
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: {
      type: String,
      maxlength: 500
    }
  }],
  route: [{
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    },
    type: {
      type: String,
      enum: ['pickup', 'dropoff'],
      required: true
    },
    passengerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    estimatedTime: Date,
    actualTime: Date
  }],
  estimatedDistance: {
    type: Number,
    required: true,
    min: 0
  },
  actualDistance: {
    type: Number,
    min: 0
  },
  estimatedDuration: {
    type: Number,
    required: true,
    min: 0
  },
  actualDuration: {
    type: Number,
    min: 0
  },
  baseFare: {
    type: Number,
    required: true,
    min: 0
  },
  totalFare: {
    type: Number,
    required: true,
    min: 0
  },
  driverEarnings: {
    type: Number,
    required: true,
    min: 0
  },
  platformCommission: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['requested', 'accepted', 'driver_arrived', 'started', 'completed', 'cancelled'],
    default: 'requested',
    index: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'wallet'],
    required: true
  },
  paymentTransactionId: {
    type: String,
    sparse: true,
    index: true
  },
  otp: {
    type: String,
    length: 4
  },
  specialInstructions: {
    type: String,
    maxlength: 500
  },
  cancellationReason: {
    type: String,
    maxlength: 200
  },
  sosAlerted: {
    type: Boolean,
    default: false
  },
  requestedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  acceptedAt: Date,
  startedAt: Date,
  completedAt: Date,
  cancelledAt: Date
}
```

**Indexes:**
```javascript
// Performance indexes
RideSchema.index({ rideId: 1 }, { unique: true });
RideSchema.index({ driverId: 1, status: 1 });
RideSchema.index({ status: 1, requestedAt: -1 });
RideSchema.index({ paymentStatus: 1 });
RideSchema.index({ isPooled: 1, status: 1 });
RideSchema.index({ 'passengers.userId': 1 });

// Geospatial indexes for location queries
RideSchema.index({ 'passengers.pickupLocation': '2dsphere' });
RideSchema.index({ 'passengers.dropoffLocation': '2dsphere' });
RideSchema.index({ 'route.location': '2dsphere' });
```

**Sample Document:**
```json
{
  "_id": "60d5ecb74b24c72b8c8b4567",
  "rideId": "R20250913001",
  "isPooled": false,
  "capacity": 1,
  "driverId": "60d5ecb74b24c72b8c8b4568",
  "vehicleId": "60d5ecb74b24c72b8c8b4569",
  "passengers": [
    {
      "userId": "60d5ecb74b24c72b8c8b4570",
      "pickupLocation": {
        "type": "Point",
        "coordinates": [-122.4194, 37.7749],
        "address": "123 Main St, San Francisco, CA"
      },
      "dropoffLocation": {
        "type": "Point",
        "coordinates": [-122.4089, 37.7849],
        "address": "456 Market St, San Francisco, CA"
      },
      "fare": 25.50,
      "paymentStatus": "pending",
      "joinedAt": "2025-09-13T10:30:00.000Z",
      "rating": 5,
      "review": "Great driver, very safe journey!"
    }
  ],
  "estimatedDistance": 2.5,
  "estimatedDuration": 15,
  "baseFare": 20.00,
  "totalFare": 25.50,
  "driverEarnings": 21.93,
  "platformCommission": 3.57,
  "status": "accepted",
  "paymentMethod": "card",
  "otp": "4829",
  "specialInstructions": "Please wait at the main entrance",
  "requestedAt": "2025-09-13T10:30:00.000Z",
  "acceptedAt": "2025-09-13T10:32:00.000Z",
  "createdAt": "2025-09-13T10:30:00.000Z",
  "updatedAt": "2025-09-13T10:32:00.000Z"
}
```

### 3. Vehicles Collection

**Collection Name:** `vehicles`

**Purpose:** Stores vehicle information for drivers

**Schema Definition:**
```javascript
{
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  make: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  model: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  year: {
    type: Number,
    required: true,
    min: 2000,
    max: new Date().getFullYear() + 1
  },
  licensePlate: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  type: {
    type: String,
    enum: ['sedan', 'suv', 'hatchback', 'bike', 'auto', 'truck'],
    required: true
  },
  color: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 50
  },
  documents: {
    registration: {
      number: {
        type: String,
        required: true,
        trim: true
      },
      expiryDate: {
        type: Date,
        required: true
      },
      verified: {
        type: Boolean,
        default: false
      },
      documentUrl: String
    },
    insurance: {
      provider: {
        type: String,
        required: true,
        trim: true
      },
      policyNumber: {
        type: String,
        required: true,
        trim: true
      },
      expiryDate: {
        type: Date,
        required: true
      },
      verified: {
        type: Boolean,
        default: false
      },
      documentUrl: String
    },
    permit: {
      number: {
        type: String,
        required: true,
        trim: true
      },
      expiryDate: {
        type: Date,
        required: true
      },
      verified: {
        type: Boolean,
        default: false
      },
      documentUrl: String
    }
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive', 'suspended', 'rejected'],
    default: 'pending',
    index: true
  },
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalRides: {
    type: Number,
    default: 0,
    min: 0
  },
  features: [{
    type: String,
    enum: ['ac', 'music', 'wifi', 'charger', 'pet_friendly', 'child_seat']
  }],
  photos: [{
    url: String,
    type: {
      type: String,
      enum: ['exterior', 'interior', 'dashboard']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}
```

**Indexes:**
```javascript
VehicleSchema.index({ driverId: 1, status: 1 });
VehicleSchema.index({ type: 1, status: 1 });
VehicleSchema.index({ licensePlate: 1 }, { unique: true });
VehicleSchema.index({ status: 1 });
```

### 4. Payments Collection

**Collection Name:** `payments`

**Purpose:** Stores payment transaction information

**Schema Definition:**
```javascript
{
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  paymentId: {
    type: String,
    sparse: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
    index: true
  },
  method: {
    type: String,
    enum: ['card', 'upi', 'wallet', 'netbanking', 'cash'],
    required: true
  },
  description: {
    type: String,
    maxlength: 255
  },
  receipt: {
    type: String,
    unique: true
  },
  refundId: {
    type: String,
    sparse: true
  },
  refundAmount: {
    type: Number,
    min: 0
  },
  metadata: {
    type: Object
  },
  gatewayResponse: {
    type: Object
  },
  processedAt: Date,
  refundedAt: Date
}
```

**Indexes:**
```javascript
PaymentSchema.index({ rideId: 1, status: 1 });
PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ orderId: 1 }, { unique: true });
PaymentSchema.index({ paymentId: 1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
```

## Database Relationships

### Entity Relationship Diagram

```
Users (1) ──── (M) Rides (M) ──── (1) Vehicles
   │                    │
   │                    │
   └── (1) ──── (M) Payments
```

### Foreign Key Relationships

1. **User → Ride** (One-to-Many)
   - `User._id` → `Ride.driverId`
   - `User._id` → `Ride.passengers.userId`

2. **User → Vehicle** (One-to-Many)
   - `User._id` → `Vehicle.driverId`

3. **User → Payment** (One-to-Many)
   - `User._id` → `Payment.userId`
   - `User._id` → `Payment.driverId`

4. **Ride → Payment** (One-to-One/Many)
   - `Ride._id` → `Payment.rideId`

5. **Ride → Vehicle** (Many-to-One)
   - `Vehicle._id` → `Ride.vehicleId`

## Data Validation Rules

### User Validation
- Phone number must be unique and valid format
- Email must be unique if provided
- KYC status can only be updated by admin
- Average rating calculated automatically from ride ratings

### Ride Validation
- Capacity cannot exceed vehicle capacity
- Status transitions must follow valid flow
- OTP must be exactly 4 digits
- Total fare must equal sum of passenger fares

### Vehicle Validation
- License plate must be unique
- All documents must be verified before activation
- Vehicle type determines capacity limits

### Payment Validation
- Amount must be positive
- Order ID must be unique
- Refund amount cannot exceed original amount

## Indexing Strategy

### Performance Indexes
```javascript
// User indexes
{ phoneNumber: 1 }
{ role: 1, isAvailable: 1 }
{ currentLocation: '2dsphere' }
{ kycStatus: 1, role: 1 }

// Ride indexes
{ rideId: 1 }
{ driverId: 1, status: 1 }
{ status: 1, requestedAt: -1 }
{ 'passengers.userId': 1 }
{ 'passengers.pickupLocation': '2dsphere' }

// Vehicle indexes
{ driverId: 1, status: 1 }
{ licensePlate: 1 }

// Payment indexes
{ rideId: 1, status: 1 }
{ orderId: 1 }
{ userId: 1, createdAt: -1 }
```

### Compound Indexes
```javascript
// For driver availability queries
{ role: 1, isAvailable: 1, currentLocation: '2dsphere' }

// For ride history queries
{ 'passengers.userId': 1, status: 1, requestedAt: -1 }

// For payment reconciliation
{ status: 1, createdAt: -1, amount: 1 }
```

## Data Migration

### Migration Scripts
Located in `database/migrations/`

Example migration:
```javascript
module.exports = {
  async up(db) {
    await db.collection('users').updateMany(
      { role: 'driver' },
      { $set: { isAvailable: false } }
    );
  },

  async down(db) {
    await db.collection('users').updateMany(
      { role: 'driver' },
      { $unset: { isAvailable: '' } }
    );
  }
};
```

### Seeding Data
Located in `database/seeds/`

Example seed file:
```javascript
module.exports = {
  async run(db) {
    await db.collection('users').insertMany([
      {
        phoneNumber: '+1234567890',
        firstName: 'John',
        lastName: 'Doe',
        role: 'rider',
        status: 'active'
      }
    ]);
  }
};
```

## Backup and Recovery

### Backup Strategy
- Daily automated backups using MongoDB Atlas or mongodump
- Point-in-time recovery capability
- Encrypted backup storage
- Backup retention: 30 days

### Recovery Procedures
1. Stop application servers
2. Restore from latest backup
3. Verify data integrity
4. Restart application servers
5. Monitor for anomalies

## Monitoring and Maintenance

### Database Metrics
- Connection pool utilization
- Query performance statistics
- Index usage statistics
- Storage utilization
- Replication lag (if using replica set)

### Maintenance Tasks
- Index optimization
- Data archiving (old rides)
- Statistics aggregation
- Cleanup of expired OTPs
- Database compaction

## Security Considerations

### Data Encryption
- Payment details encrypted at rest
- JWT tokens with expiration
- API keys hashed and salted
- Document URLs with signed access

### Access Control
- Role-based access control (RBAC)
- Field-level security
- API rate limiting
- Input validation and sanitization

### Audit Trail
- All database changes logged
- User action tracking
- Payment transaction logs
- Admin action logs

## Performance Optimization

### Query Optimization
- Use appropriate indexes
- Implement pagination for large datasets
- Use aggregation pipelines for complex queries
- Cache frequently accessed data

### Connection Pooling
```javascript
mongoose.connect(uri, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
});
```

### Read/Write Concerns
- Write concern: majority for critical data
- Read concern: majority for consistency
- Journaling enabled for durability
