const crypto = require('crypto');
const { getMasterPool } = require('../config/database');
const { getSchoolPool, resolveSchoolDbName } = require('../config/tenantPool');
const { hashPassword } = require('../config/auth');

// @desc    Get all schools (platform-wide)
// @route   GET /api/super-admin/schools
// @access  Super Admin
exports.getAllSchools = async (req, res) => {
  try {
    const masterPool = await getMasterPool();
    const [schools] = await masterPool.query('SELECT * FROM schools ORDER BY created_at DESC');

    // Enrich with user counts by querying global_users
    const [userCounts] = await masterPool.query('SELECT school_id, COUNT(*) as count FROM global_users GROUP BY school_id');

    const countMap = {};
    userCounts.forEach(r => {
      countMap[r.school_id] = r.count;
    });

    const enrichedSchools = schools.map(school => ({
      ...school,
      status: school.is_active === 1 ? 'active' : 'inactive',
      userCount: countMap[school.id] || 0,
    }));

    res.json({
      success: true,
      count: enrichedSchools.length,
      data: enrichedSchools,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single school details
// @route   GET /api/super-admin/schools/:id
// @access  Super Admin
exports.getSchoolById = async (req, res) => {
  try {
    const masterPool = await getMasterPool();
    const [schoolRows] = await masterPool.execute('SELECT * FROM schools WHERE id = ?', [req.params.id]);

    if (schoolRows.length === 0) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }
    const school = schoolRows[0];

    // Connect to tenant DB to get users and student count
    const schoolPool = await getSchoolPool(school.db_name);

    const [users] = await schoolPool.query('SELECT id, name, email, role, created_at FROM profiles ORDER BY created_at DESC');
    const [studentCountResult] = await schoolPool.query('SELECT COUNT(*) as count FROM students');

    res.json({
      success: true,
      data: {
        ...school,
        users: users || [],
        studentCount: studentCountResult[0].count || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users across all schools
// @route   GET /api/super-admin/users
// @access  Super Admin
exports.getAllUsers = async (req, res) => {
  try {
    const masterPool = await getMasterPool();
    // Query schools and global users
    const [schools] = await masterPool.query('SELECT id, name, db_name FROM schools');

    const schoolMap = {};
    schools.forEach(s => { schoolMap[s.id] = s.name; });

    let allUsers = [];

    // Parallel query to each school database to get profiles
    const tasks = schools.map(async (school) => {
      try {
        const pool = await getSchoolPool(school.db_name);
        const [users] = await pool.query('SELECT id, name, email, role, is_active FROM profiles');
        users.forEach(u => {
          allUsers.push({
            ...u,
            school_id: school.id,
            school_name: school.name
          });
        });
      } catch (err) {
        console.error(`Failed to fetch users for ${school.name}:`, err.message);
      }
    });

    await Promise.all(tasks);

    res.json({
      success: true,
      count: allUsers.length,
      data: allUsers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a school user (Super Admin only)
// @route   POST /api/super-admin/users
// @access  Super Admin
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, schoolId } = req.body;

    if (!name || !email || !password || !schoolId) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and schoolId required' });
    }

    const masterPool = await getMasterPool();

    // Check if user exists globally
    const [checkUser] = await masterPool.execute('SELECT * FROM global_users WHERE email = ?', [email]);

    if (checkUser.length > 0) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists' });
    }

    const [schoolRows] = await masterPool.execute('SELECT * FROM schools WHERE id = ?', [schoolId]);

    if (schoolRows.length === 0) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }
    const school = schoolRows[0];

    const passwordHash = await hashPassword(password);

    // Add to tenant DB
    const schoolPool = await getSchoolPool(school.db_name);
    const profileId = crypto.randomUUID();

    await schoolPool.execute(`
        INSERT INTO profiles (id, email, password_hash, name, role, must_change_password)
        VALUES (?, ?, ?, ?, ?, 1)
      `, [profileId, email, passwordHash, name, role]);

    const [profileRows] = await schoolPool.execute('SELECT * FROM profiles WHERE id = ?', [profileId]);
    const newProfile = profileRows[0];

    // Add to global routing table
    const globalUserId = crypto.randomUUID();
    await masterPool.execute(`
        INSERT INTO global_users (id, email, school_id)
        VALUES (?, ?, ?)
      `, [globalUserId, email, schoolId]);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: newProfile.id,
        name,
        email,
        role,
        schoolId,
        schoolName: school.name,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new school and its Principal account
// @route   POST /api/super-admin/schools
// @access  Super Admin
exports.createSchool = async (req, res) => {
  // Uses the CLI script function internally or reproduces it
  try {
    const { createSchoolDatabase } = require('../scripts/createSchoolDb');
    const { schoolName, schoolCode, address, phone, email, academicYear, logo, principalName, principalEmail, temporaryPassword, dbName } = req.body;

    if (!schoolName || !principalName || !principalEmail || !temporaryPassword || !dbName) {
      return res.status(400).json({ success: false, message: 'Missing required fields. Database name (pre-created in cPanel) is required.' });
    }

    const school = await createSchoolDatabase(
      schoolName,
      schoolCode || Math.random().toString(36).substring(2, 8).toUpperCase(),
      academicYear || '2026-2027',
      principalEmail,
      temporaryPassword,
      { address, phone, email, logoUrl: logo, principalName, dbName }
    );

    if (!school) {
      return res.status(400).json({ success: false, message: 'Failed to create school. School code may already exist.' });
    }

    res.status(201).json({
      success: true,
      message: 'School and Principal created successfully',
      data: { school }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Platform-wide statistics
// @route   GET /api/super-admin/stats
// @access  Super Admin
exports.getStats = async (req, res) => {
  try {
    const masterPool = await getMasterPool();

    const [schools] = await masterPool.query('SELECT id, name, db_name, created_at FROM schools ORDER BY created_at DESC');
    const totalSchools = schools.length;

    let totalUsers = 0;
    let totalStudents = 0;
    const roleCounts = {};

    const tasks = schools.map(async (school) => {
      try {
        const pool = await getSchoolPool(school.db_name);

        const [uCount] = await pool.query('SELECT COUNT(*) as count FROM profiles');
        totalUsers += uCount[0].count;

        const [sCount] = await pool.query('SELECT COUNT(*) as count FROM students');
        totalStudents += sCount[0].count;

        const [rCounts] = await pool.query('SELECT role, COUNT(*) as count FROM profiles GROUP BY role');
        rCounts.forEach(r => {
          roleCounts[r.role] = (roleCounts[r.role] || 0) + r.count;
        });
      } catch (err) { }
    });

    await Promise.all(tasks);

    res.json({
      success: true,
      data: {
        totalSchools,
        totalUsers,
        totalStudents,
        roleCounts,
        recentSchools: schools.slice(0, 5),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a user (Super Admin only)
// @route   DELETE /api/super-admin/users/:id
// @access  Super Admin
exports.deleteUser = async (req, res) => {
  try {
    // Requires email to delete from global_users, or finding the user first
    const { email, schoolId } = req.body;

    if (!email || !schoolId) {
      return res.status(400).json({ success: false, message: 'email and schoolId required in body to delete user' });
    }

    const dbName = await resolveSchoolDbName(schoolId);
    if (!dbName) return res.status(404).json({ success: false, message: 'School not found' });

    const schoolPool = await getSchoolPool(dbName);

    await schoolPool.execute('DELETE FROM profiles WHERE email = ?', [email]);

    const masterPool = await getMasterPool();
    await masterPool.execute('DELETE FROM global_users WHERE email = ?', [email]);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset user password (generates new temp password)
// @route   POST /api/super-admin/users/:id/reset-password
// @access  Super Admin
exports.resetUserPassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { schoolId } = req.body;

    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId required in body' });
    }

    const dbName = await resolveSchoolDbName(schoolId);
    if (!dbName) return res.status(404).json({ success: false, message: 'School not found' });

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let newPassword = '';
    for (let i = 0; i < 12; i++) newPassword += chars[Math.floor(Math.random() * chars.length)];
    const passwordHash = await hashPassword(newPassword);

    const schoolPool = await getSchoolPool(dbName);
    const [result] = await schoolPool.execute(`
        UPDATE profiles 
        SET password_hash = ?, must_change_password = 1 
        WHERE id = ?
      `, [passwordHash, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'Password reset successfully', data: { temporaryPassword: newPassword } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user status (activate/suspend)
// @route   PATCH /api/super-admin/users/:id/status
// @access  Super Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const { status, schoolId } = req.body;

    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId required in body' });
    }

    const dbName = await resolveSchoolDbName(schoolId);
    if (!dbName) return res.status(404).json({ success: false, message: 'School not found' });

    const schoolPool = await getSchoolPool(dbName);
    const [result] = await schoolPool.execute('UPDATE profiles SET is_active = ? WHERE id = ?', [status === 'active' ? 1 : 0, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: `User status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a school's details
// @route   PATCH /api/super-admin/schools/:id
// @access  Super Admin
exports.updateSchool = async (req, res) => {
  console.log("🔥 updateSchool called");
  console.log(req.params.id);
  console.log(req.body);
  try {
    const schoolId = req.params.id;
    const { name, address, phone, email, status, academicYear } = req.body;

    const masterPool = await getMasterPool();

    // Check if school exists
    const [schoolRows] = await masterPool.execute('SELECT * FROM schools WHERE id = ?', [schoolId]);
    if (schoolRows.length === 0) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    // Build dynamic update
    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (address !== undefined) { updates.push('address = ?'); values.push(address); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (academicYear !== undefined) { updates.push('academic_year = ?'); values.push(academicYear); }
    if (status !== undefined) {
      const isActive = status === 'active' || status === 'Active' ? 1 : 0;
      updates.push('is_active = ?');
      values.push(isActive);

      // Reset the 365-day timer if activating
      if (isActive === 1) {
        updates.push('created_at = CURRENT_TIMESTAMP');
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(schoolId);
    await masterPool.execute(`UPDATE schools SET ${updates.join(', ')} WHERE id = ?`, values);

    const [updatedRows] = await masterPool.execute('SELECT * FROM schools WHERE id = ?', [schoolId]);

    res.json({
      success: true,
      message: 'School updated successfully',
      data: updatedRows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a school
// @route   DELETE /api/super-admin/schools/:id
// @access  Super Admin
exports.deleteSchool = async (req, res) => {
  try {
    const schoolId = req.params.id;
    const masterPool = await getMasterPool();

    const [schoolRows] = await masterPool.execute('SELECT * FROM schools WHERE id = ?', [schoolId]);
    if (schoolRows.length === 0) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    const school = schoolRows[0];

    // Remove global users for this school
    await masterPool.execute('DELETE FROM global_users WHERE school_id = ?', [schoolId]);

    // Try to drop the tenant database (may fail on shared hosting due to permissions)
    try {
      await masterPool.execute(`DROP DATABASE IF EXISTS \`${school.db_name}\``);
      console.log(`🗑️ Dropped database: ${school.db_name}`);
    } catch (dropError) {
      // On shared hosting (e.g., HostGator), the user may not have DROP DATABASE privilege.
      // Log the error but proceed with deleting the school record.
      console.warn(`⚠️ Could not drop database ${school.db_name}: ${dropError.message}. Proceeding with school deletion.`);
    }

    // Delete school record from master DB
    await masterPool.execute('DELETE FROM schools WHERE id = ?', [schoolId]);

    res.json({ success: true, message: `School "${school.name}" deleted successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

