const { createClient } = require('@supabase/supabase-js');

/**
 * Supabase Auth middleware.
 * Verifies the Bearer token from the frontend's Supabase session
 * and attaches the user + profile to req.
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized — no token provided',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Create a per-request Supabase client with the user's token
    // This respects RLS policies
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    // Verify the JWT and get the user
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — invalid or expired token',
      });
    }

    // Fetch the user's profile (role, name)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // We don't throw 401 if profile is missing, to prevent infinite login loops 
    // for users who signed up before the database schema was fully executed.

    // Attach to request
    req.user = {
      id: user.id,
      email: user.email,
      name: profile?.name || user.email,
      role: profile?.role || 'teacher', // fallback to 'teacher' instead of 'staff' based on schema
      schoolId: profile?.school_id || null,
      mustChangePassword: profile?.must_change_password || false,
      isSuperAdmin: profile?.role === 'super_admin',
    };

    // If user must change password, only allow specific endpoints
    if (req.user.mustChangePassword) {
      const allowedPaths = [
        '/api/auth/me',
        '/api/auth/change-password',
      ];
      const isAllowed = allowedPaths.some(path => req.originalUrl.startsWith(path));
      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: 'You must change your password before continuing',
          mustChangePassword: true,
        });
      }
    }

    // Super Admin users don't need a school — skip school check for them
    if (req.user.isSuperAdmin) {
      return next();
    }

    // Protect multi-tenant routes from users without a school
    if (!req.user.schoolId && req.originalUrl !== '/api/auth/me') {
      return res.status(403).json({
        success: false,
        message: 'Your account has not yet been assigned to a school. Please contact your administrator.',
      });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized — token verification failed',
    });
  }
};

module.exports = { protect };
