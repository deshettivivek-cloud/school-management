const supabase = require('../config/supabase');

// Helper: generate admission number
const generateAdmissionNo = async (schoolId, academicYear) => {
  const yearCode = academicYear.replace('-', '');
  const prefix = `ADM-${yearCode}`;

  const { data } = await supabase
    .from('students')
    .select('admission_no')
    .eq('school_id', schoolId)
    .like('admission_no', `${prefix}%`)
    .order('admission_no', { ascending: false })
    .limit(1);

  let seq = 1;
  if (data && data.length > 0) {
    const lastSeq = parseInt(data[0].admission_no.split('-').pop(), 10);
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

    let query = supabase.from('students').select('*').eq('school_id', req.user.schoolId);

    if (grade) query = query.eq('grade', grade);
    if (academicYear) query = query.eq('academic_year', academicYear);
    if (status) query = query.eq('admission_status', status);
    if (active !== undefined) query = query.eq('is_active', active === 'true');

    if (search) {
      query = query.or(`name.ilike.%${search}%,admission_no.ilike.%${search}%,parent_name.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Auth
exports.getStudent = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', req.params.id)
      .eq('school_id', req.user.schoolId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Student not found' });

    res.json({ success: true, data });
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
      fatherOccupationDesc, motherOccupationDesc
    } = req.body;

    const finalAdmissionNo = admissionNo || await generateAdmissionNo(req.user.schoolId, academicYear);

    const { data, error } = await supabase
      .from('students')
      .insert({
        school_id: req.user.schoolId,
        admission_no: finalAdmissionNo,
        name,
        dob,
        gender,
        grade,
        section: section || '',
        parent_name: parentName,
        parent_phone: parentPhone,
        parent_email: parentEmail || '',
        address: address || '',
        academic_year: academicYear,
        admission_date: admissionDate || new Date().toISOString().split('T')[0],
        photo_url: photoUrl || '',
        aadhar_no: aadharNo || null,
        mother_name: motherName || '',
        mother_tongue: motherTongue || '',
        mother_phone: motherPhone || '',
        guardian_phone: guardianPhone || '',
        permanent_address: permanentAddress || '',
        father_occupation: fatherOccupation || '',
        mother_occupation: motherOccupation || '',
        father_occupation_desc: fatherOccupationDesc || '',
        mother_occupation_desc: motherOccupationDesc || ''
      })
      .select()
      .single();

    if (error) throw error;

    // Auto-assign fee if a fee structure exists for the student's grade
    try {
      const { data: feeStructure } = await supabase
        .from('fee_structures')
        .select('*')
        .eq('school_id', req.user.schoolId)
        .eq('academic_year', academicYear)
        .eq('grade', grade)
        .maybeSingle();

      if (feeStructure) {
        // Check if fee collection already exists (should not, but just in case)
        const { data: existingFee } = await supabase
          .from('fee_collections')
          .select('id')
          .eq('school_id', req.user.schoolId)
          .eq('student_id', data.id)
          .eq('academic_year', academicYear)
          .maybeSingle();

        if (!existingFee) {
          await supabase.from('fee_collections').insert({
            school_id: req.user.schoolId,
            student_id: data.id,
            academic_year: academicYear,
            committed_fee: feeStructure.total_standard_fee,
            fee_breakdown: feeStructure.fee_heads || [],
            payments: [],
            total_paid: 0,
            balance: feeStructure.total_standard_fee,
            status: 'pending',
          });
        }
      }
    } catch (feeErr) {
      console.error('Auto-assign fee on admission (non-fatal):', feeErr.message);
    }

    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Auth
exports.updateStudent = async (req, res) => {
  try {
    const {
      name, dob, gender, grade, section, parentName, parentPhone,
      parentEmail, address, academicYear, admissionDate, photoUrl,
      admissionNo, aadharNo, motherName, motherTongue, motherPhone,
      guardianPhone, permanentAddress, fatherOccupation, motherOccupation,
      fatherOccupationDesc, motherOccupationDesc
    } = req.body;

    const updateData = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (dob !== undefined) updateData.dob = dob;
    if (gender !== undefined) updateData.gender = gender;
    if (grade !== undefined) updateData.grade = grade;
    if (section !== undefined) updateData.section = section;
    if (parentName !== undefined) updateData.parent_name = parentName;
    if (parentPhone !== undefined) updateData.parent_phone = parentPhone;
    if (parentEmail !== undefined) updateData.parent_email = parentEmail;
    if (address !== undefined) updateData.address = address;
    if (academicYear !== undefined) updateData.academic_year = academicYear;
    if (admissionDate !== undefined) updateData.admission_date = admissionDate;
    if (photoUrl !== undefined) updateData.photo_url = photoUrl;
    if (admissionNo !== undefined) updateData.admission_no = admissionNo;
    if (aadharNo !== undefined) updateData.aadhar_no = aadharNo;
    if (motherName !== undefined) updateData.mother_name = motherName;
    if (motherTongue !== undefined) updateData.mother_tongue = motherTongue;
    if (motherPhone !== undefined) updateData.mother_phone = motherPhone;
    if (guardianPhone !== undefined) updateData.guardian_phone = guardianPhone;
    if (permanentAddress !== undefined) updateData.permanent_address = permanentAddress;
    if (fatherOccupation !== undefined) updateData.father_occupation = fatherOccupation;
    if (motherOccupation !== undefined) updateData.mother_occupation = motherOccupation;
    if (fatherOccupationDesc !== undefined) updateData.father_occupation_desc = fatherOccupationDesc;
    if (motherOccupationDesc !== undefined) updateData.mother_occupation_desc = motherOccupationDesc;

    const { data, error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('school_id', req.user.schoolId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Student not found' });

    res.json({ success: true, data });
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

    const { data, error } = await supabase
      .from('students')
      .update({ admission_status: admissionStatus, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('school_id', req.user.schoolId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
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

    let query = supabase.from('students').select('*').eq('is_active', true).eq('school_id', req.user.schoolId);
    if (academicYear) query = query.eq('academic_year', academicYear);

    const { data: students, error } = await query;
    if (error) throw error;

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

    res.json({
      success: true,
      data: { total, pending, confirmed, gradeWise },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
