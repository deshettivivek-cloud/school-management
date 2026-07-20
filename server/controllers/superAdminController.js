const { sql, getMasterPool } = require('../config/database');
const { getSchoolPool, resolveSchoolDbName } = require('../config/tenantPool');
const { hashPassword } = require('../config/auth');

// @desc    Get all schools (platform-wide)
// @route   GET /api/super-admin/schools
// @access  Super Admin
exports.getAllSchools = async (req, res) => {
  try {
    const masterPool = await getMasterPool();
    const result = await masterPool.request().query('SELECT * FROM schools ORDER BY created_at DESC');
    
    // Enrich with user counts by querying global_users
    const userCountsResult = await masterPool.request().query('SELECT school_id, COUNT(*) as count FROM global_users GROUP BY school_id');
    
    const countMap = {};
    userCountsResult.recordset.forEach(r => {
      countMap[r.school_id] = r.count;
    });

    const enrichedSchools = result.recordset.map(school => ({
      ...school,
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
    const schoolResult = await masterPool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query('SELECT * FROM schools WHERE id = @id');

    if (schoolResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }
    const school = schoolResult.recordset[0];

    // Connect to tenant DB to get users and student count
    const schoolPool = await getSchoolPool(school.db_name);
    
    const usersResult = await schoolPool.request().query('SELECT id, name, email, role, created_at FROM profiles ORDER BY created_at DESC');
    const studentCountResult = await schoolPool.request().query('SELECT COUNT(*) as count FROM students');

    res.json({
      success: true,
      data: {
        ...school,
        users: usersResult.recordset || [],
        studentCount: studentCountResult.recordset[0].count || 0,
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
    const schoolsResult = await masterPool.request().query('SELECT id, name, db_name FROM schools');
    const schools = schoolsResult.recordset;
    
    const schoolMap = {};
    schools.forEach(s => { schoolMap[s.id] = s.name; });

    let allUsers = [];

    // Parallel query to each school database to get profiles
    const tasks = schools.map(async (school) => {
      try {
        const pool = await getSchoolPool(school.db_name);
        const usersResult = await pool.request().query('SELECT id, name, email, role, is_active FROM profiles');
        usersResult.recordset.forEach(u => {
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
    const checkUser = await masterPool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM global_users WHERE email = @email');
      
    if (checkUser.recordset.length > 0) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists' });
    }

    const schoolResult = await masterPool.request()
      .input('id', sql.UniqueIdentifier, schoolId)
      .query('SELECT * FROM schools WHERE id = @id');

    if (schoolResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }
    const school = schoolResult.recordset[0];

    const passwordHash = await hashPassword(password);
    
    // Add to tenant DB
    const schoolPool = await getSchoolPool(school.db_name);
    const profileResult = await schoolPool.request()
      .input('email', sql.NVarChar, email)
      .input('passwordHash', sql.NVarChar, passwordHash)
      .input('name', sql.NVarChar, name)
      .input('role', sql.NVarChar, role)
      .query(`
        INSERT INTO profiles (email, password_hash, name, role, must_change_password)
        OUTPUT INSERTED.*
        VALUES (@email, @passwordHash, @name, @role, 1)
      `);

    const newProfile = profileResult.recordset[0];

    // Add to global routing table
    await masterPool.request()
      .input('email', sql.NVarChar, email)
      .input('schoolId', sql.UniqueIdentifier, schoolId)
      .query(`
        INSERT INTO global_users (email, school_id)
        VALUES (@email, @schoolId)
      `);

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
    const { schoolName, schoolCode, address, phone, email, academicYear, logo, principalName, principalEmail, temporaryPassword } = req.body;

    if (!schoolName || !principalName || !principalEmail || !temporaryPassword) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const school = await createSchoolDatabase(
      schoolName, 
      schoolCode || Math.random().toString(36).substring(2, 8).toUpperCase(), 
      academicYear || '2023-2024', 
      principalEmail, 
      temporaryPassword, 
      { address, phone, email, logoUrl: logo, principalName }
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
    
    const schoolsResult = await masterPool.request().query('SELECT id, name, db_name, created_at FROM schools ORDER BY created_at DESC');
    const schools = schoolsResult.recordset;
    const totalSchools = schools.length;

    let totalUsers = 0;
    let totalStudents = 0;
    const roleCounts = {};

    const tasks = schools.map(async (school) => {
      try {
        const pool = await getSchoolPool(school.db_name);
        
        const uCount = await pool.request().query('SELECT COUNT(*) as count FROM profiles');
        totalUsers += uCount.recordset[0].count;

        const sCount = await pool.request().query('SELECT COUNT(*) as count FROM students');
        totalStudents += sCount.recordset[0].count;

        const rCounts = await pool.request().query('SELECT role, COUNT(*) as count FROM profiles GROUP BY role');
        rCounts.recordset.forEach(r => {
          roleCounts[r.role] = (roleCounts[r.role] || 0) + r.count;
        });
      } catch (err) {}
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
    
    await schoolPool.request()
      .input('email', sql.NVarChar, email)
      .query('DELETE FROM profiles WHERE email = @email');

    const masterPool = await getMasterPool();
    await masterPool.request()
      .input('email', sql.NVarChar, email)
      .query('DELETE FROM global_users WHERE email = @email');

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
    const result = await schoolPool.request()
      .input('id', sql.UniqueIdentifier, userId)
      .input('hash', sql.NVarChar, passwordHash)
      .query(`
        UPDATE profiles 
        SET password_hash = @hash, must_change_password = 1 
        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
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
    const result = await schoolPool.request()
      .input('id', sql.UniqueIdentifier, userId)
      .input('status', sql.Bit, status === 'active' ? 1 : 0)
      .query('UPDATE profiles SET is_active = @status WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: `User status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
