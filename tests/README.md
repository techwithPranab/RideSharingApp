# RideSharing App Tests

This directory contains all test-related files for the RideSharing application.

## 📁 Directory Structure

```
tests/
├── e2e/                    # End-to-End API Tests
│   ├── run-api-tests.sh    # Automated test runner script
│   ├── newman-config.json  # Newman configuration for CI/CD
│   ├── test-data.json      # Sample test data for seeding
│   ├── test-report-template.md # Test report template
│   ├── RideSharing_API_Postman_Collection.json # Postman collection
│   └── RideSharing_Postman_Environment.postman_environment.json # Postman environment
├── integration/            # Integration tests
└── unit/                   # Unit tests
```

## 🚀 Running Tests

### API Tests (E2E)
```bash
# From project root
./tests/e2e/run-api-tests.sh
```

### Manual Newman Run
```bash
# From project root
newman run --config tests/e2e/newman-config.json

# Or run directly
newman run tests/e2e/RideSharing_API_Postman_Collection.json \
  -e tests/e2e/RideSharing_Postman_Environment.postman_environment.json \
  --reporters cli,json,html \
  --reporter-json-export test-results/test-results.json \
  --reporter-html-export test-results/test-results.html
```

## 📊 Test Results
- Results are saved to `test-results/` directory
- HTML reports: `test-results/test-results.html`
- JSON data: `test-results/test-results.json`

## 🧪 Test Coverage

### E2E Tests
- ✅ Authentication flow (OTP, Register, Login)
- ✅ Subscription management (Plans, Purchase, Validation)
- ✅ Ride management (Request, Track, Rate)
- ✅ Payment processing (Methods, Transactions)
- ✅ Location services (Places, Geocoding)
- ✅ User management (Addresses, Preferences)
- ✅ Error scenarios and edge cases

### Test Data
Sample test data is available in `test-data.json` for:
- Users (riders and drivers)
- Subscription plans
- Vehicles
- Payment methods
- Addresses

## 📋 CI/CD Integration
Tests are automatically run via GitHub Actions on:
- Push to main/develop branches
- Pull requests
- Manual workflow dispatch

## 🤝 Contributing
1. Add new test cases to the Postman collection
2. Update test data as needed
3. Ensure all tests pass before committing
4. Update documentation for new test scenarios
