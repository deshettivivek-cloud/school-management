const { sql } = require('../config/database');

// Helper: generate admission number
const generateAdmissionNo = async (db, academicYear) => {
  const yearCode = academicYear.replace('-', '');
  const prefix = `ADM-${yearCode}`;

  const result = await db.request()
    .input('prefix', sql.NVarChar, `${prefix}%`)
    .query(`
      SELECT TOP 1 admission_no 
      FROM students 
      WHERE admission_no LIKE @prefix 
      ORDER BY admission_no DESC
    `);

  let seq = 1;
  if (result.recordset && result.recordset.length > 0) {
    const lastSeq = parseInt(result.recordset[0].admission_no.split('-').pop(), 10);
    seq = lastSeq + 1;
  }

  return `${prefix}-${String(seq).padStart(4, '0')}`;
};

// @desc    Get all students (with filters)
// @route   GET /api/students
// @access  Auth
exports.getStudents = async (req, res) => {
  try {
    const { grade, academicYear, status, search, active } = req.query;
    
    let query = 'SELECT * FROM students WHERE 1=1';
    const request = req.db.request();

    if (grade) {
      query += ' AND grade = @grade';
      request.input('grade', sql.NVarChar, grade);
    }
    if (academicYear) {
      query += ' AND academic_year = @academicYear';
      request.input('academicYear', sql.NVarChar, academicYear);
    }
    if (status) {
      query += ' AND admission_status = @status';
      request.input('status', sql.NVarChar, status);
    }
    if (active !== undefined) {
      query += ' AND is_active = @active';
      request.input('active', sql.Bit, active === 'true' ? 1 : 0);
    }
    if (search) {
      query += ' AND (name LIKE @search OR admission_no LIKE @search OR parent_name LIKE @search)';
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const result = await request.query(query);

    res.json({ success: true, count: result.recordset.length, data: result.recordset });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Auth
exports.getStudent = async (req, res) => {
  try {
    const result = await req.db.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query('SELECT * FROM students WHERE id = @id');

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register new student
// @route   POST /api/students
// @access  Auth
exports.createStudent = async (req, res) => {
  try {
    const {
      name, dob, gender, grade, section, parentName, parentPhone,
      parentEmail, address, academicYear, admissionDate, photoUrl,
      admissionNo, aadharNo, motherName, motherTongue, motherPhone,
      guardianPhone, permanentAddress, fatherOccupation, motherOccupation,
      fatherOccupationDesc, motherOccupationDesc, penNumber, caste, subCaste
    } = req.body;

    const finalAdmissionNo = admissionNo || await generateAdmissionNo(req.db, academicYear);

    const result = await req.db.request()
      .input('admissionNo', sql.NVarChar, finalAdmissionNo)
      .input('name', sql.NVarChar, name)
      .input('dob', sql.Date, dob)
      .input('gender', sql.NVarChar, gender)
      .input('grade', sql.NVarChar, grade)
      .input('section', sql.NVarChar, section || '')
      .input('parentName', sql.NVarChar, parentName)
      .input('parentPhone', sql.NVarChar, parentPhone)
      .input('parentEmail', sql.NVarChar, parentEmail || '')
      .input('address', sql.NVarChar, address || '')
      .input('academicYear', sql.NVarChar, academicYear)
      .input('admissionDate', sql.Date, admissionDate || new Date().toISOString().split('T')[0])
      .input('photoUrl', sql.NVarChar, photoUrl || '')
      .input('aadharNo', sql.NVarChar, aadharNo || null)
      .input('penNumber', sql.NVarChar, penNumber || null)
      .input('caste', sql.NVarChar, caste || '')
      .input('subCaste', sql.NVarChar, subCaste || '')
      .input('motherName', sql.NVarChar, motherName || '')
      .input('motherTongue', sql.NVarChar, motherTongue || '')
      .input('motherPhone', sql.NVarChar, motherPhone || '')
      .input('guardianPhone', sql.NVarChar, guardianPhone || '')
      .input('permanentAddress', sql.NVarChar, permanentAddress || '')
      .input('fatherOccupation', sql.NVarChar, fatherOccupation || '')
      .input('motherOccupation', sql.NVarChar, motherOccupation || '')
      .input('fatherOccupationDesc', sql.NVarChar, fatherOccupationDesc || '')
      .input('motherOccupationDesc', sql.NVarChar, motherOccupationDesc || '')
      .query(`
        INSERT INTO students (
          admission_no, name, dob, gender, grade, section, parent_name, parent_phone,
          parent_email, address, academic_year, admission_date, photo_url, aadhar_no,
          pen_number, caste, sub_caste, mother_name, mother_tongue, mother_phone,
          guardian_phone, permanent_address, father_occupation, mother_occupation,
          father_occupation_desc, mother_occupation_desc
        )
        OUTPUT INSERTED.*
        VALUES (
          @admissionNo, @name, @dob, @gender, @grade, @section, @parentName, @parentPhone,
          @parentEmail, @address, @academicYear, @admissionDate, @photoUrl, @aadharNo,
          @penNumber, @caste, @subCaste, @motherName, @motherTongue, @motherPhone,
          @guardianPhone, @permanentAddress, @fatherOccupation, @motherOccupation,
          @fatherOccupationDesc, @motherOccupationDesc
        )
      `);

    const student = result.recordset[0];

    // Auto-assign fee if a fee structure exists for the student's grade
    try {
      const feeResult = await req.db.request()
        .input('academicYear', sql.NVarChar, academicYear)
        .input('grade', sql.NVarChar, grade)
        .query('SELECT * FROM fee_structures WHERE academic_year = @academicYear AND grade = @grade');

      if (feeResult.recordset.length > 0) {
        const feeStructure = feeResult.recordset[0];
        
        await req.db.request()
          .input('studentId', sql.UniqueIdentifier, student.id)
          .input('academicYear', sql.NVarChar, academicYear)
          .input('committedFee', sql.Decimal(12,2), feeStructure.total_standard_fee)
          .input('feeBreakdown', sql.NVarChar, feeStructure.fee_heads || '[]')
          .input('balance', sql.Decimal(12,2), feeStructure.total_standard_fee)
          .query(`
            INSERT INTO fee_collections (student_id, academic_year, committed_fee, fee_breakdown, balance, status)
            VALUES (@studentId, @academicYear, @committedFee, @feeBreakdown, @balance, 'pending')
          `);
      }
    } catch (feeErr) {
      console.error('Auto-assign fee on admission (non-fatal):', feeErr.message);
    }

    res.status(201).json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Auth
exports.updateStudent = async (req, res) => {
  try {
    const fields = [
      'name', 'dob', 'gender', 'grade', 'section', 'parentName', 'parentPhone',
      'parentEmail', 'address', 'academicYear', 'admissionDate', 'photoUrl',
      'admissionNo', 'aadharNo', 'motherName', 'motherTongue', 'motherPhone',
      'guardianPhone', 'permanentAddress', 'fatherOccupation', 'motherOccupation',
      'fatherOccupationDesc', 'motherOccupationDesc', 'penNumber', 'caste', 'subCaste'
    ];
    
    // Map JSON keys to DB column names
    const dbFields = {
      parentName: 'parent_name', parentPhone: 'parent_phone', parentEmail: 'parent_email',
      academicYear: 'academic_year', admissionDate: 'admission_date', photoUrl: 'photo_url',
      admissionNo: 'admission_no', aadharNo: 'aadhar_no', motherName: 'mother_name',
      motherTongue: 'mother_tongue', motherPhone: 'mother_phone', guardianPhone: 'guardian_phone',
      permanentAddress: 'permanent_address', fatherOccupation: 'father_occupation',
      motherOccupation: 'mother_occupation', fatherOccupationDesc: 'father_occupation_desc',
      motherOccupationDesc: 'mother_occupation_desc', penNumber: 'pen_number', subCaste: 'sub_caste'
    };

    let setClauses = [];
    const request = req.db.request();

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        const dbCol = dbFields[field] || field;
        setClauses.push(`${dbCol} = @${field}`);
        
        // Basic type inference for SQL Server
        if (field === 'dob' || field === 'admissionDate') {
          request.input(field, sql.Date, req.body[field]);
        } else {
          request.input(field, sql.NVarChar, req.body[field] === null ? '' : String(req.body[field]));
        }
      }
    });

    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    setClauses.push('updated_at = SYSDATETIMEOFFSET()');
    
    const query = `
      UPDATE students 
      SET ${setClauses.join(', ')} 
      OUTPUT INSERTED.*
      WHERE id = @id
    `;
    
    request.input('id', sql.UniqueIdentifier, req.params.id);
    
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update admission status
// @route   PATCH /api/students/:id/status
// @access  Admin
exports.updateAdmissionStatus = async (req, res) => {
  try {
    const { admissionStatus } = req.body;

    if (!['pending', 'confirmed'].includes(admissionStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const result = await req.db.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('status', sql.NVarChar, admissionStatus)
      .query(`
        UPDATE students 
        SET admission_status = @status, updated_at = SYSDATETIMEOFFSET()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student stats (for dashboard)
// @route   GET /api/students/stats
// @access  Auth
exports.getStudentStats = async (req, res) => {
  try {
    const { academicYear } = req.query;

    let query = 'SELECT admission_status, grade FROM students WHERE is_active = 1';
    const request = req.db.request();

    if (academicYear) {
      query += ' AND academic_year = @academicYear';
      request.input('academicYear', sql.NVarChar, academicYear);
    }

    const result = await request.query(query);
    const students = result.recordset;

    const total = students.length;
    const pending = students.filter((s) => s.admission_status === 'pending').length;
    const confirmed = students.filter((s) => s.admission_status === 'confirmed').length;

    // Grade-wise count
    const gradeMap = {};
    students.forEach((s) => {
      gradeMap[s.grade] = (gradeMap[s.grade] || 0) + 1;
    });
    const gradeWise = Object.entries(gradeMap)
      .map(([_id, count]) => ({ _id, count }))
      .sort((a, b) => a._id.localeCompare(b._id, undefined, { numeric: true }));

    const newAdmissions = total;

    res.json({
      success: true,
      data: { total, pending, confirmed, gradeWise, newAdmissions },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student exam marks
// @route   GET /api/students/:id/marks
// @access  Auth
exports.getStudentMarks = async (req, res) => {
  try {
    const result = await req.db.request()
      .input('studentId', sql.UniqueIdentifier, req.params.id)
      .query(`
        SELECT em.*, e.name as exam_name, e.term 
        FROM exam_marks em
        JOIN exams e ON em.exam_id = e.id
        WHERE em.student_id = @studentId
      `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    if (error.message.includes('Invalid object name')) {
       return res.json({ success: true, data: [] });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student timeline (audit logs)
// @route   GET /api/students/:id/timeline
// @access  Auth
exports.getStudentTimeline = async (req, res) => {
  try {
    const result = await req.db.request()
      .input('studentId', sql.NVarChar, req.params.id) // resource_id is varchar in audit_logs
      .query(`
        SELECT * FROM audit_logs 
        WHERE resource_id = @studentId
        ORDER BY created_at DESC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    if (error.message.includes('Invalid object name')) {
       return res.json({ success: true, data: [] });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};
