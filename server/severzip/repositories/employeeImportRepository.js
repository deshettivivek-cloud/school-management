/**
 * Finds all existing employee_ids in the database that match the provided array.
 * @param {Object} db - The tenant database connection
 * @param {Array<string>} empIds - Array of employee_ids to check
 * @returns {Promise<Set<string>>} Set of duplicate employee_ids (lowercase)
 */
async function findExistingEmployeeIds(db, empIds) {
  if (!empIds || empIds.length === 0) return new Set();

  const placeholders = empIds.map(() => '?').join(',');
  const [rows] = await db.query(
    `SELECT employee_id FROM employees WHERE employee_id IN (${placeholders})`,
    empIds
  );

  return new Set(rows.map(r => r.employee_id.toLowerCase()));
}

/**
 * Bulk inserts employees into the tenant database using parameterized queries.
 * @param {Object} db - The tenant database connection
 * @param {Array<Object>} validRows - Array of validated objects (extract .data if wrapped)
 * @returns {Promise<Array>} The inserted records
 */
async function bulkInsertEmployees(db, validRows) {
  if (!validRows || validRows.length === 0) return [];

  const rawData = validRows.map(row => row.data || row);

  // Use a transaction for atomic insert
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const insertQuery = `
      INSERT INTO employees (
        employee_id, name, department, designation, gender, 
        dob, joining_date, basic_salary, phone, email, address, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)
    `;

    for (const emp of rawData) {
      const dobStr = emp.dob ? emp.dob.toISOString().split('T')[0] : null;
      const dojStr = emp.joining_date ? emp.joining_date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      
      const values = [
        emp.emp_id,
        emp.name,
        emp.department,
        emp.designation,
        emp.gender || '',
        dobStr,
        dojStr,
        emp.basic_salary || 0,
        emp.phone || '',
        emp.email || '',
        emp.address || ''
      ];

      await connection.query(insertQuery, values);
    }

    await connection.commit();
    return rawData;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  findExistingEmployeeIds,
  bulkInsertEmployees
};
