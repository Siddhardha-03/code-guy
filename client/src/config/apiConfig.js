// Dynamic API configuration
// Auto-detects the correct API URL based on environment

const getApiUrl = () => {
  // Check if API URL is explicitly set in environment
  if (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim()) {
    console.log('🔧 Using configured API URL:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }

  // Auto-detect based on current hostname
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  console.log('🔍 Auto-detecting API URL for hostname:', hostname);

  // Development environment
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const apiUrl = 'http://localhost:5000/api';
    console.log('🛠️ Development detected, using:', apiUrl);
    return apiUrl;
  }

  // Render deployment - auto-detect server URL
  if (hostname.includes('.onrender.com')) {
    // Try to guess server URL based on client URL patterns
    let serverUrl;
    
    if (hostname.includes('code-guy-1')) {
      serverUrl = 'https://code-guy.onrender.com/api';
    } else if (hostname.includes('code-guy')) {
      serverUrl = 'https://code-guy.onrender.com/api';
    } else {
      // Fallback: replace 'client' with 'server' or add '-server'
      const serverHostname = hostname
        .replace('-client', '')
        .replace('client-', '')
        .replace('code-guy-1', 'code-guy')
        + (hostname.includes('-') ? '' : '-server');
      
      serverUrl = `${protocol}//${serverHostname}/api`;
    }
    
    console.log('🚀 Render deployment detected, using:', serverUrl);
    return serverUrl;
  }

  // Netlify deployment
  if (hostname.includes('.netlify.app')) {
    // For Netlify, you'd typically set the API URL explicitly
    const apiUrl = 'https://code-guy.onrender.com/api'; // Your Render server
    console.log('🌐 Netlify deployment detected, using:', apiUrl);
    return apiUrl;
  }

  // Vercel deployment
  if (hostname.includes('.vercel.app')) {
    const apiUrl = 'https://code-guy.onrender.com/api'; // Your Render server
    console.log('▲ Vercel deployment detected, using:', apiUrl);
    return apiUrl;
  }

  // Custom domain - try to infer API subdomain
  if (hostname.includes('.')) {
    const apiUrl = `${protocol}//api.${hostname.split('.').slice(-2).join('.')}/api`;
    console.log('🌍 Custom domain detected, trying:', apiUrl);
    return apiUrl;
  }

  // Fallback to production server
  const fallbackUrl = 'https://code-guy.onrender.com/api';
  console.log('⚠️ Could not auto-detect, using fallback:', fallbackUrl);
  return fallbackUrl;
};

// Export the dynamic API URL
export const API_URL = getApiUrl();

// Log the final API URL being used
console.log('🎯 Final API URL:', API_URL);

export default API_URL;