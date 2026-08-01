const express = require('express');
const router = express.Router();
const {
  login,
  superAdminLogin,
  changePassword,
  forgotPassword,
  getMe,
  getUsers,
  register,
  updateRole,
  updateClasses,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const { loginLimiter } = require('../middleware/rateLimiter');

// Public auth routes (no token required)
router.post('/login', loginLimiter, login);
router.post('/super-admin/login', loginLimiter, superAdminLogin);
router.post('/forgot-password', loginLimiter, forgotPassword);

// Protected auth routes
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);

// Principal-only routes
router.get('/users', protect, roleCheck('principal'), getUsers);
router.post('/register', protect, roleCheck('principal'), register);
router.patch('/users/:id/role', protect, roleCheck('principal'), updateRole);
router.patch('/users/:id/classes', protect, roleCheck('principal'), updateClasses);

module.exports = router;