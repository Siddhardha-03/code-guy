// This file has been cleaned for redundancy and simplified.
// Functional behavior remains identical to previous version.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

// Import routes
const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const submissionRoutes = require('./routes/submissions');
const quizRoutes = require('./routes/quizzes');
const compilerRoutes = require('./routes/compiler');
const adminRoutes = require('./routes/admin');
const codeDraftRoutes = require('./routes/codeDrafts');
const contestRoutes = require('./routes/contests');
const sheetsRoutes = require('./routes/sheets');

// Create Express app
const app = express();

// Dynamic CORS configuration - auto-accepts legitimate origins
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    console.log('CORS request from origin:', origin);
    
    // Auto-allow common development origins
    const devOrigins = ['localhost', '127.0.0.1', '0.0.0.0'];
    if (devOrigins.some(dev => origin.includes(dev))) {
      console.log('✅ CORS: Allowing development origin');
      return callback(null, true);
    }
    
    // Auto-allow Render deployments
    if (origin.includes('.onrender.com')) {
      console.log('✅ CORS: Allowing Render deployment');
      return callback(null, true);
    }
    
    // Auto-allow Netlify deployments
    if (origin.includes('.netlify.app') || origin.includes('.netlify.com')) {
      console.log('✅ CORS: Allowing Netlify deployment');
      return callback(null, true);
    }
    
    // Auto-allow Vercel deployments
    if (origin.includes('.vercel.app') || origin.includes('.vercel.com')) {
      console.log('✅ CORS: Allowing Vercel deployment');
      return callback(null, true);
    }
    
    // Check CLIENT_URL environment variable if set
    if (process.env.CLIENT_URL) {
      const allowedOrigins = process.env.CLIENT_URL.split(',').map(url => url.trim());
      if (allowedOrigins.includes(origin)) {
        console.log('✅ CORS: Allowing configured origin');
        return callback(null, true);
      }
    }
    
    // Allow HTTPS origins that contain 'code-guy' (project-specific)
    if (origin.startsWith('https://') && origin.includes('code-guy')) {
      console.log('✅ CORS: Allowing code-guy project origin');
      return callback(null, true);
    }
    
    console.log('❌ CORS: Blocking origin:', origin);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function ensureDatabaseSchema() {
  const connection = await pool.getConnection();

  try {
    const [exampleColumn] = await connection.query("SHOW COLUMNS FROM questions LIKE 'examples'");
    if (exampleColumn.length === 0) {
      console.log("[DB] Adding missing 'examples' column to questions table");
      await connection.query("ALTER TABLE questions ADD COLUMN examples JSON NULL");
    }

    const [languageSupportedColumn] = await connection.query("SHOW COLUMNS FROM questions LIKE 'language_supported'");
    if (languageSupportedColumn.length === 0) {
      console.log("[DB] Adding missing 'language_supported' column to questions table");
      await connection.query("ALTER TABLE questions ADD COLUMN language_supported JSON NULL");
    }

    const [tagsColumn] = await connection.query("SHOW COLUMNS FROM questions LIKE 'tags'");
    if (tagsColumn.length === 0) {
      console.log("[DB] Adding missing 'tags' column to questions table");
      await connection.query("ALTER TABLE questions ADD COLUMN tags JSON NULL");
    }
  } catch (schemaError) {
    console.error('[DB] Schema verification failed:', schemaError.message);
    throw schemaError;
  } finally {
    connection.release();
  }
}

// Make db available to all routes
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/compiler', compilerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/code-drafts', codeDraftRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/sheets', sheetsRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Something went wrong on the server',
  });
});

// Start server
ensureDatabaseSchema()
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch((error) => {
    console.error('[DB] Failed to ensure schema. Shutting down.', error);
    process.exit(1);
  });