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

    const [students] = await req.db.execute(`
        SELECT * FROM students 
        WHERE grade = ? AND academic_year = ? AND is_active = 1
        ORDER BY name ASC
      `, [grade, academicYear]);

    if (students.length === 0) {
      return res.json({
        success: true,
        data: { grade, academicYear, totalStudents: 0, withPendingFees: 0, students: [] },
      });
    }

    // Get fee records for these students
    const studentIds = students.map((s) => s.id);
    const idsList = studentIds.map(() => '?').join(',');
    
    const [feeRecords] = await req.db.query(`
      SELECT student_id, status, balance 
      FROM fee_collections 
      WHERE academic_year = ? AND student_id IN (${idsList})
    `, [academicYear, ...studentIds]);

    const feeMap = {};
    feeRecords.forEach((f) => { feeMap[f.student_id] = f; });

    const studentsWithFeeStatus = students.map((student) => {
      const feeRecord = feeMap[student.id];
      return {
        student,
        feeStatus: feeRecord ? feeRecord.status : 'no_record',
        balance: feeRecord ? feeRecord.balance : 0,
        hasPendingFees: feeRecord ? ['pending', 'partial', 'overdue'].includes(feeRecord.status) : false,
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

    let query = `SELECT id FROM students WHERE grade = ? AND academic_year = ? AND is_active = 1`;
    let params = [fromGrade, academicYear];

    if (studentIds && studentIds.length > 0) {
      const idsList = studentIds.map(() => '?').join(',');
      query += ` AND id IN (${idsList})`;
      params.push(...studentIds);
    }

    const [students] = await req.db.query(query, params);

    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'No students found to promote' });
    }

    const ids = students.map((s) => s.id);

    // Check pending fees
    if (!force) {
      const idsList = ids.map(() => '?').join(',');
      
      const [pendingFees] = await req.db.query(`
        SELECT fc.balance, s.name, s.admission_no
        FROM fee_collections fc
        JOIN students s ON fc.student_id = s.id
        WHERE fc.academic_year = ? 
          AND fc.status IN ('pending', 'partial', 'overdue')
          AND fc.student_id IN (${idsList})
      `, [academicYear, ...ids]);

      if (pendingFees.length > 0) {
        return res.status(400).json({
          success: false,
          message: `${pendingFees.length} student(s) have pending fees. Use force=true to override.`,
          data: {
            studentsWithPendingFees: pendingFees.map((f) => ({
              name: f.name,
              admissionNo: f.admission_no,
              balance: f.balance,
            })),
          },
        });
      }
    }

    // Promote: update grade and academic year
    const idsList = ids.map(() => '?').join(',');

    await req.db.query(`
      UPDATE students 
      SET grade = ?, 
          academic_year = ?
      WHERE id IN (${idsList})
    `, [toGrade, newAcademicYear, ...ids]);

    res.json({
      success: true,
      message: `${ids.length} student(s) promoted from ${fromGrade} to ${toGrade}`,
      data: { promoted: ids.length, fromGrade, toGrade, newAcademicYear },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
