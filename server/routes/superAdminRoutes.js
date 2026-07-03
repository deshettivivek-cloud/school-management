const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { superAdminGuard } = require('../middleware/superAdminGuard');
const {
  getAllSchools,
  getSchoolById,
  getAllUsers,
  createUser,
  getStats,
  deleteUser,
  createSchool,
  updateSchool,
  deleteSchool,
  resetUserPassword,
  updateUserStatus,
  getAuditLogs,
} = require('../controllers/superAdminController');

// All routes require auth + super_admin role
router.use(protect, superAdminGuard);

// Analytics & Reports
router.get('/dashboard-stats', getStats);
router.get('/audit-logs', getAuditLogs);

// Schools Management
router.get('/schools', getAllSchools);
router.get('/schools/:id', getSchoolById);
router.post('/schools', createSchool);
router.patch('/schools/:id', updateSchool);
router.delete('/schools/:id', deleteSchool);

// Users Management
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.post('/users/:id/reset-password', resetUserPassword);
router.patch('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

module.exports = router;
