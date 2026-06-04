const express = require('express');
const router = express.Router();
const { getSchool, updateSchool, uploadLogo } = require('../controllers/schoolController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.get('/', protect, getSchool);
router.put('/', protect, roleCheck('admin'), updateSchool);
router.post('/logo', protect, roleCheck('admin'), uploadLogo);

module.exports = router;
