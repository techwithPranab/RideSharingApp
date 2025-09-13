#!/bin/bash

# RideSharing App API Testing Script
# This script runs the Postman collection using Newman

set -e

echo "🚀 Starting RideSharing App API Tests"
echo "====================================="

# Check if Newman is installed
if ! command -v newman &> /dev/null; then
    echo "❌ Newman is not installed. Installing..."
    npm install -g newman newman-reporter-html
    echo "✅ Newman installed successfully"
fi

# Check if collection and environment files exist
if [ ! -f "RideSharing_API_Postman_Collection.json" ]; then
    echo "❌ Collection file not found: RideSharing_API_Postman_Collection.json"
    exit 1
fi

if [ ! -f "RideSharing_Postman_Environment.postman_environment.json" ]; then
    echo "❌ Environment file not found: RideSharing_Postman_Environment.postman_environment.json"
    exit 1
fi

# Create results directory
mkdir -p ../../test-results

# Run the tests
echo "📋 Running API tests..."
newman run RideSharing_API_Postman_Collection.json \
    -e RideSharing_Postman_Environment.postman_environment.json \
    --reporters cli,json,html \
    --reporter-json-export ../../test-results/test-results.json \
    --reporter-html-export ../../test-results/test-results.html \
    --timeout 30000 \
    --delay-request 1000 \
    --verbose

# Check test results
if [ $? -eq 0 ]; then
    echo "✅ All tests passed!"
    echo "📊 Test results saved to ../../test-results/"
    echo "   - JSON: ../../test-results/test-results.json"
    echo "   - HTML: ../../test-results/test-results.html"
else
    echo "❌ Some tests failed. Check the results above."
    exit 1
fi

echo ""
echo "🎉 API Testing completed!"
echo "📈 Open test-results/test-results.html in your browser for detailed results."
