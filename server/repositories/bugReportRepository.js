/**
 * Bug Report Repository
 * Data access functions for bug reports table.
 * Every function accepts a `db` connection or pool instance as its first argument.
 */

async function insertBugReport(db, data) {
  const { reported_by, reporter_name, page_url, title, description, severity } = data;
  const [result] = await db.query(
    `INSERT INTO bug_reports (reported_by, reporter_name, page_url, title, description, severity)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [reported_by, reporter_name, page_url || null, title, description, severity || 'medium']
  );
  return result.insertId;
}

async function findAllBugReports(db) {
  const [rows] = await db.query(
    `SELECT * FROM bug_reports ORDER BY created_at DESC`
  );
  return rows;
}

async function findBugReportById(db, id) {
  const [rows] = await db.query(
    `SELECT * FROM bug_reports WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function updateBugReportStatus(db, id, status) {
  const [result] = await db.query(
    `UPDATE bug_reports SET status = ? WHERE id = ?`,
    [status, id]
  );
  return result.affectedRows > 0;
}

async function updateBugReportDeveloperResponse(db, id, developer_response, status) {
  let query = 'UPDATE bug_reports SET developer_response = ?';
  const params = [developer_response];

  if (status) {
    query += ', status = ?';
    params.push(status);
  }

  query += ' WHERE id = ?';
  params.push(id);

  const [result] = await db.query(query, params);
  return result.affectedRows > 0;
}

module.exports = {
  insertBugReport,
  findAllBugReports,
  findBugReportById,
  updateBugReportStatus,
  updateBugReportDeveloperResponse,
};
