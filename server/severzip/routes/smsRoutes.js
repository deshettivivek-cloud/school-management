const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { sendSMS } = require('../services/smsService');
const { getSmsCredentials } = require('../config/sms');
const { logSms, extractMessageId } = require('../utils/smsLogger');

router.post('/send', protect, async (req, res) => {
  try {
    const { to, message } = req.body;
    const credentials = getSmsCredentials(req.school);
    const result = await sendSMS(to, message, credentials);
    const messageId = extractMessageId(result.data);

    // Log to database
    await logSms(req.db, {
      phone: to,
      message,
      gatewayResponse: typeof result.data === 'string' ? result.data : JSON.stringify(result.data),
      messageId,
      status: result.success ? 'sent' : 'failed',
      sentBy: req.user?.id,
      sentByName: req.user?.name || '',
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;