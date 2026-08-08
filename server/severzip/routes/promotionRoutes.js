const express = require('express');
const router = express.Router();
const { checkPromotion, promoteStudents } = require('../controllers/promotionController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.get('/check/:grade', protect, roleCheck('principal'), checkPromotion);
router.post('/promote', protect, roleCheck('principal'), promoteStudents);

module.exports = router;
