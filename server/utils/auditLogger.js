const supabase = require('../config/supabase');

/**
 * Logs an action to the audit_logs table.
 * 
 * @param {Object} req - Express request object (used to extract IP and User-Agent)
 * @param {Object} params - The audit log details
 * @param {string} params.action - E.g. 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'
 * @param {string} params.resource_type - E.g. 'school', 'user', 'fee', 'admission'
 * @param {string} params.resource_id - The ID of the resource affected
 * @param {Object} [params.old_values] - JSON object of values before the change
 * @param {Object} [params.new_values] - JSON object of values after the change
 * @param {string} [params.schoolId] - Explicit school ID (if not provided, falls back to req.user.schoolId)
 * @param {string} [params.userId] - Explicit user ID (if not provided, falls back to req.user.id)
 */
exports.logAuditAction = async (req, { action, resource_type, resource_id, old_values = null, new_values = null, schoolId = null, userId = null }) => {
  try {
    // Extract IP (handling proxies if applicable)
    const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
    const user_agent = req.headers['user-agent'] || null;

    const actualSchoolId = schoolId || (req.user ? req.user.schoolId : null);
    const actualUserId = userId || (req.user ? req.user.id : null);

    const { error } = await supabase.from('audit_logs').insert([{
      school_id: actualSchoolId,
      user_id: actualUserId,
      action,
      resource_type,
      resource_id,
      old_values,
      new_values,
      ip_address,
      user_agent
    }]);

    if (error) {
      console.error('Failed to write audit log:', error);
    }
  } catch (err) {
    console.error('Audit Logger Error:', err);
  }
};
