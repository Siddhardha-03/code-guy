import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add Firebase token
axiosInstance.interceptors.request.use(
  async (config) => {
    // Token is already set in axios.defaults.headers.common by AuthContext
    // This interceptor can be used for additional request processing if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Handle specific error codes
      if (error.response.status === 401) {
        // Token expired or invalid
        if (error.response.data?.code === 'TOKEN_EXPIRED') {
          // The AuthContext will handle token refresh
          console.log('Token expired, please refresh');
        }
      }
      
      if (error.response.status === 403) {
        // Forbidden - user doesn't have permission
        console.error('Access denied:', error.response.data?.message);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
export { API_URL };
