const { verifyToken } = require('../config/auth');
const { sql, getMasterPool } = require('../config/database');
const { resolveSchoolDbName, getSchoolPool } = require('../config/tenantPool');

/**
 * JWT Auth middleware — replaces Supabase Auth.
 * Verifies the Bearer token, fetches the user profile,
 * and resolves the school's database connection.
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
    // Verify the JWT
    const decoded = verifyToken(token);

    // Check if user is a Super Admin
    if (decoded.role === 'super_admin') {
      // Super Admins are stored in the master database
      const masterPool = await getMasterPool();
      const result = await masterPool.request()
        .input('id', sql.UniqueIdentifier, decoded.id)
        .query('SELECT * FROM super_admin_profiles WHERE id = @id');

      if (!result.recordset || result.recordset.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized — super admin profile not found',
        });
      }

      const profile = result.recordset[0];

      req.user = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: 'super_admin',
        schoolId: null,
        mustChangePassword: profile.must_change_password,
        isSuperAdmin: true,
      };

      // Super Admin uses master database
      req.db = masterPool;
      req.isMasterDb = true;
      return next();
    }

    // Regular school user — resolve their school's database
    const schoolId = decoded.schoolId;
    if (!schoolId) {
      return res.status(403).json({
        success: false,
        message: 'Your account has not yet been assigned to a school.',
      });
    }

    // Get the school's database connection
    const dbName = await resolveSchoolDbName(schoolId);
    const schoolPool = await getSchoolPool(dbName);

    // Fetch user profile from the school's database
    const profileResult = await schoolPool.request()
      .input('id', sql.UniqueIdentifier, decoded.id)
      .query('SELECT * FROM profiles WHERE id = @id');

    const profile = profileResult.recordset[0];

    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: profile?.name || decoded.email,
      role: profile?.role || decoded.role || 'teacher',
      schoolId: schoolId,
      mustChangePassword: profile?.must_change_password || false,
      isSuperAdmin: false,
    };

    // Attach the school's database connection
    req.db = schoolPool;
    req.isMasterDb = false;

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

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — token has expired',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Not authorized — invalid token',
    });
  }
};

module.exports = { protect };
