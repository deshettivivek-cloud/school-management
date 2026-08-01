const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { sendSMS } = require('../services/smsService');

router.post('/send', protect, async (req, res) => {
  const { to, message } = req.body;
  const result = await sendSMS(to, message);
  res.json(result);
});

module.exports = router;