const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

// All report routes are protected.
// RBAC is handled inside the controller based on the module requested.

router.get('/:module', protect, reportController.generateReport);

module.exports = router;
