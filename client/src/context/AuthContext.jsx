import { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../api/supabase';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (currentSession) {
        setSession(currentSession);
        await fetchProfile(currentSession.user);
      }
      setLoading(false);
    };

    initAuth();

    // Listen for auth state changes (login, logout, token refresh, OAuth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);

        if (event === 'SIGNED_IN' && newSession) {
          await fetchProfile(newSession.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          // Session refreshed, keep user data
          setSession(newSession);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user profile (role, name) from profiles table
  const fetchProfile = async (authUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        // Fall back to auth user metadata
        setUser({
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email,
          role: 'teacher',
          assigned_classes: [],
          schoolId: null,
        });
        return;
      }
      setUser({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        assigned_classes: profile.assigned_classes || [],
        schoolId: profile.school_id || null,
      });
    } catch (err) {
      console.error('Profile fetch failed:', err);
    }
  };

  // Google OAuth login
  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) throw error;
    return data;
  };

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
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
    signInWithGoogle,
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
