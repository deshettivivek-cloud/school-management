// Placeholder SMS service — no SMS provider wired up yet.
async function sendSMS(to, message) {
  console.log(`[SMS - not sent, no provider configured] To: ${to}, Message: ${message}`);
  return { success: false, message: 'SMS service not configured' };
}

module.exports = { sendSMS };