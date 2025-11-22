const { admin, isFirebaseInitialized } = require('../firebaseAdmin');

/**
 * Middleware to verify Firebase ID token and attach user to request
 * Replaces the old JWT-based authenticate middleware
 */
const verifyFirebaseToken = async (req, res, next) => {
  try {
    // Check if Firebase is initialized
    if (!isFirebaseInitialized) {
      return res.status(503).json({
        status: 'error',
        message: 'Firebase authentication is not configured. Please contact administrator.'
      });
    }

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided. Please login again.'
      });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify the ID token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Attach Firebase user info to request
    req.firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name || decodedToken.email?.split('@')[0] || 'User'
    };

    // Get or create user in MySQL database
    try {
      const [users] = await req.db.execute(
        'SELECT * FROM users WHERE firebase_uid = ?',
        [decodedToken.uid]
      );

      if (users.length === 0) {
        // User doesn't exist in MySQL - create them
        const [result] = await req.db.execute(
          `INSERT INTO users (firebase_uid, name, email, email_verified, role, created_at) 
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [
            decodedToken.uid,
            req.firebaseUser.name,
            decodedToken.email,
            decodedToken.email_verified ? 1 : 0,
            'student' // default role
          ]
        );

        req.user = {
          id: result.insertId,
          firebase_uid: decodedToken.uid,
          name: req.firebaseUser.name,
          email: decodedToken.email,
          email_verified: decodedToken.email_verified ? 1 : 0,
          role: 'student',
          created_at: new Date()
        };

        console.log(`✅ New user created in MySQL: ${decodedToken.email}`);
      } else {
        // User exists - update email_verified if changed
        const user = users[0];
        
        if (user.email_verified !== (decodedToken.email_verified ? 1 : 0)) {
          await req.db.execute(
            'UPDATE users SET email_verified = ? WHERE id = ?',
            [decodedToken.email_verified ? 1 : 0, user.id]
          );
          user.email_verified = decodedToken.email_verified ? 1 : 0;
        }

        req.user = user;
      }

      next();
    } catch (dbError) {
      console.error('Database error in verifyFirebaseToken:', dbError);
      return res.status(500).json({
        status: 'error',
        message: 'Database error while syncing user'
      });
    }
  } catch (error) {
    console.error('Firebase token verification error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.code === 'auth/argument-error') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token format'
      });
    }

    return res.status(401).json({
      status: 'error',
      message: 'Authentication failed. Please login again.'
    });
  }
};

/**
 * Middleware to check if user is admin
 * Use after verifyFirebaseToken
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Admin privileges required.'
    });
  }

  next();
};

/**
 * Optional Firebase authentication middleware
 * If a valid token is provided, it will populate req.user and req.firebaseUser
 * If no token or invalid token, it will continue without blocking
 */
const optionalVerifyFirebaseToken = async (req, res, next) => {
  try {
    // If Firebase is not initialized, continue as unauthenticated
    if (!isFirebaseInitialized) {
      return next();
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided - continue as unauthenticated
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get user from MySQL
    const [rows] = await req.db.execute(
      'SELECT * FROM users WHERE firebase_uid = ?',
      [decodedToken.uid]
    );

    if (rows.length > 0) {
      req.user = rows[0];
      req.firebaseUser = decodedToken;
    }
    
    next();
  } catch (error) {
    // If token is invalid or expired, treat as unauthenticated (do not block public routes)
    next();
  }
};

module.exports = {
  verifyFirebaseToken,
  optionalVerifyFirebaseToken,
  isAdmin,
  // Keep old names for backward compatibility during migration
  authenticate: verifyFirebaseToken,
  optionalAuthenticate: optionalVerifyFirebaseToken
};
