const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.use(protect);

// GET /api/dashboard/widgets
router.get('/widgets', dashboardController.getDashboardWidgets);

// POST /api/dashboard/calendar/events
router.post('/calendar/events', roleCheck('principal', 'super_admin'), dashboardController.createCalendarEvent);

module.exports = router;
