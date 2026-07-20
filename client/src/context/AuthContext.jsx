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
      
      const userObj = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        assigned_classes: userData.assigned_classes || [],
        schoolId: userData.school_id || userData.schoolId || null,
        mustChangePassword: userData.must_change_password || userData.mustChangePassword || false,
        isSuperAdmin: userData.role === 'super_admin',
      };
      
      setUser(userObj);
      return userObj;
    } catch (err) {
      console.error('Profile fetch failed:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');

        if (token && isMounted) {
          const expectedPortal = getStoredPortal() || getPortalFromURL();
          
          const userObj = await fetchProfile();

          if (userObj && isMounted) {
            if (isSessionValidForPortal(userObj.role, expectedPortal)) {
              setSession({ access_token: token });
              setPortalType(userObj.role === 'super_admin' ? PORTAL_SUPER_ADMIN : PORTAL_SCHOOL);
              storePortal(userObj.role === 'super_admin' ? PORTAL_SUPER_ADMIN : PORTAL_SCHOOL);
            } else {
              console.warn(`Session role "\${userObj.role}" does not match expected portal "\${expectedPortal}".`);
              setUser(null);
              setSession(null);
              clearPortal();
              localStorage.removeItem('token');
            }
          } else {
            // Token is invalid
            localStorage.removeItem('token');
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
      schoolId: userData.schoolId,
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
      schoolId: null,
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
