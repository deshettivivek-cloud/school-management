const crypto = require('crypto');
const whatsappService = require('../services/whatsappService');
const smsService = require('../services/smsService');
const { logAuditAction } = require('../utils/auditLogger');

/**
 * Send bulk message via specified channel (WhatsApp enabled, SMS stubbed/rejected)
 * @route POST /api/communications/send
 * @access Private (Principal, Clerk)
 */
exports.sendBulkMessage = async (req, res) => {
  try {
    const targetFilter = req.body.targetFilter || req.body.target_filter || 'All Students';
    const channel = (req.body.channel || '').toLowerCase();
    const messageText = req.body.messageText || req.body.message_text;

    // 1. Channel Validation
    if (channel !== 'whatsapp' && channel !== 'sms') {
      return res.status(400).json({
        success: false,
        message: 'Invalid communication channel. Currently supported channels are whatsapp and sms.',
      });
    }

    // 2. Content Validation
    if (!messageText || !messageText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required.',
      });
    }

    const trimmedText = messageText.trim();

    // 3. Find matching students with valid parent_phone
    let query = `
      SELECT id, name, parent_phone, grade 
      FROM students 
      WHERE deleted_at IS NULL AND is_active = 1 AND parent_phone IS NOT NULL AND TRIM(parent_phone) != ''
    `;
    let params = [];

    const isAll = !targetFilter || targetFilter === 'all' || targetFilter === 'All Students';

    if (!isAll) {
      // Stripping "Grade " prefix if present to match grade column format
      const rawGrade = targetFilter.replace(/^Grade\s+/i, '').trim();
      query += ` AND (grade = ? OR grade = ?)`;
      params.push(rawGrade, targetFilter);
    }

    const [students] = await req.db.execute(query, params);

    if (!students || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No recipients with valid parent phone numbers found for filter "${targetFilter}".`,
      });
    }

    // 4. Send messages to each student's parent_phone
    let successCount = 0;
    let failCount = 0;
    const sendResults = [];

    for (const student of students) {
      let result;
      if (channel === 'whatsapp') {
        result = await whatsappService.sendTextMessage(student.parent_phone, trimmedText);
      } else if (channel === 'sms') {
        result = await smsService.sendSMS(student.parent_phone, trimmedText);
      }
      
      if (result && result.success) {
        successCount++;
      } else {
        failCount++;
      }
      sendResults.push({
        studentId: student.id,
        phone: student.parent_phone,
        success: Boolean(result && result.success),
        error: result?.error || null,
      });
    }

    const recipientCount = students.length;
    let status = 'sent';
    if (successCount === 0) {
      status = 'failed';
    } else if (failCount > 0) {
      status = 'partial';
    }

    // 5. Insert row into communication_logs
    const logId = crypto.randomUUID();
    let sentBy = req.user?.id || null;

    if (sentBy) {
      const [profileRows] = await req.db.execute('SELECT id FROM profiles WHERE id = ? LIMIT 1', [sentBy]);
      if (!profileRows || profileRows.length === 0) {
        sentBy = null;
      }
    }

    await req.db.execute(
      `INSERT INTO communication_logs (id, sent_by, channel, message_text, recipient_count, target_filter, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [logId, sentBy, channel, trimmedText, recipientCount, targetFilter, status]
    );

    // 6. Log audit action
    await logAuditAction(req, {
      action: 'BULK_MESSAGE_SENT',
      resource_type: 'communication_log',
      resource_id: logId,
      new_values: {
        channel,
        target_filter: targetFilter,
        recipient_count: recipientCount,
        success_count: successCount,
        fail_count: failCount,
        status,
      },
    });

    return res.json({
      success: true,
      message: `Sent to ${successCount} of ${recipientCount} recipients.`,
      data: {
        logId,
        channel,
        targetFilter,
        recipientCount,
        successCount,
        failCount,
        status,
        results: sendResults,
      },
    });
  } catch (error) {
    console.error('Error in sendBulkMessage:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send bulk message: ' + error.message,
    });
  }
};

/**
 * Get paginated communication history logs
 * @route GET /api/communications/history
 * @access Private
 */
exports.getCommunicationHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    // Fetch total count
    const [countRows] = await req.db.execute(`SELECT COUNT(*) AS total FROM communication_logs`);
    const total = countRows[0]?.total || 0;

    // Fetch logs with sender profile name
    const [rows] = await req.db.execute(
      `SELECT 
        c.id, 
        c.sent_by, 
        c.channel, 
        c.message_text, 
        c.recipient_count, 
        c.target_filter, 
        c.status, 
        c.created_at,
        p.name AS sender_name
       FROM communication_logs c
       LEFT JOIN profiles p ON c.sent_by = p.id
       ORDER BY c.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`
    );

    return res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Error in getCommunicationHistory:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch communication history: ' + error.message,
    });
  }
};
