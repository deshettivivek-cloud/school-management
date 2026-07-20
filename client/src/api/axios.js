import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT access token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 and 403
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data, config } = error.response;
      
      // Do not trigger global signout/redirect for auth endpoints
      const isAuthRequest = config.url?.includes('/auth/login') || config.url?.includes('/auth/super-admin/login');

      if (status === 401 && !isAuthRequest) {
        // Clear token on Unauthorized response
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }

      if (status === 403 && data?.mustChangePassword) {
        window.location.href = '/change-password';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
