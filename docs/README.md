# Code Guy Platform Documentation

Welcome to the Code Guy platform documentation. This directory contains comprehensive guides for development, deployment, and maintenance.

## 📁 Documentation Structure

### `/deployment/` - Production Deployment
- **`RAILWAY_RENDER_DEPLOYMENT.md`** - Complete deployment guide for Railway + Render stack
- **`cross-platform-config.md`** - Integration setup between Railway DB and Render services
- **`.env.railway-render`** - Environment variable templates for production deployment

### `/development/` - Development Guides
- **`FIREBASE_SETUP_GUIDE.md`** - Firebase project configuration and authentication setup
- **`QUICK_START.md`** - Fast development environment setup
- **`STARTUP_CHECKLIST.md`** - Pre-development verification checklist

## 🚀 Quick Navigation

### Getting Started
1. Read `/development/QUICK_START.md` for local setup
2. Configure Firebase using `/development/FIREBASE_SETUP_GUIDE.md`
3. Use `/development/STARTUP_CHECKLIST.md` to verify your setup

### Deployment
1. Review `/deployment/RAILWAY_RENDER_DEPLOYMENT.md` for complete deployment guide
2. Configure cross-platform integration with `/deployment/cross-platform-config.md`
3. Use environment templates from `/deployment/.env.railway-render`

### Validation
- Run `node scripts/deployment-helper.js` to validate deployment readiness
- Use `node server/test-railway-connection.js` to test database connectivity

## 🔧 Development Workflow

```bash
# 1. Initial setup
cd code-guy
cp docs/deployment/.env.railway-render server/.env
# Edit server/.env with your configuration

# 2. Install dependencies
cd server && npm install
cd ../client && npm install

# 3. Setup database
cd server && node run-migration.js

# 4. Start development
cd server && npm run dev  # Terminal 1
cd client && npm start    # Terminal 2
```

## 🚀 Production Deployment

```bash
# 1. Validate readiness
node scripts/deployment-helper.js

# 2. Deploy Railway database
# Follow Railway dashboard instructions

# 3. Deploy Render services
# Server: Web Service from /server directory
# Client: Static Site from /client directory

# 4. Configure cross-platform
# Update environment variables as per guides
```

## 📚 Additional Resources

### Core Features
- **Authentication**: Firebase Auth with email/password and Google Sign-In
- **Contests**: Time-based programming competitions
- **Practice**: Individual problem solving with Judge0 execution
- **Quizzes**: MCQ-based assessments with scoring
- **Admin Panel**: Contest and user management

### Architecture
- **Frontend**: React 18.2.0 with Tailwind CSS
- **Backend**: Node.js/Express with JWT authentication
- **Database**: MySQL with connection pooling
- **Deployment**: Railway (DB) + Render (Server/Client)

### Cost Estimation
- **Development**: Free (local setup)
- **Production**: $12-17/month (Railway DB + Render services)

## 🆘 Troubleshooting

### Common Issues
1. **Database Connection**: Use `server/test-railway-connection.js`
2. **Firebase Auth**: Check configuration in Firebase Console
3. **CORS Errors**: Verify CLIENT_URL environment variable
4. **Build Failures**: Check Node.js version compatibility

### Support Channels
- Review error logs in browser console
- Check server logs for API issues
- Validate environment variable configuration
- Use provided test scripts for diagnostics

## 📄 Contributing

When adding new documentation:
1. Place deployment guides in `/deployment/`
2. Place development guides in `/development/`
3. Update this index file with new additions
4. Follow existing formatting and structure

---

**Last Updated**: November 2025  
**Version**: 1.0.0  
**Platform**: Code Guy Programming Contest Platform