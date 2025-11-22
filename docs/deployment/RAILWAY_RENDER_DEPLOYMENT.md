# 🚀 CodeGuy - Railway + Render Deployment Guide

## 🎯 **Why Railway + Render?**

**Railway (Database):**
- ✅ Managed MySQL with automatic backups
- ✅ Built-in monitoring and scaling
- ✅ Easy connection string management
- ✅ Developer-friendly interface

**Render (Server + Client):**
- ✅ Auto-deploy from GitHub
- ✅ Free SSL certificates
- ✅ Built-in CDN for static sites
- ✅ Environment variable management
- ✅ Auto-scaling and health checks

---

## 🗄️ **Step 1: Railway Database Setup**

### 1. Create MySQL Database
1. Go to [Railway](https://railway.app)
2. Create new project → Add MySQL
3. Note the connection details from Variables tab:
   ```
   MYSQL_URL: mysql://user:pass@host:port/database
   MYSQLDATABASE: your_db_name
   MYSQLHOST: your_host
   MYSQLPASSWORD: your_password
   MYSQLPORT: 3306
   MYSQLUSER: your_username
   ```

### 2. Initialize Database Schema
```bash
# Connect to Railway MySQL and run:
mysql -h [MYSQLHOST] -P [MYSQLPORT] -u [MYSQLUSER] -p[MYSQLPASSWORD] [MYSQLDATABASE]

# Then run your schema files:
source database/init.sql;
source database/firebase_migration.sql;
source database/add_platform_links.sql;
```

Or use Railway's built-in query runner in their dashboard.

---

## 🖥️ **Step 2: Render Server Deployment**

### 1. Create Web Service on Render
1. Connect your GitHub repository
2. Choose **Web Service**
3. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: 18

### 2. Environment Variables (Render Dashboard)
```env
NODE_ENV=production
PORT=10000

# Railway Database Connection
DB_HOST=[Copy from Railway MYSQLHOST]
DB_PORT=[Copy from Railway MYSQLPORT] 
DB_USER=[Copy from Railway MYSQLUSER]
DB_PASSWORD=[Copy from Railway MYSQLPASSWORD]
DB_NAME=[Copy from Railway MYSQLDATABASE]

# Security
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters

# APIs
JUDGE0_BASE_URL=https://ce.judge0.com

# CORS (Update after client deployment)
CLIENT_URL=https://your-render-app.onrender.com

# Firebase
FIREBASE_PROJECT_ID=code-guy
```

### 3. Add Firebase Service Account (Optional)
If using service account key:
1. Add as environment variable: `FIREBASE_SERVICE_ACCOUNT`
2. Update `server/firebaseAdmin.js` to parse JSON from env var

---

## 🌐 **Step 3: Render Client Deployment**

### 1. Create Static Site on Render
1. Same GitHub repository
2. Choose **Static Site**
3. Configure:
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`

### 2. Environment Variables (Build Time)
```env
# API URL (Update with your Render server URL)
REACT_APP_API_URL=https://your-server-name.onrender.com/api

# Firebase Config
REACT_APP_FIREBASE_API_KEY=AIzaSyCmz6BMReZW8XNJa54wU2j4Z_IeHCyilf8
REACT_APP_FIREBASE_AUTH_DOMAIN=code-guy.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=code-guy
REACT_APP_FIREBASE_STORAGE_BUCKET=code-guy.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=490751208380
REACT_APP_FIREBASE_APP_ID=1:490751208380:web:d5cf322310a2e4f11e99b9
```

### 3. Add Redirect Rules
Create `client/public/_redirects`:
```
/*    /index.html   200
```

---

## 🔄 **Step 4: Update CORS Configuration**

After both deployments, update server's `CLIENT_URL`:
```env
CLIENT_URL=https://your-client-app.onrender.com,https://www.your-custom-domain.com
```

---

## ⚡ **Render-Specific Optimizations**

### 1. Update `server/package.json`
```json
{
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "start": "node index.js",
    "build": "npm install --production"
  }
}
```

### 2. Add Health Check Endpoint
Already configured in your server! `/api/health`

### 3. Environment Detection
```javascript
// In server/index.js - already configured!
const PORT = process.env.PORT || 5000;
```

---

## 🔥 **Firebase Configuration Updates**

### 1. Add Render Domains to Firebase
1. Go to Firebase Console → Authentication → Settings
2. Add authorized domains:
   - `your-client-app.onrender.com`
   - `your-custom-domain.com` (if using)

### 2. Update Firebase Service Account (Production)
```javascript
// server/firebaseAdmin.js - already handles multiple options!
// Option 1: Service account file (current)
// Option 2: Application Default Credentials 
// Option 3: Environment variables (works on Render)
```

---

## 📊 **Monitoring & Scaling**

### Railway Dashboard
- Database metrics and logs
- Connection pool monitoring
- Automatic backups
- Resource usage

### Render Dashboard  
- Deploy logs and status
- Resource usage
- Domain management
- SSL certificate status

---

## 💰 **Cost Optimization**

### Railway Pricing
- **Starter**: $5/month MySQL
- **Developer**: $20/month (recommended)
- Pay-per-use compute

### Render Pricing
- **Static Sites**: Free with 100GB bandwidth
- **Web Services**: $7/month (recommended)
- Free SSL and CDN included

**Total Monthly Cost: ~$12-27/month** for production-ready setup!

---

## 🚨 **Deployment Checklist**

### Railway Setup
- [ ] MySQL database created
- [ ] Schema imported
- [ ] Connection variables copied

### Render Server
- [ ] Repository connected
- [ ] Environment variables configured
- [ ] Firebase service account setup
- [ ] Health checks passing

### Render Client
- [ ] Static site deployed
- [ ] API URL configured
- [ ] Redirects working
- [ ] Firebase domains updated

### Testing
- [ ] Authentication working
- [ ] Database connectivity verified  
- [ ] CORS properly configured
- [ ] All features functional

---

## 🔧 **Troubleshooting**

### Common Issues

**Database Connection Errors**
```bash
# Verify Railway connection string
# Check firewall/IP restrictions
# Test connection from Render server
```

**CORS Errors**
```bash
# Update CLIENT_URL in Render server environment
# Verify Firebase authorized domains
# Check browser network tab for exact blocked origin
```

**Build Failures**
```bash
# Check Render build logs
# Verify Node.js version compatibility
# Ensure all dependencies installed
```

---

## 🎯 **Your Production URLs**

After deployment, you'll have:
- **Client**: `https://your-app.onrender.com`
- **API**: `https://your-api.onrender.com/api`
- **Database**: Railway MySQL (private)
- **Admin**: `https://your-app.onrender.com/admin`

---

🚀 **Railway + Render = Perfect for CodeGuy!** 

This combination gives you enterprise-grade infrastructure with developer-friendly pricing and management!