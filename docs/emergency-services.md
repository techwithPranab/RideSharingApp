# Emergency Services Integration

This document outlines the emergency services integration for the RideSharing application, including SOS alerts, emergency response protocols, and integration with external emergency services.

## Overview

The RideSharing application includes comprehensive emergency services to ensure rider and driver safety during rides. The system provides multiple layers of emergency response:

- **SOS Alerts**: Immediate emergency notifications
- **Automatic Emergency Services**: Integration with local emergency services
- **Emergency Contacts**: Notification to user's emergency contacts
- **Real-time Monitoring**: Continuous safety monitoring during rides

## SOS Alert System

### Triggering SOS Alerts

#### Mobile App Integration

```javascript
// React Native SOS Alert Implementation
import { Alert, Linking } from 'react-native';

const triggerSOS = async (rideId, location, message = 'Emergency situation') => {
  try {
    // Send SOS alert via Socket.IO
    socket.emit('sosAlert', {
      rideId,
      location: {
        lat: location.latitude,
        lng: location.longitude
      },
      message,
      timestamp: new Date()
    });

    // Show immediate feedback to user
    Alert.alert(
      'SOS Alert Sent',
      'Emergency services have been notified. Help is on the way.',
      [{ text: 'OK' }]
    );

    // Automatically call emergency services
    const emergencyNumber = getEmergencyNumber();
    await Linking.openURL(`tel:${emergencyNumber}`);

  } catch (error) {
    console.error('SOS Alert failed:', error);
    Alert.alert('Error', 'Failed to send SOS alert. Please call emergency services directly.');
  }
};
```

#### Backend SOS Processing

```javascript
// Socket.IO SOS Event Handler
socket.on('sosAlert', async (data) => {
  try {
    const { rideId, location, message } = data;
    const userId = socket.userId;
    const userRole = socket.userRole;

    // 1. Validate SOS request
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return socket.emit('sosError', { error: 'Ride not found' });
    }

    // 2. Log emergency event
    await logEmergencyEvent({
      rideId,
      userId,
      userRole,
      location,
      message,
      timestamp: new Date()
    });

    // 3. Notify all ride participants
    await notifyRideParticipants(ride, {
      type: 'SOS_ALERT',
      message: 'Emergency alert triggered!',
      location
    });

    // 4. Trigger emergency response
    await triggerEmergencyResponse(ride, location, message);

    // 5. Update ride status
    ride.sosAlerted = true;
    ride.emergencyStatus = 'ACTIVE';
    await ride.save();

    socket.emit('sosAlerted', { success: true });

  } catch (error) {
    logger.error('SOS processing failed:', error);
    socket.emit('sosError', { error: 'Failed to process SOS alert' });
  }
});
```

### Emergency Response Protocol

#### 1. Immediate Actions

```javascript
const triggerEmergencyResponse = async (ride, location, message) => {
  // 1. Notify Emergency Services
  await notifyEmergencyServices({
    location,
    rideId: ride._id,
    message,
    priority: 'HIGH'
  });

  // 2. Notify Emergency Contacts
  await notifyEmergencyContacts(ride, location);

  // 3. Alert Nearby Drivers
  await alertNearbyDrivers(ride, location);

  // 4. Create Emergency Incident Record
  await createEmergencyIncident(ride, location, message);
};
```

#### 2. Emergency Services Notification

```javascript
const notifyEmergencyServices = async (emergencyData) => {
  const { location, rideId, message, priority } = emergencyData;

  // Get local emergency service number
  const emergencyNumber = await getLocalEmergencyNumber(location);

  // Send structured emergency data
  const emergencyPayload = {
    incidentType: 'RIDESHARING_EMERGENCY',
    location: {
      latitude: location.lat,
      longitude: location.lng,
      address: await getAddressFromCoordinates(location)
    },
    rideId,
    message,
    priority,
    timestamp: new Date(),
    requester: 'RIDESHARING_APP'
  };

  // Integration with emergency services API
  if (process.env.EMERGENCY_SERVICES_API_URL) {
    await axios.post(process.env.EMERGENCY_SERVICES_API_URL, emergencyPayload, {
      headers: {
        'Authorization': `Bearer ${process.env.EMERGENCY_SERVICES_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // Fallback: Send SMS to emergency services
  await sendEmergencySMS(emergencyNumber, emergencyPayload);
};
```

#### 3. Emergency Contacts Notification

```javascript
const notifyEmergencyContacts = async (ride, location) => {
  // Get user's emergency contacts
  const user = await User.findById(ride.driverId || ride.passengers[0].userId);
  const emergencyContacts = user.emergencyContacts || [];

  const notificationMessage = `EMERGENCY ALERT: ${user.firstName} ${user.lastName} has triggered an emergency alert during a ride. Location: ${location.lat}, ${location.lng}. Please contact emergency services immediately.`;

  // Send SMS to all emergency contacts
  for (const contact of emergencyContacts) {
    await sendSMS(contact.phoneNumber, notificationMessage);
  }

  // Send push notification if contact has app
  for (const contact of emergencyContacts) {
    if (contact.userId) {
      await sendPushNotification(contact.userId, {
        title: 'Emergency Alert',
        body: `${user.firstName} has triggered an emergency during a ride`,
        data: { rideId: ride._id, emergency: true }
      });
    }
  }
};
```

## Emergency Incident Management

### Incident Tracking

```javascript
// Emergency Incident Model
const EmergencyIncidentSchema = new Schema({
  rideId: {
    type: Schema.Types.ObjectId,
    ref: 'Ride',
    required: true
  },
  triggeredBy: {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userRole: { type: String, enum: ['rider', 'driver'] }
  },
  location: {
    type: 'Point',
    coordinates: [Number], // [longitude, latitude]
    address: String
  },
  message: String,
  status: {
    type: String,
    enum: ['ACTIVE', 'RESOLVED', 'FALSE_ALARM'],
    default: 'ACTIVE'
  },
  emergencyServicesNotified: {
    type: Boolean,
    default: false
  },
  emergencyContactsNotified: {
    type: Boolean,
    default: false
  },
  responseTime: Number, // in minutes
  resolutionTime: Date,
  notes: String,
  createdAt: Date,
  updatedAt: Date
});

// Incident Management Service
class EmergencyIncidentService {
  static async createIncident(rideId, triggeredBy, location, message) {
    const incident = new EmergencyIncident({
      rideId,
      triggeredBy,
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat]
      },
      message,
      status: 'ACTIVE'
    });

    await incident.save();
    return incident;
  }

  static async resolveIncident(incidentId, resolutionNotes) {
    const incident = await EmergencyIncident.findById(incidentId);
    if (incident) {
      incident.status = 'RESOLVED';
      incident.resolutionTime = new Date();
      incident.notes = resolutionNotes;
      await incident.save();
    }
    return incident;
  }
}
```

### Real-time Emergency Monitoring

```javascript
// Emergency Monitoring Service
class EmergencyMonitoringService {
  static async monitorRideSafety(rideId) {
    const ride = await Ride.findById(rideId).populate('passengers.userId driverId');

    // Check for unusual patterns
    const safetyChecks = await Promise.all([
      this.checkRideDuration(ride),
      this.checkLocationUpdates(ride),
      this.checkCommunicationPatterns(ride),
      this.checkSpeedAnomalies(ride)
    ]);

    const hasSafetyConcerns = safetyChecks.some(check => check.hasConcern);

    if (hasSafetyConcerns) {
      await this.triggerSafetyAlert(ride, safetyChecks);
    }

    return { hasSafetyConcerns, safetyChecks };
  }

  static async checkRideDuration(ride) {
    const expectedDuration = ride.estimatedDuration;
    const actualDuration = (new Date() - ride.startedAt) / (1000 * 60); // in minutes

    if (actualDuration > expectedDuration * 1.5) {
      return {
        hasConcern: true,
        type: 'DURATION_EXCEEDED',
        message: `Ride duration exceeded by ${(actualDuration - expectedDuration).toFixed(1)} minutes`
      };
    }

    return { hasConcern: false };
  }

  static async checkLocationUpdates(ride) {
    const lastLocationUpdate = await LocationUpdate.findOne({ rideId: ride._id })
      .sort({ timestamp: -1 });

    if (!lastLocationUpdate) {
      return { hasConcern: false };
    }

    const timeSinceLastUpdate = (new Date() - lastLocationUpdate.timestamp) / (1000 * 60); // in minutes

    if (timeSinceLastUpdate > 10) { // No location update for 10 minutes
      return {
        hasConcern: true,
        type: 'LOCATION_UPDATE_MISSING',
        message: `No location update for ${timeSinceLastUpdate.toFixed(1)} minutes`
      };
    }

    return { hasConcern: false };
  }
}
```

## Emergency Response Integration

### Integration with Local Emergency Services

```javascript
// Emergency Services Integration
class EmergencyServicesIntegration {
  static async notifyLocalEmergencyServices(emergencyData) {
    const { location, priority, message } = emergencyData;

    // Get local emergency dispatch center
    const dispatchCenter = await this.getLocalDispatchCenter(location);

    // Send emergency notification
    const response = await axios.post(`${dispatchCenter.apiUrl}/emergency`, {
      incidentType: 'RIDESHARING_EMERGENCY',
      location: {
        latitude: location.lat,
        longitude: location.lng,
        address: await this.getAddressFromCoordinates(location)
      },
      priority,
      message,
      source: 'RIDESHARING_APP',
      timestamp: new Date()
    }, {
      headers: {
        'Authorization': `Bearer ${dispatchCenter.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  }

  static async getLocalDispatchCenter(location) {
    // Determine local emergency dispatch center based on location
    const { lat, lng } = location;

    // This would typically query a database of emergency dispatch centers
    // For now, return default configuration
    return {
      name: 'Local Emergency Dispatch',
      apiUrl: process.env.EMERGENCY_DISPATCH_API_URL,
      apiKey: process.env.EMERGENCY_DISPATCH_API_KEY,
      phoneNumber: process.env.EMERGENCY_DISPATCH_PHONE
    };
  }
}
```

### Emergency Contact Management

```javascript
// Emergency Contact Management
class EmergencyContactService {
  static async addEmergencyContact(userId, contactData) {
    const { name, phoneNumber, relationship } = contactData;

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Validate phone number format
    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new Error('Invalid phone number format');
    }

    // Check if contact already exists
    const existingContact = user.emergencyContacts.find(
      contact => contact.phoneNumber === phoneNumber
    );

    if (existingContact) {
      throw new Error('Emergency contact already exists');
    }

    // Add emergency contact
    user.emergencyContacts.push({
      name,
      phoneNumber,
      relationship,
      addedAt: new Date()
    });

    await user.save();

    // Send verification SMS
    await this.sendVerificationSMS(phoneNumber, user);

    return user.emergencyContacts;
  }

  static async verifyEmergencyContact(userId, contactId, verificationCode) {
    const user = await User.findById(userId);
    const contact = user.emergencyContacts.id(contactId);

    if (!contact) {
      throw new Error('Emergency contact not found');
    }

    if (contact.verificationCode !== verificationCode) {
      throw new Error('Invalid verification code');
    }

    contact.isVerified = true;
    contact.verifiedAt = new Date();
    await user.save();

    return contact;
  }

  static async sendVerificationSMS(phoneNumber, user) {
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    const message = `Emergency contact verification for ${user.firstName} ${user.lastName}. Your verification code is: ${verificationCode}`;

    // Store verification code temporarily
    await this.storeVerificationCode(phoneNumber, verificationCode);

    // Send SMS
    await sendSMS(phoneNumber, message);
  }
}
```

## Safety Features

### Ride Safety Monitoring

```javascript
// Ride Safety Monitoring
class RideSafetyMonitor {
  static async startMonitoring(rideId) {
    // Start periodic safety checks
    const monitoringInterval = setInterval(async () => {
      try {
        const ride = await Ride.findById(rideId);
        if (!ride || ride.status === 'completed' || ride.status === 'cancelled') {
          clearInterval(monitoringInterval);
          return;
        }

        // Perform safety checks
        const safetyStatus = await EmergencyMonitoringService.monitorRideSafety(rideId);

        if (safetyStatus.hasSafetyConcerns) {
          await this.handleSafetyConcern(ride, safetyStatus);
        }

      } catch (error) {
        logger.error('Safety monitoring error:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    // Store monitoring interval for cleanup
    await this.storeMonitoringInterval(rideId, monitoringInterval);
  }

  static async handleSafetyConcern(ride, safetyStatus) {
    // Log safety concern
    await logSafetyConcern(ride._id, safetyStatus);

    // Send alert to admin
    await notifyAdminSafetyConcern(ride, safetyStatus);

    // If critical concern, trigger emergency protocol
    const hasCriticalConcern = safetyStatus.safetyChecks.some(
      check => check.type === 'LOCATION_UPDATE_MISSING' && check.hasConcern
    );

    if (hasCriticalConcern) {
      await triggerEmergencyResponse(ride, ride.currentLocation, 'Safety monitoring detected critical issue');
    }
  }
}
```

### Emergency Button Implementation

```javascript
// Emergency Button Component (React Native)
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, Alert } from 'react-native';
import { useLocation } from '../hooks/useLocation';
import { useSocket } from '../hooks/useSocket';

const EmergencyButton = ({ rideId }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [pressCount, setPressCount] = useState(0);
  const location = useLocation();
  const socket = useSocket();

  useEffect(() => {
    let timer;
    if (pressCount > 0) {
      timer = setTimeout(() => {
        setPressCount(0);
      }, 3000); // Reset after 3 seconds
    }
    return () => clearTimeout(timer);
  }, [pressCount]);

  const handlePress = () => {
    const newCount = pressCount + 1;
    setPressCount(newCount);

    if (newCount >= 3) { // Triple press to trigger
      triggerEmergency();
    }
  };

  const triggerEmergency = async () => {
    setIsPressed(true);

    try {
      await triggerSOS(rideId, location, 'Emergency button pressed multiple times');
    } catch (error) {
      Alert.alert('Error', 'Failed to send emergency alert');
    } finally {
      setIsPressed(false);
      setPressCount(0);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.emergencyButton, isPressed && styles.emergencyButtonPressed]}
      onPress={handlePress}
      disabled={isPressed}
    >
      <Text style={styles.emergencyButtonText}>
        {pressCount > 0 ? `Press ${3 - pressCount} more times` : 'SOS'}
      </Text>
    </TouchableOpacity>
  );
};
```

## Emergency Response Protocols

### Response Time Tracking

```javascript
// Emergency Response Tracking
class EmergencyResponseTracker {
  static async trackResponseTime(incidentId, responseStartTime) {
    const incident = await EmergencyIncident.findById(incidentId);
    if (!incident) {
      throw new Error('Emergency incident not found');
    }

    const responseTime = (new Date().getTime() - responseStartTime.getTime()) / (1000 * 60); // in minutes
    incident.responseTime = responseTime;

    await incident.save();

    // Log response time for analytics
    await logEmergencyResponseTime(incidentId, responseTime);

    return responseTime;
  }

  static async getAverageResponseTime(location, timeRange = 30) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - timeRange);

    const incidents = await EmergencyIncident.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [location.lng, location.lat]
          },
          $maxDistance: 10000 // 10km radius
        }
      },
      createdAt: { $gte: thirtyDaysAgo },
      responseTime: { $exists: true }
    });

    if (incidents.length === 0) {
      return 0;
    }

    const totalResponseTime = incidents.reduce((sum, incident) => sum + incident.responseTime, 0);
    return totalResponseTime / incidents.length;
  }
}
```

### Emergency Incident Reporting

```javascript
// Emergency Incident Reporting
class EmergencyReportingService {
  static async generateEmergencyReport(filters = {}) {
    const {
      startDate,
      endDate,
      location,
      status,
      priority
    } = filters;

    const query = {};

    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    if (location) {
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [location.lng, location.lat]
          },
          $maxDistance: location.radius || 5000
        }
      };
    }

    if (status) {
      query.status = status;
    }

    const incidents = await EmergencyIncident.find(query)
      .populate('rideId')
      .populate('triggeredBy.userId')
      .sort({ createdAt: -1 });

    const report = {
      totalIncidents: incidents.length,
      resolvedIncidents: incidents.filter(i => i.status === 'RESOLVED').length,
      falseAlarms: incidents.filter(i => i.status === 'FALSE_ALARM').length,
      averageResponseTime: await this.calculateAverageResponseTime(incidents),
      incidentsByType: this.groupIncidentsByType(incidents),
      incidentsByLocation: this.groupIncidentsByLocation(incidents),
      incidents: incidents.map(this.formatIncidentForReport)
    };

    return report;
  }

  static calculateAverageResponseTime(incidents) {
    const incidentsWithResponseTime = incidents.filter(i => i.responseTime);
    if (incidentsWithResponseTime.length === 0) {
      return 0;
    }

    const totalResponseTime = incidentsWithResponseTime.reduce((sum, incident) => sum + incident.responseTime, 0);
    return totalResponseTime / incidentsWithResponseTime.length;
  }
}
```

## Configuration and Setup

### Environment Variables

```env
# Emergency Services Configuration
EMERGENCY_SERVICES_API_URL=https://api.emergency-services.local
EMERGENCY_SERVICES_API_KEY=your_emergency_api_key
EMERGENCY_DISPATCH_API_URL=https://dispatch.local/api
EMERGENCY_DISPATCH_API_KEY=your_dispatch_api_key
EMERGENCY_DISPATCH_PHONE=+1-911

# SMS Configuration for Emergency Alerts
EMERGENCY_SMS_PROVIDER=TWILIO
EMERGENCY_SMS_FROM_NUMBER=+1234567890

# Safety Monitoring
SAFETY_MONITORING_ENABLED=true
SAFETY_CHECK_INTERVAL_MINUTES=5
MAX_LOCATION_UPDATE_INTERVAL_MINUTES=10
MAX_RIDE_DURATION_MULTIPLIER=1.5
```

### Database Configuration

```javascript
// Emergency Services Database Configuration
const emergencyConfig = {
  collections: {
    emergencyIncidents: 'emergency_incidents',
    safetyConcerns: 'safety_concerns',
    emergencyContacts: 'emergency_contacts',
    emergencyLogs: 'emergency_logs'
  },
  indexes: [
    { collection: 'emergency_incidents', field: 'location.coordinates', type: '2dsphere' },
    { collection: 'emergency_incidents', field: 'createdAt', type: 1 },
    { collection: 'emergency_incidents', field: 'status', type: 1 },
    { collection: 'safety_concerns', field: 'rideId', type: 1 },
    { collection: 'emergency_contacts', field: 'userId', type: 1 }
  ]
};
```

## Testing and Validation

### Emergency System Testing

```javascript
// Emergency System Test Suite
describe('Emergency Services', () => {
  test('should trigger SOS alert successfully', async () => {
    const mockRide = await createMockRide();
    const mockLocation = { lat: 37.7749, lng: -122.4194 };

    const result = await triggerSOS(mockRide._id, mockLocation, 'Test emergency');

    expect(result.success).toBe(true);
    expect(mockRide.sosAlerted).toBe(true);
  });

  test('should notify emergency contacts', async () => {
    const mockUser = await createMockUserWithEmergencyContacts();
    const mockRide = await createMockRide(mockUser._id);

    await notifyEmergencyContacts(mockRide, mockLocation);

    // Verify SMS was sent to emergency contacts
    expect(sendSMS).toHaveBeenCalledTimes(mockUser.emergencyContacts.length);
  });

  test('should create emergency incident record', async () => {
    const mockRide = await createMockRide();
    const mockLocation = { lat: 37.7749, lng: -122.4194 };

    const incident = await createEmergencyIncident(mockRide, mockLocation, 'Test incident');

    expect(incident.rideId).toEqual(mockRide._id);
    expect(incident.status).toBe('ACTIVE');
    expect(incident.location.coordinates).toEqual([-122.4194, 37.7749]);
  });
});
```

## Compliance and Legal Considerations

### Data Privacy

- Emergency data is encrypted and stored securely
- Access to emergency logs is restricted to authorized personnel
- Emergency data retention policies comply with local regulations
- User consent is obtained for emergency contact information

### Legal Compliance

- Integration with local emergency services follows regulatory requirements
- Emergency response protocols align with local laws
- Data sharing agreements with emergency services are in place
- Regular audits of emergency response procedures

### User Rights

- Users can update their emergency contacts at any time
- Users can disable emergency features if desired
- Clear privacy policy regarding emergency data usage
- Right to access and correct emergency contact information

This comprehensive emergency services integration ensures the safety and security of all users in the RideSharing application, providing multiple layers of protection and rapid response capabilities.</content>
<parameter name="filePath">/Users/pranabpaul/Desktop/Blog/RideSharingApp/docs/emergency-services.md
