const express = require('express');
const router = express.Router();
const { getTCs, getTC, issueTC } = require('../controllers/tcController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.get('/', protect, getTCs);
router.get('/:id', protect, getTC);
router.post('/', protect, roleCheck('principal', 'clerk'), issueTC);

module.exports = router;
