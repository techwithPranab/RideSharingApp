# API Configuration Guide

This project uses a centralized configuration approach for API URLs across all applications.

## Configuration Files

### 1. Shared Configuration (`.env.shared`)
Contains common environment variables that can be shared across all apps:
```env
API_BASE_URL=http://localhost:5000/api
SOCKET_URL=http://localhost:5000
NODE_ENV=development
```

### 2. Application-Specific Configurations

#### Driver App (`mobile/driver-app/.env`)
```env
EXPO_PROJECT_ID=rideshare-driver-dev-12345
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
EXPO_PUBLIC_SOCKET_URL=http://localhost:5000
```

#### Rider App (`mobile/rider-app/.env`)
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
EXPO_PUBLIC_SOCKET_URL=http://localhost:5000
```

#### Admin App (`admin/.env`)
```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

#### Backend (`.env`)
```env
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your_brevo_smtp_username
EMAIL_PASS=your_brevo_smtp_password
EMAIL_FROM="RideShare Pro" <noreply@yourdomain.com>
```

## How It Works

### Mobile Apps (React Native/Expo)
- Use `EXPO_PUBLIC_` prefixed environment variables
- Configuration is loaded from `src/constants/config.ts`
- Falls back to default values if environment variables are not set

### Admin App (React)
- Uses `REACT_APP_` prefixed environment variables
- Configuration is loaded directly in API service files

### Backend (Node.js)
- Uses standard environment variables
- Loaded via `dotenv.config()` in `server.ts`

## Usage Examples

### In Mobile Apps:
```typescript
import { API_BASE_URL, SOCKET_URL } from '../constants/config';

// API calls
const response = await api.post('/auth/login', credentials);

// Socket connections
const socket = io(SOCKET_URL, { auth: { token } });
```

### In Admin App:
```typescript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
```

## Environment-Specific Configuration

For different environments (development, staging, production), create separate `.env` files:

- `.env.development`
- `.env.staging`
- `.env.production`

## Benefits

1. **Centralized Configuration**: All API URLs are managed in one place
2. **Environment Flexibility**: Easy to switch between dev/staging/prod
3. **Consistency**: All apps use the same configuration pattern
4. **Security**: Sensitive values can be properly managed
5. **Maintainability**: Changes to API URLs only need to be made in one place

## Deployment

When deploying to different environments, make sure to:

1. Set the correct environment variables in your deployment platform
2. Update the API URLs to point to the correct backend instances
3. Test all applications after configuration changes

## Troubleshooting

1. **API calls failing**: Check that `API_BASE_URL` is correctly set
2. **Socket connections failing**: Verify `SOCKET_URL` points to the backend
3. **Environment variables not loading**: Ensure `.env` files are in the correct locations
4. **Mobile apps not picking up changes**: Restart the Expo development server
