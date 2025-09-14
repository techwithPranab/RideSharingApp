# Brevo Email Configuration Guide

## Setup Instructions

1. **Create a Brevo Account**
   - Go to [brevo.com](https://brevo.com) and create an account
   - Verify your email address

2. **Get SMTP Credentials**
   - Log in to your Brevo dashboard
   - Go to **Transactional** → **SMTP**
   - You have two options:
     - **Option A**: Generate dedicated SMTP credentials
     - **Option B**: Use your account email and API key as password

3. **Update Environment Variables**
   Update your `.env` file with the correct Brevo credentials:

   ```env
   EMAIL_HOST=smtp-relay.brevo.com
   EMAIL_PORT=587
   EMAIL_USER=YOUR_BREVO_SMTP_LOGIN
   EMAIL_PASS=YOUR_BREVO_SMTP_PASSWORD_OR_API_KEY
   EMAIL_FROM="RideShare Pro" <noreply@yourdomain.com>
   ```

   **For Option A (Dedicated SMTP credentials):**
   ```env
   EMAIL_USER=your_smtp_username@smtp-brevo.com
   EMAIL_PASS=your_generated_smtp_password
   ```

   **For Option B (API Key method):**
   ```env
   EMAIL_USER=your_account_email@example.com
   EMAIL_PASS=your_brevo_api_key
   ```

4. **Get API Key (if using Option B)**
   - In Brevo dashboard, go to **Account Settings** → **API Keys**
   - Create a new API key with SMTP permissions
   - Copy the API key to use as EMAIL_PASS

5. **Verify Domain (Recommended)**
   - In Brevo dashboard, go to **Transactional** → **Domain**
   - Add and verify your domain for better deliverability

6. **Test the Configuration**
   - Run the test script: `npx ts-node test-email.ts`
   - Check your email inbox for the test OTP email

## Brevo SMTP Settings

- **Host**: smtp-relay.brevo.com
- **Port**: 587 (TLS) or 465 (SSL)
- **Authentication**: Login
- **Security**: STARTTLS

## Troubleshooting

1. **Authentication Failed**: Double-check your SMTP username and password/API key
2. **Connection Issues**: Ensure port 587 is not blocked by your firewall
3. **Domain Not Verified**: Emails may go to spam if domain is not verified
4. **Rate Limits**: Brevo has sending limits based on your plan
5. **API Key Issues**: Make sure your API key has SMTP permissions

## Alternative Configuration (Port 465)

If port 587 doesn't work, try using port 465 with SSL:

```env
EMAIL_PORT=465
```

And update the email service config to use secure connection.

## Features Configured

- ✅ OTP Email sending
- ✅ Welcome emails
- ✅ Email verification
- ✅ Password reset emails
- ✅ Transactional emails (ride confirmations, payments, etc.)

The email service is now fully configured for Brevo and ready to use once you add your credentials!
