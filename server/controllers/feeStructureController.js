const supabase = require('../config/supabase');

// @desc    Get all fee structures
// @route   GET /api/fees/structure
// @access  Auth
exports.getFeeStructures = async (req, res) => {
  try {
    const { academicYear, grade } = req.query;

    let query = supabase.from('fee_structures').select('*').eq('school_id', req.user.schoolId);
    if (academicYear) query = query.eq('academic_year', academicYear);
    if (grade) query = query.eq('grade', grade);
    query = query.order('grade', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create fee structure
// @route   POST /api/fees/structure
// @access  Admin
exports.createFeeStructure = async (req, res) => {
  try {
    const { academicYear, grade, feeHeads } = req.body;

    // Check if already exists
    const { data: existing } = await supabase
      .from('fee_structures')
      .select('id')
      .eq('school_id', req.user.schoolId)
      .eq('academic_year', academicYear)
      .eq('grade', grade)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Fee structure already exists for Grade ${grade}, Year ${academicYear}`,
      });
    }

    const totalStandardFee = feeHeads.reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0);

    const { data, error } = await supabase
      .from('fee_structures')
      .insert({
        school_id: req.user.schoolId,
        academic_year: academicYear,
        grade,
        fee_heads: feeHeads,
        total_standard_fee: totalStandardFee,
      })
      .select()
      .single();

    if (error) throw error;

    // Auto-assign fee to all active students in this grade
    let assignedCount = 0;
    try {
      const { data: students } = await supabase
        .from('students')
        .select('id')
        .eq('school_id', req.user.schoolId)
        .eq('grade', grade)
        .eq('is_active', true);

      if (students && students.length > 0) {
        // Get existing fee_collections to avoid duplicates
        const { data: existing } = await supabase
          .from('fee_collections')
          .select('student_id')
          .eq('school_id', req.user.schoolId)
          .eq('academic_year', academicYear)
          .in('student_id', students.map((s) => s.id));

        const existingIds = new Set((existing || []).map((e) => e.student_id));
        const newRecords = students
          .filter((s) => !existingIds.has(s.id))
          .map((s) => ({
            school_id: req.user.schoolId,
            student_id: s.id,
            academic_year: academicYear,
            committed_fee: totalStandardFee,
            fee_breakdown: feeHeads,
            payments: [],
            total_paid: 0,
            balance: totalStandardFee,
            status: 'pending',
          }));

        if (newRecords.length > 0) {
          await supabase.from('fee_collections').insert(newRecords);
          assignedCount = newRecords.length;
        }
      }
    } catch (assignErr) {
      console.error('Auto-assign fee error (non-fatal):', assignErr.message);
    }

    res.status(201).json({ success: true, data, assignedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update fee structure
// @route   PUT /api/fees/structure/:id
// @access  Admin
exports.updateFeeStructure = async (req, res) => {
  try {
    const { feeHeads } = req.body;

    const totalStandardFee = feeHeads.reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0);

    const { data, error } = await supabase
      .from('fee_structures')
      .update({ fee_heads: feeHeads, total_standard_fee: totalStandardFee })
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

// @desc    Delete fee structure
// @route   DELETE /api/fees/structure/:id
// @access  Admin
exports.deleteFeeStructure = async (req, res) => {
  try {
    const { error } = await supabase
      .from('fee_structures')
      .delete()
      .eq('id', req.params.id)
      .eq('school_id', req.user.schoolId);

    if (error) throw error;

    res.json({ success: true, message: 'Fee structure deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Apply fee structure to all students in that grade (retroactive)
// @route   POST /api/fees/structure/:id/apply
// @access  Admin
exports.applyFeeToStudents = async (req, res) => {
  try {
    // Get the fee structure
    const { data: structure, error: sErr } = await supabase
      .from('fee_structures')
      .select('*')
      .eq('id', req.params.id)
      .eq('school_id', req.user.schoolId)
      .single();

    if (sErr || !structure) {
      return res.status(404).json({ success: false, message: 'Fee structure not found' });
    }

    // Get all active students in this grade
    const { data: students } = await supabase
      .from('students')
      .select('id')
      .eq('school_id', req.user.schoolId)
      .eq('grade', structure.grade)
      .eq('is_active', true);

    if (!students || students.length === 0) {
      return res.json({ success: true, assignedCount: 0, message: 'No active students in this grade' });
    }

    // Get existing fee_collections to avoid duplicates
    const { data: existing } = await supabase
      .from('fee_collections')
      .select('student_id')
      .eq('school_id', req.user.schoolId)
      .eq('academic_year', structure.academic_year)
      .in('student_id', students.map((s) => s.id));

    const existingIds = new Set((existing || []).map((e) => e.student_id));
    const newRecords = students
      .filter((s) => !existingIds.has(s.id))
      .map((s) => ({
        school_id: req.user.schoolId,
        student_id: s.id,
        academic_year: structure.academic_year,
        committed_fee: structure.total_standard_fee,
        fee_breakdown: structure.fee_heads || [],
        payments: [],
        total_paid: 0,
        balance: structure.total_standard_fee,
        status: 'pending',
      }));

    if (newRecords.length > 0) {
      const { error: insertErr } = await supabase.from('fee_collections').insert(newRecords);
      if (insertErr) throw insertErr;
    }

    res.json({
      success: true,
      assignedCount: newRecords.length,
      alreadyAssigned: existingIds.size,
      message: `Fees applied to ${newRecords.length} student(s). ${existingIds.size} already had fee records.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
