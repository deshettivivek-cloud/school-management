/**
 * Role-based access control middleware.
 * Must be used AFTER the protect middleware (which sets req.user with role).
 */
const roleCheck = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Bypass role checking as per user request to give access to everyone
    next();
  };
};

module.exports = { roleCheck };
