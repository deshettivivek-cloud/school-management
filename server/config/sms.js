/**
 * Get SMS credentials for a school, falling back to process.env
 * @param {Object} school - The school object from req.school
 * @returns {Object} credentials
 */
const getSmsCredentials = (school) => {
  let sms_credentials = {};

  if (school && school.sms_credentials) {
    if (typeof school.sms_credentials === 'string') {
      try {
        sms_credentials = JSON.parse(school.sms_credentials);
      } catch (err) {
        console.error('Failed to parse sms_credentials from school:', err.message);
        sms_credentials = {};
      }
    } else {
      sms_credentials = school.sms_credentials;
    }
  }

  return {
    userId: sms_credentials.userId || process.env.SMS_USERID,
    password: sms_credentials.password || process.env.SMS_PASSWORD,
    sender: sms_credentials.sender || process.env.SMS_SENDER,
    peid: sms_credentials.peid || process.env.SMS_PEID,
    tpid: sms_credentials.tpid || process.env.SMS_TPID,
  };
};

module.exports = { getSmsCredentials };
