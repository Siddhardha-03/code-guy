# Railway Database Configuration
# This file contains Railway-specific database setup and migration instructions

## Railway Database Setup

### 1. Create Railway MySQL Database
```bash
# Option 1: Deploy MySQL template from Railway dashboard
# Option 2: Use Railway CLI
railway login
railway new
railway add mysql
```

### 2. Environment Variables (Railway Dashboard → Variables)
```env
# Railway automatically provides these variables:
MYSQL_URL=mysql://username:password@host:port/database
MYSQLDATABASE=railway
MYSQLHOST=containers-us-west-xx.railway.app  
MYSQLPASSWORD=generated_password
MYSQLPORT=3306
MYSQLUSER=root

# Map Railway variables to our app variables:
DB_HOST=${{MYSQLHOST}}
DB_PORT=${{MYSQLPORT}}
DB_USER=${{MYSQLUSER}}
DB_PASSWORD=${{MYSQLPASSWORD}}
DB_NAME=${{MYSQLDATABASE}}
```

### 3. Database Migration Script
```sql
-- Run this after connecting to your Railway MySQL instance
-- Use Railway's database connection or MySQL client

CREATE DATABASE IF NOT EXISTS railway;
USE railway;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  firebase_uid VARCHAR(255) UNIQUE,
  role ENUM('student', 'admin') DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Questions table  
CREATE TABLE IF NOT EXISTS questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  input_format TEXT,
  output_format TEXT,
  constraints TEXT,
  sample_input TEXT,
  sample_output TEXT,
  test_cases JSON,
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  tags JSON,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Contests table
CREATE TABLE IF NOT EXISTS contests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  created_by INT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Contest questions relationship
CREATE TABLE IF NOT EXISTS contest_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contest_id INT,
  question_id INT,
  points INT DEFAULT 100,
  FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_contest_question (contest_id, question_id)
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  question_id INT,
  contest_id INT NULL,
  code TEXT NOT NULL,
  language VARCHAR(50) NOT NULL,
  status ENUM('pending', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'runtime_error', 'compilation_error') DEFAULT 'pending',
  execution_time FLOAT,
  memory_used INT,
  test_results JSON,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (question_id) REFERENCES questions(id),
  FOREIGN KEY (contest_id) REFERENCES contests(id)
);

-- Code drafts table
CREATE TABLE IF NOT EXISTS code_drafts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  question_id INT NOT NULL,
  contest_id INT NULL,
  code TEXT NOT NULL,
  language VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_question_contest (user_id, question_id, contest_id)
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by INT,
  duration_minutes INT DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Quiz questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT,
  question_text TEXT NOT NULL,
  options JSON NOT NULL,
  correct_answer INT NOT NULL,
  points INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- Quiz submissions table  
CREATE TABLE IF NOT EXISTS quiz_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  quiz_id INT,
  answers JSON NOT NULL,
  score INT DEFAULT 0,
  total_questions INT DEFAULT 0,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
  UNIQUE KEY unique_user_quiz (user_id, quiz_id)
);

-- Platform links table
CREATE TABLE IF NOT EXISTS platform_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  platform VARCHAR(50) NOT NULL,
  username VARCHAR(255) NOT NULL,
  profile_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_platform (user_id, platform)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_question_id ON submissions(question_id);
CREATE INDEX idx_submissions_contest_id ON submissions(contest_id);
CREATE INDEX idx_contest_questions_contest_id ON contest_questions(contest_id);
CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX idx_quiz_submissions_user_id ON quiz_submissions(user_id);
```

### 4. Connection Test Script
```javascript
// test-railway-connection.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testRailwayConnection() {
  const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };
  
  console.log('Testing Railway database connection...');
  console.log('Host:', config.host);
  console.log('Port:', config.port);
  console.log('Database:', config.database);
  
  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Railway database connection successful!');
    
    // Test basic query
    const [rows] = await connection.execute('SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = ?', [config.database]);
    console.log('✅ Database query successful. Tables found:', rows[0].table_count);
    
    await connection.end();
  } catch (error) {
    console.error('❌ Railway database connection failed:', error.message);
    process.exit(1);
  }
}

testRailwayConnection();
```

### 5. Railway CLI Commands
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
railway link

# View environment variables
railway variables

# Connect to database directly
railway connect mysql

# Deploy with environment sync
railway up --detach
```

### 6. Production Environment Setup
```env
# Production .env for Railway deployment
NODE_ENV=production
DB_HOST=${MYSQLHOST}
DB_PORT=${MYSQLPORT}
DB_USER=${MYSQLUSER}
DB_PASSWORD=${MYSQLPASSWORD}
DB_NAME=${MYSQLDATABASE}

# Additional production variables
JWT_SECRET=your_secure_jwt_secret_32_chars_plus
CLIENT_URL=https://your-render-app.onrender.com
JUDGE0_BASE_URL=https://ce.judge0.com
```

### 7. Health Check Endpoint
```javascript
// Add to server/index.js for Railway health checks
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const db = require('./utils/db');
    await db.testConnection();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV
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

### 8. Troubleshooting
- **Connection timeout**: Check Railway service is running and environment variables are correct
- **Access denied**: Verify DB_USER and DB_PASSWORD match Railway variables
- **Database not found**: Ensure DB_NAME matches MYSQLDATABASE from Railway
- **SSL errors**: Railway MySQL requires SSL by default, our connection should work out of the box