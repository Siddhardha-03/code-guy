# Code Guy - Programming Contest Platform

A comprehensive full-stack platform for programming contests, quizzes, and collaborative coding practice.

## 🚀 Features

- **Programming Contests**: Create and participate in time-based coding competitions
- **Practice Problems**: Solve coding challenges with multiple difficulty levels  
- **Quiz System**: Interactive programming knowledge assessments
- **Real-time Code Execution**: Support for multiple programming languages
- **Firebase Authentication**: Secure login with email/password and Google Sign-In
- **User Profiles**: Personalized dashboards and progress tracking
- **Leaderboards**: Track performance and rankings
- **Admin Panel**: Contest and user management

## 🛠️ Tech Stack

**Frontend**: React 18.2.0, React Router, Tailwind CSS, Firebase SDK  
**Backend**: Node.js, Express.js, MySQL2, Firebase Admin, JWT  
**Database**: MySQL with connection pooling  
**External APIs**: Judge0 for code execution  
**Deployment**: Railway (DB) + Render (Server/Client)

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8+
- Firebase project

### Local Development

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd code-guy
   
   # Install dependencies
   cd server && npm install
   cd ../client && npm install
   ```

2. **Configure environment**
   ```bash
   # Server environment
   cp .env.example server/.env
   # Edit server/.env with your database and Firebase config
   
   # Client environment  
   cp .env.example client/.env
   # Edit client/.env with Firebase config
   ```

3. **Setup database**
   ```bash
   cd server
   node run-migration.js
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Backend (port 5000)
   cd server && npm run dev
   
   # Terminal 2: Frontend (port 3000)  
   cd client && npm start
   ```

Visit `http://localhost:3000` to see the application.

## 🚀 Production Deployment

Optimized for **Railway** (database) + **Render** (server/client) deployment:

1. **Railway**: Deploy MySQL database
2. **Render**: Deploy server as Web Service  
3. **Render**: Deploy client as Static Site

**Total Cost**: ~$12-17/month

See detailed guides in `/docs/deployment/`:
- `RAILWAY_RENDER_DEPLOYMENT.md` - Complete deployment guide
- `cross-platform-config.md` - Integration setup

## 📁 Project Structure

```
code-guy/
├── client/                 # React frontend
│   ├── src/components/     # UI components  
│   ├── src/pages/         # Route pages
│   ├── src/services/      # API services
│   └── public/            # Static assets
├── server/                # Node.js backend
│   ├── routes/           # API endpoints
│   ├── controllers/      # Business logic
│   ├── middlewares/      # Auth & validation
│   └── utils/            # Database & utilities
├── database/             # SQL migration scripts
├── docs/                 # Documentation  
│   ├── deployment/       # Production guides
│   └── development/      # Development docs
└── scripts/              # Utility scripts
```

## 🔧 Key Configuration

**Server Environment Variables:**
```env
DB_HOST=your_db_host
DB_PASSWORD=your_db_password  
JWT_SECRET=your_jwt_secret
FIREBASE_PROJECT_ID=your_project_id
CLIENT_URL=http://localhost:3000
```

**Client Environment Variables:**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
```

## 🧪 Testing

```bash
# Test database connection
cd server && node test-railway-connection.js

# Run development servers
npm run dev  # Server
npm start    # Client

# Validate deployment readiness
node scripts/deployment-helper.js
```

## 📚 Core API Endpoints

- **Auth**: `/api/auth/register`, `/api/auth/login`, `/api/auth/sync`
- **Contests**: `/api/contests`, `/api/contests/:id/join`  
- **Questions**: `/api/questions`, `/api/questions/:id`
- **Submissions**: `/api/submissions`, `/api/compiler/execute`
- **Quizzes**: `/api/quizzes`, `/api/quizzes/:id/submit`

## 🔒 Security Features

- JWT-based authentication
- Firebase Admin SDK for token verification
- CORS protection with configurable origins
- Input validation and sanitization
- Protected routes and admin middleware

## 🎯 Production Ready

✅ Firebase authentication with Google Sign-In  
✅ Scalable database connection pooling  
✅ Environment-based configuration  
✅ Docker containerization support  
✅ Comprehensive error handling  
✅ Production deployment guides  
✅ Health check endpoints  

## 📄 License

MIT License - Built with ❤️ for the programming community

## 🆘 Support

- Check `/docs/` for comprehensive guides
- Use `scripts/deployment-helper.js` for deployment validation
- Review logs for debugging information