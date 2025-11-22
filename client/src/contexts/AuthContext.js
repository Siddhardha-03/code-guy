import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChange } from '../services/firebaseAuthService';
import axios from 'axios';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to Firebase auth state changes
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        
        // Get ID token and sync with backend
        try {
          const idToken = await firebaseUser.getIdToken();
          
          // Set axios default header for all requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
          
          // Sync user data from MySQL database
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/sync`,
            {}, // Empty body - user data comes from verified token
            {
              headers: {
                Authorization: `Bearer ${idToken}`
              }
            }
          );
          
          setUserData(response.data.data.user);
        } catch (error) {
          console.error('Failed to sync user data:', error);
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
        delete axios.defaults.headers.common['Authorization'];
      }
      
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Auto-refresh token every 50 minutes (tokens expire after 1 hour)
  useEffect(() => {
    if (!currentUser) return;

    const refreshToken = async () => {
      try {
        const idToken = await currentUser.getIdToken(true); // force refresh
        axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    };

    // Refresh token every 50 minutes
    const interval = setInterval(refreshToken, 50 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const value = {
    currentUser,      // Firebase user object
    userData,         // MySQL user data (with id, role, etc.)
    setUserData,      // Allow manual setting of user data
    loading,
    isAuthenticated: !!currentUser,
    isEmailVerified: currentUser?.emailVerified || false,
    isAdmin: userData?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
