const supabase = require('../config/supabase');

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
    const { name, email, password, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    // Create user via Supabase Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { name, full_name: name },
    });

    if (authError) throw authError;

    // Update role in profiles table (trigger creates profile with 'clerk' by default)
    if (role === 'principal') {
      const { error: roleError } = await supabase
        .from('profiles')
        .update({ role: 'principal', name })
        .eq('id', authData.user.id);

      if (roleError) throw roleError;
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
    res.status(500).json({ success: false, message: error.message });
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
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
