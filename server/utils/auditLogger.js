const { getMasterPool } = require('../config/database');
const crypto = require('crypto');

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
    const ip_address = (req && req.headers && req.headers['x-forwarded-for']) || (req && req.socket && req.socket.remoteAddress) || null;
    const user_agent = (req && req.headers && req.headers['user-agent']) || null;

    const actualSchoolId = schoolId || (req.user ? req.user.schoolId : null);
    const actualUserId = userId || (req.user ? req.user.id : null);

    const masterPool = await getMasterPool();
    const auditId = crypto.randomUUID();

    await masterPool.execute(`
      INSERT INTO audit_logs (id, school_id, user_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      auditId ?? null,
      actualSchoolId ?? null,
      actualUserId ?? null,
      action ?? null,
      resource_type ?? null,
      resource_id ? String(resource_id) : null,
      old_values ? JSON.stringify(old_values) : null,
      new_values ? JSON.stringify(new_values) : null,
      ip_address ? String(ip_address).substring(0, 50) : null,
      user_agent ? String(user_agent).substring(0, 500) : null
    ]);

  } catch (err) {
    console.error('Audit Logger Error:', err.message);
  }
};
