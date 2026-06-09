const supabase = require('../config/supabase');

// @desc    Get all transfer certificates
// @route   GET /api/tc
// @access  Auth
exports.getTCs = async (req, res) => {
  try {
    const { search } = req.query;

    let query = supabase
      .from('transfer_certificates')
      .select('*, students!inner(name, admission_no, grade, section, parent_name)')
      .eq('school_id', req.user.schoolId)
      .order('issued_date', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    const userIds = [...new Set(data.map(tc => tc.issued_by).filter(Boolean))];
    const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', userIds);
    const profileMap = {};
    if (profiles) profiles.forEach(p => profileMap[p.id] = p);

    let results = data.map((tc) => ({
      ...tc,
      student: tc.students,
      issuedBy: profileMap[tc.issued_by] || { name: 'Admin' },
      students: undefined,
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
      .select('*, students(name, admission_no, grade, section, dob, gender, parent_name, parent_phone, address, admission_date, academic_year)')
      .eq('id', req.params.id)
      .eq('school_id', req.user.schoolId)
      .single();

    if (error) throw error;

    let issuedBy = { name: 'Admin' };
    if (data.issued_by) {
      const { data: profile } = await supabase.from('profiles').select('name').eq('id', data.issued_by).single();
      if (profile) issuedBy = profile;
    }

    res.json({
      success: true,
      data: {
        ...data,
        student: data.students,
        issuedBy,
        students: undefined,
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

    // Check for pending fees
    const { data: pendingFees, error: feeErr } = await supabase
      .from('fee_collections')
      .select('balance')
      .eq('student_id', studentId)
      .eq('school_id', req.user.schoolId)
      .gt('balance', 0);

    if (feeErr) {
      return res.status(500).json({ success: false, message: 'Error checking pending fees' });
    }

    if (pendingFees && pendingFees.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot issue TC — student has pending fees' });
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
      .select('*, students(name, admission_no, grade, section, parent_name)')
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
        issuedBy: { name: req.user.name },
        students: undefined,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
