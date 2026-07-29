const crypto = require('crypto');

// @desc    Get attendance for a specific class/date
// @route   GET /api/attendance
// @access  Auth
exports.getAttendance = async (req, res) => {
  try {
    const { classReference, date } = req.query;

    if (!classReference || !date) {
      return res.status(400).json({ success: false, message: 'Class and date are required' });
    }

    // 1. Fetch students
    const [students] = await req.db.execute(
      'SELECT id, name, admission_no, photo_url FROM students WHERE grade = ? AND is_active = 1 ORDER BY name ASC',
      [classReference]
    );

    // 2. Fetch existing attendance records
    const [records] = await req.db.execute(
      'SELECT * FROM attendance WHERE class_reference = ? AND date = ?',
      [classReference, date]
    );

    const attendanceMap = {};
    records.forEach(r => {
      attendanceMap[r.student_id] = r;
    });

    const data = students.map(student => {
      const record = attendanceMap[student.id];
      return {
        student_id: student.id,
        name: student.name,
        admission_no: student.admission_no,
        photo_url: student.photo_url,
        status: record ? record.status : 'present', 
        remarks: record ? record.remarks : '',
        marked_by: record ? record.marked_by : null
      };
    });

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark attendance (bulk upsert)
// @route   POST /api/attendance
// @access  Auth
exports.markAttendance = async (req, res) => {
  try {
    const { classReference, date, records } = req.body;

    if (!classReference || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Invalid data provided' });
    }

    if (req.user.role === 'teacher') {
      const [empResult] = await req.db.execute(
        'SELECT class_teacher_of FROM employees WHERE user_id = ?',
        [req.user.id]
      );
        
      if (empResult.length === 0 || empResult[0].class_teacher_of !== classReference) {
        return res.status(403).json({ success: false, message: 'You can only mark attendance for your assigned class.' });
      }
    }

    // Process attendance records using a transaction
    const connection = await req.db.getConnection();
    await connection.beginTransaction();
    
    try {
      // We will loop and merge (upsert) each record
      for (const record of records) {
        const attId = crypto.randomUUID();
        await connection.execute(`
          INSERT INTO attendance (id, student_id, class_reference, date, status, remarks, marked_by)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            status = VALUES(status), 
            remarks = VALUES(remarks), 
            marked_by = VALUES(marked_by), 
            updated_at = CURRENT_TIMESTAMP
        `, [
          attId, record.student_id, classReference, date, 
          record.status, record.remarks || '', req.user.id
        ]);
      }
      
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    // Notifications
    const absentRecords = records.filter(r => r.status === 'absent');
    if (absentRecords.length > 0) {
      const absentStudentIds = absentRecords.map(r => r.student_id);
      
      const idsList = absentStudentIds.map(() => '?').join(',');
      
      const [studentsResult] = await req.db.query(`
        SELECT id, name, parent_phone FROM students WHERE id IN (${idsList})
      `, absentStudentIds);

      const whatsappService = require('../services/whatsappService');
      for (const student of studentsResult) {
        if (student.parent_phone) {
          // Send official template (Requires 'attendance_alert' approved in Meta)
          const components = [
            {
              type: "body",
              parameters: [
                { type: "text", text: student.name },
                { type: "text", text: date }
              ]
            }
          ];
          whatsappService.sendTemplateMessage(student.parent_phone, 'attendance_alert', 'en_US', components)
            .catch(err => console.error('Failed to send attendance alert:', err));
        }
      }
    }

    res.status(201).json({ success: true, message: 'Attendance saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student attendance stats
// @route   GET /api/attendance/stats/:studentId
// @access  Auth
exports.getStudentAttendanceStats = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [records] = await req.db.execute(`
        SELECT status, date 
        FROM attendance 
        WHERE student_id = ? AND date >= ? AND date <= ?
        ORDER BY date DESC
      `, [studentId, startOfMonth, endOfMonth]);

    const total = records.length;
    const present = records.filter(d => d.status === 'present' || d.status === 'late').length; 
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

    res.json({ 
      success: true, 
      data: { total, present, percentage, records } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
