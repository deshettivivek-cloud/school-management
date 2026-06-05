const express = require('express');
const router = express.Router();
const { getSchool, updateSchool, uploadLogo } = require('../controllers/schoolController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.get('/', protect, getSchool);
router.put('/', protect, roleCheck('principal'), updateSchool);
router.post('/logo', protect, roleCheck('principal'), uploadLogo);

module.exports = router;
