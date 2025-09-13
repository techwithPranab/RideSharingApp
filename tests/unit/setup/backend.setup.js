/**
 * Backend unit test setup
 * Configuration for Node.js testing environment
 */

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/ridesharing_test';
process.env.RAZORPAY_KEY_ID = 'rzp_test_demo_key';
process.env.RAZORPAY_KEY_SECRET = 'demo_secret_key';

// Global test timeout
jest.setTimeout(10000);

// Mock console methods for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Suppress console.error and console.warn during tests
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Mock database connection
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(true),
  connection: {
    close: jest.fn().mockResolvedValue(true)
  },
  Schema: jest.fn().mockImplementation(() => ({
    pre: jest.fn(),
    post: jest.fn(),
    index: jest.fn(),
    statics: {},
    methods: {}
  })),
  model: jest.fn(),
  Types: {
    ObjectId: jest.fn().mockImplementation((id) => id || 'mock-object-id')
  }
}));

// Mock external services
jest.mock('razorpay', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    orders: {
      create: jest.fn().mockResolvedValue({
        id: 'order_test123',
        amount: 100000,
        currency: 'INR',
        receipt: 'receipt_123'
      })
    },
    payments: {
      fetch: jest.fn().mockResolvedValue({
        id: 'pay_test123',
        status: 'captured'
      })
    }
  }))
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ id: 'user-id', role: 'rider' }),
  decode: jest.fn().mockReturnValue({ id: 'user-id', role: 'rider' })
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('salt')
}));

// Mock socket.io
jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => ({
    use: jest.fn(),
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis()
  }))
}));

// Global test utilities
global.createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  user: { id: 'test-user-id', role: 'rider' },
  headers: { authorization: 'Bearer mock-token' },
  ...overrides
});

global.createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis()
  };
  return res;
};

global.createMockNext = () => jest.fn();
