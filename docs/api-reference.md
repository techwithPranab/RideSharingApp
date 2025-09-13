# API Reference Documentation

This document provides comprehensive API reference for the RideSharing App backend.

## Base URL
```
http://localhost:3000/api
```

## Authentication

All API requests require authentication except for authentication endpoints. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this standard format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error information"
  }
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate limited to prevent abuse:
- General endpoints: 100 requests per minute
- Authentication endpoints: 10 requests per minute
- Search endpoints: 30 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1638360000
```

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Invalid request data |
| `AUTHENTICATION_FAILED` | Invalid or missing JWT token |
| `AUTHORIZATION_FAILED` | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | Requested resource doesn't exist |
| `RESOURCE_CONFLICT` | Resource already exists or conflict |
| `PAYMENT_FAILED` | Payment processing failed |
| `RIDE_NOT_AVAILABLE` | No drivers available for the route |
| `INVALID_STATUS_TRANSITION` | Invalid ride status change |
| `OTP_EXPIRED` | OTP has expired |
| `OTP_INVALID` | Invalid OTP provided |

## Pagination

List endpoints support pagination with these query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |
| `sort` | string | '-createdAt' | Sort field (prefix with - for descending) |

Pagination response format:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## Data Types

### Location Object
```json
{
  "type": "Point",
  "coordinates": [longitude, latitude],
  "address": "Human readable address"
}
```

### User Object
```json
{
  "id": "60d5ecb74b24c72b8c8b4567",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "email": "john@example.com",
  "role": "rider",
  "avatar": "https://example.com/avatar.jpg",
  "averageRating": 4.8,
  "isVerified": true
}
```

### Vehicle Object
```json
{
  "id": "60d5ecb74b24c72b8c8b4569",
  "make": "Toyota",
  "model": "Camry",
  "year": 2020,
  "licensePlate": "ABC123",
  "type": "sedan",
  "color": "White",
  "capacity": 4
}
```

### Ride Object
```json
{
  "id": "60d5ecb74b24c72b8c8b4567",
  "rideId": "R20250913001",
  "status": "accepted",
  "isPooled": false,
  "capacity": 1,
  "estimatedDistance": 2.5,
  "estimatedDuration": 15,
  "totalFare": 25.50,
  "paymentMethod": "card",
  "requestedAt": "2025-09-13T10:30:00.000Z",
  "driver": {...},
  "vehicle": {...},
  "passengers": [...]
}
```

## Webhooks

### Payment Webhooks

Razorpay payment webhooks are handled at:
```
POST /api/payments/webhook
```

Webhook events:
- `payment.captured` - Payment successfully captured
- `payment.failed` - Payment failed
- `refund.processed` - Refund processed

### Security

- Webhook signature verification using Razorpay secret
- Idempotent processing to handle duplicate events
- Comprehensive logging for audit trails

## File Upload

### Supported Formats
- Images: JPEG, PNG, WebP (max 5MB)
- Documents: PDF, DOC, DOCX (max 10MB)

### Upload Endpoints
- `POST /api/upload/avatar` - User avatar upload
- `POST /api/upload/documents` - KYC documents upload
- `POST /api/upload/vehicle` - Vehicle documents upload

### Upload Response
```json
{
  "success": true,
  "data": {
    "url": "https://cdn.example.com/uploads/avatar_123.jpg",
    "filename": "avatar_123.jpg",
    "size": 245760,
    "mimeType": "image/jpeg"
  }
}
```

## Caching

API responses are cached using Redis:
- Ride search results: 5 minutes
- User profiles: 15 minutes
- Vehicle information: 30 minutes
- Static data: 1 hour

Cache headers are included:
```
Cache-Control: public, max-age=300
ETag: "abc123"
```

## Compression

All API responses are compressed using gzip:
- JSON responses automatically compressed
- Compression ratio: 60-80% reduction
- Minimum response size for compression: 1KB

## CORS

Cross-Origin Resource Sharing is configured for:
- Origins: Configurable via environment variables
- Methods: GET, POST, PUT, PATCH, DELETE
- Headers: Content-Type, Authorization, X-Requested-With
- Credentials: Supported for authenticated requests

## Monitoring

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-09-13T10:30:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "socketio": "running"
  },
  "uptime": "2 days, 4 hours"
}
```

### Metrics
Application metrics are available at `/metrics` (Prometheus format):
- Request count and duration
- Error rates
- Database connection pool stats
- Memory and CPU usage
- Socket.IO connection count

## Versioning

API versioning is handled through:
1. URL path versioning: `/api/v1/rides`
2. Accept header versioning: `Accept: application/vnd.ridesharing.v1+json`
3. Custom header: `X-API-Version: 1`

## Deprecation

Deprecated endpoints include deprecation headers:
```
Deprecation: true
Sunset: Sat, 31 Dec 2025 23:59:59 GMT
Link: </api/v2/rides>; rel="successor-version"
```

## SDKs and Libraries

### JavaScript SDK
```javascript
import { RideSharingAPI } from '@ridesharing/sdk';

const api = new RideSharingAPI({
  baseURL: 'http://localhost:3000/api',
  apiKey: 'your-api-key'
});

// Example usage
const rides = await api.rides.search({
  pickup: [-122.4194, 37.7749],
  dropoff: [-122.4089, 37.7849]
});
```

### Mobile SDKs
- **iOS**: Swift SDK available via CocoaPods
- **Android**: Kotlin SDK available via Maven
- **React Native**: JavaScript SDK with native modules

## Troubleshooting

### Common Issues

#### Authentication Errors
- Verify JWT token is valid and not expired
- Check token is included in Authorization header
- Ensure user account is active

#### Rate Limiting
- Implement exponential backoff
- Cache responses when possible
- Use WebSocket for real-time updates

#### Location Services
- Ensure GPS permissions are granted
- Verify location accuracy settings
- Handle location services disabled gracefully

#### Payment Issues
- Verify payment method is supported
- Check payment amount limits
- Handle payment failures gracefully

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=ridesharing:* npm run dev
```

### Support

For API support:
- 📧 Email: api-support@ridesharingapp.com
- 💬 Slack: #api-support
- 📚 Documentation: https://docs.ridesharingapp.com
- 🐛 Issue Tracker: https://github.com/techwithPranab/RideSharingApp/issues
