const crypto = require('crypto');

/**
 * Checks for existing admission numbers in database for the tenant.
 * Returns a Set of existing admission_no strings (lowercase).
 */
async function findExistingAdmissionNumbers(db, admissionNumbers) {
  if (!admissionNumbers || admissionNumbers.length === 0) {
    return new Set();
  }

  // Escape placeholders
  const placeholders = admissionNumbers.map(() => '?').join(',');
  const [rows] = await db.query(
    `SELECT admission_no FROM students WHERE deleted_at IS NULL AND admission_no IN (${placeholders})`,
    admissionNumbers.map(a => String(a).trim())
  );

  const existingSet = new Set();
  rows.forEach(r => {
    if (r.admission_no) {
      existingSet.add(r.admission_no.toLowerCase());
    }
  });

  return existingSet;
}

/**
 * Inserts valid student rows and auto-creates fee collections in a single transaction.
 */
async function bulkInsertStudentsWithFeeCollections(db, validRows) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const insertedStudents = [];

    for (const item of validRows) {
      const studentData = item.data || item;
      const studentId = crypto.randomUUID();

      const dobDate = new Date(studentData.dob).toISOString().split('T')[0];

      await connection.execute(`
        INSERT INTO students (
          id, admission_no, name, dob, gender, grade, section,
          parent_name, parent_phone, academic_year, aadhar_no, pen_number,
          caste, sub_caste, mother_name, mother_tongue, mother_phone,
          guardian_phone, parent_email, address, permanent_address,
          father_occupation, mother_occupation, father_occupation_desc,
          mother_occupation_desc, admission_status
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?
        )
      `, [
        studentId,
        studentData.admission_no,
        studentData.name,
        dobDate,
        studentData.gender,
        studentData.grade,
        studentData.section || '',
        studentData.parent_name,
        studentData.parent_phone,
        studentData.academic_year,
        studentData.aadhar_no || '',
        studentData.pen_number || '',
        studentData.caste || '',
        studentData.sub_caste || '',
        studentData.mother_name || '',
        studentData.mother_tongue || '',
        studentData.mother_phone || '',
        studentData.guardian_phone || '',
        studentData.parent_email || '',
        studentData.address || '',
        studentData.permanent_address || '',
        studentData.father_occupation || '',
        studentData.mother_occupation || '',
        studentData.father_occupation_desc || '',
        studentData.mother_occupation_desc || '',
        studentData.admission_status || 'confirmed'
      ]);

      insertedStudents.push({
        id: studentId,
        admission_no: studentData.admission_no,
        name: studentData.name,
        grade: studentData.grade,
        academic_year: studentData.academic_year
      });

      // Auto-create fee collection row if fee structure exists for grade + academic_year
      try {
        const [feeResult] = await connection.execute(
          'SELECT * FROM fee_structures WHERE academic_year = ? AND grade = ? AND deleted_at IS NULL',
          [studentData.academic_year, studentData.grade]
        );

        if (feeResult.length > 0) {
          const feeStructure = feeResult[0];
          await connection.execute(`
            INSERT INTO fee_collections (student_id, academic_year, committed_fee, fee_breakdown, balance, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
          `, [
            studentId,
            studentData.academic_year,
            feeStructure.total_standard_fee,
            feeStructure.fee_heads || '[]',
            feeStructure.total_standard_fee
          ]);
        }
      } catch (feeErr) {
        console.error(`Auto-assign fee error for student ${studentData.admission_no} (non-fatal):`, feeErr.message);
      }
    }

    await connection.commit();
    return insertedStudents;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  findExistingAdmissionNumbers,
  bulkInsertStudentsWithFeeCollections,
};
