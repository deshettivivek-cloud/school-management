const { sendSMS } = require('../services/smsService');
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

// @desc    Send a test SMS
// @route   POST /api/sms/test
// @access  Auth
exports.sendTestSms = async (req, res) => {
  try {
    const { phone, message, tpid } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const result = await sendSMS(phone, message, tpid);
    const messageId = extractMessageId(result.data);

    // Log to database
    await logSms(req.db, {
      phone,
      message,
      gatewayResponse: typeof result.data === 'string' ? result.data : JSON.stringify(result.data),
      messageId,
      status: result.success ? 'sent' : 'failed',
      sentBy: req.user?.id,
      sentByName: req.user?.name || '',
    });

    if (result.success) {
      res.json({ success: true, message: 'SMS sent successfully', data: result.data });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send bulk SMS to students
// @route   POST /api/sms/bulk-send
// @access  Auth
exports.sendBulkSms = async (req, res) => {
  try {
    const { target, message, tpid } = req.body;

    if (!target || !message) {
      return res.status(400).json({ success: false, message: 'Target and message are required' });
    }

    let query = 'SELECT name, parent_phone FROM students WHERE is_active = 1';
    let params = [];

    if (target.type === 'class') {
      if (target.grade) {
        query += ' AND grade = ?';
        params.push(target.grade);
      }
      if (target.section) {
        query += ' AND section = ?';
        params.push(target.section);
      }
    } else if (target.type === 'specific_students' && target.studentIds && target.studentIds.length > 0) {
      const placeholders = target.studentIds.map(() => '?').join(',');
      query += ` AND id IN (${placeholders})`;
      params.push(...target.studentIds);
    } else if (target.type !== 'all_students') {
      return res.status(400).json({ success: false, message: 'Invalid target type' });
    }

    const [students] = await req.db.query(query, params);

    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'No students found' });
    }

    let successCount = 0;
    let failCount = 0;

    for (const student of students) {
      if (student.parent_phone) {
        const personalizedMsg = message.replace(/__STUDENT_NAME__/g, student.name);

        try {
          const result = await sendSMS(student.parent_phone, personalizedMsg, tpid);
          const messageId = extractMessageId(result.data);

          // Log each SMS to database
          await logSms(req.db, {
            phone: student.parent_phone,
            message: personalizedMsg,
            gatewayResponse: typeof result.data === 'string' ? result.data : JSON.stringify(result.data),
            messageId,
            status: result.success ? 'sent' : 'failed',
            sentBy: req.user?.id,
            sentByName: req.user?.name || '',
          });

          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          console.error(`Failed to send SMS to ${student.parent_phone}:`, err);
          failCount++;
        }
      } else {
        failCount++;
      }
    }

    if (successCount === 0 && failCount > 0) {
      return res.status(500).json({
        success: false,
        message: `Failed to send SMS to all ${failCount} recipients.`
      });
    }

    res.json({
      success: true,
      message: `SMS sent. Success: ${successCount}, Failed: ${failCount}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get SMS history/logs
// @route   GET /api/sms/history
// @access  Auth
exports.getSmsHistory = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, phone } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = 'SELECT * FROM sms_logs WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM sms_logs WHERE 1=1';
    let params = [];
    let countParams = [];

    if (status) {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
      countParams.push(status);
    }

    if (phone) {
      query += ' AND phone LIKE ?';
      countQuery += ' AND phone LIKE ?';
      params.push(`%${phone}%`);
      countParams.push(`%${phone}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await req.db.query(query, params);
    const [countResult] = await req.db.query(countQuery, countParams);

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / parseInt(limit)),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
