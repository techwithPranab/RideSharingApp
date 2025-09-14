/**
 * Test script to verify Brevo email configuration
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

import { emailService } from './src/services/emailService';

async function testBrevoEmail() {
  try {
    console.log('🔄 Initializing email service...');
    await emailService.initialize();

    console.log('📧 Sending test email...');
    await emailService.sendOTPEmail(
      'pranabpiitk@gmail.com', // Replace with your test email
      'Test User',
      '123456'
    );

    console.log('✅ Test email sent successfully!');
    console.log('📬 Check your email inbox for the test OTP email');
  } catch (error) {
    console.error('❌ Failed to send test email:', error);

    // Provide helpful troubleshooting information
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('1. Check your EMAIL_USER and EMAIL_PASS in .env file');
    console.log('2. Make sure your Brevo account is active');
    console.log('3. Verify your SMTP credentials in Brevo dashboard');
    console.log('4. Try using your API key as the password');
    console.log('5. If port 587 doesn\'t work, try port 465 (SSL)');

    console.log('\n📖 For detailed setup instructions, see BREVO_SETUP.md');
  }
}

// Run the test
testBrevoEmail();
