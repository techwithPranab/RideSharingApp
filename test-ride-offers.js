/**
 * Test script to verify MyOffersScreen API integration
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGM1ZWZlNjY4OGYzODViZmY3ZDhhMDciLCJyb2xlIjoiZHJpdmVyIiwiaWF0IjoxNzU3ODQ0MTg3LCJleHAiOjE3NTg0NDg5ODd9.TCGK3Cn1mBnPv1FH4WV0qw3SlaTN3DxOAF2OmJuHdPA';

async function testRideOffersAPI() {
  try {
    console.log('Testing ride offers API...');

    const response = await axios.get(`${API_BASE_URL}/ride-offers`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('API Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));

    if (response.data.success && response.data.data?.rideOffers) {
      console.log(`✅ Success! Found ${response.data.data.rideOffers.length} ride offers`);
      response.data.data.rideOffers.forEach((offer, index) => {
        console.log(`${index + 1}. ${offer.source.name} → ${offer.destination.name} (${offer.status})`);
      });
    } else {
      console.log('❌ No ride offers found or invalid response structure');
    }

  } catch (error) {
    console.error('❌ API Error:', error.response?.data || error.message);
  }
}

// Run the test
testRideOffersAPI();
