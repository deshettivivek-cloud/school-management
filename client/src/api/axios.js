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
    const status = error.response ? error.response.status : null;
    const data = error.response ? error.response.data : null;
    
    // Bypass interceptor for specific endpoints to handle errors in components
    const isAuthRequest = error.config && error.config.url && error.config.url.includes('/auth/login');
    const isMeRequest = error.config && error.config.url && error.config.url.includes('/auth/me');

    console.error(`[Axios Interceptor] URL: ${error.config?.url}, Status: ${status}, Message: ${data?.message || error.message}`);

    if (status === 401 && !isAuthRequest && !isMeRequest) {
      console.log('[Axios Interceptor] Clearing token due to 401 on', error.config?.url, 'Message:', data?.message);
      // Clear token on Unauthorized response
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    if (status === 403 && data?.mustChangePassword) {
      window.location.href = '/change-password';
    }

    return Promise.reject(error);
  }
);

export default api;
