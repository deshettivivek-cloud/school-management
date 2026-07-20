const { sql } = require('../config/database');

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

    const studentsResult = await req.db.request()
      .input('grade', sql.NVarChar, grade)
      .input('academicYear', sql.NVarChar, academicYear)
      .query(`
        SELECT * FROM students 
        WHERE grade = @grade AND academic_year = @academicYear AND is_active = 1
        ORDER BY name ASC
      `);

    const students = studentsResult.recordset;

    if (students.length === 0) {
      return res.json({
        success: true,
        data: { grade, academicYear, totalStudents: 0, withPendingFees: 0, students: [] },
      });
    }

    // Get fee records for these students
    const studentIds = students.map((s) => s.id);
    const idsList = studentIds.map((_, i) => `@id${i}`).join(',');
    
    const feesReq = req.db.request();
    feesReq.input('academicYear', sql.NVarChar, academicYear);
    studentIds.forEach((id, i) => feesReq.input(`id${i}`, sql.UniqueIdentifier, id));

    const feeRecords = await feesReq.query(`
      SELECT student_id, status, balance 
      FROM fee_collections 
      WHERE academic_year = @academicYear AND student_id IN (${idsList})
    `);

    const feeMap = {};
    feeRecords.recordset.forEach((f) => { feeMap[f.student_id] = f; });

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

    let query = `SELECT id FROM students WHERE grade = @fromGrade AND academic_year = @academicYear AND is_active = 1`;
    const request = req.db.request();
    request.input('fromGrade', sql.NVarChar, fromGrade);
    request.input('academicYear', sql.NVarChar, academicYear);

    if (studentIds && studentIds.length > 0) {
      const idsList = studentIds.map((_, i) => `@s_id${i}`).join(',');
      query += ` AND id IN (${idsList})`;
      studentIds.forEach((id, i) => request.input(`s_id${i}`, sql.UniqueIdentifier, id));
    }

    const studentsResult = await request.query(query);
    const students = studentsResult.recordset;

    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'No students found to promote' });
    }

    const ids = students.map((s) => s.id);

    // Check pending fees
    if (!force) {
      const idsList = ids.map((_, i) => `@id${i}`).join(',');
      const pendingReq = req.db.request();
      pendingReq.input('academicYear', sql.NVarChar, academicYear);
      ids.forEach((id, i) => pendingReq.input(`id${i}`, sql.UniqueIdentifier, id));

      const pendingFees = await pendingReq.query(`
        SELECT fc.balance, s.name, s.admission_no
        FROM fee_collections fc
        JOIN students s ON fc.student_id = s.id
        WHERE fc.academic_year = @academicYear 
          AND fc.status IN ('pending', 'partial', 'overdue')
          AND fc.student_id IN (${idsList})
      `);

      if (pendingFees.recordset.length > 0) {
        return res.status(400).json({
          success: false,
          message: `${pendingFees.recordset.length} student(s) have pending fees. Use force=true to override.`,
          data: {
            studentsWithPendingFees: pendingFees.recordset.map((f) => ({
              name: f.name,
              admissionNo: f.admission_no,
              balance: f.balance,
            })),
          },
        });
      }
    }

    // Promote: update grade and academic year
    const idsList = ids.map((_, i) => `@uid${i}`).join(',');
    const updateReq = req.db.request();
    updateReq.input('toGrade', sql.NVarChar, toGrade);
    updateReq.input('newAcademicYear', sql.NVarChar, newAcademicYear);
    ids.forEach((id, i) => updateReq.input(`uid${i}`, sql.UniqueIdentifier, id));

    await updateReq.query(`
      UPDATE students 
      SET grade = @toGrade, 
          academic_year = @newAcademicYear, 
          updated_at = SYSDATETIMEOFFSET()
      WHERE id IN (${idsList})
    `);

    res.json({
      success: true,
      message: `${ids.length} student(s) promoted from ${fromGrade} to ${toGrade}`,
      data: { promoted: ids.length, fromGrade, toGrade, newAcademicYear },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
