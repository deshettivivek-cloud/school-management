const { sql } = require('../config/database');

// @desc    Get all transfer certificates
// @route   GET /api/tc
// @access  Auth
exports.getTCs = async (req, res) => {
  try {
    const { search } = req.query;

    let query = `
      SELECT tc.*, 
             s.name as student_name, s.admission_no, s.grade, s.section, s.parent_name,
             p.name as issued_by_name
      FROM transfer_certificates tc
      JOIN students s ON tc.student_id = s.id
      LEFT JOIN profiles p ON tc.issued_by = p.id
      WHERE 1=1
    `;
    const request = req.db.request();

    if (search) {
      query += ' AND (s.name LIKE @search OR s.admission_no LIKE @search OR tc.tc_number LIKE @search)';
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    query += ' ORDER BY tc.issued_date DESC';

    const result = await request.query(query);

    let results = result.recordset.map((row) => {
      const tc = { ...row };
      
      tc.student = {
        name: row.student_name,
        admission_no: row.admission_no,
        grade: row.grade,
        section: row.section,
        parent_name: row.parent_name
      };
      
      tc.issuedBy = { name: row.issued_by_name || 'Admin' };
      
      delete tc.student_name;
      delete tc.admission_no;
      delete tc.grade;
      delete tc.section;
      delete tc.parent_name;
      delete tc.issued_by_name;
      
      return tc;
    });

    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single TC
// @route   GET /api/tc/:id
// @access  Auth
exports.getTC = async (req, res) => {
  try {
    const result = await req.db.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query(`
        SELECT tc.*, 
               s.name as student_name, s.admission_no, s.grade, s.section, s.dob, s.gender, s.parent_name, s.parent_phone, s.address, s.admission_date, s.academic_year,
               p.name as issued_by_name
        FROM transfer_certificates tc
        JOIN students s ON tc.student_id = s.id
        LEFT JOIN profiles p ON tc.issued_by = p.id
        WHERE tc.id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'TC not found' });
    }

    const row = result.recordset[0];
    const data = { ...row };
    
    data.student = {
      name: row.student_name,
      admission_no: row.admission_no,
      grade: row.grade,
      section: row.section,
      dob: row.dob,
      gender: row.gender,
      parent_name: row.parent_name,
      parent_phone: row.parent_phone,
      address: row.address,
      admission_date: row.admission_date,
      academic_year: row.academic_year
    };
    
    data.issuedBy = { name: row.issued_by_name || 'Admin' };
    
    delete data.student_name;
    delete data.admission_no;
    delete data.grade;
    delete data.section;
    delete data.dob;
    delete data.gender;
    delete data.parent_name;
    delete data.parent_phone;
    delete data.address;
    delete data.admission_date;
    delete data.academic_year;
    delete data.issued_by_name;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Issue TC
// @route   POST /api/tc
// @access  Admin
exports.issueTC = async (req, res) => {
  try {
    const { studentId, dateOfLeaving, reason, conduct, remarks } = req.body;

    // Verify student exists and is active
    const sResult = await req.db.request()
      .input('id', sql.UniqueIdentifier, studentId)
      .query('SELECT * FROM students WHERE id = @id');

    if (sResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    const student = sResult.recordset[0];
    if (!student.is_active) {
      return res.status(400).json({ success: false, message: 'TC already issued — student is inactive' });
    }

    // Check for pending fees
    const feesResult = await req.db.request()
      .input('studentId', sql.UniqueIdentifier, studentId)
      .query('SELECT balance FROM fee_collections WHERE student_id = @studentId AND balance > 0');

    if (feesResult.recordset.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot issue TC — student has pending fees' });
    }

    // Check existing TC
    const existingTC = await req.db.request()
      .input('studentId', sql.UniqueIdentifier, studentId)
      .query('SELECT id FROM transfer_certificates WHERE student_id = @studentId');

    if (existingTC.recordset.length > 0) {
      return res.status(400).json({ success: false, message: 'TC already issued for this student' });
    }

    // Generate TC number
    const year = new Date().getFullYear();
    const countResult = await req.db.request()
      .query('SELECT COUNT(*) as count FROM transfer_certificates');
      
    const count = countResult.recordset[0].count;
    const tcNumber = `TC-${year}-${String(count + 1).padStart(4, '0')}`;

    // Create TC
    const tcResult = await req.db.request()
      .input('studentId', sql.UniqueIdentifier, studentId)
      .input('tcNumber', sql.NVarChar, tcNumber)
      .input('dateOfLeaving', sql.Date, dateOfLeaving)
      .input('reason', sql.NVarChar, reason)
      .input('conduct', sql.NVarChar, conduct || 'Good')
      .input('remarks', sql.NVarChar, remarks || '')
      .input('issuedBy', sql.UniqueIdentifier, req.user.id)
      .query(`
        INSERT INTO transfer_certificates (student_id, tc_number, date_of_leaving, reason, conduct, remarks, issued_by)
        OUTPUT INSERTED.*
        VALUES (@studentId, @tcNumber, @dateOfLeaving, @reason, @conduct, @remarks, @issuedBy)
      `);

    const tc = tcResult.recordset[0];

    // Mark student inactive
    await req.db.request()
      .input('id', sql.UniqueIdentifier, studentId)
      .query('UPDATE students SET is_active = 0, updated_at = SYSDATETIMEOFFSET() WHERE id = @id');

    // Get the final joined data for the response
    const finalResult = await req.db.request()
      .input('id', sql.UniqueIdentifier, tc.id)
      .query(`
        SELECT tc.*, 
               s.name as student_name, s.admission_no, s.grade, s.section, s.parent_name,
               p.name as issued_by_name
        FROM transfer_certificates tc
        JOIN students s ON tc.student_id = s.id
        LEFT JOIN profiles p ON tc.issued_by = p.id
        WHERE tc.id = @id
      `);

    const finalRow = finalResult.recordset[0];
    const data = { ...finalRow };
    data.student = {
      name: finalRow.student_name,
      admission_no: finalRow.admission_no,
      grade: finalRow.grade,
      section: finalRow.section,
      parent_name: finalRow.parent_name
    };
    data.issuedBy = { name: finalRow.issued_by_name || 'Admin' };
    
    // clean up
    delete data.student_name; delete data.admission_no; delete data.grade; delete data.section; delete data.parent_name; delete data.issued_by_name;

    res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
