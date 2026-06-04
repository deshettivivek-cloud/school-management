const express = require('express');
const router = express.Router();
const { getMe, getUsers, register, updateRole } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// No login route — handled by Supabase Auth on the frontend
router.get('/me', protect, getMe);
router.get('/users', protect, roleCheck('admin'), getUsers);
router.post('/register', protect, roleCheck('admin'), register);
router.patch('/users/:id/role', protect, roleCheck('admin'), updateRole);

module.exports = router;
