const supabase = require('../config/supabase');

// @desc    Check promotion eligibility for a grade
// @route   GET /api/promotion/check/:grade
// @access  Admin
exports.checkPromotion = async (req, res) => {
  try {
    const { grade } = req.params;
    const { academicYear } = req.query;

    if (!academicYear) {
      return res.status(400).json({ success: false, message: 'Academic year is required' });
    }

    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .eq('school_id', req.user.schoolId)
      .eq('grade', grade)
      .eq('academic_year', academicYear)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;

    // Get fee records for these students
    const studentIds = students.map((s) => s.id);
    const { data: feeRecords } = await supabase
      .from('fee_collections')
      .select('*')
      .eq('school_id', req.user.schoolId)
      .in('student_id', studentIds.length > 0 ? studentIds : ['none'])
      .eq('academic_year', academicYear);

    const feeMap = {};
    (feeRecords || []).forEach((f) => { feeMap[f.student_id] = f; });

    const studentsWithFeeStatus = students.map((student) => {
      const feeRecord = feeMap[student.id];
      return {
        student,
        feeStatus: feeRecord ? feeRecord.status : 'no_record',
        balance: feeRecord ? feeRecord.balance : 0,
        hasPendingFees: feeRecord
          ? ['pending', 'partial', 'overdue'].includes(feeRecord.status)
          : false,
      };
    });

    const withPendingFees = studentsWithFeeStatus.filter((s) => s.hasPendingFees).length;

    res.json({
      success: true,
      data: {
        grade,
        academicYear,
        totalStudents: students.length,
        withPendingFees,
        students: studentsWithFeeStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Bulk promote students
// @route   POST /api/promotion/promote
// @access  Admin
exports.promoteStudents = async (req, res) => {
  try {
    const { fromGrade, toGrade, academicYear, newAcademicYear, studentIds, force } = req.body;

    if (!fromGrade || !toGrade || !academicYear || !newAcademicYear) {
      return res.status(400).json({
        success: false,
        message: 'fromGrade, toGrade, academicYear, and newAcademicYear are required',
      });
    }

    // Get students to promote
    let query = supabase
      .from('students')
      .select('*')
      .eq('school_id', req.user.schoolId)
      .eq('grade', fromGrade)
      .eq('academic_year', academicYear)
      .eq('is_active', true);

    if (studentIds && studentIds.length > 0) {
      query = query.in('id', studentIds);
    }

    const { data: students, error: sErr } = await query;
    if (sErr) throw sErr;

    if (!students || students.length === 0) {
      return res.status(404).json({ success: false, message: 'No students found to promote' });
    }

    // Check pending fees
    if (!force) {
      const ids = students.map((s) => s.id);
      const { data: pendingFees } = await supabase
        .from('fee_collections')
        .select('*, students(name, admission_no)')
        .eq('school_id', req.user.schoolId)
        .in('student_id', ids)
        .eq('academic_year', academicYear)
        .in('status', ['pending', 'partial', 'overdue']);

      if (pendingFees && pendingFees.length > 0) {
        return res.status(400).json({
          success: false,
          message: `${pendingFees.length} student(s) have pending fees. Use force=true to override.`,
          data: {
            studentsWithPendingFees: pendingFees.map((f) => ({
              name: f.students?.name,
              admissionNo: f.students?.admission_no,
              balance: f.balance,
            })),
          },
        });
      }
    }

    // Promote: update grade and academic year
    const ids = students.map((s) => s.id);
    const { error: updateErr } = await supabase
      .from('students')
      .update({
        grade: toGrade,
        academic_year: newAcademicYear,
        updated_at: new Date().toISOString(),
      })
      .eq('school_id', req.user.schoolId)
      .in('id', ids);

    if (updateErr) throw updateErr;

    res.json({
      success: true,
      message: `${ids.length} student(s) promoted from ${fromGrade} to ${toGrade}`,
      data: { promoted: ids.length, fromGrade, toGrade, newAcademicYear },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
