import axios from 'axios';

// For Next.js API routes, we don't need to set baseURL when on same domain
// Only set it if we have an external API
const baseURL = process.env.NEXT_PUBLIC_API_URL;
if (baseURL && baseURL !== 'http://localhost:3000') {
  axios.defaults.baseURL = baseURL;
  // Only set withCredentials for cross-origin requests
  axios.defaults.withCredentials = true;
}

// Set default content type
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Request interceptor
axios.interceptors.request.use(
  (config) => {
    // You can add auth headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Don't redirect on 401 if it's an auth check
    if (error.response?.status === 401 && !error.config.url?.includes('/api/auth/me')) {
      // The auth context will handle the logout
      console.log('Unauthorized access detected');
    }
    return Promise.reject(error);
  }
);

export default axios;