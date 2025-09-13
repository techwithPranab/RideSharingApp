# RideSharing App API Testing Framework

This repository contains a comprehensive Postman collection for testing the RideSharing App APIs. The collection covers all major functionalities including authentication, subscription management, ride booking, payments, and more.

## 📋 Table of Contents

- [Quick Start](#quic### Newman Integration
```bash
# Install Newman
npm install -g newman newman-reporter-html

# Run collection (from project root)
./tests/e2e/run-api-tests.sh

# Or run manually
newman run tests/e2e/RideSharing_API_Postman_Collection.json \
  -e tests/e2e/RideSharing_Postman_Environment.postman_environment.json \
  --reporters cli,json,html \
  --reporter-json-export test-results/test-results.json \
  --reporter-html-export test-results/test-results.html

# Or use the config file
newman run --config tests/e2e/newman-config.json
```[API Endpoints Covered](#api-endpoints-covered)
- [Test Scenarios](#test-scenarios)
- [Environment Setup](#environment-setup)
- [Authentication Flow](#authentication-flow)
- [Subscription Testing](#subscription-testing)
- [Ride Management Testing](#ride-management-testing)
- [Error Testing](#error-testing)
- [Load Testing](#load-testing)
- [Best Practices](#best-practices)

## 🚀 Quick Start

### Prerequisites

1. **Postman** installed on your system
2. **RideSharing App Backend** running on `http://localhost:5000`
3. **MongoDB** database with seed data

### Setup Steps

1. **Import Collection and Environment:**
   - Open Postman
   - Click "Import" button
   - Import `tests/e2e/RideSharing_API_Postman_Collection.json`
   - Import `tests/e2e/RideSharing_Postman_Environment.postman_environment.json`

2. **Set Environment:**
   - Select "RideSharing App Environment" from the environment dropdown

3. **Start Testing:**
   - Begin with the "Complete User Journey - New User" folder
   - Run requests in order for a complete flow

4. **Automated Testing (Optional):**
   - Run `./tests/e2e/run-api-tests.sh` for automated testing
   - View results in `test-results/test-results.html`
   - Test data: `tests/e2e/test-data.json`
   - Report template: `tests/e2e/test-report-template.md`

## 📚 API Endpoints Covered

### Authentication
- ✅ Send OTP
- ✅ Register User
- ✅ Login User
- ✅ Get User Profile
- ✅ Update User Profile

### Subscription Management
- ✅ Get All Subscription Plans
- ✅ Purchase Subscription (Basic/Premium)
- ✅ Validate Subscription
- ✅ Get Active Subscription
- ✅ Get Subscription History
- ✅ Cancel Subscription

### Ride Management
- ✅ Request Ride (Regular/Pooled)
- ✅ Get Ride Details
- ✅ Get Active Ride
- ✅ Get Ride History
- ✅ Cancel Ride
- ✅ Rate and Review Ride
- ✅ Get Fare Estimate

### Payment Management
- ✅ Get Payment Methods
- ✅ Add Payment Method (Card/UPI)
- ✅ Process Payment
- ✅ Get Payment History

### Places & Location
- ✅ Search Places
- ✅ Get Place Details
- ✅ Reverse Geocode

### User Management
- ✅ Update User Location
- ✅ Get Saved Addresses
- ✅ Add Saved Address (Home/Work)

### Notifications
- ✅ Get Notifications
- ✅ Mark Notification as Read
- ✅ Mark All Notifications as Read

## 🧪 Test Scenarios

### Complete User Journey
1. **Send OTP** → Register new user
2. **Login** → Authenticate user
3. **Get Plans** → View subscription options
4. **Purchase Subscription** → Subscribe to a plan
5. **Validate Subscription** → Check subscription status
6. **Request Ride** → Book a ride with discount

### Error Scenarios
- Invalid authentication token
- Invalid phone number format
- Invalid subscription plan ID
- Unauthorized ride requests
- Missing required parameters

### Load Testing Scenarios
- Multiple concurrent ride requests
- Bulk subscription validations
- High-frequency API calls

## 🔧 Environment Setup

### Environment Variables

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `baseUrl` | API base URL | `http://localhost:5000/api` |
| `token` | JWT auth token | Auto-populated |
| `userId` | Current user ID | Auto-populated |
| `subscriptionId` | Current subscription ID | Auto-populated |
| `rideId` | Current ride ID | Auto-populated |
| `testPhoneNumber` | Test phone for auth | `9999999999` |
| `testOTP` | Test OTP code | `123456` |

### Pre-request Scripts

The collection includes pre-request scripts that:
- Set timestamps for unique requests
- Auto-extract tokens from login responses
- Populate user IDs and subscription IDs
- Handle response data automatically

## 🔐 Authentication Flow

### 1. Send OTP
```json
POST /api/auth/send-otp
{
  "phoneNumber": "9999999999"
}
```

### 2. Register/Login
```json
POST /api/auth/register
{
  "phoneNumber": "9999999999",
  "otp": "123456",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com"
}
```

### 3. Use Token
All subsequent requests include:
```
Authorization: Bearer {{token}}
```

## 💳 Subscription Testing

### View Available Plans
```json
GET /api/subscriptions/plans
```

### Purchase Subscription
```json
POST /api/subscriptions/purchase
{
  "planId": "PLAN_BASIC_MONTHLY",
  "paymentMethod": "card",
  "autoRenew": true
}
```

### Validate Subscription
```json
POST /api/subscriptions/validate
```

## 🚗 Ride Management Testing

### Request a Ride
```json
POST /api/rides/request
{
  "riderId": "{{userId}}",
  "pickupLocation": {
    "latitude": 12.9716,
    "longitude": 77.5946,
    "address": "123 Main St, Bangalore"
  },
  "dropoffLocation": {
    "latitude": 12.9816,
    "longitude": 77.6046,
    "address": "456 Oak Ave, Bangalore"
  },
  "rideType": "regular",
  "estimatedFare": 250,
  "subscriptionDiscount": 15
}
```

### Get Fare Estimate
```json
POST /api/rides/fare-estimate
{
  "pickupLat": 12.9716,
  "pickupLng": 77.5946,
  "dropoffLat": 12.9816,
  "dropoffLng": 77.6046,
  "isPooled": false
}
```

## ❌ Error Testing

### Invalid Token
- Use an expired or invalid JWT token
- Expected: 401 Unauthorized

### Invalid Phone Number
```json
{
  "phoneNumber": "invalid"
}
```
- Expected: 400 Bad Request

### Invalid Subscription Plan
```json
{
  "planId": "INVALID_PLAN"
}
```
- Expected: 400 Bad Request

## ⚡ Load Testing

### Using Postman Runner
1. Select a folder (e.g., "Load Testing Scenarios")
2. Click "Run" button
3. Configure iterations and delay
4. Monitor response times and error rates

### Performance Metrics to Monitor
- Response time per request
- Error rate percentage
- Throughput (requests/second)
- Memory usage on server

## 📊 Best Practices

### 1. Test Order
Always run tests in this order:
1. Authentication tests first
2. Subscription tests
3. Ride management tests
4. Payment tests

### 2. Environment Management
- Use separate environments for dev/staging/prod
- Never commit sensitive data
- Update environment variables as needed

### 3. Data Cleanup
- Reset test data between test runs
- Use unique identifiers for test data
- Clean up created resources after testing

### 4. Response Validation
- Check HTTP status codes
- Validate response structure
- Verify data integrity
- Test edge cases

### 5. Documentation
- Keep collection updated with API changes
- Document test scenarios clearly
- Include expected vs actual results

## 🔍 Troubleshooting

### Common Issues

**401 Unauthorized**
- Check if token is set correctly
- Verify token hasn't expired
- Ensure user is authenticated

**400 Bad Request**
- Validate request payload format
- Check required fields are present
- Verify data types match API expectations

**500 Internal Server Error**
- Check server logs
- Verify database connection
- Ensure all dependencies are running

### Debug Tips
- Use Postman's console for detailed logs
- Check network tab for request/response details
- Validate environment variables are set
- Test individual endpoints before running collections

## 📈 Advanced Features

### Collection Runner
- Run entire collections automatically
- Set iterations and delays
- Generate test reports
- Export results for analysis

### Newman Integration
```bash
# Install Newman
npm install -g newman

# Run collection
newman run RideSharing_API_Postman_Collection.json \
  -e RideSharing_Postman_Environment.postman_environment.json \
  --reporters cli,json \
  --reporter-json-export results.json
```

### CI/CD Integration
- Integrate with GitHub Actions
- Automate API testing in pipelines
- Generate test reports
- Set up monitoring alerts

## 🤝 Contributing

1. Update collection with new API endpoints
2. Add comprehensive test cases
3. Document changes in this README
4. Test thoroughly before committing

## 📞 Support

For issues with the API testing framework:
1. Check this documentation first
2. Review Postman console logs
3. Check backend server logs
4. Create an issue with detailed reproduction steps

---

**Happy Testing! 🚀**
