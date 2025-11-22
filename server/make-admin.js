/**
 * Script to make a user an admin
 * Usage: node make-admin.js <email>
 * Example: node make-admin.js user@example.com
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

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

    if (user.role === 'admin') {
      console.log('✓ User is already an admin');
      process.exit(0);
    }

    // Update user to admin
    await connection.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      ['admin', user.id]
    );

    console.log('✓ Successfully updated user role to admin');
    console.log('Note: User needs to log out and log back in for changes to take effect');
    
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
