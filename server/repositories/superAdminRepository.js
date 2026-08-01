/**
 * Super Admin Repository
 * Data access functions for super admin operations across master DB and tenant DBs.
 * Every function accepts a `db` connection or pool instance as its first argument.
 */

async function findAllSchools(masterPool) {
  const [rows] = await masterPool.query('SELECT * FROM schools ORDER BY created_at DESC');
  return rows;
}

async function findGlobalUserCounts(masterPool) {
  const [rows] = await masterPool.query('SELECT school_id, COUNT(*) as count FROM global_users GROUP BY school_id');
  return rows;
}

async function findSchoolById(masterPool, id) {
  const [rows] = await masterPool.execute('SELECT * FROM schools WHERE id = ?', [id]);
  return rows;
}

async function findSchoolUsers(schoolPool) {
  const [rows] = await schoolPool.query('SELECT id, name, email, role, created_at FROM profiles ORDER BY created_at DESC');
  return rows;
}

async function findSchoolStudentCount(schoolPool) {
  const [rows] = await schoolPool.query('SELECT COUNT(*) as count FROM students WHERE deleted_at IS NULL');
  return rows;
}

async function findAllSchoolsBasic(masterPool) {
  const [rows] = await masterPool.query('SELECT id, name, db_name FROM schools');
  return rows;
}

async function findSchoolProfilesBasic(schoolPool) {
  const [rows] = await schoolPool.query('SELECT id, name, email, role, is_active FROM profiles');
  return rows;
}

async function findGlobalUserByEmail(masterPool, email) {
  const [rows] = await masterPool.execute('SELECT * FROM global_users WHERE email = ?', [email]);
  return rows;
}

async function insertSchoolUserProfile(schoolPool, { id, email, passwordHash, name, role }) {
  await schoolPool.execute(`
    INSERT INTO profiles (id, email, password_hash, name, role, must_change_password)
    VALUES (?, ?, ?, ?, ?, 1)
  `, [id, email, passwordHash, name, role]);
}

async function findSchoolProfileById(schoolPool, id) {
  const [rows] = await schoolPool.execute('SELECT * FROM profiles WHERE id = ?', [id]);
  return rows;
}

async function insertGlobalUser(masterPool, { id, email, schoolId }) {
  await masterPool.execute(`
    INSERT INTO global_users (id, email, school_id)
    VALUES (?, ?, ?)
  `, [id, email, schoolId]);
}

async function findSchoolsForStats(masterPool) {
  const [rows] = await masterPool.query('SELECT id, name, db_name, created_at FROM schools ORDER BY created_at DESC');
  return rows;
}

async function findSchoolProfileCount(schoolPool) {
  const [rows] = await schoolPool.query('SELECT COUNT(*) as count FROM profiles');
  return rows[0] ? rows[0].count : 0;
}

async function findSchoolRoleCounts(schoolPool) {
  const [rows] = await schoolPool.query('SELECT role, COUNT(*) as count FROM profiles GROUP BY role');
  return rows;
}

async function deleteProfileByEmail(schoolPool, email) {
  await schoolPool.execute('DELETE FROM profiles WHERE email = ?', [email]);
}

async function deleteGlobalUserByEmail(masterPool, email) {
  await masterPool.execute('DELETE FROM global_users WHERE email = ?', [email]);
}

async function updateProfilePasswordAndFlag(schoolPool, userId, passwordHash) {
  const [result] = await schoolPool.execute(`
    UPDATE profiles 
    SET password_hash = ?, must_change_password = 1 
    WHERE id = ?
  `, [passwordHash, userId]);
  return result;
}

async function updateProfileActiveStatus(schoolPool, userId, isActive) {
  const [result] = await schoolPool.execute('UPDATE profiles SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, userId]);
  return result;
}

async function updateSchoolRecord(masterPool, schoolId, setClause, values) {
  await masterPool.execute(`UPDATE schools SET ${setClause} WHERE id = ?`, [...values, schoolId]);
}

async function deleteGlobalUsersBySchoolId(masterPool, schoolId) {
  await masterPool.execute('DELETE FROM global_users WHERE school_id = ?', [schoolId]);
}

async function dropDatabaseIfExists(masterPool, dbName) {
  await masterPool.execute(`DROP DATABASE IF EXISTS \`${dbName}\``);
}

async function deleteSchoolById(masterPool, schoolId) {
  await masterPool.execute('DELETE FROM schools WHERE id = ?', [schoolId]);
}

module.exports = {
  findAllSchools,
  findGlobalUserCounts,
  findSchoolById,
  findSchoolUsers,
  findSchoolStudentCount,
  findAllSchoolsBasic,
  findSchoolProfilesBasic,
  findGlobalUserByEmail,
  insertSchoolUserProfile,
  findSchoolProfileById,
  insertGlobalUser,
  findSchoolsForStats,
  findSchoolProfileCount,
  findSchoolRoleCounts,
  deleteProfileByEmail,
  deleteGlobalUserByEmail,
  updateProfilePasswordAndFlag,
  updateProfileActiveStatus,
  updateSchoolRecord,
  deleteGlobalUsersBySchoolId,
  dropDatabaseIfExists,
  deleteSchoolById,
};
