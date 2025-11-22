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
      // First try to find user by firebase_uid
      let [users] = await req.db.execute(
        'SELECT * FROM users WHERE firebase_uid = ?',
        [decodedToken.uid]
      );

      if (users.length === 0) {
        // User doesn't exist by firebase_uid, check by email
        const [emailUsers] = await req.db.execute(
          'SELECT * FROM users WHERE email = ?',
          [decodedToken.email]
        );

        if (emailUsers.length > 0) {
          // User exists with this email but different firebase_uid - update the firebase_uid
          console.log(`Updating existing user ${decodedToken.email} with new firebase_uid`);
          await req.db.execute(
            'UPDATE users SET firebase_uid = ?, name = ?, email_verified = ?, updated_at = NOW() WHERE email = ?',
            [
              decodedToken.uid,
              req.firebaseUser.name,
              decodedToken.email_verified ? 1 : 0,
              decodedToken.email
            ]
          );
          
          // Fetch the updated user
          [users] = await req.db.execute(
            'SELECT * FROM users WHERE firebase_uid = ?',
            [decodedToken.uid]
          );
        } else {
          // User doesn't exist at all - create new user
          console.log(`Creating new user: ${decodedToken.email}`);
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

          // Fetch the newly created user
          [users] = await req.db.execute(
            'SELECT * FROM users WHERE id = ?',
            [result.insertId]
          );
        }
      } else {
        // User exists by firebase_uid - update their info if needed
        console.log(`Found existing user by firebase_uid: ${decodedToken.email}`);
        await req.db.execute(
          'UPDATE users SET name = ?, email = ?, email_verified = ?, updated_at = NOW() WHERE firebase_uid = ?',
          [
            req.firebaseUser.name,
            decodedToken.email,
            decodedToken.email_verified ? 1 : 0,
            decodedToken.uid
          ]
        );
      }

      // Set req.user from the fetched/updated user data
      const user = users[0];
      req.user = {
        id: user.id,
        firebase_uid: user.firebase_uid,
        name: user.name,
        email: user.email,
        email_verified: user.email_verified,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      console.log(`✅ User authenticated: ${user.email} (Role: ${user.role})`);

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
