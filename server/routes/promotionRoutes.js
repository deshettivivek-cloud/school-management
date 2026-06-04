const express = require('express');
const router = express.Router();
const { checkPromotion, promoteStudents } = require('../controllers/promotionController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.get('/check/:grade', protect, roleCheck('admin'), checkPromotion);
router.post('/promote', protect, roleCheck('admin'), promoteStudents);

module.exports = router;
