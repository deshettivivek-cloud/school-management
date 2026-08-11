const { getMasterPool } = require('../config/database');
const { resolveSchoolDbName, getSchoolPool } = require('../config/tenantPool');
const { hashPassword, comparePassword, generateToken, generateTempPassword } = require('../config/auth');
const { logAuditAction } = require('../utils/auditLogger');
const { z } = require('zod');
const crypto = require('crypto');
const AuthRateLimiter = require('../services/authRateLimiter');
const { sendEmail } = require('../services/emailService');
const authRepository = require('../repositories/authRepository');

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
  console.warn(`[AUTH_VALIDATION_FAILURE] Path: ${req.originalUrl} | IP: ${req.ip} | Errors:`, JSON.stringify(error.errors || error.message));
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

    if (AuthRateLimiter.isLocked(email)) {
      await AuthRateLimiter.delay(3000);
      return res.status(401).json({ success: false, message: 'Incorrect email or password' });
    }

    const masterPool = await getMasterPool();

    // 1. Find school mapping for this email
    const routeResult = await authRepository.findGlobalUserSchool(masterPool, email);

    if (routeResult.length === 0) {
      const delayMs = await AuthRateLimiter.incrementAttempt(email);
      await AuthRateLimiter.delay(delayMs);
      return res.status(401).json({ success: false, message: 'Incorrect email or password' });
    }

    const schoolInfo = routeResult[0];

    // Suspension and Expiration Check
    const isSuspended = schoolInfo.is_active === 0 || schoolInfo.is_active === false;
    
    // Check if older than 365 days
    const createdAt = new Date(schoolInfo.created_at);
    const now = new Date();
    const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);
    const isExpired = daysSinceCreation > 365;

    if (isSuspended || isExpired) {
      AuthRateLimiter.clearAttempts(email);
      return res.status(403).json({ 
        success: false, 
        message: 'Your account is suspended due to low balance or it has been blocked by the super admin.' 
      });
    }

    const dbName = schoolInfo.db_name;
    const schoolPool = await getSchoolPool(dbName);

    // 2. Fetch user from school DB
    const profileResult = await authRepository.findUserProfileByEmail(schoolPool, email);

    if (profileResult.length === 0) {
      const delayMs = await AuthRateLimiter.incrementAttempt(email);
      await AuthRateLimiter.delay(delayMs);
      return res.status(401).json({ success: false, message: 'Incorrect email or password' });
    }

    const user = profileResult[0];

    if (user.is_active === 0 || user.is_active === false) {
      AuthRateLimiter.clearAttempts(email);
      return res.status(403).json({ 
        success: false, 
        message: 'Your account is suspended due to low balance or it has been blocked by the super admin.' 
      });
    }

    // 3. Verify password
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      const delayMs = await AuthRateLimiter.incrementAttempt(email);
      await AuthRateLimiter.delay(delayMs);
      return res.status(401).json({ success: false, message: 'Incorrect email or password' });
    }

    if (user.role === 'super_admin') {
      return res.status(403).json({ success: false, message: 'Super Admin accounts must use the admin portal.' });
    }

    AuthRateLimiter.clearAttempts(email);

    // 4. Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      tenantDb: dbName,
    });

    res.json({
      success: true,
      data: {
        session: { access_token: token },
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantDb: dbName,
          mustChangePassword: user.must_change_password || false,
        },
      },
    });

    req.user = { id: user.id, tenantDb: dbName }; // Mock for audit
    await logAuditAction(req, {
      action: 'LOGIN',
      resource_type: 'user',
      resource_id: user.id,
      userId: user.id
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.', error: error.message, stack: error.stack });
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

    if (AuthRateLimiter.isLocked(email)) {
      await AuthRateLimiter.delay(3000);
      return res.status(401).json({ success: false, message: 'Incorrect email or password' });
    }

    const masterPool = await getMasterPool();

    const profileResult = await authRepository.findSuperAdminByEmail(masterPool, email);

    if (profileResult.length === 0) {
      const delayMs = await AuthRateLimiter.incrementAttempt(email);
      await AuthRateLimiter.delay(delayMs);
      return res.status(401).json({ success: false, message: 'Incorrect email or password' });
    }

    const admin = profileResult[0];

    const isMatch = await comparePassword(password, admin.password_hash);
    if (!isMatch) {
      const delayMs = await AuthRateLimiter.incrementAttempt(email);
      await AuthRateLimiter.delay(delayMs);
      return res.status(401).json({ success: false, message: 'Incorrect email or password' });
    }

    AuthRateLimiter.clearAttempts(email);

    const token = generateToken({
      id: admin.id,
      email: admin.email,
      role: 'super_admin',
      tenantDb: null,
    });

    res.json({
      success: true,
      data: {
        session: { access_token: token },
        user: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          mustChangePassword: admin.must_change_password || false,
        },
      },
    });

    req.user = { id: admin.id }; // Mock for audit
    await logAuditAction(req, {
      action: 'LOGIN',
      resource_type: 'user',
      resource_id: admin.id,
      userId: admin.id
    });

  } catch (error) {
    console.error('Super Admin login error:', error);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.', error: error.message, stack: error.stack });
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Auth
exports.changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    const passwordHash = await hashPassword(newPassword);

    if (req.user.isSuperAdmin) {
      await authRepository.updateSuperAdminPassword(req.db, req.user.id, passwordHash);
    } else {
      await authRepository.updateUserProfilePassword(req.db, req.user.id, passwordHash);
    }

    res.json({ success: true, message: 'Password changed successfully' });

    await logAuditAction(req, { action: 'CHANGE_PASSWORD', resource_type: 'user', resource_id: req.user.id });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    res.json({ success: true, message: 'If that email is registered, you\'ll receive an email with instructions.' });

    const masterPool = await getMasterPool();

    const globalUserResult = await authRepository.findGlobalUserSchool(masterPool, email);
    const superAdminResult = await authRepository.findSuperAdminIdByEmail(masterPool, email);

    if (globalUserResult.length === 0 && superAdminResult.length === 0) {
      return; 
    }

    const tempPassword = generateTempPassword(12);
    const passwordHash = await hashPassword(tempPassword);

    if (superAdminResult.length > 0) {
      await authRepository.resetSuperAdminPasswordByEmail(masterPool, email, passwordHash);
    } else if (globalUserResult.length > 0) {
      const dbName = globalUserResult[0].db_name;
      const schoolPool = await getSchoolPool(dbName);

      await authRepository.resetUserProfilePasswordByEmail(schoolPool, email, passwordHash);
    }

    const emailText = `
Hello,

You recently requested to reset your password. 
We have generated a secure temporary password for your account.

Your temporary password is: ${tempPassword}

Please log in using this temporary password. You will be immediately prompted to set a new, permanent password of your choosing.

If you did not request a password reset, please contact your administrator.

Regards,
School Management System
    `;

    await sendEmail({
      to: email,
      subject: 'Your Password Reset Request',
      text: emailText.trim(),
    });

  } catch (error) {
    console.error('Forgot password error:', error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Auth
exports.getMe = async (req, res) => {
  try {
    let rows;
    if (req.user.isSuperAdmin) {
      rows = await authRepository.findSuperAdminById(req.db, req.user.id);
    } else {
      rows = await authRepository.findUserProfileById(req.db, req.user.id);
    }

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const userData = rows[0];
    if (req.user.tenantDb) {
      userData.tenantDb = req.user.tenantDb;
    }

    res.json({ success: true, data: userData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/auth/users
// @access  Admin
exports.getUsers = async (req, res) => {
  try {
    const rows = await authRepository.findAllUserProfiles(req.db);

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new user (admin only)
// @route   POST /api/auth/register
// @access  Admin
exports.register = async (req, res) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return handleValidationError(parseResult.error, req, res);
    }
    const { name, email, password, role } = parseResult.data;

    const masterPool = await getMasterPool();
    const existing = await authRepository.findGlobalUserByEmail(masterPool, email);

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists in the system' });
    }

    const existingAdmin = await authRepository.findSuperAdminEmailByEmail(masterPool, email);

    if (existingAdmin.length > 0) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists in the system' });
    }

    const passwordHash = await hashPassword(password);
    const assignedRole = role || 'clerk';
    const newUserId = crypto.randomUUID();

    await authRepository.insertUserProfile(req.db, {
      id: newUserId,
      email,
      passwordHash,
      name,
      role: assignedRole,
    });

    const newUser = { id: newUserId, email, name, role: assignedRole };

    const schoolRows = await authRepository.findSchoolIdByDbName(masterPool, req.user.tenantDb);
    const schoolId = schoolRows[0].id;
    await authRepository.insertGlobalUser(masterPool, email, schoolId);

    res.status(201).json({
      success: true,
      data: newUser,
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ success: false, message: 'Registration failed. Please check your details and try again.' });
  }
};

// @desc    Update user role
// @route   PATCH /api/auth/users/:id/role
// @access  Admin
exports.updateRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['principal', 'clerk', 'teacher'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be "principal", "clerk" or "teacher"' });
    }

    await authRepository.updateUserProfileRole(req.db, req.params.id, role);
    const rows = await authRepository.findUserProfileDetailsById(req.db, req.params.id);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user classes
// @route   PATCH /api/auth/users/:id/classes
// @access  Admin
exports.updateClasses = async (req, res) => {
  try {
    const { assigned_classes } = req.body;
    
    const classesStr = Array.isArray(assigned_classes) ? JSON.stringify(assigned_classes) : '[]';

    await authRepository.updateUserProfileClasses(req.db, req.params.id, classesStr);
    const rows = await authRepository.findUserProfileDetailsById(req.db, req.params.id);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
