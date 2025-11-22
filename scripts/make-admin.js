/**
 * Script to make a user an admin
 * Usage: node make-admin.js <email>
 * Example: node make-admin.js user@example.com
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const admin = require('./firebaseAdmin');

async function makeAdmin() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('Error: Please provide an email address');
    console.log('Usage: node make-admin.js <email>');
    console.log('Example: node make-admin.js admin@example.com');
    process.exit(1);
  }

  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'code_guy'
    });

    console.log('Connected to database');

    // Check if user exists
    const [users] = await connection.execute(
      'SELECT id, name, email, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.error(`Error: User with email "${email}" not found`);
      process.exit(1);
    }

    const user = users[0];
    console.log('Found user:', {
      id: user.id,
      name: user.name,
      email: user.email,
      currentRole: user.role
    });

    if (user.role !== 'admin') {
      // Update user to admin in MySQL
      await connection.execute(
        'UPDATE users SET role = ? WHERE id = ?',
        ['admin', user.id]
      );
      console.log('✓ Updated MySQL role to admin');
    } else {
      console.log('✓ User already has MySQL admin role');
    }

    // Set Firebase custom claim if firebase_uid present
    if (user.firebase_uid) {
      try {
        await admin.auth().setCustomUserClaims(user.firebase_uid, { admin: true });
        console.log('✓ Firebase custom admin claim set');
      } catch (claimErr) {
        console.error('⚠ Failed to set Firebase custom claim:', claimErr.message);
      }
    } else {
      console.log('⚠ User has no firebase_uid; skipped Firebase custom claim');
    }

    console.log('Note: User must obtain a new ID token (logout/login) for custom claims to propagate.');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

makeAdmin();
