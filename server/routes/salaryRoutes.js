const express = require('express');
const router = express.Router();
const {
  getSalaryDashboard,
  generateMonthlySalary,
  getSalaryHistory,
  updateSalaryStatus
} = require('../controllers/salaryController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// Apply protection to all salary routes
router.use(protect);

// Only principals should manage salaries as per requirements
router.use(roleCheck('principal', 'super_admin'));

router.get('/dashboard', getSalaryDashboard);
router.post('/generate', generateMonthlySalary);
router.get('/history', getSalaryHistory);
router.put('/:id/status', updateSalaryStatus);

module.exports = router;
