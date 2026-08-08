/**
 * Fee Repository
 * Data access functions for fee collections and related student queries.
 * Every function accepts a `db` connection or pool instance as its first argument.
 */

async function getPaymentsByAcademicYear(db, academicYear) {
  const [rows] = await db.query('SELECT payments FROM fee_collections WHERE academic_year = ?', [academicYear]);
  return rows;
}

async function findFeeCollections(db, { academicYear, status, grade }) {
  let query = `
    SELECT fc.*, 
           s.name as student_name, s.admission_no, s.grade, s.section, 
           s.parent_name, s.parent_phone
    FROM fee_collections fc
    JOIN students s ON fc.student_id = s.id AND s.deleted_at IS NULL
    WHERE 1=1
  `;
  const params = [];

  if (academicYear) {
    query += ' AND fc.academic_year = ?';
    params.push(academicYear);
  }
  if (status) {
    query += ' AND fc.status = ?';
    params.push(status);
  }
  if (grade) {
    query += ' AND s.grade = ?';
    params.push(grade);
  }

  query += ' ORDER BY fc.updated_at DESC';

  const [rows] = await db.query(query, params);
  return rows;
}

async function findStudentFeeCollection(db, studentId, academicYear) {
  let query = `
    SELECT fc.*, 
           s.name as student_name, s.admission_no, s.grade, s.section, 
           s.parent_name, s.parent_phone, s.photo_url
    FROM fee_collections fc
    JOIN students s ON fc.student_id = s.id AND s.deleted_at IS NULL
    WHERE fc.student_id = ?
  `;
  const params = [studentId];

  if (academicYear) {
    query += ' AND fc.academic_year = ?';
    params.push(academicYear);
  }

  const [rows] = await db.query(query, params);
  return rows;
}

async function findFeeHistoryByStudent(db, studentId) {
  const [rows] = await db.query('SELECT * FROM fee_collections WHERE student_id = ? ORDER BY academic_year DESC', [studentId]);
  return rows;
}

async function findStudentById(db, studentId) {
  const [rows] = await db.query('SELECT id, name, admission_no, grade, section, parent_name, parent_phone FROM students WHERE id = ? AND deleted_at IS NULL', [studentId]);
  return rows;
}

async function findFeeCollectionByStudentAndYear(db, studentId, academicYear) {
  const [rows] = await db.query('SELECT * FROM fee_collections WHERE student_id = ? AND academic_year = ?', [studentId, academicYear]);
  return rows;
}

async function updateFeeCollection(db, id, { committedFee, feeBreakdownJson, totalPaid, balance, status }) {
  await db.query(`
    UPDATE fee_collections 
    SET committed_fee = ?, fee_breakdown = ?,
        total_paid = ?, balance = ?, status = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [committedFee, feeBreakdownJson, totalPaid, balance, status, id]);
}

async function insertFeeCollection(db, { id, studentId, academicYear, committedFee, feeBreakdownJson, balance }) {
  await db.query(`
    INSERT INTO fee_collections (id, student_id, academic_year, committed_fee, fee_breakdown, balance, status, total_paid, payments)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, '[]')
  `, [id, studentId, academicYear, committedFee, feeBreakdownJson, balance]);
}

async function findFeeCollectionById(db, id) {
  const [rows] = await db.query('SELECT * FROM fee_collections WHERE id = ?', [id]);
  return rows;
}

async function findFeeCollectionWithStudent(db, studentId, academicYear) {
  const [rows] = await db.query(`
    SELECT fc.*, s.name as student_name, s.parent_phone 
    FROM fee_collections fc
    JOIN students s ON fc.student_id = s.id AND s.deleted_at IS NULL
    WHERE fc.student_id = ? AND fc.academic_year = ?
  `, [studentId, academicYear]);
  return rows;
}

async function updateFeeCollectionPayments(db, id, paymentsJson, totalPaid, balance, status) {
  await db.query(`
    UPDATE fee_collections 
    SET payments = ?, total_paid = ?, balance = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [paymentsJson, totalPaid, balance, status, id]);
}

async function findPendingFees(db, { academicYear, grade }) {
  let query = `
    SELECT fc.*, 
           s.name as student_name, s.admission_no, s.grade, s.section, 
           s.parent_name, s.parent_phone
    FROM fee_collections fc
    JOIN students s ON fc.student_id = s.id AND s.deleted_at IS NULL
    WHERE fc.status IN ('pending', 'partial', 'overdue')
  `;
  const params = [];

  if (academicYear) {
    query += ' AND fc.academic_year = ?';
    params.push(academicYear);
  }
  if (grade) {
    query += ' AND s.grade = ?';
    params.push(grade);
  }

  query += ' ORDER BY fc.balance DESC';

  const [rows] = await db.query(query, params);
  return rows;
}

async function getFeeStatsData(db, { academicYear }) {
  let query = 'SELECT committed_fee, total_paid, balance, status FROM fee_collections WHERE 1=1';
  const params = [];

  if (academicYear) {
    query += ' AND academic_year = ?';
    params.push(academicYear);
  }

  const [rows] = await db.query(query, params);
  return rows;
}

async function findFeeCollectionDetailsById(db, collectionId) {
  const [rows] = await db.query(`
    SELECT fc.*, s.name as student_name, s.admission_no, s.grade, s.section, 
           s.parent_name, s.parent_phone, s.photo_url
    FROM fee_collections fc
    JOIN students s ON fc.student_id = s.id AND s.deleted_at IS NULL
    WHERE fc.id = ?
  `, [collectionId]);
  return rows;
}

async function findPendingFeeStudentsByIds(db, studentIds) {
  const placeholders = studentIds.map(() => '?').join(',');
  const [rows] = await db.query(`
    SELECT s.id, s.name, s.parent_phone, fc.balance 
    FROM students s
    JOIN fee_collections fc ON s.id = fc.student_id
    WHERE s.id IN (${placeholders}) AND fc.status IN ('pending', 'partial', 'overdue') AND s.deleted_at IS NULL
  `, studentIds);
  return rows;
}

async function findStudentContactById(db, studentId) {
  const [rows] = await db.query('SELECT name, parent_phone FROM students WHERE id = ? AND deleted_at IS NULL', [studentId]);
  return rows;
}

module.exports = {
  getPaymentsByAcademicYear,
  findFeeCollections,
  findStudentFeeCollection,
  findFeeHistoryByStudent,
  findStudentById,
  findFeeCollectionByStudentAndYear,
  updateFeeCollection,
  insertFeeCollection,
  findFeeCollectionById,
  findFeeCollectionWithStudent,
  updateFeeCollectionPayments,
  findPendingFees,
  getFeeStatsData,
  findFeeCollectionDetailsById,
  findPendingFeeStudentsByIds,
  findStudentContactById,
};
