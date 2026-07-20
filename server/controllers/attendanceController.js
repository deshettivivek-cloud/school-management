const { sql } = require('../config/database');

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
    const studentsResult = await req.db.request()
      .input('grade', sql.NVarChar, classReference)
      .query('SELECT id, name, admission_no, photo_url FROM students WHERE grade = @grade AND is_active = 1 ORDER BY name ASC');

    const students = studentsResult.recordset;

    // 2. Fetch existing attendance records
    const recordsResult = await req.db.request()
      .input('classReference', sql.NVarChar, classReference)
      .input('date', sql.Date, date)
      .query('SELECT * FROM attendance WHERE class_reference = @classReference AND date = @date');

    const records = recordsResult.recordset;

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
      const empResult = await req.db.request()
        .input('userId', sql.UniqueIdentifier, req.user.id)
        .query('SELECT class_teacher_of FROM employees WHERE user_id = @userId');
        
      if (empResult.recordset.length === 0 || empResult.recordset[0].class_teacher_of !== classReference) {
        return res.status(403).json({ success: false, message: 'You can only mark attendance for your assigned class.' });
      }
    }

    // Process attendance records using a transaction
    const transaction = new sql.Transaction(req.db);
    await transaction.begin();
    
    try {
      const request = new sql.Request(transaction);
      
      // We will loop and merge (upsert) each record
      for (const record of records) {
        request.input('studentId', sql.UniqueIdentifier, record.student_id);
        request.input('classRef', sql.NVarChar, classReference);
        request.input('date', sql.Date, date);
        request.input('status', sql.NVarChar, record.status);
        request.input('remarks', sql.NVarChar, record.remarks || '');
        request.input('markedBy', sql.UniqueIdentifier, req.user.id);

        await request.query(`
          MERGE attendance AS target
          USING (SELECT @studentId AS student_id, @date AS date) AS source
          ON (target.student_id = source.student_id AND target.date = source.date)
          WHEN MATCHED THEN
              UPDATE SET 
                status = @status, 
                remarks = @remarks, 
                marked_by = @markedBy, 
                updated_at = SYSDATETIMEOFFSET()
          WHEN NOT MATCHED THEN
              INSERT (student_id, class_reference, date, status, remarks, marked_by)
              VALUES (@studentId, @classRef, @date, @status, @remarks, @markedBy);
        `);
        
        // Clear inputs for next iteration to prevent errors
        request.parameters = {}; 
      }
      
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    // Notifications
    const absentRecords = records.filter(r => r.status === 'absent');
    if (absentRecords.length > 0) {
      const absentStudentIds = absentRecords.map(r => r.student_id);
      
      const idsList = absentStudentIds.map((_, i) => `@id${i}`).join(',');
      const studentsReq = req.db.request();
      absentStudentIds.forEach((id, i) => studentsReq.input(`id${i}`, sql.UniqueIdentifier, id));
      
      const studentsResult = await studentsReq.query(`
        SELECT id, name, parent_phone FROM students WHERE id IN (${idsList})
      `);

      const whatsappService = require('../services/whatsappService');
      for (const student of studentsResult.recordset) {
        if (student.parent_phone) {
          const message = `Dear Parent, this is an automated message from the school. Your child ${student.name} has been marked absent today (${date}). Please contact the office if you have any questions.`;
          whatsappService.sendTextMessage(student.parent_phone, message).catch(console.error);
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

    const result = await req.db.request()
      .input('studentId', sql.UniqueIdentifier, studentId)
      .input('start', sql.Date, startOfMonth)
      .input('end', sql.Date, endOfMonth)
      .query(`
        SELECT status, date 
        FROM attendance 
        WHERE student_id = @studentId AND date >= @start AND date <= @end
        ORDER BY date DESC
      `);

    const records = result.recordset;

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
