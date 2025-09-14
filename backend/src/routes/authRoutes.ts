/**
 * Authentication routes
 * Handles user registration, login, OTP verification, and profile management
 */

import { Router } from 'express';
import { body } from 'express-validator';

import * as authController from '../controllers/authController';
import { protect } from '../middleware/auth';
import { UserRole } from '../models/User';

const router = Router();

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('role')
    .isIn(Object.values(UserRole))
    .withMessage('Invalid user role'),
  body('phoneNumber')
    .optional()
    .matches(/^\+91[6-9]\d{9}$/)
    .withMessage('Please provide a valid Indian phone number'),
  body('referralCode')
    .optional()
    .isLength({ min: 6, max: 8 })
    .withMessage('Referral code must be 6-8 characters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
];

const adminLoginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const otpValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number')
];

// Public routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/admin/login', adminLoginValidation, authController.adminLogin);
router.post('/send-otp', loginValidation, authController.sendLoginOTP);
router.post('/verify-otp', otpValidation, authController.verifyEmailOTP);

// Protected routes
router.use(protect); // All routes below this middleware require authentication

router.get('/me', authController.getMe);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);

// Email verification routes
router.post('/send-email-verification', authController.sendEmailVerification);
router.post('/verify-email', authController.verifyEmail);

export default router;
