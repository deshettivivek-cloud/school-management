const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const whatsappService = require('../services/whatsappService');

router.get('/status', protect, (req, res) => {
  res.json({ success: true, configured: whatsappService.isConfigured() });
});

module.exports = router;