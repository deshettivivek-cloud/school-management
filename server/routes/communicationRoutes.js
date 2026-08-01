const express = require('express');
const router = express.Router();
const { sendBulkMessage, getCommunicationHistory } = require('../controllers/communicationController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// POST /api/communications/send - Send bulk message (Principal & Clerk only)
router.post('/send', protect, roleCheck('principal', 'clerk'), sendBulkMessage);

// GET /api/communications/history - Get communication log history
router.get('/history', protect, getCommunicationHistory);

module.exports = router;
