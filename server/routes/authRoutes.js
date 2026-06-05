const express = require('express');
const router = express.Router();
const { getMe, getUsers, register, updateRole } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// No login route — handled by Supabase Auth on the frontend
router.get('/me', protect, getMe);
router.get('/users', protect, roleCheck('principal'), getUsers);
router.post('/register', protect, roleCheck('principal'), register);
router.patch('/users/:id/role', protect, roleCheck('principal'), updateRole);

module.exports = router;
