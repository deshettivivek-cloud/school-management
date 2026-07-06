const express = require('express');
const router = express.Router();
const {
  getEmployees,
  createEmployee,
  getEmployee,
  updateEmployee,
  deleteEmployee
} = require('../controllers/employeeController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// Apply protection to all employee routes
router.use(protect);

// Allow principal and authorized admins (e.g. clerk maybe) to view, but only principal to modify
router.route('/')
  .get(getEmployees)
  .post(roleCheck('principal', 'super_admin'), createEmployee);

router.route('/:id')
  .get(getEmployee)
  .put(roleCheck('principal', 'super_admin'), updateEmployee)
  .delete(roleCheck('principal', 'super_admin'), deleteEmployee);

module.exports = router;
