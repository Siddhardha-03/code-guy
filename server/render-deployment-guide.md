# Render Server Deployment Guide
# Complete setup instructions for deploying the Node.js server to Render

## Prerequisites
- GitHub repository with server code
- Railway MySQL database already deployed
- Render account (free tier available)

## Step 1: Prepare Server for Render

### 1.1 Verify package.json
Ensure your `server/package.json` has the correct settings:

```json
{
  "name": "code-guy-server",
  "version": "1.0.0",
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  },
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  }
}
```

### 1.2 Health Check Endpoint
Add this to your `server/index.js`:

```javascript
// Health check endpoint for Render
app.get('/api/health', async (req, res) => {
  try {
    const db = require('./utils/db');
    await db.testConnection();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

## Step 2: Deploy to Render

### 2.1 Create Web Service
1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure service:
   - **Name**: `code-guy-server`
   - **Region**: Oregon (or closest to your users)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 2.2 Environment Variables
Add these environment variables in Render Dashboard:

#### Required Variables
```env
NODE_ENV=production
PORT=10000

# Database (copy from Railway dashboard)
DB_HOST=containers-us-west-xx.railway.app
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_railway_password
DB_NAME=railway

# Security (generate 32+ character secret)
JWT_SECRET=your_secure_jwt_secret_here

# External APIs
JUDGE0_BASE_URL=https://ce.judge0.com

# Firebase
FIREBASE_PROJECT_ID=code-guy
```

#### Optional Variables (update after client deployment)
```env
CLIENT_URL=https://your-client-name.onrender.com
```

### 2.3 Deploy Settings
- **Plan**: Starter ($7/month) or Free (with limitations)
- **Auto-Deploy**: Enable for automatic deployments
- **Health Check Path**: `/api/health`

## Step 3: Configure Advanced Settings

### 3.1 Custom Headers (Optional)
Add in Render Dashboard → Settings → Headers:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### 3.2 Build & Deploy Hooks (Optional)
```bash
# Pre-deploy hook (runs before build)
echo "Starting server deployment..."

# Post-deploy hook (runs after successful deploy)
curl -X POST "$RENDER_EXTERNAL_URL/api/health"
```

## Step 4: Verify Deployment

### 4.1 Test Endpoints
After deployment, test these URLs:

```bash
# Health check
https://your-server-name.onrender.com/api/health

# Test endpoints
https://your-server-name.onrender.com/api/auth/verify
https://your-server-name.onrender.com/api/questions
```

### 4.2 Check Logs
1. Go to Render Dashboard → Your Service
2. Click "Logs" tab
3. Verify no errors and successful database connection

## Step 5: Connect to Railway Database

### 5.1 Test Database Connection
Run this in Render's terminal or check logs:

```javascript
// Should see this in logs
console.log('Database connection established successfully');
```

### 5.2 Troubleshoot Connection Issues
If database connection fails:

1. **Check Railway Variables**: Verify DB credentials in Railway dashboard
2. **Verify Render Environment**: Ensure all DB_ variables are set correctly
3. **Test Connection**: Use the test script in development
4. **Check Network**: Railway and Render should connect automatically

## Step 6: Update Client Configuration

After server deployment, update client environment:

```env
# In client deployment
REACT_APP_API_URL=https://your-server-name.onrender.com/api
```

## Render-Specific Features

### Free Tier Limitations
- Service spins down after 15 minutes of inactivity
- 750 hours/month limit (shared across services)
- Slower cold starts

### Paid Tier Benefits ($7/month)
- Always-on service
- Faster performance
- Custom domains
- More build minutes

### Auto-Deploy
- Automatic deployment on git push to main
- Build logs available in dashboard
- Rollback to previous deployments

### Custom Domains (Paid Plans)
1. Add domain in Render Dashboard
2. Point DNS to Render's IP
3. SSL certificates automatically provisioned

## Monitoring & Debugging

### Performance Monitoring
```javascript
// Add to server for basic monitoring
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});
```

### Error Tracking
```javascript
// Global error handler
app.use((error, req, res, next) => {
  console.error('Global Error:', error);
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});
```

## Scaling & Performance

### Horizontal Scaling (Standard+ plans)
```yaml
# In render.yaml
scaling:
  minInstances: 1
  maxInstances: 3
```

### Database Connection Pooling
Already configured in `utils/db.js`:
```javascript
connectionLimit: 10  // Adjust based on Railway plan
```

### Caching Headers
```javascript
// Add cache headers for static responses
app.use('/api/questions', (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
  }
  next();
});
```

## Troubleshooting Common Issues

### Build Failures
- Check Node.js version compatibility
- Verify package.json scripts
- Review build logs in Render dashboard

### Database Connection Errors
- Verify Railway service is running
- Check environment variable names
- Test connection with Railway CLI

### CORS Errors
- Update CLIENT_URL after client deployment
- Check CORS middleware configuration
- Verify allowed origins

### Performance Issues
- Monitor response times in logs
- Check database query performance
- Consider upgrading to paid plan

## Cost Estimation
- **Render Server**: $0 (free) or $7/month (starter)
- **Total with Railway DB**: $5-17/month
- **Production recommendation**: Starter plan for reliability

## Next Steps
1. ✅ Server deployed to Render
2. 🔄 Deploy client to Render Static Sites  
3. 🔄 Update CORS and environment variables
4. 🔄 Test complete authentication flow
5. 🔄 Configure custom domains (optional)