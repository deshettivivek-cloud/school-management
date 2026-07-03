const express = require('express');
const router = express.Router();
const { getSchool, updateSchool, uploadLogo } = require('../controllers/schoolController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// Onboarding endpoints removed - SaaS model uses Super Admin creation only

// School management endpoints
router.get('/', protect, getSchool);
router.get('/daily-stats', protect, require('../controllers/schoolController').getDailyStats);
router.put('/', protect, roleCheck('principal'), updateSchool);
router.post('/logo', protect, roleCheck('principal'), uploadLogo);

module.exports = router;
