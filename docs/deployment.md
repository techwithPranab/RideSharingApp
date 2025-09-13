# Deployment Documentation

This document provides comprehensive information about deploying the RideSharing application to various environments.

## Overview

The application consists of multiple components:
- Backend API (Node.js/Express with TypeScript)
- MongoDB Database
- Mobile Applications (React Native for iOS/Android)
- Real-time Socket.IO server
- Payment Gateway integration (Razorpay)
- SMS Service integration (Twilio)

## Docker Deployment

### Docker Compose Setup

The application includes a `docker-compose.yml` file for easy deployment:

```yaml
version: '3.8'

services:
  # MongoDB Database
  mongodb:
    image: mongo:6.0
    container_name: rideshare-mongo
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: rideshare
    volumes:
      - mongodb_data:/data/db
      - ./database/init:/docker-entrypoint-initdb.d
    ports:
      - "27017:27017"
    networks:
      - rideshare-network

  # Redis for caching and session management
  redis:
    image: redis:7-alpine
    container_name: rideshare-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - rideshare-network

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: rideshare-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3000
      - MONGODB_URI=mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@mongodb:27017/rideshare?authSource=admin
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}
      - RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET}
      - TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
      - TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
      - TWILIO_PHONE_NUMBER=${TWILIO_PHONE_NUMBER}
      - CLIENT_URL=${CLIENT_URL}
    ports:
      - "3000:3000"
    depends_on:
      - mongodb
      - redis
    volumes:
      - ./backend/logs:/app/logs
    networks:
      - rideshare-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: rideshare-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - backend
    networks:
      - rideshare-network

volumes:
  mongodb_data:
  redis_data:

networks:
  rideshare-network:
    driver: bridge
```

### Backend Dockerfile

```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    python3 \
    make \
    g++ \
    sqlite-dev

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/
COPY utils/ ./utils/
COPY migrations/ ./migrations/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]
```

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Database Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=secure_password_123
MONGODB_URI=mongodb://admin:secure_password_123@localhost:27017/rideshare?authSource=admin

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Server Configuration
NODE_ENV=production
PORT=3000
CLIENT_URL=https://yourdomain.com

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Twilio SMS Service
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# File Upload Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=/app/logs/app.log

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
```

## Deployment Steps

### 1. Local Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/rideshare-app.git
cd rideshare-app

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env

# Start development server
npm run dev
```

### 2. Production Deployment with Docker

```bash
# Build and start services
docker-compose up -d --build

# Check service status
docker-compose ps

# View logs
docker-compose logs -f backend

# Scale services if needed
docker-compose up -d --scale backend=3
```

### 3. Database Setup

```bash
# Connect to MongoDB
docker exec -it rideshare-mongo mongo -u admin -p secure_password_123

# Create database and collections
use rideshare

# Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "phone": 1 }, { unique: true })
db.users.createIndex({ "currentLocation": "2dsphere" })
db.rides.createIndex({ "pickupLocation": "2dsphere" })
db.rides.createIndex({ "dropoffLocation": "2dsphere" })
db.rides.createIndex({ "createdAt": -1 })
db.vehicles.createIndex({ "driverId": 1 })
db.payments.createIndex({ "rideId": 1 })
```

### 4. Nginx Configuration

Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # Performance
    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    upstream backend {
        server backend:3000;
    }

    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

        # API endpoints
        location /api/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 86400;
        }

        # Socket.IO
        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files
        location /static/ {
            proxy_pass http://backend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Health check
        location /health {
            proxy_pass http://backend;
            access_log off;
        }

        # Default location
        location / {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

## Cloud Deployment Options

### 1. AWS Deployment

#### EC2 with Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.17.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository
git clone https://github.com/yourusername/rideshare-app.git
cd rideshare-app

# Configure environment
cp .env.example .env
nano .env

# Start services
docker-compose up -d --build
```

#### AWS ECS (Elastic Container Service)

Create `ecs-task-definition.json`:

```json
{
  "family": "rideshare-backend",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-registry/rideshare-backend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "MONGODB_URI",
          "value": "mongodb://username:password@docdb-cluster.cluster-xxxxxx.us-east-1.docdb.amazonaws.com:27017/rideshare"
        }
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/rideshare-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### 2. Google Cloud Platform

#### Cloud Run Deployment

```bash
# Build and push Docker image
gcloud builds submit --tag gcr.io/project-id/rideshare-backend

# Deploy to Cloud Run
gcloud run deploy rideshare-backend \
  --image gcr.io/project-id/rideshare-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production" \
  --set-secrets "JWT_SECRET=jwt-secret:latest" \
  --set-secrets "MONGODB_URI=mongodb-uri:latest"
```

#### Kubernetes Deployment

Create `k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rideshare-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rideshare-backend
  template:
    metadata:
      labels:
        app: rideshare-backend
    spec:
      containers:
      - name: backend
        image: gcr.io/project-id/rideshare-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: mongodb-secret
              key: uri
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 3. Heroku Deployment

```bash
# Create Heroku app
heroku create rideshare-backend

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set MONGODB_URI=your_mongodb_uri

# Deploy
git push heroku main
```

## Database Migration

### Migration Scripts

Create migration files in `backend/migrations/`:

```javascript
// migrations/001_initial_schema.js
const mongoose = require('mongoose');

module.exports = {
  async up() {
    // Create collections and indexes
    await mongoose.connection.db.createCollection('users');
    await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
    await mongoose.connection.db.collection('users').createIndex({ phone: 1 }, { unique: true });
    await mongoose.connection.db.collection('users').createIndex({ currentLocation: '2dsphere' });

    await mongoose.connection.db.createCollection('rides');
    await mongoose.connection.db.collection('rides').createIndex({ pickupLocation: '2dsphere' });
    await mongoose.connection.db.collection('rides').createIndex({ dropoffLocation: '2dsphere' });
    await mongoose.connection.db.collection('rides').createIndex({ createdAt: -1 });

    console.log('Initial schema migration completed');
  },

  async down() {
    // Rollback migration
    await mongoose.connection.db.dropCollection('users');
    await mongoose.connection.db.dropCollection('rides');
    console.log('Initial schema migration rolled back');
  }
};
```

### Running Migrations

```javascript
// migration-runner.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir).sort();

    for (const file of migrationFiles) {
      if (file.endsWith('.js')) {
        console.log(`Running migration: ${file}`);
        const migration = require(path.join(migrationsDir, file));
        await migration.up();
      }
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runMigrations();
```

## Monitoring and Logging

### Application Monitoring

```javascript
// monitoring.js
const express = require('express');
const { collectDefaultMetrics, register } = require('prom-client');

const app = express();

// Enable default metrics collection
collectDefaultMetrics();

// Custom metrics
const rideRequestsTotal = new Counter({
  name: 'ride_requests_total',
  help: 'Total number of ride requests',
  labelNames: ['status']
});

const activeConnections = new Gauge({
  name: 'active_socket_connections',
  help: 'Number of active socket connections'
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = app;
```

### Log Aggregation

```javascript
// logger.js
const winston = require('winston');
const { format } = winston;

// Define log format
const logFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'rideshare-backend' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// If we're not in production then log to the console with a simple format
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

module.exports = logger;
```

## Security Best Practices

### SSL/TLS Configuration

```nginx
# SSL Configuration for Nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

// API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiting (more restrictive)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Socket rate limiting
const socketLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 socket events per minute
  message: 'Too many socket events, please slow down.',
});
```

### Data Encryption

```javascript
const crypto = require('crypto');

// Encrypt sensitive data
function encrypt(text) {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Decrypt sensitive data
function decrypt(encrypted) {
  const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

## Backup and Recovery

### Database Backup

```bash
# MongoDB backup script
#!/bin/bash

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="rideshare_backup_$DATE"

# Create backup
docker exec rideshare-mongo mongodump \
  --db rideshare \
  --username $MONGO_ROOT_USERNAME \
  --password $MONGO_ROOT_PASSWORD \
  --out /backup/$BACKUP_NAME

# Compress backup
docker exec rideshare-mongo tar -czf /backup/$BACKUP_NAME.tar.gz -C /backup $BACKUP_NAME

# Upload to cloud storage (AWS S3 example)
aws s3 cp /backup/$BACKUP_NAME.tar.gz s3://your-backup-bucket/

# Clean up old backups (keep last 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### Automated Backup with Cron

```bash
# Add to crontab for daily backups at 2 AM
0 2 * * * /path/to/backup-script.sh
```

## Performance Optimization

### Database Optimization

```javascript
// Optimized queries with indexes
const userQueries = {
  // Find nearby drivers
  async findNearbyDrivers(location, radius = 5000) {
    return await User.find({
      role: 'driver',
      isAvailable: true,
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [location.lng, location.lat]
          },
          $maxDistance: radius
        }
      }
    }).select('name phone currentLocation vehicle rating');
  },

  // Find active rides for user
  async findActiveRides(userId) {
    return await Ride.find({
      $or: [
        { driverId: userId },
        { 'passengers.userId': userId }
      ],
      status: { $in: ['confirmed', 'started', 'arrived'] }
    }).populate('driverId', 'name phone').populate('passengers.userId', 'name phone');
  }
};
```

### Caching Strategy

```javascript
const redis = require('redis');
const client = redis.createClient({ url: process.env.REDIS_URL });

// Cache user data
async function getCachedUser(userId) {
  const cacheKey = `user:${userId}`;
  const cached = await client.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const user = await User.findById(userId);
  if (user) {
    await client.setex(cacheKey, 3600, JSON.stringify(user)); // Cache for 1 hour
  }

  return user;
}

// Cache ride search results
async function cacheRideSearch(query, results) {
  const cacheKey = `ride_search:${JSON.stringify(query)}`;
  await client.setex(cacheKey, 300, JSON.stringify(results)); // Cache for 5 minutes
}
```

## Testing Deployment

### Load Testing

```bash
# Install Artillery for load testing
npm install -g artillery

# Create load test script
# test-load.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: Warm up
    - duration: 120
      arrivalRate: 50
      name: Load testing
    - duration: 60
      arrivalRate: 100
      name: Stress testing

scenarios:
  - name: 'User registration and login'
    weight: 30
    flow:
      - post:
          url: '/api/auth/register'
          json:
            name: 'Test User {{ $randomInt }}'
            email: 'test{{ $randomInt }}@example.com'
            phone: '+1234567890'
            password: 'password123'
      - post:
          url: '/api/auth/login'
          json:
            email: 'test{{ $randomInt }}@example.com'
            password: 'password123'

  - name: 'Ride search'
    weight: 40
    flow:
      - post:
          url: '/api/rides/search'
          json:
            pickupLocation: { lat: 37.7749, lng: -122.4194 }
            dropoffLocation: { lat: 37.7849, lng: -122.4294 }

  - name: 'Socket connection'
    weight: 30
    engine: socketio
    flow:
      - emit:
          channel: 'updateLocation'
          data:
            lat: 37.7749
            lng: -122.4194

# Run load test
artillery run test-load.yml
```

### Health Checks

```javascript
// Comprehensive health check
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {}
  };

  try {
    // Check MongoDB connection
    await mongoose.connection.db.admin().ping();
    health.services.database = 'healthy';
  } catch (error) {
    health.services.database = 'unhealthy';
    health.status = 'unhealthy';
  }

  try {
    // Check Redis connection
    await redisClient.ping();
    health.services.redis = 'healthy';
  } catch (error) {
    health.services.redis = 'unhealthy';
    health.status = 'unhealthy';
  }

  // Check external services
  try {
    // Check Razorpay API
    const razorpayHealth = await checkRazorpayHealth();
    health.services.razorpay = razorpayHealth ? 'healthy' : 'unhealthy';
  } catch (error) {
    health.services.razorpay = 'unhealthy';
  }

  try {
    // Check Twilio API
    const twilioHealth = await checkTwilioHealth();
    health.services.twilio = twilioHealth ? 'healthy' : 'unhealthy';
  } catch (error) {
    health.services.twilio = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check MongoDB logs
   docker-compose logs mongodb

   # Test connection
   docker exec -it rideshare-mongo mongo --eval "db.stats()"
   ```

2. **Socket.IO Connection Issues**
   ```bash
   # Check backend logs
   docker-compose logs backend

   # Test socket connection
   curl -X GET http://localhost:3000/socket.io/?EIO=4&transport=polling
   ```

3. **Memory Issues**
   ```bash
   # Monitor memory usage
   docker stats

   # Check Node.js memory usage
   docker exec rideshare-backend node -e "console.log(process.memoryUsage())"
   ```

4. **SSL Certificate Issues**
   ```bash
   # Test SSL certificate
   openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

   # Check certificate expiry
   openssl x509 -in cert.pem -text -noout | grep "Not After"
   ```

### Log Analysis

```bash
# View recent logs
docker-compose logs --tail=100 -f backend

# Search for specific errors
docker-compose logs backend | grep "ERROR"

# Analyze log patterns
docker-compose logs backend | grep "WARN" | head -20
```

This comprehensive deployment documentation provides everything needed to successfully deploy the RideSharing application to production environments with proper monitoring, security, and scalability considerations.
