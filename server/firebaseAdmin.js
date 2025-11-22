const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// You need to download your service account key from Firebase Console
// and place it in server/config/serviceAccountKey.json
// OR use environment variables for production

let isFirebaseInitialized = false;

try {
  // Option 1: Use service account file (for local development)
  // Download from: Firebase Console > Project Settings > Service Accounts > Generate New Private Key
  const serviceAccount = require('./config/serviceAccountKey.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'code-guy'
  });
  
  isFirebaseInitialized = true;
  console.log('✅ Firebase Admin initialized with service account');
} catch (error) {
  // Option 2: Use Application Default Credentials (for production/Cloud Run)
  // This works automatically in Google Cloud environments
  try {
    admin.initializeApp({
      projectId: 'code-guy'
    });
    isFirebaseInitialized = true;
    console.log('✅ Firebase Admin initialized with default credentials');
  } catch (err) {
    // Option 3: Try with environment variables (for some cloud providers)
    if (process.env.FIREBASE_PROJECT_ID) {
      try {
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID
        });
        isFirebaseInitialized = true;
        console.log('✅ Firebase Admin initialized with environment variables');
      } catch (envError) {
        console.error('❌ Failed to initialize Firebase Admin:', envError.message);
        console.error('Please set up Firebase credentials:');
        console.error('1. Download serviceAccountKey.json from Firebase Console, OR');
        console.error('2. Set up Application Default Credentials, OR');
        console.error('3. Use environment variables for your cloud provider');
        console.error('⚠️ Server will continue but Firebase authentication will not work');
        isFirebaseInitialized = false;
      }
    } else {
      console.error('❌ Failed to initialize Firebase Admin:', err.message);
      console.error('Please set up Firebase credentials:');
      console.error('1. Download serviceAccountKey.json from Firebase Console, OR');
      console.error('2. Set up Application Default Credentials, OR');
      console.error('3. Set FIREBASE_PROJECT_ID environment variable');
      console.error('⚠️ Server will continue but Firebase authentication will not work');
      isFirebaseInitialized = false;
    }
  }
}

module.exports = {
  admin,
  isFirebaseInitialized
};
