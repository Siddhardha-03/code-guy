# Render Client Deployment Guide
# Complete setup instructions for deploying the React client to Render Static Sites

## Prerequisites
- React client code in GitHub repository
- Server already deployed to Render 
- Render account (free tier available)

## Step 1: Prepare Client for Render

### 1.1 Verify package.json
Ensure your `client/package.json` has the correct settings:

```json
{
  "name": "code-guy-client",
  "version": "1.0.0",
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "homepage": "."
}
```

### 1.2 Build Configuration
Verify `client/public/index.html` has proper meta tags:

```html
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="description" content="Code Guy - Programming contests and quizzes platform" />
<title>Code Guy</title>
```

### 1.3 React Router Configuration
Ensure `_redirects` file exists in `client/public/` for SPA routing:

```
/*    /index.html   200
```

## Step 2: Deploy to Render Static Sites

### 2.1 Create Static Site
1. Go to [render.com](https://render.com) 
2. Click "New +" → "Static Site"
3. Connect your GitHub repository
4. Configure site:
   - **Name**: `code-guy-client`
   - **Branch**: `main` 
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`

### 2.2 Environment Variables (Build Time)
Add these environment variables for the build process:

#### Required Variables
```env
# API endpoint (update with your Render server URL)
REACT_APP_API_URL=https://your-server-name.onrender.com/api

# Firebase Configuration
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

### 2.3 Advanced Build Settings
```bash
# Build Command (optimized)
npm ci && npm run build

# Publish Directory
build

# Auto-Deploy
Enable for automatic deployments on git push
```

## Step 3: Configure React Router Support

### 3.1 Redirects Configuration  
Ensure `client/public/_redirects` contains:
```
# Single Page Application routing
/*    /index.html   200

# API proxy (optional, if needed)
/api/*  https://your-server-name.onrender.com/api/:splat  200

# Security headers
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

### 3.2 Custom Headers (Optional)
Create `client/public/_headers`:
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Cache-Control: public, max-age=31536000, immutable
  
/static/js/*
  Cache-Control: public, max-age=31536000, immutable
  
/static/css/*
  Cache-Control: public, max-age=31536000, immutable
  
/static/media/*
  Cache-Control: public, max-age=31536000, immutable
  
/index.html
  Cache-Control: no-cache, no-store, must-revalidate
```

## Step 4: Firebase Configuration Update

### 4.1 Add Render Domain to Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`code-guy`)
3. Go to Authentication → Settings → Authorized domains
4. Add your Render domain:
   ```
   your-client-name.onrender.com
   ```

### 4.2 Test Firebase Authentication
After deployment, test:
- Email/password login
- Google Sign-In 
- Authentication state persistence

## Step 5: Update Server CORS Configuration

### 5.1 Add Client URL to Server Environment
In your Render server dashboard, update:
```env
CLIENT_URL=https://your-client-name.onrender.com
```

### 5.2 Multiple Domain Support (if needed)
```env
CLIENT_URL=https://your-client-name.onrender.com,https://custom-domain.com
```

## Step 6: Verify Deployment

### 6.1 Test Client Features
After deployment, verify:

```bash
# Main application
https://your-client-name.onrender.com

# Authentication pages
https://your-client-name.onrender.com/login
https://your-client-name.onrender.com/register

# Protected routes
https://your-client-name.onrender.com/contests
https://your-client-name.onrender.com/quizzes
```

### 6.2 Check Network Requests
1. Open browser developer tools
2. Go to Network tab
3. Verify API calls go to correct server URL
4. Check for CORS errors in console

## Step 7: Performance Optimization

### 7.1 Build Optimization
Add to `client/.env.production`:
```env
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
DISABLE_ESLINT_PLUGIN=true
```

### 7.2 Bundle Analysis (Development)
```bash
# Install bundle analyzer
npm install --save-dev webpack-bundle-analyzer

# Add script to package.json
"analyze": "npm run build && npx webpack-bundle-analyzer build/static/js/*.js"

# Run analysis
npm run analyze
```

### 7.3 Code Splitting (Already implemented)
Verify lazy loading in your routes:
```javascript
const LazyLogin = React.lazy(() => import('./pages/Login'));
const LazyRegister = React.lazy(() => import('./pages/Register'));
```

## Render Static Sites Features

### Free Tier Benefits
- Unlimited static sites
- Global CDN
- Automatic SSL certificates
- Custom domains
- Git-based deployments

### Build Performance
- Fast builds with caching
- Automatic dependency installation
- Build logs and error reporting

### Custom Domains (Free)
1. Add domain in Render Dashboard
2. Point DNS CNAME to: `your-site-name.onrender.com`
3. SSL automatically provisioned

## Advanced Configuration

### 7.1 Preview Deployments
Enable preview deployments for pull requests:
1. Go to Settings → Preview Deploys
2. Enable "Auto-Deploy Preview" 
3. Get unique URL for each PR

### 7.2 Build Hooks
```bash
# Pre-build hook
echo "Starting React build..."

# Post-build hook  
echo "Build completed successfully"
ls -la build/
```

### 7.3 Environment-Specific Builds
```javascript
// In React components
const API_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL 
  : 'http://localhost:5000/api';
```

## Troubleshooting Common Issues

### Build Failures
```bash
# Common issues and solutions:

# 1. Node version mismatch
# Solution: Update package.json engines

# 2. Memory issues during build
# Solution: Add to package.json
"scripts": {
  "build": "react-scripts --max_old_space_size=4096 build"
}

# 3. Missing dependencies
# Solution: Check package-lock.json is committed
```

### Runtime Errors
```javascript
// Add error boundary for production
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Please refresh the page.</h1>;
    }
    return this.props.children;
  }
}
```

### API Connection Issues
```javascript
// Add API health check
useEffect(() => {
  const checkAPI = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/health`);
      if (!response.ok) {
        console.error('API health check failed');
      }
    } catch (error) {
      console.error('API connection error:', error);
    }
  };
  
  checkAPI();
}, []);
```

## Monitoring & Analytics

### Performance Monitoring
```javascript
// Add to index.js for basic performance tracking
if (process.env.NODE_ENV === 'production') {
  // Web Vitals
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(console.log);
    getFID(console.log);
    getFCP(console.log);
    getLCP(console.log);
    getTTFB(console.log);
  });
}
```

### Error Tracking (Optional)
```bash
# Install Sentry for error tracking
npm install @sentry/react @sentry/tracing

# Configure in index.js
import * as Sentry from "@sentry/react";
Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

## Cost & Scaling

### Free Tier Limitations
- 100GB bandwidth/month
- Global CDN included
- No build time limits

### Scaling Considerations
- Static sites scale automatically
- CDN handles global traffic
- No server costs for client

## Security Best Practices

### Environment Variables
```bash
# Never commit these to git:
REACT_APP_FIREBASE_API_KEY  # Public but should be in env
REACT_APP_API_URL          # Should match deployed server

# Safe to include in build:
REACT_APP_FIREBASE_PROJECT_ID
REACT_APP_FIREBASE_AUTH_DOMAIN
```

### Content Security Policy
Add to `public/index.html`:
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://apis.google.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://your-server-name.onrender.com https://identitytoolkit.googleapis.com;
  img-src 'self' data:;
">
```

## Final Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Firebase domains updated
- [ ] Server CORS updated with client URL
- [ ] _redirects file in public folder
- [ ] Package.json engines specified

### Post-Deployment  
- [ ] Test authentication flows
- [ ] Verify API connections
- [ ] Check React Router navigation
- [ ] Test responsive design
- [ ] Validate performance metrics

## Next Steps
1. ✅ Client deployed to Render Static Sites
2. 🔄 Update server CORS configuration
3. 🔄 Test complete application flow
4. 🔄 Configure custom domains (optional)
5. 🔄 Set up monitoring and analytics