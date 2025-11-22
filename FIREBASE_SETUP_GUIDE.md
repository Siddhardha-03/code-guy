# Firebase Authentication Setup Guide

## Overview
This application has been refactored to use Firebase Authentication for user management while keeping MySQL for application-specific data (submissions, progress, etc.).

## Prerequisites
- Node.js (v14+)
- MySQL 8.0
- Firebase project (already created: "code-guy")
- Firebase config credentials (already added to client)

## Firebase Service Account Setup

### Step 1: Download Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **code-guy**
3. Click on the **gear icon** (Settings) → **Project Settings**
4. Navigate to the **Service Accounts** tab
5. Click **Generate New Private Key**
6. A JSON file will be downloaded (e.g., `code-guy-firebase-adminsdk-xxxxx.json`)

### Step 2: Place the Service Account Key

1. Create a `config` directory in the `server` folder if it doesn't exist:
   ```powershell
   mkdir server\config
   ```

2. Rename the downloaded file to `serviceAccountKey.json`

3. Move it to `server/config/serviceAccountKey.json`

4. **IMPORTANT:** Add this to your `.gitignore` to prevent committing sensitive credentials:
   ```
   server/config/serviceAccountKey.json
   ```

### Step 3: Verify File Structure

Your server directory should look like this:
```
server/
├── config/
│   └── serviceAccountKey.json  ← Your Firebase credentials
├── controllers/
├── middlewares/
│   ├── auth.js              ← Old JWT middleware (deprecated)
│   └── authFirebase.js      ← New Firebase middleware
├── routes/
│   ├── auth.js              ← Old JWT routes (for backward compatibility)
│   └── authFirebase.js      ← New Firebase routes
├── firebaseAdmin.js
├── index.js
└── package.json
```

## Database Migration

Run the migration script to update the `users` table:

```powershell
cd server
node run-migration.js
```

This will:
- Make the `password` column nullable (since Firebase manages passwords)
- Verify that `firebase_uid` and `email_verified` columns exist

## Installation

### Client Setup

```powershell
cd client
npm install
```

### Server Setup

```powershell
cd server
npm install
```

## Environment Variables

### Client (.env)

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_FIREBASE_API_KEY=AIzaSyDiJxM8u4v2dJPUcKp3fK5eNXxJl9Y0234
REACT_APP_FIREBASE_AUTH_DOMAIN=code-guy.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=code-guy
REACT_APP_FIREBASE_STORAGE_BUCKET=code-guy.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=537699654231
REACT_APP_FIREBASE_APP_ID=1:537699654231:web:3ba4e58f90ceee30d65a63
```

### Server (.env)

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=code_guy
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

## Running the Application

### Start the Server

```powershell
cd server
node index.js
```

The server will:
- Connect to MySQL
- Initialize Firebase Admin SDK using the service account key
- Start on port 5000 (or your configured PORT)

### Start the Client

```powershell
cd client
npm start
```

The client will start on port 3000.

## Authentication Flow

### User Registration

1. User fills out registration form with name, email, and password
2. Firebase creates authentication account
3. Firebase sends email verification link
4. Backend middleware automatically creates MySQL user record on first API call
5. User must verify email before accessing protected features

### User Login

1. User enters email and password
2. Firebase authenticates the user
3. Client receives Firebase ID token (valid for 1 hour)
4. Client sends token to backend `/api/auth/firebase/verify`
5. Backend verifies token and returns MySQL user data
6. Token is automatically refreshed every 50 minutes

### Protected Routes

All protected API routes now use the `verifyFirebaseToken` middleware:

```javascript
const { verifyFirebaseToken } = require('../middlewares/authFirebase');

router.get('/protected', verifyFirebaseToken, (req, res) => {
  // req.user contains MySQL user data
  // req.firebaseUser contains Firebase user data
});
```

## API Endpoints

### Firebase Authentication Routes

All Firebase auth routes are prefixed with `/api/auth/firebase`:

- `POST /api/auth/firebase/verify` - Verify Firebase token and sync user
- `GET /api/auth/firebase/me` - Get current user info
- `PUT /api/auth/firebase/profile` - Update user profile (name only)
- `POST /api/auth/firebase/update-last-signin` - Update last sign-in timestamp
- `DELETE /api/auth/firebase/account` - Delete user account (Firebase + MySQL)

### Legacy JWT Routes (Deprecated)

Old JWT routes at `/api/auth/register` and `/api/auth/login` still exist for backward compatibility but should not be used for new features.

## Features

### Email Verification

- Users must verify their email before logging in
- Verification emails are sent automatically upon registration
- Users can resend verification emails if needed

### Password Reset

- Users can request password reset via the "Forgot Password" page
- Firebase sends a secure password reset link to the user's email
- No server-side code needed for password reset flow

### Account Deletion

- Users can delete their accounts from the profile page
- Deletes both Firebase auth account and all MySQL data (submissions, progress, etc.)
- Uses database transactions to ensure data integrity

## Troubleshooting

### Error: "Failed to initialize Firebase Admin SDK"

**Cause:** Service account key file not found or invalid.

**Solution:**
1. Verify the file exists at `server/config/serviceAccountKey.json`
2. Check that the file contains valid JSON
3. Ensure it's the correct service account key for the "code-guy" project

### Error: "auth/email-already-in-use"

**Cause:** Email is already registered in Firebase.

**Solution:** Use a different email or log in with existing credentials.

### Error: "Please verify your email before logging in"

**Cause:** User hasn't verified their email yet.

**Solution:** Check inbox for verification email and click the link. Can request a new verification email if needed.

### Token Expired Error

**Cause:** Firebase ID tokens expire after 1 hour.

**Solution:** The client automatically refreshes tokens every 50 minutes. If manual refresh is needed, log out and log back in.

## Security Best Practices

1. **Never commit** `serviceAccountKey.json` to version control
2. **Use environment variables** for sensitive configuration
3. **Enable CORS** only for trusted domains in production
4. **Validate all user inputs** on both client and server
5. **Use HTTPS** in production for secure token transmission

## Migration from JWT to Firebase

If you have existing users in the database using JWT authentication:

1. They will need to create a new account using Firebase Authentication
2. Old JWT routes are still available during the migration period
3. Gradually migrate users by:
   - Sending email notifications about the change
   - Providing a "migrate account" feature (optional)
   - Setting a deadline for migration

## Production Deployment

### Firebase Admin SDK in Production

Instead of using a service account key file, use **Default Application Credentials** in production:

1. For Google Cloud Platform:
   - No service account file needed
   - Firebase Admin SDK will automatically use the service account associated with your GCP project

2. For other platforms:
   - Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the path of your service account key
   - OR upload the service account key to your server securely

### Security Rules

Ensure Firebase Security Rules are properly configured for your Firebase project.

## Support

For issues or questions, please contact the development team or refer to:
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)

---

**Last Updated:** 2024
**Version:** 1.0.0
