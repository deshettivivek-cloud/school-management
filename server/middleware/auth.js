const { verifyToken } = require('../config/auth');
const { getMasterPool } = require('../config/database');
const { getSchoolPool } = require('../config/tenantPool');

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
      const [rows] = await masterPool.execute('SELECT * FROM super_admin_profiles WHERE id = ?', [decoded.id]);

      if (rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized — super admin profile not found',
        });
      }

      const profile = rows[0];

      req.user = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: 'super_admin',
        tenantDb: null,
        mustChangePassword: profile.must_change_password,
        isSuperAdmin: true,
      };

      // Super Admin uses master database
      req.db = masterPool;
      req.isMasterDb = true;
      return next();
    }

    // Regular school user — connect to their tenant database
    const tenantDb = decoded.tenantDb;
    if (!tenantDb) {
      return res.status(403).json({
        success: false,
        message: 'Your account has not yet been assigned to a school.',
      });
    }

    // Get the school's database connection
    const schoolPool = await getSchoolPool(tenantDb);

    // Fetch user profile from the school's database
    const [profileRows] = await schoolPool.execute('SELECT * FROM profiles WHERE id = ?', [decoded.id]);

    const profile = profileRows[0];

    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: profile?.name || decoded.email,
      role: profile?.role || decoded.role || 'teacher',
      tenantDb: tenantDb,
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
