const supabase = require('../config/supabase');

// @desc    Get attendance for a specific class/date
// @route   GET /api/attendance
// @access  Auth
exports.getAttendance = async (req, res) => {
  try {
    const { classReference, date } = req.query;

    if (!classReference || !date) {
      return res.status(400).json({ success: false, message: 'Class and date are required' });
    }

    // First fetch all students for this class
    const { data: students, error: studentErr } = await supabase
      .from('students')
      .select('id, name, admission_no, photo_url')
      .eq('school_id', req.user.schoolId)
      .eq('grade', classReference)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (studentErr) throw studentErr;

    // Fetch existing attendance records for this class on this date
    const { data: records, error: recordsErr } = await supabase
      .from('attendance')
      .select('*')
      .eq('school_id', req.user.schoolId)
      .eq('class_reference', classReference)
      .eq('date', date);

    if (recordsErr && recordsErr.code !== '42P01') {
       throw recordsErr;
    }

    // Merge students with their attendance status
    const attendanceMap = {};
    if (records) {
      records.forEach(r => {
        attendanceMap[r.student_id] = r;
      });
    }

    const data = students.map(student => {
      const record = attendanceMap[student.id];
      return {
        student_id: student.id,
        name: student.name,
        admission_no: student.admission_no,
        photo_url: student.photo_url,
        status: record ? record.status : 'present', // Default to present if not marked
        remarks: record ? record.remarks : '',
        marked_by: record ? record.marked_by : null
      };
    });

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    if (error.code === '42P01') {
       // Table does not exist (fallback for migration issues)
       return res.status(404).json({ success: false, message: 'Attendance module is not properly configured (missing table). Please run migrations.' });
    }
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

    // If role is teacher, verify they are assigned to this class
    if (req.user.role === 'teacher') {
      const { data: employee, error: empErr } = await supabase
        .from('employees')
        .select('class_teacher_of')
        .eq('user_id', req.user.id)
        .single();
        
      if (empErr || !employee || employee.class_teacher_of !== classReference) {
        return res.status(403).json({ success: false, message: 'You can only mark attendance for your assigned class.' });
      }
    }

    // Upsert records
    const upsertData = records.map(record => ({
      school_id: req.user.schoolId,
      student_id: record.student_id,
      class_reference: classReference,
      date: date,
      status: record.status,
      remarks: record.remarks || '',
      marked_by: req.user.id,
      updated_at: new Date().toISOString()
    }));

    // Perform bulk upsert on (student_id, date) constraint. 
    // Supabase upsert requires specifying the onConflict column if we want to overwrite.
    const { data, error } = await supabase
      .from('attendance')
      .upsert(upsertData, { onConflict: 'student_id,date', returning: 'minimal' });

    if (error) {
      if (error.code === '42P01') {
         return res.status(404).json({ success: false, message: 'Attendance table does not exist.' });
      }
      throw error;
    }

    // Send WhatsApp notifications for absent students
    const absentRecords = records.filter(r => r.status === 'absent');
    if (absentRecords.length > 0) {
      const absentStudentIds = absentRecords.map(r => r.student_id);
      
      const { data: absentStudents } = await supabase
        .from('students')
        .select('id, name, parent_phone')
        .in('id', absentStudentIds);

      if (absentStudents) {
        const whatsappService = require('../services/whatsappService');
        for (const student of absentStudents) {
          if (student.parent_phone) {
            const message = `Dear Parent, this is an automated message from the school. Your child ${student.name} has been marked absent today (${date}). Please contact the office if you have any questions.`;
            // Fire and forget (don't block the response)
            whatsappService.sendTextMessage(student.parent_phone, message).catch(console.error);
          }
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
    
    // Get current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data: records, error } = await supabase
      .from('attendance')
      .select('status, date')
      .eq('student_id', studentId)
      .eq('school_id', req.user.schoolId)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)
      .order('date', { ascending: false });

    if (error && error.code !== '42P01') throw error;
    
    if (error && error.code === '42P01' || !records) {
       return res.json({ success: true, data: { total: 0, present: 0, percentage: 0, records: [] } });
    }

    const total = records.length;
    const present = records.filter(d => d.status === 'present' || d.status === 'late').length; // Assuming late counts as present for percentage
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

    res.json({ 
      success: true, 
      data: { 
        total, 
        present, 
        percentage, 
        records 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
