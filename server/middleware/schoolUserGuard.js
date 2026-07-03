/**
 * School User Guard middleware.
 * Blocks super_admin users from accessing school-specific routes.
 * This prevents privilege escalation and ensures data isolation.
 * Must be used AFTER the protect middleware.
 */
const schoolUserGuard = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  if (req.user.role === 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Super Admin cannot access school-specific resources. Use the Super Admin portal.',
    });
  }

  next();
};

module.exports = { schoolUserGuard };
