/**
 * SMS Service for sending OTP and notifications
 * Supports MSG91 and Twilio providers
 */

import axios from 'axios';
import { logger } from '../utils/logger';

// SMS Provider types
type SMSProvider = 'msg91' | 'twilio';

// SMS configuration
const smsConfig = {
  provider: (process.env.SMS_PROVIDER || 'msg91') as SMSProvider,
  msg91: {
    authKey: process.env.MSG91_AUTH_KEY,
    templateId: process.env.MSG91_TEMPLATE_ID || '607c9f7ad6fc056b4b73d4d1'
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER
  }
};

/**
 * Send OTP via SMS using MSG91
 */
const sendOTPViaMSG91 = async (phoneNumber: string, otp: string): Promise<void> => {
  try {
    const { authKey, templateId } = smsConfig.msg91;
    
    if (!authKey) {
      throw new Error('MSG91 auth key not configured');
    }
    
    const url = 'https://api.msg91.com/api/v5/otp';
    
    const data = {
      template_id: templateId,
      mobile: phoneNumber,
      authkey: authKey,
      otp: otp,
      message: `Your RideShare verification code is ${otp}. Valid for 5 minutes. Do not share with anyone.`
    };
    
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.type !== 'success') {
      throw new Error(`MSG91 API error: ${response.data.message}`);
    }
    
    logger.info(`OTP sent via MSG91 to ${phoneNumber}`);
  } catch (error) {
    logger.error('MSG91 SMS error:', error);
    throw new Error('Failed to send OTP via MSG91');
  }
};

/**
 * Send OTP via SMS using Twilio
 */
const sendOTPViaTwilio = async (phoneNumber: string, otp: string): Promise<void> => {
  try {
    const { accountSid, authToken, phoneNumber: twilioNumber } = smsConfig.twilio;
    
    if (!accountSid || !authToken || !twilioNumber) {
      throw new Error('Twilio configuration incomplete');
    }
    
    // Note: In a real implementation, you would use the Twilio SDK
    // This is a simplified HTTP API call example
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const data = new URLSearchParams({
      From: twilioNumber,
      To: phoneNumber,
      Body: `Your RideShare verification code is ${otp}. Valid for 5 minutes. Do not share with anyone.`
    });
    
    const response = await axios.post(url, data, {
      auth: {
        username: accountSid,
        password: authToken
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (response.status !== 201) {
      throw new Error(`Twilio API error: ${response.statusText}`);
    }
    
    logger.info(`OTP sent via Twilio to ${phoneNumber}`);
  } catch (error) {
    logger.error('Twilio SMS error:', error);
    throw new Error('Failed to send OTP via Twilio');
  }
};

/**
 * Send OTP using configured provider
 */
export const sendOTP = async (phoneNumber: string, otp: string): Promise<void> => {
  try {
    // Validate phone number format (basic validation)
    if (!/^\+91[6-9]\d{9}$/.test(phoneNumber)) {
      throw new Error('Invalid Indian phone number format');
    }
    
    // Send OTP based on configured provider
    switch (smsConfig.provider) {
      case 'msg91':
        await sendOTPViaMSG91(phoneNumber, otp);
        break;
      case 'twilio':
        await sendOTPViaTwilio(phoneNumber, otp);
        break;
      default:
        throw new Error(`Unsupported SMS provider: ${smsConfig.provider}`);
    }
  } catch (error) {
    logger.error('SMS service error:', error);
    throw error;
  }
};

/**
 * Send general SMS notification
 */
export const sendSMS = async (phoneNumber: string, message: string): Promise<void> => {
  try {
    // Validate inputs
    if (!phoneNumber || !message) {
      throw new Error('Phone number and message are required');
    }
    
    if (message.length > 160) {
      logger.warn('SMS message exceeds 160 characters, may be split');
    }
    
    // Send based on provider
    switch (smsConfig.provider) {
      case 'msg91':
        await sendGeneralSMSViaMSG91(phoneNumber, message);
        break;
      case 'twilio':
        await sendGeneralSMSViaTwilio(phoneNumber, message);
        break;
      default:
        throw new Error(`Unsupported SMS provider: ${smsConfig.provider}`);
    }
  } catch (error) {
    logger.error('SMS notification error:', error);
    throw error;
  }
};

/**
 * Send general SMS via MSG91
 */
const sendGeneralSMSViaMSG91 = async (phoneNumber: string, message: string): Promise<void> => {
  try {
    const { authKey } = smsConfig.msg91;
    
    if (!authKey) {
      throw new Error('MSG91 auth key not configured');
    }
    
    const url = 'https://api.msg91.com/api/sendhttp.php';
    
    const params = {
      authkey: authKey,
      mobiles: phoneNumber,
      message: message,
      sender: 'RIDESH',
      route: '4',
      country: '91'
    };
    
    const response = await axios.get(url, { params });
    
    if (!response.data.includes('success')) {
      throw new Error(`MSG91 API error: ${response.data}`);
    }
    
    logger.info(`SMS sent via MSG91 to ${phoneNumber}`);
  } catch (error) {
    logger.error('MSG91 general SMS error:', error);
    throw new Error('Failed to send SMS via MSG91');
  }
};

/**
 * Send general SMS via Twilio
 */
const sendGeneralSMSViaTwilio = async (phoneNumber: string, message: string): Promise<void> => {
  try {
    const { accountSid, authToken, phoneNumber: twilioNumber } = smsConfig.twilio;
    
    if (!accountSid || !authToken || !twilioNumber) {
      throw new Error('Twilio configuration incomplete');
    }
    
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const data = new URLSearchParams({
      From: twilioNumber,
      To: phoneNumber,
      Body: message
    });
    
    const response = await axios.post(url, data, {
      auth: {
        username: accountSid,
        password: authToken
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (response.status !== 201) {
      throw new Error(`Twilio API error: ${response.statusText}`);
    }
    
    logger.info(`SMS sent via Twilio to ${phoneNumber}`);
  } catch (error) {
    logger.error('Twilio general SMS error:', error);
    throw new Error('Failed to send SMS via Twilio');
  }
};

/**
 * Validate SMS configuration
 */
export const validateSMSConfig = (): boolean => {
  switch (smsConfig.provider) {
    case 'msg91':
      return !!(smsConfig.msg91.authKey);
    case 'twilio':
      return !!(smsConfig.twilio.accountSid && 
                smsConfig.twilio.authToken && 
                smsConfig.twilio.phoneNumber);
    default:
      return false;
  }
};
