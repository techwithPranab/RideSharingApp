/**
 * Unit tests for Payment Service
 * Tests payment processing, Razorpay integration, and split payments
 */

const { PaymentService } = require('../../../../backend/src/services/paymentService');
const { Payment } = require('../../../../backend/src/models/Payment');
const { Ride } = require('../../../../backend/src/models/Ride');
const Razorpay = require('razorpay');

// Mock dependencies
jest.mock('../../../../backend/src/models/Payment');
jest.mock('../../../../backend/src/models/Ride');
jest.mock('razorpay');

describe('PaymentService', () => {
  let mockRazorpayInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Razorpay instance
    mockRazorpayInstance = {
      orders: {
        create: jest.fn()
      },
      payments: {
        fetch: jest.fn()
      }
    };
    Razorpay.mockImplementation(() => mockRazorpayInstance);
  });

  describe('createOrder', () => {
    it('should create Razorpay order successfully', async () => {
      const paymentRequest = {
        amount: 100.50,
        currency: 'INR',
        description: 'Test payment'
      };

      const mockOrder = {
        id: 'order_test123',
        amount: 10050, // Amount in paisa
        currency: 'INR',
        receipt: 'receipt_123'
      };

      mockRazorpayInstance.orders.create.mockResolvedValue(mockOrder);

      const result = await PaymentService.createOrder(paymentRequest);

      expect(mockRazorpayInstance.orders.create).toHaveBeenCalledWith({
        amount: 10050, // 100.50 * 100
        currency: 'INR',
        receipt: expect.any(String),
        notes: {
          description: 'Test payment'
        }
      });

      expect(result).toEqual({
        id: 'order_test123',
        amount: 10050,
        currency: 'INR',
        receipt: 'receipt_123',
        status: undefined
      });
    });

    it('should throw error if Razorpay is not configured', async () => {
      // Mock no Razorpay configuration
      PaymentService.razorpay = null;

      const paymentRequest = {
        amount: 100.50,
        currency: 'INR'
      };

      await expect(PaymentService.createOrder(paymentRequest)).rejects.toThrow(
        'Payment gateway not configured. Please configure Razorpay keys.'
      );
    });
  });

  describe('createPaymentRecord', () => {
    it('should create payment record in database', async () => {
      const paymentRequest = {
        amount: 100.50,
        currency: 'INR',
        method: 'card',
        description: 'Test payment',
        rideId: 'ride-id',
        payerId: 'user-id',
        payeeId: 'driver-id'
      };

      const mockPayment = {
        _id: 'payment-id',
        paymentId: 'PAY123',
        amount: 100.50,
        save: jest.fn().mockResolvedValue(true)
      };

      Payment.mockImplementation(() => mockPayment);

      const result = await PaymentService.createPaymentRecord(paymentRequest, 'order_123');

      expect(Payment).toHaveBeenCalledWith(expect.objectContaining({
        amount: 100.50,
        currency: 'INR',
        method: 'card',
        description: 'Test payment',
        rideId: 'ride-id',
        payerId: 'user-id',
        payeeId: 'driver-id',
        gatewayOrderId: 'order_123',
        status: 'pending'
      }));

      expect(mockPayment.save).toHaveBeenCalled();
      expect(result).toBe(mockPayment);
    });
  });

  describe('processRidePayment', () => {
    it('should process ride payment successfully', async () => {
      const rideId = 'ride-id';
      const payerId = 'rider-id';
      const paymentMethod = 'card';

      const mockRide = {
        _id: 'ride-id',
        status: 'completed',
        totalFare: 150.00,
        driverId: { _id: 'driver-id' },
        passengers: [{ userId: 'rider-id' }],
        rideId: 'R123'
      };

      const mockOrder = {
        id: 'order_test123',
        amount: 15000,
        currency: 'INR'
      };

      const mockPayment = {
        _id: 'payment-id',
        paymentId: 'PAY123'
      };

      Ride.findById.mockImplementation(() => ({
        populate: jest.fn().mockReturnThis()
      }));
      Ride.findById().populate.mockResolvedValue(mockRide);

      Payment.findOne.mockResolvedValue(null); // No existing payment

      // Mock static methods
      PaymentService.createOrder = jest.fn().mockResolvedValue(mockOrder);
      PaymentService.createPaymentRecord = jest.fn().mockResolvedValue(mockPayment);

      const result = await PaymentService.processRidePayment(rideId, payerId, paymentMethod);

      expect(Ride.findById).toHaveBeenCalledWith(rideId);
      expect(PaymentService.createOrder).toHaveBeenCalledWith(expect.objectContaining({
        amount: 150.00,
        currency: 'INR',
        method: paymentMethod,
        description: 'Payment for ride R123'
      }));

      expect(result).toEqual({
        payment: mockPayment,
        order: mockOrder
      });
    });

    it('should throw error if ride not found', async () => {
      const rideId = 'non-existent-ride';
      const payerId = 'rider-id';
      const paymentMethod = 'card';

      Ride.findById.mockImplementation(() => ({
        populate: jest.fn().mockResolvedValue(null)
      }));

      await expect(
        PaymentService.processRidePayment(rideId, payerId, paymentMethod)
      ).rejects.toThrow('Ride not found');
    });

    it('should throw error if ride is not completed', async () => {
      const mockRide = {
        _id: 'ride-id',
        status: 'started', // Not completed
        totalFare: 150.00
      };

      Ride.findById.mockImplementation(() => ({
        populate: jest.fn().mockResolvedValue(mockRide)
      }));

      await expect(
        PaymentService.processRidePayment('ride-id', 'rider-id', 'card')
      ).rejects.toThrow('Ride must be completed before payment');
    });

    it('should throw error if payment already exists', async () => {
      const mockRide = {
        _id: 'ride-id',
        status: 'completed',
        totalFare: 150.00
      };

      const existingPayment = {
        _id: 'existing-payment',
        status: 'completed'
      };

      Ride.findById.mockImplementation(() => ({
        populate: jest.fn().mockResolvedValue(mockRide)
      }));

      Payment.findOne.mockResolvedValue(existingPayment);

      await expect(
        PaymentService.processRidePayment('ride-id', 'rider-id', 'card')
      ).rejects.toThrow('Payment already exists for this ride');
    });
  });

  describe('verifyPayment', () => {
    it('should verify payment signature successfully', async () => {
      const verificationData = {
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'valid_signature'
      };

      // Mock crypto for signature verification
      const crypto = require('crypto');
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('valid_signature')
      };
      crypto.createHmac = jest.fn().mockReturnValue(mockHmac);

      const result = await PaymentService.verifyPayment(verificationData);

      expect(crypto.createHmac).toHaveBeenCalledWith('sha256', expect.any(String));
      expect(mockHmac.update).toHaveBeenCalledWith('order_123|pay_123');
      expect(mockHmac.digest).toHaveBeenCalledWith('hex');
      expect(result).toBe(true);
    });

    it('should return false for invalid signature', async () => {
      const verificationData = {
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'invalid_signature'
      };

      const crypto = require('crypto');
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('valid_signature')
      };
      crypto.createHmac = jest.fn().mockReturnValue(mockHmac);

      const result = await PaymentService.verifyPayment(verificationData);

      expect(result).toBe(false);
    });
  });

  describe('handlePaymentSuccess', () => {
    it('should handle successful payment', async () => {
      const paymentId = 'PAY123';
      const gatewayPaymentId = 'pay_123';
      const gatewaySignature = 'signature_123';

      const mockPayment = {
        _id: 'payment-id',
        paymentId: 'PAY123',
        status: 'pending',
        save: jest.fn().mockResolvedValue(true)
      };

      Payment.findOne.mockResolvedValue(mockPayment);

      const result = await PaymentService.handlePaymentSuccess(
        paymentId,
        gatewayPaymentId,
        gatewaySignature
      );

      expect(Payment.findOne).toHaveBeenCalledWith({ paymentId });
      expect(mockPayment.status).toBe('completed');
      expect(mockPayment.gatewayTransactionId).toBe(gatewayPaymentId);
      expect(mockPayment.gatewaySignature).toBe(gatewaySignature);
      expect(mockPayment.completedAt).toBeDefined();
      expect(mockPayment.save).toHaveBeenCalled();
      expect(result).toBe(mockPayment);
    });
  });

  describe('calculateSplitFare', () => {
    it('should calculate split fare correctly', () => {
      const totalFare = 100.00;
      const passengerCount = 2;
      const platformCommission = 0.15;

      const result = PaymentService.calculateSplitFare(
        totalFare,
        passengerCount,
        platformCommission
      );

      expect(result.platformFee).toBe(15.00); // 15% of 100
      expect(result.driverEarnings).toBe(85.00); // 100 - 15
      expect(result.passengerAmount).toBe(42.50); // 85 / 2
    });

    it('should use default platform commission', () => {
      const totalFare = 200.00;
      const passengerCount = 4;

      const result = PaymentService.calculateSplitFare(totalFare, passengerCount);

      expect(result.platformFee).toBe(30.00); // 15% of 200 (default)
      expect(result.driverEarnings).toBe(170.00); // 200 - 30
      expect(result.passengerAmount).toBe(42.50); // 170 / 4
    });
  });

  describe('processRefund', () => {
    it('should process refund successfully', async () => {
      const paymentId = 'PAY123';
      const refundAmount = 50.00;

      const mockPayment = {
        _id: 'payment-id',
        paymentId: 'PAY123',
        status: 'completed',
        amount: 100.00,
        gatewayTransactionId: 'pay_123',
        save: jest.fn().mockResolvedValue(true)
      };

      const mockRefund = {
        id: 'rfnd_123',
        amount: 5000,
        payment_id: 'pay_123'
      };

      Payment.findOne.mockResolvedValue(mockPayment);
      mockRazorpayInstance.refunds = {
        create: jest.fn().mockResolvedValue(mockRefund)
      };

      const mockRefundPayment = {
        _id: 'refund-payment-id',
        save: jest.fn().mockResolvedValue(true)
      };
      Payment.mockImplementation(() => mockRefundPayment);

      const result = await PaymentService.processRefund(paymentId, refundAmount);

      expect(Payment.findOne).toHaveBeenCalledWith({ paymentId });
      expect(mockRazorpayInstance.refunds.create).toHaveBeenCalledWith({
        payment_id: 'pay_123',
        amount: 5000 // Amount in paisa
      });

      expect(result).toBe(mockRefundPayment);
    });

    it('should throw error if payment not found', async () => {
      Payment.findOne.mockResolvedValue(null);

      await expect(
        PaymentService.processRefund('non-existent-payment')
      ).rejects.toThrow('Payment not found');
    });

    it('should throw error if payment not completed', async () => {
      const mockPayment = {
        status: 'pending'
      };

      Payment.findOne.mockResolvedValue(mockPayment);

      await expect(
        PaymentService.processRefund('PAY123')
      ).rejects.toThrow('Can only refund completed payments');
    });
  });
});
