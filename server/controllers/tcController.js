const supabase = require('../config/supabase');

// @desc    Get all transfer certificates
// @route   GET /api/tc
// @access  Auth
exports.getTCs = async (req, res) => {
  try {
    const { search } = req.query;

    let query = supabase
      .from('transfer_certificates')
      .select('*, students!inner(name, admission_no, grade, section, parent_name), profiles:issued_by(name)')
      .eq('school_id', req.user.schoolId)
      .order('issued_date', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    let results = data.map((tc) => ({
      ...tc,
      student: tc.students,
      issuedBy: tc.profiles,
      students: undefined,
      profiles: undefined,
    }));

    // Client-side search filtering (for name, admission_no, tc_number)
    if (search) {
      const s = search.toLowerCase();
      results = results.filter(
        (tc) =>
          tc.student?.name?.toLowerCase().includes(s) ||
          tc.student?.admission_no?.toLowerCase().includes(s) ||
          tc.tc_number?.toLowerCase().includes(s)
      );
    }

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
    const { data, error } = await supabase
      .from('transfer_certificates')
      .select('*, students(name, admission_no, grade, section, dob, gender, parent_name, parent_phone, address, admission_date, academic_year), profiles:issued_by(name)')
      .eq('id', req.params.id)
      .eq('school_id', req.user.schoolId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: {
        ...data,
        student: data.students,
        issuedBy: data.profiles,
        students: undefined,
        profiles: undefined,
      },
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
    const { data: student, error: sErr } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .eq('school_id', req.user.schoolId)
      .single();

    if (sErr || !student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (!student.is_active) {
      return res.status(400).json({ success: false, message: 'TC already issued — student is inactive' });
    }

    // Check existing TC
    const { data: existingTC } = await supabase
      .from('transfer_certificates')
      .select('id')
      .eq('student_id', studentId)
      .eq('school_id', req.user.schoolId)
      .maybeSingle();

    if (existingTC) {
      return res.status(400).json({ success: false, message: 'TC already issued for this student' });
    }

    // Generate TC number
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('transfer_certificates')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', req.user.schoolId);

    const tcNumber = `TC-${year}-${String((count || 0) + 1).padStart(4, '0')}`;

    // Create TC
    const { data: tc, error: tcErr } = await supabase
      .from('transfer_certificates')
      .insert({
        school_id: req.user.schoolId,
        student_id: studentId,
        tc_number: tcNumber,
        date_of_leaving: dateOfLeaving,
        reason,
        conduct: conduct || 'Good',
        remarks: remarks || '',
        issued_by: req.user.id,
      })
      .select('*, students(name, admission_no, grade, section, parent_name), profiles:issued_by(name)')
      .single();

    if (tcErr) throw tcErr;

    // Mark student inactive
    await supabase
      .from('students')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', studentId)
      .eq('school_id', req.user.schoolId);

    res.status(201).json({
      success: true,
      data: {
        ...tc,
        student: tc.students,
        issuedBy: tc.profiles,
        students: undefined,
        profiles: undefined,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
