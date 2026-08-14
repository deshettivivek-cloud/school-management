const crypto = require('crypto');
const { getMasterPool } = require('../config/database');
const { getSchoolPool, resolveSchoolDbName } = require('../config/tenantPool');
const { hashPassword } = require('../config/auth');
const superAdminRepository = require('../repositories/superAdminRepository');
const bugReportRepo = require('../repositories/bugReportRepository');
const { logAuditAction } = require('../utils/auditLogger');

// @desc    Get all schools (platform-wide)
// @route   GET /api/super-admin/schools
// @access  Super Admin
exports.getAllSchools = async (req, res) => {
  try {
    const masterPool = await getMasterPool();
    const schools = await superAdminRepository.findAllSchools(masterPool);

    // Enrich with user counts by querying global_users
    const userCounts = await superAdminRepository.findGlobalUserCounts(masterPool);

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
    const schoolRows = await superAdminRepository.findSchoolById(masterPool, req.params.id);

    if (schoolRows.length === 0) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }
    const school = schoolRows[0];

    // Connect to tenant DB to get users and student count
    const schoolPool = await getSchoolPool(school.db_name);

    const users = await superAdminRepository.findSchoolUsers(schoolPool);
    const studentCountResult = await superAdminRepository.findSchoolStudentCount(schoolPool);

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
    const schools = await superAdminRepository.findAllSchoolsBasic(masterPool);

    const schoolMap = {};
    schools.forEach(s => { schoolMap[s.id] = s.name; });

    let allUsers = [];

    // Parallel query to each school database to get profiles
    const tasks = schools.map(async (school) => {
      try {
        const pool = await getSchoolPool(school.db_name);
        const users = await superAdminRepository.findSchoolProfilesBasic(pool);
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
    const checkUser = await superAdminRepository.findGlobalUserByEmail(masterPool, email);

    if (checkUser.length > 0) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists' });
    }

    const schoolRows = await superAdminRepository.findSchoolById(masterPool, schoolId);

    if (schoolRows.length === 0) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }
    const school = schoolRows[0];

    const passwordHash = await hashPassword(password);

    // Add to tenant DB
    const schoolPool = await getSchoolPool(school.db_name);
    const profileId = crypto.randomUUID();

    await superAdminRepository.insertSchoolUserProfile(schoolPool, {
      id: profileId,
      email,
      passwordHash,
      name,
      role,
    });

    const profileRows = await superAdminRepository.findSchoolProfileById(schoolPool, profileId);
    const newProfile = profileRows[0];

    // Add to global routing table
    const globalUserId = crypto.randomUUID();
    await superAdminRepository.insertGlobalUser(masterPool, {
      id: globalUserId,
      email,
      schoolId,
    });

    await logAuditAction(req, {
      action: 'CREATE_USER',
      resource_type: 'user',
      resource_id: newProfile.id,
      new_values: { email, name, role, schoolId }
    });

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
  try {
    const { createSchoolDatabase } = require('../scripts/createSchoolDb');
    const { schoolName, schoolCode, address, phone, email, academicYear, logo, principalName, principalEmail, temporaryPassword, dbName } = req.body;

    if (!schoolName || !principalName || !principalEmail || !temporaryPassword || !dbName) {
      return res.status(400).json({ success: false, message: 'Missing required fields. Database name (pre-created in cPanel) is required.' });
    }

    if (phone && !/^\d{10}$/.test(String(phone).trim())) {
      return res.status(400).json({ success: false, message: '❌ School phone number must be exactly 10 digits' });
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

    await logAuditAction(req, {
      action: 'CREATE_SCHOOL',
      resource_type: 'school',
      resource_id: school.id,
      new_values: { schoolName, dbName, principalEmail }
    });

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

    const schools = await superAdminRepository.findSchoolsForStats(masterPool);
    const totalSchools = schools.length;

    let totalUsers = 0;
    let totalStudents = 0;
    const roleCounts = {};

    const tasks = schools.map(async (school) => {
      try {
        const pool = await getSchoolPool(school.db_name);

        const uCount = await superAdminRepository.findSchoolProfileCount(pool);
        totalUsers += uCount;

        const sCount = await superAdminRepository.findSchoolStudentCount(pool);
        totalStudents += (sCount[0] ? sCount[0].count : 0);

        const rCounts = await superAdminRepository.findSchoolRoleCounts(pool);
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
    const { email, schoolId } = req.body;

    if (!email || !schoolId) {
      return res.status(400).json({ success: false, message: 'email and schoolId required in body to delete user' });
    }

    const dbName = await resolveSchoolDbName(schoolId);
    if (!dbName) return res.status(404).json({ success: false, message: 'School not found' });

    const schoolPool = await getSchoolPool(dbName);

    await superAdminRepository.deleteProfileByEmail(schoolPool, email);

    const masterPool = await getMasterPool();
    await superAdminRepository.deleteGlobalUserByEmail(masterPool, email);

    await logAuditAction(req, {
      action: 'DELETE_USER',
      resource_type: 'user',
      resource_id: email
    });

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
    const result = await superAdminRepository.updateProfilePasswordAndFlag(schoolPool, userId, passwordHash);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await logAuditAction(req, {
      action: 'RESET_USER_PASSWORD',
      resource_type: 'user',
      resource_id: userId
    });

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
    const result = await superAdminRepository.updateProfileActiveStatus(schoolPool, userId, status === 'active');

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await logAuditAction(req, {
      action: 'UPDATE_USER_STATUS',
      resource_type: 'user',
      resource_id: userId,
      new_values: { status }
    });

    res.json({ success: true, message: `User status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a school's details
// @route   PATCH /api/super-admin/schools/:id
// @access  Super Admin
exports.updateSchool = async (req, res) => {
  try {
    const schoolId = req.params.id;
    const { name, address, phone, email, status, academicYear } = req.body;

    const masterPool = await getMasterPool();

    const schoolRows = await superAdminRepository.findSchoolById(masterPool, schoolId);
    if (schoolRows.length === 0) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

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

      if (isActive === 1) {
        updates.push('created_at = CURRENT_TIMESTAMP');
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    await superAdminRepository.updateSchoolRecord(masterPool, schoolId, updates.join(', '), values);

    const updatedRows = await superAdminRepository.findSchoolById(masterPool, schoolId);

    await logAuditAction(req, {
      action: 'UPDATE_SCHOOL',
      resource_type: 'school',
      resource_id: schoolId,
      new_values: updatedRows[0]
    });

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

    const schoolRows = await superAdminRepository.findSchoolById(masterPool, schoolId);
    if (schoolRows.length === 0) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    const school = schoolRows[0];

    // Remove global users for this school
    await superAdminRepository.deleteGlobalUsersBySchoolId(masterPool, schoolId);

    // Try to drop tenant database
    try {
      await superAdminRepository.dropDatabaseIfExists(masterPool, school.db_name);
      console.log(`🗑️ Dropped database: ${school.db_name}`);
    } catch (dropError) {
      console.warn(`⚠️ Could not drop database ${school.db_name}: ${dropError.message}. Proceeding with school deletion.`);
    }

    // Delete school record from master DB
    await superAdminRepository.deleteSchoolById(masterPool, schoolId);

    await logAuditAction(req, {
      action: 'DELETE_SCHOOL',
      resource_type: 'school',
      resource_id: schoolId
    });

    res.json({ success: true, message: `School "${school.name}" deleted successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all bug reports across all tenant databases (Super Admin only)
// @route   GET /api/super-admin/bug-reports
// @access  Super Admin
exports.getAllBugReportsAcrossSchools = async (req, res) => {
  try {
    const masterPool = await getMasterPool();
    const schools = await superAdminRepository.findAllSchoolsBasic(masterPool);

    let allBugReports = [];

    const tasks = schools.map(async (school) => {
      try {
        const pool = await getSchoolPool(school.db_name);
        const reports = await bugReportRepo.findAllBugReports(pool);
        reports.forEach(r => {
          allBugReports.push({
            ...r,
            school_id: school.id,
            school_name: school.name,
            school_db_name: school.db_name,
          });
        });
      } catch (err) {
        console.error(`Failed to fetch bug reports for school ${school.name}:`, err.message);
      }
    });

    await Promise.all(tasks);

    // Sort newest first
    allBugReports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      success: true,
      count: allBugReports.length,
      data: allBugReports,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Respond to a bug report (Super Admin only)
// @route   PUT /api/super-admin/bug-reports/:schoolId/:id/respond
// @access  Super Admin
exports.respondToBugReport = async (req, res) => {
  try {
    const { schoolId, id } = req.params;
    const { developer_response, status } = req.body;

    if (!developer_response || !developer_response.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Developer response text is required',
      });
    }

    const masterPool = await getMasterPool();
    const schoolRows = await superAdminRepository.findSchoolById(masterPool, schoolId);

    if (schoolRows.length === 0) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    const school = schoolRows[0];
    const pool = await getSchoolPool(school.db_name);

    const existing = await bugReportRepo.findBugReportById(pool, id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Bug report not found in school database' });
    }

    await bugReportRepo.updateBugReportDeveloperResponse(pool, id, developer_response.trim(), status);
    const updated = await bugReportRepo.findBugReportById(pool, id);

    await logAuditAction(req, {
      action: 'RESPOND_TO_BUG_REPORT',
      resource_type: 'bug_report',
      resource_id: String(id),
      schoolId: schoolId,
      old_values: { developer_response: existing.developer_response, status: existing.status },
      new_values: { developer_response: developer_response.trim(), status: updated.status },
    });

    res.json({
      success: true,
      message: 'Response recorded successfully',
      data: {
        ...updated,
        school_id: school.id,
        school_name: school.name,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all audit logs
// @route   GET /api/super-admin/audit-logs
// @access  Super Admin
exports.getAuditLogs = async (req, res) => {
  try {
    const { action } = req.query;
    const masterPool = await getMasterPool();
    
    let query = `
      SELECT al.*, p.name as profile_name, p.email as profile_email 
      FROM audit_logs al
      LEFT JOIN super_admin_profiles p ON al.user_id = p.id
    `;
    const params = [];
    
    if (action) {
      query += ' WHERE al.action = ?';
      params.push(action);
    }
    
    query += ' ORDER BY al.created_at DESC LIMIT 100';
    
    const [rows] = await masterPool.execute(query, params);
    
    // Map to the frontend format expected
    const formattedLogs = rows.map(log => ({
      ...log,
      profiles: {
        name: log.profile_name || 'System / Unknown',
        email: log.profile_email || ''
      }
    }));
    
    res.json({
      success: true,
      data: formattedLogs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
