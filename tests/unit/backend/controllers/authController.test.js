/**
 * Unit tests for Authentication Controller
 * Tests user registration, login, OTP verification, and profile management
 */

const { AuthController } = require('../../../../backend/src/controllers/authController');
const { User } = require('../../../../backend/src/models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock dependencies
jest.mock('../../../../backend/src/models/User');
jest.mock('../../../../backend/src/services/smsService');
jest.mock('../../../../backend/src/utils/apiResponse');

describe('AuthController', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        email: 'john@example.com',
        role: 'rider'
      };

      mockReq.body = userData;

      // Mock User.findOne to return null (user doesn't exist)
      User.findOne.mockResolvedValue(null);

      // Mock User.create to return new user
      const mockUser = {
        _id: 'user-id',
        ...userData,
        isVerified: false,
        save: jest.fn().mockResolvedValue(true)
      };
      User.create.mockResolvedValue(mockUser);

      // Mock SMS service
      const smsService = require('../../../../backend/src/services/smsService');
      smsService.sendOTP.mockResolvedValue(true);

      await AuthController.register(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({
        $or: [
          { phoneNumber: userData.phoneNumber },
          { email: userData.email }
        ]
      });
      expect(User.create).toHaveBeenCalledWith(expect.objectContaining(userData));
      expect(smsService.sendOTP).toHaveBeenCalledWith(userData.phoneNumber, expect.any(String));
    });

    it('should return error if user already exists', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        email: 'john@example.com',
        role: 'rider'
      };

      mockReq.body = userData;

      // Mock existing user
      User.findOne.mockResolvedValue({ _id: 'existing-user' });

      const ApiResponse = require('../../../../backend/src/utils/apiResponse');
      ApiResponse.error = jest.fn();

      await AuthController.register(mockReq, mockRes);

      expect(ApiResponse.error).toHaveBeenCalledWith(
        mockRes,
        'User already exists with this phone number or email',
        400
      );
    });

    it('should validate required fields', async () => {
      mockReq.body = {
        firstName: 'John'
        // Missing required fields
      };

      const ApiResponse = require('../../../../backend/src/utils/apiResponse');
      ApiResponse.error = jest.fn();

      await AuthController.register(mockReq, mockRes);

      expect(ApiResponse.error).toHaveBeenCalledWith(
        mockRes,
        'Missing required fields',
        400
      );
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const loginData = {
        phoneNumber: '+1234567890',
        password: 'password123'
      };

      mockReq.body = loginData;

      const mockUser = {
        _id: 'user-id',
        phoneNumber: loginData.phoneNumber,
        password: 'hashed-password',
        isVerified: true,
        role: 'rider',
        toObject: jest.fn().mockReturnValue({
          _id: 'user-id',
          phoneNumber: loginData.phoneNumber,
          role: 'rider'
        })
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock-jwt-token');

      const ApiResponse = require('../../../../backend/src/utils/apiResponse');
      ApiResponse.success = jest.fn();

      await AuthController.login(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({
        phoneNumber: loginData.phoneNumber
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password);
      expect(ApiResponse.success).toHaveBeenCalledWith(
        mockRes,
        expect.objectContaining({
          message: 'Login successful',
          data: expect.objectContaining({
            token: 'mock-jwt-token',
            user: expect.any(Object)
          })
        })
      );
    });

    it('should return error for invalid credentials', async () => {
      mockReq.body = {
        phoneNumber: '+1234567890',
        password: 'wrongpassword'
      };

      User.findOne.mockResolvedValue(null);

      const ApiResponse = require('../../../../backend/src/utils/apiResponse');
      ApiResponse.error = jest.fn();

      await AuthController.login(mockReq, mockRes);

      expect(ApiResponse.error).toHaveBeenCalledWith(
        mockRes,
        'Invalid credentials',
        401
      );
    });

    it('should return error for unverified user', async () => {
      const mockUser = {
        _id: 'user-id',
        phoneNumber: '+1234567890',
        password: 'hashed-password',
        isVerified: false
      };

      mockReq.body = {
        phoneNumber: '+1234567890',
        password: 'password123'
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const ApiResponse = require('../../../../backend/src/utils/apiResponse');
      ApiResponse.error = jest.fn();

      await AuthController.login(mockReq, mockRes);

      expect(ApiResponse.error).toHaveBeenCalledWith(
        mockRes,
        'Please verify your phone number first',
        401
      );
    });
  });

  describe('verifyOTP', () => {
    it('should verify OTP successfully', async () => {
      mockReq.body = {
        phoneNumber: '+1234567890',
        otp: '1234'
      };

      const mockUser = {
        _id: 'user-id',
        phoneNumber: '+1234567890',
        otp: '1234',
        otpExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        isVerified: false,
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: 'user-id',
          phoneNumber: '+1234567890',
          isVerified: true
        })
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('mock-jwt-token');

      const ApiResponse = require('../../../../backend/src/utils/apiResponse');
      ApiResponse.success = jest.fn();

      await AuthController.verifyOTP(mockReq, mockRes);

      expect(mockUser.isVerified).toBe(true);
      expect(mockUser.otp).toBeUndefined();
      expect(mockUser.otpExpires).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalled();
      expect(ApiResponse.success).toHaveBeenCalledWith(
        mockRes,
        expect.objectContaining({
          message: 'Phone number verified successfully',
          data: expect.objectContaining({
            token: 'mock-jwt-token',
            user: expect.any(Object)
          })
        })
      );
    });

    it('should return error for invalid OTP', async () => {
      mockReq.body = {
        phoneNumber: '+1234567890',
        otp: 'wrong'
      };

      const mockUser = {
        _id: 'user-id',
        phoneNumber: '+1234567890',
        otp: '1234',
        otpExpires: new Date(Date.now() + 10 * 60 * 1000)
      };

      User.findOne.mockResolvedValue(mockUser);

      const ApiResponse = require('../../../../backend/src/utils/apiResponse');
      ApiResponse.error = jest.fn();

      await AuthController.verifyOTP(mockReq, mockRes);

      expect(ApiResponse.error).toHaveBeenCalledWith(
        mockRes,
        'Invalid or expired OTP',
        400
      );
    });

    it('should return error for expired OTP', async () => {
      mockReq.body = {
        phoneNumber: '+1234567890',
        otp: '1234'
      };

      const mockUser = {
        _id: 'user-id',
        phoneNumber: '+1234567890',
        otp: '1234',
        otpExpires: new Date(Date.now() - 1000) // Expired
      };

      User.findOne.mockResolvedValue(mockUser);

      const ApiResponse = require('../../../../backend/src/utils/apiResponse');
      ApiResponse.error = jest.fn();

      await AuthController.verifyOTP(mockReq, mockRes);

      expect(ApiResponse.error).toHaveBeenCalledWith(
        mockRes,
        'Invalid or expired OTP',
        400
      );
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      mockReq.user = { id: 'user-id' };

      const mockUser = {
        _id: 'user-id',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        email: 'john@example.com',
        toObject: jest.fn().mockReturnValue({
          _id: 'user-id',
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '+1234567890',
          email: 'john@example.com'
        })
      };

      User.findById.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(mockUser)
      }));

      const ApiResponse = require('../../../../backend/src/utils/apiResponse');
      ApiResponse.success = jest.fn();

      await AuthController.getProfile(mockReq, mockRes);

      expect(User.findById).toHaveBeenCalledWith('user-id');
      expect(ApiResponse.success).toHaveBeenCalledWith(
        mockRes,
        expect.objectContaining({
          message: 'Profile retrieved successfully',
          data: { user: expect.any(Object) }
        })
      );
    });

    it('should return error if user not found', async () => {
      mockReq.user = { id: 'non-existent-user' };

      User.findById.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(null)
      }));

      const ApiResponse = require('../../../../backend/src/utils/apiResponse');
      ApiResponse.error = jest.fn();

      await AuthController.getProfile(mockReq, mockRes);

      expect(ApiResponse.error).toHaveBeenCalledWith(
        mockRes,
        'User not found',
        404
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      mockReq.user = { id: 'user-id' };
      mockReq.body = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com'
      };

      const mockUpdatedUser = {
        _id: 'user-id',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        toObject: jest.fn().mockReturnValue({
          _id: 'user-id',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com'
        })
      };

      User.findByIdAndUpdate.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(mockUpdatedUser)
      }));

      const ApiResponse = require('../../../../backend/src/utils/apiResponse');
      ApiResponse.success = jest.fn();

      await AuthController.updateProfile(mockReq, mockRes);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user-id',
        mockReq.body,
        { new: true, runValidators: true }
      );
      expect(ApiResponse.success).toHaveBeenCalledWith(
        mockRes,
        expect.objectContaining({
          message: 'Profile updated successfully',
          data: { user: expect.any(Object) }
        })
      );
    });
  });
});
