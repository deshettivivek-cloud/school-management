import axios from 'axios';
import supabase from './supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

let cachedToken = null;

// Listen to auth changes to cache the token synchronously
supabase.auth.onAuthStateChange((event, session) => {
  cachedToken = session?.access_token || null;
});

// Request interceptor: attach Supabase session access token
api.interceptors.request.use(
  async (config) => {
    // Fallback to getSession if cachedToken isn't set yet (initial load race condition)
    let token = cachedToken;
    if (!token) {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token;
    }
    
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
  async (error) => {
    if (error.response) {
      const { status, data, config } = error.response;
      
      // Do not trigger global signout/redirect for auth endpoints
      const isAuthRequest = config.url?.includes('/auth/login') || config.url?.includes('/auth/super-admin/login');

      if (status === 401 && !isAuthRequest) {
        // Sign out from Supabase. 
        // The onAuthStateChange listener in AuthContext will detect this, 
        // clear the user state, and React Router will gracefully redirect 
        // to the correct login portal based on the current route guards.
        await supabase.auth.signOut();
      }

      if (status === 403 && data?.mustChangePassword) {
        // Dispatch custom event or let React handle it. 
        // Since this is rare, a hard redirect is acceptable, but let's make it softer if possible.
        window.location.href = '/change-password';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
