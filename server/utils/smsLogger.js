const crypto = require('crypto');

// Helper: Log SMS to database
const logSms = async (db, { phone, message, gatewayResponse, messageId, status, sentBy, sentByName }) => {
  try {
    const id = crypto.randomUUID();
    await db.query(
      `INSERT INTO sms_logs (id, phone, message, gateway_response, message_id, status, sent_by, sent_by_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, phone, message, gatewayResponse || '', messageId || '', status, sentBy || null, sentByName || '']
    );
  } catch (err) {
    console.error('Failed to log SMS to database:', err.message);
  }
};

// Helper: Extract message ID from gateway response
const extractMessageId = (responseData) => {
  if (typeof responseData === 'string' && responseData.includes('Message ID:')) {
    return responseData.split('Message ID:')[1].trim();
  }
  return '';
};

module.exports = {
  logSms,
  extractMessageId,
};
