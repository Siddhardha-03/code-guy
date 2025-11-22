# Railway + Render Cross-Platform Configuration
# Complete integration guide for Railway (database) + Render (server/client) deployment

## Overview
This guide ensures proper communication between:
- **Railway MySQL** → Database hosting
- **Render Server** → Node.js/Express API 
- **Render Client** → React static site
- **Firebase** → Authentication service

## Step 1: Environment Variables Synchronization

### 1.1 Railway Database Variables
```bash
# Railway Dashboard → Variables (automatically provided)
MYSQL_URL=mysql://username:password@host:port/database
MYSQLDATABASE=railway
MYSQLHOST=containers-us-west-xx.railway.app
MYSQLPASSWORD=generated_secure_password
MYSQLPORT=3306
MYSQLUSER=root
```

### 1.2 Render Server Environment Variables
```env
# Copy these from Railway to Render Server Dashboard → Environment

NODE_ENV=production
PORT=10000

# Database connection (map Railway variables)
DB_HOST=containers-us-west-xx.railway.app  # From MYSQLHOST
DB_PORT=3306                               # From MYSQLPORT  
DB_USER=root                               # From MYSQLUSER
DB_PASSWORD=generated_secure_password      # From MYSQLPASSWORD
DB_NAME=railway                            # From MYSQLDATABASE

# Security
JWT_SECRET=generate_secure_32_char_secret_here

# External APIs
JUDGE0_BASE_URL=https://ce.judge0.com

# Client URL (update after client deployment)
CLIENT_URL=https://code-guy-client.onrender.com

# Firebase
FIREBASE_PROJECT_ID=code-guy
```

### 1.3 Render Client Build Variables
```env
# Render Static Site → Environment (Build-time variables)

# API endpoint (your deployed server URL)
REACT_APP_API_URL=https://code-guy-server.onrender.com/api

# Firebase configuration
REACT_APP_FIREBASE_API_KEY=AIzaSyCmz6BMReZW8XNJa54wU2j4Z_IeHCyilf8
REACT_APP_FIREBASE_AUTH_DOMAIN=code-guy.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=code-guy
REACT_APP_FIREBASE_STORAGE_BUCKET=code-guy.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=490751208380
REACT_APP_FIREBASE_APP_ID=1:490751208380:web:d5cf322310a2e4f11e99b9

# Build optimization
GENERATE_SOURCEMAP=false
DISABLE_ESLINT_PLUGIN=true
```

## Step 2: CORS Configuration Update

### 2.1 Server CORS Setup (server/index.js)
Update the CORS configuration to handle multiple Render domains:

```javascript
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Parse CLIENT_URL environment variable
    const allowedOrigins = [];
    
    if (process.env.CLIENT_URL) {
      // Support multiple URLs separated by commas
      allowedOrigins.push(...process.env.CLIENT_URL.split(','));
    }
    
    // Add localhost for development
    if (process.env.NODE_ENV !== 'production') {
      allowedOrigins.push('http://localhost:3000', 'http://localhost:3001');
    }
    
    // Default fallback
    if (allowedOrigins.length === 0) {
      allowedOrigins.push('http://localhost:3000');
    }
    
    console.log('Allowed origins:', allowedOrigins);
    console.log('Request origin:', origin);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200 // For legacy browser support
};
```

### 2.2 Update CLIENT_URL After Deployment
```bash
# In Render Server Dashboard → Environment Variables
CLIENT_URL=https://code-guy-client.onrender.com

# For multiple domains (if using custom domains)
CLIENT_URL=https://code-guy-client.onrender.com,https://your-custom-domain.com
```

## Step 3: Firebase Cross-Platform Setup

### 3.1 Add All Domains to Firebase
In Firebase Console → Authentication → Settings → Authorized domains:
```
# Render domains
code-guy-client.onrender.com
code-guy-server.onrender.com  # If needed for server-side auth

# Custom domains (if applicable)  
your-custom-domain.com

# Development (keep for testing)
localhost
```

### 3.2 Firebase Security Rules (Optional)
```javascript
// Firebase Firestore rules (if using Firestore)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 4: Network Security Configuration

### 4.1 API Security Headers
Add to server/index.js:
```javascript
// Security middleware
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '3600');
    return res.status(200).end();
  }
  
  next();
});
```

### 4.2 Railway Database Security
Railway databases are automatically secured with:
- SSL/TLS encryption in transit
- Private networking within Railway
- Automatic backups
- Access restricted to authorized connections

## Step 5: Connection Testing

### 5.1 Test Database Connection
Create a test script for Railway connection:
```javascript
// test-full-stack.js
const axios = require('axios');

async function testFullStack() {
  const SERVER_URL = 'https://code-guy-server.onrender.com';
  const CLIENT_URL = 'https://code-guy-client.onrender.com';
  
  try {
    // Test server health
    console.log('Testing server health...');
    const health = await axios.get(`${SERVER_URL}/api/health`);
    console.log('✅ Server health:', health.data);
    
    // Test CORS
    console.log('Testing CORS...');
    const corsTest = await axios.get(`${SERVER_URL}/api/questions`, {
      headers: { 'Origin': CLIENT_URL }
    });
    console.log('✅ CORS working correctly');
    
    // Test authentication endpoint
    console.log('Testing auth endpoint...');
    const authTest = await axios.post(`${SERVER_URL}/api/auth/verify`, {}, {
      headers: { 'Origin': CLIENT_URL }
    });
    console.log('✅ Auth endpoint accessible');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testFullStack();
```

### 5.2 Client-Server Integration Test
```javascript
// Add to React app for production testing
useEffect(() => {
  const testIntegration = async () => {
    try {
      // Test API connection
      const response = await fetch(`${process.env.REACT_APP_API_URL}/health`);
      const data = await response.json();
      console.log('✅ API Integration:', data);
      
      // Test Firebase connection
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        console.log('✅ Firebase token obtained');
      }
      
    } catch (error) {
      console.error('❌ Integration test failed:', error);
    }
  };
  
  if (process.env.NODE_ENV === 'production') {
    testIntegration();
  }
}, []);
```

## Step 6: Deployment Sequence

### 6.1 Correct Deployment Order
```bash
# 1. Deploy Railway Database first
railway up  # Or use Railway dashboard

# 2. Deploy Render Server with database credentials
# Configure environment variables in Render dashboard

# 3. Deploy Render Client with server API URL
# Configure build-time variables in Render dashboard

# 4. Update server CORS with client URL
# Add CLIENT_URL environment variable to server

# 5. Update Firebase authorized domains
# Add both server and client URLs to Firebase console
```

### 6.2 Environment Variable Propagation
```mermaid
graph LR
    Railway[Railway DB] --> Server[Render Server]
    Server --> Client[Render Client]
    Firebase[Firebase] --> Client
    Firebase --> Server
```

## Step 7: Monitoring & Health Checks

### 7.1 Cross-Platform Health Check
```javascript
// Enhanced health check endpoint
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {}
  };
  
  try {
    // Test database
    const db = require('./utils/db');
    await db.testConnection();
    health.services.database = 'connected';
    
    // Test Firebase admin (if initialized)
    try {
      const admin = require('./firebaseAdmin');
      if (admin.isFirebaseInitialized) {
        health.services.firebase = 'initialized';
      }
    } catch (e) {
      health.services.firebase = 'not_configured';
    }
    
    // Test external APIs
    try {
      const judge0Response = await axios.get(`${process.env.JUDGE0_BASE_URL}/system_info`);
      health.services.judge0 = 'available';
    } catch (e) {
      health.services.judge0 = 'unavailable';
    }
    
    res.json(health);
    
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
      services: health.services
    });
  }
});
```

### 7.2 Client Network Monitor
```javascript
// Add to React app
const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [apiStatus, setApiStatus] = useState('unknown');
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Test API connectivity
    const testAPI = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/health`);
        setApiStatus(response.ok ? 'connected' : 'error');
      } catch {
        setApiStatus('disconnected');
      }
    };
    
    testAPI();
    const interval = setInterval(testAPI, 30000); // Check every 30s
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);
  
  return { isOnline, apiStatus };
};
```

## Step 8: Troubleshooting Guide

### Common CORS Issues
```bash
# Issue: CORS error in browser console
# Solution: Check CLIENT_URL in server environment variables

# Issue: Pre-flight OPTIONS requests failing
# Solution: Verify CORS middleware handles OPTIONS method

# Issue: Credentials not included in requests
# Solution: Ensure credentials: true in both server and client
```

### Database Connection Issues
```bash
# Issue: Connection timeout to Railway
# Solution: Verify DB_HOST matches Railway hostname exactly

# Issue: Access denied errors
# Solution: Check DB_PASSWORD matches Railway generated password

# Issue: Database not found
# Solution: Verify DB_NAME matches MYSQLDATABASE from Railway
```

### Firebase Authentication Issues
```bash
# Issue: Firebase auth fails in production
# Solution: Add production domains to Firebase authorized domains

# Issue: Token verification fails on server
# Solution: Check FIREBASE_PROJECT_ID environment variable

# Issue: Google Sign-In not working
# Solution: Verify OAuth domains in Google Cloud Console
```

## Step 9: Performance Optimization

### 9.1 Database Connection Pooling
```javascript
// Optimized for Railway + Render
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,        // Adjust based on Railway plan
  queueLimit: 0,
  acquireTimeout: 60000,      // Render timeout consideration
  timeout: 60000,
  reconnect: true,
  idleTimeout: 300000         // 5 minutes
});
```

### 9.2 API Response Caching
```javascript
// Add caching middleware for static data
const cache = {};
const cacheMiddleware = (duration = 300) => (req, res, next) => {
  if (req.method !== 'GET') return next();
  
  const key = req.originalUrl;
  const cached = cache[key];
  
  if (cached && (Date.now() - cached.timestamp) < duration * 1000) {
    return res.json(cached.data);
  }
  
  const originalSend = res.json;
  res.json = function(data) {
    cache[key] = { data, timestamp: Date.now() };
    originalSend.call(this, data);
  };
  
  next();
};

// Use on appropriate routes
app.get('/api/questions', cacheMiddleware(300), questionRoutes);
```

## Step 10: Production Checklist

### Pre-Deployment Verification
- [ ] Railway database deployed and accessible
- [ ] Server environment variables configured
- [ ] Client build environment variables set
- [ ] Firebase domains updated
- [ ] CORS configuration updated
- [ ] Health check endpoints working

### Post-Deployment Testing
- [ ] Complete user registration flow
- [ ] Email and Google sign-in working
- [ ] Contest creation and participation
- [ ] Quiz functionality
- [ ] Code submission and execution
- [ ] Admin panel access
- [ ] Mobile responsiveness

### Monitoring Setup
- [ ] Health check endpoints responding
- [ ] Error logging configured
- [ ] Performance monitoring active
- [ ] Database connection stable
- [ ] API response times acceptable

## Cost Summary
- **Railway MySQL**: $5-10/month
- **Render Server**: $7/month (Starter plan)
- **Render Client**: Free (Static site)
- **Total**: $12-17/month for full production stack

## Next Steps
1. ✅ All platform configurations complete
2. 🔄 Deploy in correct sequence (Railway → Server → Client)
3. 🔄 Test complete application flow
4. 🔄 Monitor performance and errors
5. 🔄 Configure custom domains (optional)