/**
 * Super Admin Guard middleware.
 * Blocks all non-super_admin users from accessing Super Admin routes.
 * Must be used AFTER the protect middleware.
 */
const superAdminGuard = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  if (req.user.role !== 'super_admin') {
    console.log('🚨 [SUPER ADMIN GUARD] 403 thrown! req.user:', req.user);
    console.log('🚨 [SUPER ADMIN GUARD] originalUrl:', req.originalUrl);
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super Admin privileges required.',
    });
  }

  next();
};

module.exports = { superAdminGuard };
