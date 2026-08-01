const fetch = require('node-fetch') || globalThis.fetch;

async function sendSMS(to, message) {
  try {
    const userId = process.env.SMS_USERID;
    const password = process.env.SMS_PASSWORD;
    const sender = process.env.SMS_SENDER;
    const peid = process.env.SMS_PEID;
    const tpid = process.env.SMS_TPID;

    if (!userId || !password || !sender) {
      console.warn('SMS credentials missing in .env');
      return { success: false, error: 'SMS not configured' };
    }

    // Clean phone number (strip all non-numeric characters)
    let phone = to.replace(/\D/g, '');

    // CitySupply API strictly requires 10 digits without the country code.
    // If the user entered '91' in the database, strip it out.
    if (phone.length === 12 && phone.startsWith('91')) {
      phone = phone.substring(2);
    }

    const params = [
      `userid=${encodeURIComponent(userId)}`,
      `password=${encodeURIComponent(password)}`,
      `sender=${encodeURIComponent(sender)}`,
      `mobileno=${encodeURIComponent(phone)}`,
      `msg=${encodeURIComponent(message)}`,
      `msgtype=0`,
      `sendon=`
    ];
    if (peid) params.push(`peid=${encodeURIComponent(peid)}`);
    if (tpid) params.push(`tpid=${encodeURIComponent(tpid)}`);

    let finalUrl = `http://97.74.92.177/websms/sendsms.aspx?${params.join('&')}`;
    // Legacy ASP APIs sometimes break if commas are encoded as %2C instead of left as literal commas
    finalUrl = finalUrl.replace(/%2C/g, ',');

    console.log('\n[SMS Debug] Exact URL Requested:');
    console.log(finalUrl, '\n');

    const response = await fetch(finalUrl, { method: 'GET' });
    const data = await response.text();

    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: 'Failed to send SMS' };
    }
  } catch (error) {
    console.error('SMS Service Error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendSMS };
