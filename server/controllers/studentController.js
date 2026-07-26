// Helper: generate admission number
const generateAdmissionNo = async (db, academicYear) => {
  const yearCode = academicYear.replace('-', '');
  const prefix = `ADM-${yearCode}`;

  const [rows] = await db.execute(`
      SELECT admission_no 
      FROM students 
      WHERE admission_no LIKE ? 
      ORDER BY admission_no DESC
      LIMIT 1
    `, [`${prefix}%`]);

  let seq = 1;
  if (rows && rows.length > 0) {
    const lastSeq = parseInt(rows[0].admission_no.split('-').pop(), 10);
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
    let params = [];

    if (grade) {
      query += ' AND grade = ?';
      params.push(grade);
    }
    if (academicYear) {
      query += ' AND academic_year = ?';
      params.push(academicYear);
    }
    if (status) {
      query += ' AND admission_status = ?';
      params.push(status);
    }
    if (active !== undefined) {
      query += ' AND is_active = ?';
      params.push(active === 'true' ? 1 : 0);
    }
    if (search) {
      query += ' AND (name LIKE ? OR admission_no LIKE ? OR parent_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await req.db.execute(query, params);

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Auth
exports.getStudent = async (req, res) => {
  try {
    const [rows] = await req.db.execute('SELECT * FROM students WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ success: true, data: rows[0] });
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

    await req.db.execute(`
        INSERT INTO students (
          admission_no, name, dob, gender, grade, section, parent_name, parent_phone,
          parent_email, address, academic_year, admission_date, photo_url, aadhar_no,
          pen_number, caste, sub_caste, mother_name, mother_tongue, mother_phone,
          guardian_phone, permanent_address, father_occupation, mother_occupation,
          father_occupation_desc, mother_occupation_desc
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?
        )
      `, [
        finalAdmissionNo, name, dob, gender, grade, section || '', parentName, parentPhone,
        parentEmail || '', address || '', academicYear, admissionDate || new Date().toISOString().split('T')[0], photoUrl || '', aadharNo || null,
        penNumber || null, caste || '', subCaste || '', motherName || '', motherTongue || '', motherPhone || '',
        guardianPhone || '', permanentAddress || '', fatherOccupation || '', motherOccupation || '',
        fatherOccupationDesc || '', motherOccupationDesc || ''
      ]);

    const [rows] = await req.db.execute('SELECT * FROM students WHERE admission_no = ?', [finalAdmissionNo]);
    const student = rows[0];

    // Auto-assign fee if a fee structure exists for the student's grade
    try {
      const [feeResult] = await req.db.execute(
        'SELECT * FROM fee_structures WHERE academic_year = ? AND grade = ?',
        [academicYear, grade]
      );

      if (feeResult.length > 0) {
        const feeStructure = feeResult[0];
        
        await req.db.execute(`
            INSERT INTO fee_collections (student_id, academic_year, committed_fee, fee_breakdown, balance, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
          `, [
            student.id, academicYear, feeStructure.total_standard_fee, 
            feeStructure.fee_heads || '[]', feeStructure.total_standard_fee
          ]);
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
    let values = [];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        const dbCol = dbFields[field] || field;
        setClauses.push(`${dbCol} = ?`);
        
        if (field === 'dob' || field === 'admissionDate') {
          values.push(req.body[field]);
        } else {
          values.push(req.body[field] === null ? '' : String(req.body[field]));
        }
      }
    });

    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(req.params.id);
    
    await req.db.execute(`
      UPDATE students 
      SET ${setClauses.join(', ')} 
      WHERE id = ?
    `, values);
    
    const [rows] = await req.db.execute('SELECT * FROM students WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ success: true, data: rows[0] });
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

    await req.db.execute(`
        UPDATE students 
        SET admission_status = ?
        WHERE id = ?
      `, [admissionStatus, req.params.id]);

    const [rows] = await req.db.execute('SELECT * FROM students WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ success: true, data: rows[0] });
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
    let params = [];

    if (academicYear) {
      query += ' AND academic_year = ?';
      params.push(academicYear);
    }

    const [students] = await req.db.execute(query, params);

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
    const [rows] = await req.db.execute(`
        SELECT em.*, e.name as exam_name, e.term 
        FROM exam_marks em
        JOIN exams e ON em.exam_id = e.id
        WHERE em.student_id = ?
      `, [req.params.id]);

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student timeline (audit logs)
// @route   GET /api/students/:id/timeline
// @access  Auth
exports.getStudentTimeline = async (req, res) => {
  try {
    const [rows] = await req.db.execute(`
        SELECT * FROM audit_logs 
        WHERE resource_id = ?
        ORDER BY created_at DESC
      `, [req.params.id]);

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
