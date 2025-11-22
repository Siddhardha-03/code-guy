import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import axios from 'axios';
import { API_URL } from '../config/apiConfig';

/**
 * Firebase Authentication Service
 * Replaces the old JWT-based authentication
 */

/**
 * Sign up a new user with email and password
 * Automatically sends email verification
 */
export const signUpWithEmail = async (name, email, password) => {
  try {
    // Create user in Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, { displayName: name });

    // Send email verification with action code settings
    const actionCodeSettings = {
      url: `${window.location.origin}/login?verified=true`,
      handleCodeInApp: false
    };
    await sendEmailVerification(user, actionCodeSettings);

    // Get ID token
    const idToken = await user.getIdToken();

    // Sync with backend (this will create user in MySQL)
    await axios.post(`${API_URL}/auth/sync`, {}, {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    });

    return {
      user,
      message: 'Account created! Please check your email to verify your account.'
    };
  } catch (error) {
    console.error('Sign up error:', error);
    
    // Handle Firebase errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered. Please login instead.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address.');
    }
    
    throw new Error(error.message || 'Failed to create account. Please try again.');
  }
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Debug: basic sign-in success info
    console.log('[LOGIN] Firebase signIn success:', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified
    });

    // Get ID token
    const idToken = await user.getIdToken();

    console.log('[LOGIN] Obtained ID token (length):', idToken.length);

    // Verify with backend and sync user data
    const response = await axios.post(`${API_URL}/auth/sync`, {}, {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    });

    console.log('[LOGIN] /auth/sync response:', {
      status: response.status,
      userId: response.data?.data?.user?.id,
      email_verified: response.data?.data?.user?.email_verified
    });

    return {
      user,
      userData: response.data.data.user,
      message: user.emailVerified 
        ? 'Login successful!' 
        : 'Please verify your email to access all features.'
    };
  } catch (error) {
    console.error('Sign in error:', error);
    
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email. Please sign up.');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password. Please try again.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address.');
    } else if (error.code === 'auth/user-disabled') {
      throw new Error('This account has been disabled.');
    }
    
    throw new Error(error.message || 'Login failed. Please try again.');
  }
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    console.log('[GOOGLE LOGIN] Firebase signIn success:', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName
    });

    // Get ID token
    const idToken = await user.getIdToken();

    console.log('[GOOGLE LOGIN] Obtained ID token (length):', idToken.length);

    // Verify with backend and sync user data
    const response = await axios.post(`${API_URL}/auth/sync`, {}, {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    });

    console.log('[GOOGLE LOGIN] /auth/sync response:', {
      status: response.status,
      userId: response.data?.data?.user?.id,
      email_verified: response.data?.data?.user?.email_verified
    });

    return {
      user,
      userData: response.data.data.user,
      message: 'Google Sign-In successful!'
    };
  } catch (error) {
    console.error('Google Sign-In error:', error);
    
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled. Please try again.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Pop-up was blocked by your browser. Please allow pop-ups and try again.');
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error('An account already exists with the same email but different sign-in method.');
    }
    
    throw new Error(error.message || 'Google Sign-In failed. Please try again.');
  }
};

/**
 * Sign out current user
 */
export const signOutUser = async () => {
  try {
    await signOut(auth);
    // Clear any local storage if needed
    localStorage.removeItem('user');
    return { message: 'Signed out successfully' };
  } catch (error) {
    console.error('Sign out error:', error);
    throw new Error('Failed to sign out. Please try again.');
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { message: 'Password reset email sent! Please check your inbox.' };
  } catch (error) {
    console.error('Password reset error:', error);
    
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address.');
    }
    
    throw new Error('Failed to send password reset email. Please try again.');
  }
};

/**
 * Resend email verification
 */
export const resendVerificationEmail = async () => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('No user is currently signed in.');
    }

    if (user.emailVerified) {
      throw new Error('Email is already verified.');
    }

    const actionCodeSettings = {
      url: `${window.location.origin}/login?verified=true`,
      handleCodeInApp: false
    };
    await sendEmailVerification(user, actionCodeSettings);
    return { message: 'Verification email sent! Please check your inbox.' };
  } catch (error) {
    console.error('Resend verification error:', error);
    throw new Error(error.message || 'Failed to resend verification email.');
  }
};

/**
 * Get current user's ID token
 * Use this to make authenticated API requests
 */
export const getCurrentUserToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently signed in.');
  }
  
  return await user.getIdToken();
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return auth.currentUser !== null;
};

/**
 * Get current user
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Auth state observer
 * Use this in your App component to handle auth state changes
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Verify backend connectivity and sync user
 */
export const verifyAndSyncUser = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const idToken = await user.getIdToken();
    const response = await axios.post(`${API_URL}/auth/sync`, {
      firebase_uid: user.uid,
      name: user.displayName || user.email.split('@')[0],
      email: user.email,
      email_verified: user.emailVerified
    }, {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    });

    return response.data.data.user;
  } catch (error) {
    console.error('Verify and sync error:', error);
    return null;
  }
};

const firebaseAuthService = {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  resetPassword,
  resendVerificationEmail,
  getCurrentUserToken,
  isAuthenticated,
  getCurrentUser,
  onAuthStateChange,
  verifyAndSyncUser
};

export default firebaseAuthService;
