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
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — profile not found',
      });
    }

    // Attach to request
    req.user = {
      id: user.id,
      email: user.email,
      name: profile.name,
      role: profile.role,
    };

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
