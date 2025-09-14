const jwt = require('jsonwebtoken');

// JWT secret from .env file
const JWT_SECRET = '020d4b0675ee5ca9bce3d280e51ea4823ea0b7947405326200d1c81303f639ba7c2b544a';

// Test user payload
const testUser = {
  id: '507f1f77bcf86cd799439011', // Example MongoDB ObjectId
  email: 'testdriver@example.com',
  firstName: 'Test',
  lastName: 'Driver',
  role: 'driver'
};

// Generate JWT token
const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '24h' });

console.log('Test JWT Token:');
console.log(token);
