import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import supabase from '../api/supabase';
import api from '../api/axios';

const AuthContext = createContext(null);

// Portal type constants
const PORTAL_SCHOOL = 'school';
const PORTAL_SUPER_ADMIN = 'super_admin';
const PORTAL_STORAGE_KEY = 'schoolms_portal_type';

/**
 * Get the expected portal type based on the current URL path.
 * Used during session restoration to validate the restored session.
 */
const getPortalFromURL = () => {
  const path = window.location.pathname;
  if (path.startsWith('/super-admin')) return PORTAL_SUPER_ADMIN;
  return PORTAL_SCHOOL;
};

/**
 * Get the stored portal type from sessionStorage.
 * Returns null if no portal type is stored (fresh tab/window).
 */
const getStoredPortal = () => {
  try {
    return sessionStorage.getItem(PORTAL_STORAGE_KEY);
  } catch {
    return null;
  }
};

/**
 * Store portal type in sessionStorage.
 * Using sessionStorage (not localStorage) so different tabs can have different portals.
 */
const storePortal = (portalType) => {
  try {
    sessionStorage.setItem(PORTAL_STORAGE_KEY, portalType);
  } catch {
    // Silently ignore storage errors
  }
};

const clearPortal = () => {
  try {
    sessionStorage.removeItem(PORTAL_STORAGE_KEY);
  } catch {
    // Silently ignore
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [portalType, setPortalType] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ref to prevent double profile fetch from initAuth + onAuthStateChange race
  const initCompleteRef = useRef(false);

  /**
   * Build a normalized user object from a profile record.
   * Falls back to auth user metadata if profile fields are missing.
   * Fixes RBAC-02: checks user_metadata.role before defaulting to 'teacher'.
   * Fixes FE-01: derives isSuperAdmin from role consistently.
   * Fixes PERF-01: only uses needed fields (profile already fetched with select).
   */
  const buildUserObject = useCallback((profile, authUser) => {
    // Determine role: profile.role → user_metadata.role → 'teacher'
    const role = profile?.role
      || authUser?.user_metadata?.role
      || 'teacher';

    return {
      id: profile?.id || authUser?.id,
      email: profile?.email || authUser?.email,
      name: profile?.name || authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || authUser?.email,
      role,
      assigned_classes: profile?.assigned_classes || [],
      schoolId: profile?.school_id || authUser?.user_metadata?.schoolId || null,
      mustChangePassword: profile?.must_change_password || false,
      isSuperAdmin: role === 'super_admin', // Always derived from role
    };
  }, []);

  /**
   * Fetch user profile from the profiles table.
   * Returns the built user object (or null on failure).
   */
  const fetchProfile = useCallback(async (authUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, name, role, school_id, assigned_classes, must_change_password')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        // Fall back to auth user metadata (fixes RBAC-02)
        const fallbackUser = buildUserObject(null, authUser);
        setUser(fallbackUser);
        return fallbackUser;
      }

      const userObj = buildUserObject(profile, authUser);
      setUser(userObj);
      return userObj;
    } catch (err) {
      console.error('Profile fetch failed:', err);
      return null;
    }
  }, [buildUserObject]);

  /**
   * Validate whether a restored session's role matches the expected portal.
   * This is the core fix for AUTH-01/AUTH-02: portal-aware session restoration.
   */
  const isSessionValidForPortal = useCallback((userRole, expectedPortal) => {
    if (!expectedPortal) return true; // No portal expectation → accept any session
    if (expectedPortal === PORTAL_SUPER_ADMIN) return userRole === 'super_admin';
    if (expectedPortal === PORTAL_SCHOOL) return userRole !== 'super_admin';
    return true;
  }, []);

  useEffect(() => {
    let isMounted = true;

    /**
     * Single initialization path (fixes SESS-02: eliminates race condition).
     * We use getSession() for initial load and skip the first SIGNED_IN event.
     */
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (currentSession && isMounted) {
          // Determine the expected portal for session validation
          const storedPortal = getStoredPortal();
          const urlPortal = getPortalFromURL();
          const expectedPortal = storedPortal || urlPortal;

          // Fetch the profile to know the role
          const userObj = await fetchProfile(currentSession.user);

          if (userObj && isMounted) {
            // Validate session against expected portal (AUTH-01 fix)
            if (isSessionValidForPortal(userObj.role, expectedPortal)) {
              setSession(currentSession);
              setPortalType(userObj.role === 'super_admin' ? PORTAL_SUPER_ADMIN : PORTAL_SCHOOL);
              storePortal(userObj.role === 'super_admin' ? PORTAL_SUPER_ADMIN : PORTAL_SCHOOL);
            } else {
              // Session role doesn't match the portal — clear it silently
              // Don't call signOut here; just don't restore the session
              // The user will see the login page for the portal they're on
              console.warn(`Session role "${userObj.role}" does not match expected portal "${expectedPortal}". Not restoring session.`);
              setUser(null);
              setSession(null);
              clearPortal();
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) {
          initCompleteRef.current = true;
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;

        // Skip the initial SIGNED_IN event if initAuth hasn't completed yet
        // (fixes SESS-02: prevents double fetchProfile)
        if (event === 'SIGNED_IN' && !initCompleteRef.current) {
          return;
        }

        if (event === 'SIGNED_IN' && newSession) {
          // This fires for fresh logins (after initAuth), not for session restoration
          setSession(newSession);
          await fetchProfile(newSession.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setPortalType(null);
          clearPortal();
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          setSession(newSession);
        } else if (event === 'PASSWORD_RECOVERY' && newSession) {
          setSession(newSession);
          await fetchProfile(newSession.user);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, isSessionValidForPortal]);

  // Email/password login for school users
  const signIn = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { session: newSession, user: userData } = response.data.data;

    // Set the Supabase session
    await supabase.auth.setSession({
      access_token: newSession.access_token,
      refresh_token: newSession.refresh_token,
    });

    // Set portal type (AUTH-01 / STATE-01 fix)
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
      isSuperAdmin: userData.role === 'super_admin', // Derived, not hard-coded (FE-01)
      assigned_classes: [],
    });

    return userData;
  };

  // Email/password login for super admin
  const superAdminSignIn = async (email, password) => {
    const response = await api.post('/auth/super-admin/login', { email, password });
    const { session: newSession, user: userData } = response.data.data;

    // Set the Supabase session
    await supabase.auth.setSession({
      access_token: newSession.access_token,
      refresh_token: newSession.refresh_token,
    });

    // Set portal type (AUTH-01 / STATE-01 fix)
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

  // Change password (first login or voluntary)
  const changePassword = async (newPassword) => {
    const response = await api.post('/auth/change-password', { newPassword });
    
    // Update local user state
    setUser(prev => prev ? { ...prev, mustChangePassword: false } : prev);

    return response.data;
  };

  // Forgot password
  const forgotPassword = async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  };

  /**
   * Logout — clears auth state with targeted cleanup (fixes SESS-01).
   * Only removes auth-related keys instead of nuking all of localStorage.
   */
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Supabase signout error', e);
    } finally {
      // Targeted cleanup instead of localStorage.clear() (SESS-01 fix)
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
    if (session?.user) {
      await fetchProfile(session.user);
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
