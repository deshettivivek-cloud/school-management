/**
 * Auth Repository
 * Data access functions for global users, profiles, and super admin accounts.
 * Every function accepts a `db` connection or pool instance as its first argument.
 */

async function findGlobalUserSchool(masterPool, email) {
  const [rows] = await masterPool.execute(`
    SELECT s.db_name, s.is_active, s.created_at
    FROM global_users gu 
    JOIN schools s ON gu.school_id = s.id 
    WHERE gu.email = ?
  `, [email]);
  return rows;
}

async function findUserProfileByEmail(schoolPool, email) {
  const [rows] = await schoolPool.execute('SELECT * FROM profiles WHERE email = ?', [email]);
  return rows;
}

async function findSuperAdminByEmail(masterPool, email) {
  const [rows] = await masterPool.execute('SELECT * FROM super_admin_profiles WHERE email = ?', [email]);
  return rows;
}

async function updateSuperAdminPassword(db, id, passwordHash) {
  await db.execute(
    'UPDATE super_admin_profiles SET password_hash = ?, must_change_password = 0, password_changed_at = CURRENT_TIMESTAMP WHERE id = ?',
    [passwordHash, id]
  );
}

async function updateUserProfilePassword(db, id, passwordHash) {
  await db.execute(
    'UPDATE profiles SET password_hash = ?, must_change_password = 0, password_changed_at = CURRENT_TIMESTAMP WHERE id = ?',
    [passwordHash, id]
  );
}

async function findSuperAdminIdByEmail(masterPool, email) {
  const [rows] = await masterPool.execute('SELECT id FROM super_admin_profiles WHERE email = ?', [email]);
  return rows;
}

async function resetSuperAdminPasswordByEmail(masterPool, email, passwordHash) {
  await masterPool.execute(
    'UPDATE super_admin_profiles SET password_hash = ?, must_change_password = 1 WHERE email = ?',
    [passwordHash, email]
  );
}

async function resetUserProfilePasswordByEmail(schoolPool, email, passwordHash) {
  await schoolPool.execute(
    'UPDATE profiles SET password_hash = ?, must_change_password = 1 WHERE email = ?',
    [passwordHash, email]
  );
}

async function findSuperAdminById(db, id) {
  const [rows] = await db.execute('SELECT id, email, name, role, must_change_password FROM super_admin_profiles WHERE id = ?', [id]);
  return rows;
}

async function findUserProfileById(db, id) {
  const [rows] = await db.execute('SELECT id, email, name, role, assigned_classes, must_change_password FROM profiles WHERE id = ?', [id]);
  return rows;
}

async function findAllUserProfiles(db) {
  const [rows] = await db.execute('SELECT id, name, email, role, assigned_classes, created_at, is_active FROM profiles ORDER BY created_at DESC');
  return rows;
}

async function findGlobalUserByEmail(masterPool, email) {
  const [rows] = await masterPool.execute('SELECT email FROM global_users WHERE email = ?', [email]);
  return rows;
}

async function findSuperAdminEmailByEmail(masterPool, email) {
  const [rows] = await masterPool.execute('SELECT email FROM super_admin_profiles WHERE email = ?', [email]);
  return rows;
}

async function insertUserProfile(db, { id, email, passwordHash, name, role }) {
  await db.execute(`
    INSERT INTO profiles (id, email, password_hash, name, role, must_change_password)
    VALUES (?, ?, ?, ?, ?, 1)
  `, [id, email, passwordHash, name, role]);
}

async function findSchoolIdByDbName(masterPool, tenantDb) {
  const [rows] = await masterPool.execute('SELECT id FROM schools WHERE db_name = ?', [tenantDb]);
  return rows;
}

async function insertGlobalUser(masterPool, email, schoolId) {
  await masterPool.execute('INSERT INTO global_users (email, school_id) VALUES (?, ?)', [email, schoolId]);
}

async function updateUserProfileRole(db, id, role) {
  await db.execute('UPDATE profiles SET role = ? WHERE id = ?', [role, id]);
}

async function updateUserProfileClasses(db, id, classesStr) {
  await db.execute('UPDATE profiles SET assigned_classes = ? WHERE id = ?', [classesStr, id]);
}

async function findUserProfileDetailsById(db, id) {
  const [rows] = await db.execute('SELECT * FROM profiles WHERE id = ?', [id]);
  return rows;
}

module.exports = {
  findGlobalUserSchool,
  findUserProfileByEmail,
  findSuperAdminByEmail,
  updateSuperAdminPassword,
  updateUserProfilePassword,
  findSuperAdminIdByEmail,
  resetSuperAdminPasswordByEmail,
  resetUserProfilePasswordByEmail,
  findSuperAdminById,
  findUserProfileById,
  findAllUserProfiles,
  findGlobalUserByEmail,
  findSuperAdminEmailByEmail,
  insertUserProfile,
  findSchoolIdByDbName,
  insertGlobalUser,
  updateUserProfileRole,
  updateUserProfileClasses,
  findUserProfileDetailsById,
};
