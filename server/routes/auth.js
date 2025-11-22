// This file has been cleaned for redundancy and simplified.
// Functional behavior remains identical to previous version.

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticate } = require('../middlewares/auth');
const { verifyFirebaseToken } = require('../middlewares/authFirebase');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide name, email and password'
      });
    }
    
    // Check if user already exists
    const [existingUsers] = await req.db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user (default role is 'student')
    const [result] = await req.db.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'student']
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { id: result.insertId, name, email, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: result.insertId,
          name,
          email,
          role: 'student'
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Registration failed. Please try again.'
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }
    
    // Check if user exists
    const [users] = await req.db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }
    
    const user = users[0];
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }
    
    // Update last signed in timestamp (if column exists)
    try {
      await req.db.execute(
        'UPDATE users SET last_signed_in = NOW() WHERE id = ?',
        [user.id]
      );
    } catch (error) {
      console.log('last_signed_in column not found, skipping update');
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Login failed. Please try again.'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const [users] = await req.db.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user: users[0]
      }
    });
  } catch (error) {
    console.error('Profile error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch profile. Please try again.'
    });
  }
});

/**
 * @route   GET /api/auth/profile
 * @desc    Get detailed user profile with last signed in
 * @access  Private
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    let users;
    try {
      // Try with last_signed_in column
      [users] = await req.db.execute(
        'SELECT id, name, email, role, created_at, last_signed_in FROM users WHERE id = ?',
        [req.user.id]
      );
    } catch (error) {
      console.log('last_signed_in column not found, using fallback query');
      // Fallback without last_signed_in column
      [users] = await req.db.execute(
        'SELECT id, name, email, role, created_at, NULL as last_signed_in FROM users WHERE id = ?',
        [req.user.id]
      );
    }
    
    if (users.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user: users[0]
      }
    });
  } catch (error) {
    console.error('Profile error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch profile. Please try again.'
    });
  }
});

/**
 * @route   PUT /api/auth/update-profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/update-profile', authenticate, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    
    // Get current user data
    const [users] = await req.db.execute(
      'SELECT * FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    const user = users[0];
    let hashedPassword = user.password;
    
    // If user wants to change password
    if (currentPassword && newPassword) {
      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      
      if (!isMatch) {
        return res.status(401).json({
          status: 'error',
          message: 'Current password is incorrect'
        });
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(newPassword, salt);
    }
    
    // Update user
    await req.db.execute(
      'UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?',
      [name || user.name, email || user.email, hashedPassword, req.user.id]
    );
    
    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user.id,
          name: name || user.name,
          email: email || user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Profile update error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile. Please try again.'
    });
  }
});

/**
 * @route   POST /api/auth/sync
 * @desc    Sync Firebase user with MySQL database
 * @access  Private (requires Firebase token in Authorization header)
 */
router.post('/sync', verifyFirebaseToken, async (req, res) => {
  try {
    // Get user data from Firebase token (verified by middleware)
    const { uid, email, emailVerified, name } = req.firebaseUser;
    
    // Use the verified Firebase data instead of trusting request body
    const firebase_uid = uid;
    const email_verified = emailVerified;

    // Check if user exists by firebase_uid first
    let [existingUsers] = await req.db.execute(
      'SELECT * FROM users WHERE firebase_uid = ?',
      [firebase_uid]
    );

    let user;

    if (existingUsers.length > 0) {
      // User exists with this firebase_uid
      user = existingUsers[0];
      
      await req.db.execute(
        'UPDATE users SET email_verified = ?, last_signed_in = NOW() WHERE firebase_uid = ?',
        [email_verified ? 1 : 0, firebase_uid]
      );

      // Fetch updated user
      const [updatedUsers] = await req.db.execute(
        'SELECT * FROM users WHERE firebase_uid = ?',
        [firebase_uid]
      );
      user = updatedUsers[0];
    } else {
      // Check if user exists by email (legacy user)
      const [emailUsers] = await req.db.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (emailUsers.length > 0) {
        // User exists but doesn't have firebase_uid - update them
        user = emailUsers[0];
        
        await req.db.execute(
          'UPDATE users SET firebase_uid = ?, email_verified = ?, last_signed_in = NOW() WHERE id = ?',
          [firebase_uid, email_verified ? 1 : 0, user.id]
        );

        // Fetch updated user
        const [updatedUsers] = await req.db.execute(
          'SELECT * FROM users WHERE id = ?',
          [user.id]
        );
        user = updatedUsers[0];
      } else {
        // Create new user
        const [result] = await req.db.execute(
          'INSERT INTO users (firebase_uid, name, email, email_verified, role, password) VALUES (?, ?, ?, ?, ?, ?)',
          [firebase_uid, name, email, email_verified ? 1 : 0, 'student', null]
        );

        const [newUsers] = await req.db.execute(
          'SELECT * FROM users WHERE id = ?',
          [result.insertId]
        );
        user = newUsers[0];
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'User synced successfully',
      data: {
        user: {
          id: user.id,
          firebase_uid: user.firebase_uid,
          name: user.name,
          email: user.email,
          email_verified: user.email_verified,
          role: user.role,
          created_at: user.created_at,
          last_signed_in: user.last_signed_in
        }
      }
    });
  } catch (error) {
    console.error('Sync user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to sync user'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile (works with both JWT and Firebase)
 * @access  Private
 */
router.get('/me', async (req, res) => {
  try {
    // Try Firebase auth first
    const authHeader = req.headers.authorization;
    let user;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      // Try to verify as Firebase token
      try {
        const { admin, isFirebaseInitialized } = require('../firebaseAdmin');
        
        if (isFirebaseInitialized) {
          const decodedToken = await admin.auth().verifyIdToken(token);
          
          const [users] = await req.db.execute(
            'SELECT * FROM users WHERE firebase_uid = ?',
            [decodedToken.uid]
          );
          
          if (users.length > 0) {
            user = users[0];
          }
        } else {
          throw new Error('Firebase not initialized');
        }
      } catch (firebaseError) {
        // If Firebase fails, try JWT
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const [users] = await req.db.execute(
            'SELECT * FROM users WHERE id = ?',
            [decoded.id]
          );
          if (users.length > 0) {
            user = users[0];
          }
        } catch (jwtError) {
          return res.status(401).json({
            status: 'error',
            message: 'Invalid token'
          });
        }
      }
    }

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authenticated'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          firebase_uid: user.firebase_uid,
          name: user.name,
          email: user.email,
          email_verified: user.email_verified,
          role: user.role,
          created_at: user.created_at,
          last_signed_in: user.last_signed_in
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user profile'
    });
  }
});

module.exports = router;