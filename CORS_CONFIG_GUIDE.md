# CORS Configuration Guide for Driver App

## Overview

Cross-Origin Resource Sharing (CORS) configuration is essential for allowing your driver app and other client applications to communicate with the backend API. This guide explains how to configure CORS for different scenarios.

## Current Configuration

The backend is configured with a flexible CORS setup that supports:

### 1. **Mobile Apps (Primary Use Case)**
- ✅ Native mobile apps (iOS/Android) - No CORS restrictions
- ✅ Expo development server URLs
- ✅ Localhost development URLs

### 2. **Web Applications**
- ✅ Admin panel (`http://localhost:3000`)
- ✅ Rider app web version (`http://localhost:3001`)
- ✅ Custom domains

### 3. **Development Tools**
- ✅ Postman, Insomnia, and other API testing tools
- ✅ Browser-based testing during development

## Environment Configuration

### Backend `.env` File
```env
# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:8081,exp://192.168.1.*,exp://10.0.2.2:8081,exp://localhost:8081
```

### Mobile App Environment Files

#### Driver App (`.env`)
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
EXPO_PUBLIC_SOCKET_URL=http://localhost:5000
```

#### Rider App (`.env`)
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
EXPO_PUBLIC_SOCKET_URL=http://localhost:5000
```

## CORS Configuration Details

### Backend CORS Settings

The backend uses a dynamic CORS configuration that:

1. **Allows requests with no origin** (mobile apps, Postman)
2. **Automatically allows localhost URLs** for development
3. **Supports Expo development server URLs** (exp:// patterns)
4. **Checks against explicitly allowed origins** from environment variables
5. **Allows all origins in development mode** for flexibility
6. **Restricts origins in production** for security

### Supported HTTP Methods
- `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`

### Supported Headers
- `Content-Type`
- `Authorization`
- `X-Requested-With`

## Common Scenarios

### 1. **Local Development**
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,exp://localhost:8081
```

### 2. **Network Development (Same Network)**
```env
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.100:3000,exp://192.168.1.100:8081
```

### 3. **Production**
```env
ALLOWED_ORIGINS=https://admin.yourdomain.com,https://driver.yourdomain.com,https://rider.yourdomain.com
```

### 4. **Expo Go App**
When using Expo Go on physical devices:
```env
ALLOWED_ORIGINS=exp://192.168.1.*,exp://10.0.2.2:8081
```

## Troubleshooting

### Issue: "CORS error" in browser console
**Solution**: Add the requesting origin to `ALLOWED_ORIGINS`

### Issue: Mobile app can't connect
**Solution**: Mobile apps typically don't need CORS. Check network connectivity and API URLs.

### Issue: Expo app shows network error
**Solution**: Ensure the backend URL is accessible from the device/emulator.

### Issue: Socket.IO connection fails
**Solution**: Socket.IO uses the same CORS configuration. Check `SOCKET_URL` in mobile app config.

## Testing CORS Configuration

### 1. **Test with Browser**
```javascript
// Open browser console and run:
fetch('http://localhost:5000/api/health')
  .then(response => response.json())
  .then(data => console.log(data));
```

### 2. **Test with Mobile App**
- Ensure API_BASE_URL points to correct backend
- Check network connectivity
- Verify backend is running on correct port

### 3. **Test with Postman**
- No CORS restrictions apply
- Can test all endpoints directly

## Security Considerations

### Development
- CORS is permissive for development flexibility
- All origins allowed when `NODE_ENV=development`

### Production
- Restrict origins to your domain only
- Use HTTPS for all connections
- Implement proper authentication

## Advanced Configuration

### Custom CORS Middleware
```typescript
// In server.ts
const customCorsOptions = {
  origin: (origin, callback) => {
    // Custom logic for origin validation
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(customCorsOptions));
```

### Environment-Specific Origins
```typescript
const getAllowedOrigins = () => {
  switch (process.env.NODE_ENV) {
    case 'development':
      return ['http://localhost:3000', 'exp://*'];
    case 'staging':
      return ['https://staging-admin.yourdomain.com'];
    case 'production':
      return ['https://admin.yourdomain.com'];
    default:
      return [];
  }
};
```

## Mobile App Specific Notes

### iOS Simulator
- Uses `localhost` or `127.0.0.1`
- May need to use `http://localhost:5000` instead of `http://10.0.2.2:5000`

### Android Emulator
- Uses `10.0.2.2` for localhost
- May need to use `http://10.0.2.2:5000` instead of `http://localhost:5000`

### Physical Devices
- Must use the computer's IP address
- Example: `http://192.168.1.100:5000`
- Ensure firewall allows connections on port 5000

## Summary

The CORS configuration is now properly set up to support:
- ✅ Driver mobile app (primary use case)
- ✅ Rider mobile app
- ✅ Admin web panel
- ✅ Development tools and testing
- ✅ Expo development servers
- ✅ Production deployments

The configuration automatically adapts based on the environment and supports both development and production scenarios.
