import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

// Portal type constants
const PORTAL_SCHOOL = 'school';
const PORTAL_SUPER_ADMIN = 'super_admin';
const PORTAL_STORAGE_KEY = 'schoolms_portal_type';

const getPortalFromURL = () => {
  const path = window.location.pathname;
  if (path.startsWith('/super-admin')) return PORTAL_SUPER_ADMIN;
  return PORTAL_SCHOOL;
};

const getStoredPortal = () => {
  try {
    return sessionStorage.getItem(PORTAL_STORAGE_KEY);
  } catch {
    return null;
  }
};

const storePortal = (portalType) => {
  try {
    sessionStorage.setItem(PORTAL_STORAGE_KEY, portalType);
  } catch {
  }
};

const clearPortal = () => {
  try {
    sessionStorage.removeItem(PORTAL_STORAGE_KEY);
  } catch {
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [portalType, setPortalType] = useState(null);
  const [loading, setLoading] = useState(true);

  const isSessionValidForPortal = useCallback((userRole, expectedPortal) => {
    if (!expectedPortal) return true;
    if (expectedPortal === PORTAL_SUPER_ADMIN) return userRole === 'super_admin';
    if (expectedPortal === PORTAL_SCHOOL) return userRole !== 'super_admin';
    return true;
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.data;

      // Decode token to get tenantDb if not provided by backend
      const token = localStorage.getItem('token');
      let tokenTenantDb = null;
      try {
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          tokenTenantDb = payload.tenantDb;
        }
      } catch (e) { }

      const userObj = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        assigned_classes: userData.assigned_classes || [],
        tenantDb: userData.tenantDb || tokenTenantDb || null,
        mustChangePassword: userData.must_change_password || userData.mustChangePassword || false,
        isSuperAdmin: userData.role === 'super_admin',
      };

      setUser(userObj);
      return { user: userObj, error: null };
    } catch (err) {
      console.error('Profile fetch failed:', err);
      const status = err.response?.status;
      // Return whether this was an auth error (token invalid/expired)
      // vs a transient error (network/server issue)
      const isAuthError = status === 401 || status === 403;
      return { user: null, error: isAuthError ? 'auth' : 'network' };
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');

        if (token && isMounted) {
          const expectedPortal = getStoredPortal() || getPortalFromURL();

          const result = await fetchProfile();
          const userObj = result?.user;
          const fetchError = result?.error;

          if (userObj && isMounted) {
            if (isSessionValidForPortal(userObj.role, expectedPortal)) {
              setSession({ access_token: token });
              setPortalType(userObj.role === 'super_admin' ? PORTAL_SUPER_ADMIN : PORTAL_SCHOOL);
              storePortal(userObj.role === 'super_admin' ? PORTAL_SUPER_ADMIN : PORTAL_SCHOOL);
            } else {
              console.warn(`Session role "${userObj.role}" does not match expected portal "${expectedPortal}".`);
              console.log('Clearing token because of invalid session for portal');
              setUser(null);
              setSession(null);
              clearPortal();
              localStorage.removeItem('token');
            }
          } else if (fetchError === 'auth') {
            // Token is invalid or expired — clear it
            console.log('Clearing token because of auth error (401/403)');
            localStorage.removeItem('token');
          } else {
            // Network / server error — keep the token, restore session from token
            // so user is not logged out due to a transient server issue
            console.warn('Profile fetch failed due to network/server error — keeping session alive');
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              // Check token expiry
              if (payload.exp && payload.exp * 1000 > Date.now()) {
                setSession({ access_token: token });
                setUser({
                  id: payload.id,
                  email: payload.email,
                  name: payload.email,
                  role: payload.role,
                  tenantDb: payload.tenantDb || null,
                  mustChangePassword: false,
                  isSuperAdmin: payload.role === 'super_admin',
                  assigned_classes: [],
                });
                setPortalType(payload.role === 'super_admin' ? PORTAL_SUPER_ADMIN : PORTAL_SCHOOL);
                storePortal(payload.role === 'super_admin' ? PORTAL_SUPER_ADMIN : PORTAL_SCHOOL);
              } else {
                // Token is expired — clear it
                console.log('Token is expired — clearing');
                localStorage.removeItem('token');
              }
            } catch {
              // Malformed token — clear it
              console.log('Token is malformed — clearing');
              localStorage.removeItem('token');
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for unauthorized events from axios interceptor
    const handleUnauthorized = () => {
      if (isMounted) {
        setUser(null);
        setSession(null);
        setPortalType(null);
        clearPortal();
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [fetchProfile, isSessionValidForPortal]);

  // Email/password login for school users
  const signIn = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { session: newSession, user: userData } = response.data.data;

    localStorage.setItem('token', newSession.access_token);

    setPortalType(PORTAL_SCHOOL);
    storePortal(PORTAL_SCHOOL);

    setSession(newSession);
    setUser({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      tenantDb: userData.tenantDb,
      mustChangePassword: userData.mustChangePassword,
      isSuperAdmin: userData.role === 'super_admin',
      assigned_classes: [],
    });

    return userData;
  };

  // Email/password login for super admin
  const superAdminSignIn = async (email, password) => {
    const response = await api.post('/auth/super-admin/login', { email, password });
    const { session: newSession, user: userData } = response.data.data;

    localStorage.setItem('token', newSession.access_token);

    setPortalType(PORTAL_SUPER_ADMIN);
    storePortal(PORTAL_SUPER_ADMIN);

    setSession(newSession);
    setUser({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      tenantDb: null,
      mustChangePassword: userData.mustChangePassword,
      isSuperAdmin: true,
      assigned_classes: [],
    });

    return userData;
  };

  // Change password
  const changePassword = async (newPassword) => {
    const response = await api.post('/auth/change-password', { newPassword });
    setUser(prev => prev ? { ...prev, mustChangePassword: false } : prev);
    return response.data;
  };

  // Forgot password
  const forgotPassword = async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  };

  const logout = async () => {
    try {
      localStorage.removeItem('token');
    } finally {
      clearPortal();
      setUser(null);
      setSession(null);
      setPortalType(null);
    }
  };

  const hasAccess = (allowedRoles) => {
    if (!user) return false;
    if (!Array.isArray(allowedRoles)) return false;
    return allowedRoles.includes(user.role);
  };

  const refreshProfile = async () => {
    if (session) {
      await fetchProfile();
    }
  };

  const value = {
    user,
    session,
    loading,
    portalType,
    signIn,
    superAdminSignIn,
    changePassword,
    forgotPassword,
    logout,
    hasAccess,
    refreshProfile,
    isAuthenticated: !!session,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
