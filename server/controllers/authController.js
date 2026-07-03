const supabase = require('../config/supabase');
const { logAuditAction } = require('../utils/auditLogger');
const { z } = require('zod');
const AuthRateLimiter = require('../services/authRateLimiter');

// Helper to strip HTML tags, script tags, and unexpected special characters
const sanitizeString = (val) => {
  if (typeof val !== 'string') return val;
  return val.replace(/<[^>]*>?/gm, '').replace(/[^\w\s\.\-]/g, '').trim();
};

const loginSchema = z.object({
  email: z.string().email().min(5).max(100),
  password: z.string().min(8).max(100)
});

const registerSchema = z.object({
  name: z.string().min(2).max(100).transform(sanitizeString),
  email: z.string().email().min(5).max(100),
  password: z.string().min(8).max(100),
  role: z.enum(['principal', 'clerk', 'teacher']).optional()
});

const handleValidationError = (error, req, res) => {
  // Log validation failure server-side for monitoring
  console.warn(`[AUTH_VALIDATION_FAILURE] Path: ${req.originalUrl} | IP: ${req.ip} | Errors:`, JSON.stringify(error.errors || error.message));
  
  // Return generic error message without exposing specific field failures
  return res.status(400).json({
    success: false,
    message: 'Invalid input provided. Please check your details and try again.'
  });
};

// @desc    School User login (email/password)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return handleValidationError(parseResult.error, req, res);
    }
    const { email, password } = parseResult.data;

    // Check if account is locked out
    if (AuthRateLimiter.isLocked(email)) {
      // Artificially delay to prevent timing attacks, and do not reveal lockout status
      await AuthRateLimiter.delay(3000);
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password'
      });
    }

    // Sign in with Supabase Auth using a fresh client to avoid mutating the global singleton
    const { createClient } = require('@supabase/supabase-js');
    const client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    
    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      // Record failed attempt, trigger email on threshold, and apply progressive delay
      const delayMs = await AuthRateLimiter.incrementAttempt(email);
      await AuthRateLimiter.delay(delayMs);

      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password',
      });
    }

    // Successful login: clear the tracking record
    AuthRateLimiter.clearAttempts(email);

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    let activeProfile = profile;

    if (!activeProfile) {
      // Auto-fallback: Create the missing profile from auth user data
      const name = authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || authData.user.email.split('@')[0];
      
      const { data: newProfile, error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: authData.user.email,
          name: name,
          role: 'teacher',
          must_change_password: true,
        })
        .select('*')
        .single();
        
      if (upsertError) {
        console.error('Failed to auto-create profile:', upsertError);
        return res.status(500).json({
          success: false,
          message: 'Account exists but profile setup failed. Please contact your Super Admin.',
        });
      }
      activeProfile = newProfile;
    }

    // Block super_admin from logging in through school user portal
    if (activeProfile.role === 'super_admin') {
      // The session was created, but we won't return it to the frontend.
      // The frontend will treat this as a failed login.
      return res.status(403).json({
        success: false,
        message: 'Super Admin accounts must use the admin portal to sign in.',
      });
    }

    res.json({
      success: true,
      data: {
        session: authData.session,
        user: {
          id: activeProfile.id,
          name: activeProfile.name,
          email: activeProfile.email,
          role: activeProfile.role,
          schoolId: activeProfile.school_id,
          mustChangePassword: activeProfile.must_change_password || false,
        },
      },
    });
    await logAuditAction(req, {
      action: 'LOGIN',
      resource_type: 'user',
      resource_id: activeProfile.id,
      userId: activeProfile.id,
      schoolId: activeProfile.school_id
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

// @desc    Super Admin login (email/password)
// @route   POST /api/auth/super-admin/login
// @access  Public
exports.superAdminLogin = async (req, res) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return handleValidationError(parseResult.error, req, res);
    }
    const { email, password } = parseResult.data;

    // Check if account is locked out
    if (AuthRateLimiter.isLocked(email)) {
      await AuthRateLimiter.delay(3000);
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password'
      });
    }

    // Sign in with Supabase Auth using a fresh client to avoid mutating the global singleton
    const { createClient } = require('@supabase/supabase-js');
    const client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    
    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      const delayMs = await AuthRateLimiter.incrementAttempt(email);
      await AuthRateLimiter.delay(delayMs);

      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password',
      });
    }

    // Successful login: clear the tracking record
    AuthRateLimiter.clearAttempts(email);

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    let activeProfile = profile;

    if (!activeProfile) {
      // Check if email ends with @classorbit.in or is the designated super admin
      if (authData.user.email === 'superadmin@classorbit.in' || authData.user.email.endsWith('@classorbit.in')) {
         const { data: newProfile, error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: authData.user.email,
            name: 'Super Admin',
            role: 'super_admin',
            must_change_password: true,
          })
          .select('*')
          .single();

         if (upsertError) {
           return res.status(500).json({ success: false, message: 'Failed to auto-create admin profile' });
         }
         activeProfile = newProfile;
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch user profile',
        });
      }
    }

    // Only allow super_admin role
    if (activeProfile.role !== 'super_admin') {
      // The session was created, but we won't return it to the frontend.
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Super Admin accounts can log in through this portal.',
      });
    }

    res.json({
      success: true,
      data: {
        session: authData.session,
        user: {
          id: activeProfile.id,
          name: activeProfile.name,
          email: activeProfile.email,
          role: activeProfile.role,
          mustChangePassword: activeProfile.must_change_password || false,
        },
      },
    });
    await logAuditAction(req, {
      action: 'LOGIN',
      resource_type: 'user',
      resource_id: activeProfile.id,
      userId: activeProfile.id
    });

  } catch (error) {
    console.error('Super Admin login error:', error);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

// @desc    Change password (first login or voluntary)
// @route   POST /api/auth/change-password
// @access  Auth
exports.changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters',
      });
    }

    // Update password via Supabase Admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      req.user.id,
      { password: newPassword }
    );

    if (updateError) {
      throw updateError;
    }

    // Mark password as changed in profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        must_change_password: false,
        password_changed_at: new Date().toISOString(),
      })
      .eq('id', req.user.id);

    if (profileError) {
      throw profileError;
    }

    res.json({
      success: true,
      message: 'Password changed successfully',
    });

    await logAuditAction(req, {
      action: 'CHANGE_PASSWORD',
      resource_type: 'user',
      resource_id: req.user.id
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot password — send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Send password reset email via Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${req.headers.origin || process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password`,
    });

    if (error) {
      // Don't reveal if email exists or not (security)
      console.error('Forgot password error:', error);
    }

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If that email is registered, you\'ll receive a reset link',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to process request' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Auth
exports.getMe = async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/auth/users
// @access  Admin
exports.getUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('school_id', req.user.schoolId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new user (admin only) — uses Supabase Admin API
// @route   POST /api/auth/register
// @access  Admin
exports.register = async (req, res) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return handleValidationError(parseResult.error, req, res);
    }
    const { name, email, password, role } = parseResult.data;

    // Create user via Supabase Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { name, full_name: name },
    });

    if (authError) throw authError;

    if (role) {
      const { error: roleError } = await supabase
        .from('profiles')
        .upsert({ id: authData.user.id, role, name, school_id: req.user.schoolId, email });

      if (roleError) throw roleError;
    } else {
      await supabase
        .from('profiles')
        .upsert({ id: authData.user.id, name, school_id: req.user.schoolId, email });
    }

    res.status(201).json({
      success: true,
      data: {
        id: authData.user.id,
        name,
        email,
        role: role || 'clerk',
      },
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ success: false, message: 'Registration failed. Please check your details and try again.' });
  }
};

// @desc    Update user role (admin only)
// @route   PATCH /api/auth/users/:id/role
// @access  Admin
exports.updateRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['principal', 'clerk', 'teacher'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be "principal", "clerk" or "teacher"',
      });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', req.params.id)
      .eq('school_id', req.user.schoolId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
