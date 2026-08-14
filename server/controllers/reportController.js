const MODULE_CONFIG = {
  students: {
    table: 'students',
    defaultSort: 'created_at',
    searchColumns: ['name', 'admission_no', 'parent_name'],
  },
  fees: {
    table: 'fee_collections',
    join: 'JOIN students s ON fee_collections.student_id = s.id',
    select: 'fee_collections.*, s.name as student_name, s.admission_no, s.grade, s.section, s.parent_phone, s.parent_name, s.mother_name',
    defaultSort: 'fee_collections.created_at',
    searchColumns: ['s.name', 's.admission_no'], 
  },
  attendance: {
    table: 'attendance',
    join: 'JOIN students s ON attendance.student_id = s.id',
    select: 'attendance.*, s.name as student_name, s.admission_no, s.grade, s.section, s.parent_phone, s.parent_name, s.mother_name',
    defaultSort: 'attendance.date',
    searchColumns: ['s.name'],
  },
  exams: {
    table: 'exam_marks',
    join: 'JOIN students s ON exam_marks.student_id = s.id JOIN exams e ON exam_marks.exam_id = e.id',
    select: 'exam_marks.*, e.name as exam_name, e.term, s.name as student_name, s.admission_no, s.grade, s.section, s.parent_phone, s.parent_name, s.mother_name',
    defaultSort: 'exam_marks.created_at',
    searchColumns: ['s.name'],
  },
  teachers: {
    table: 'employees',
    defaultSort: 'created_at',
    searchColumns: ['name', 'employee_id', 'department'],
  },
  staff: {
    table: 'employees',
    defaultSort: 'created_at',
    searchColumns: ['name', 'employee_id', 'department'],
  },
  admissions: {
    table: 'students',
    defaultSort: 'admission_date',
    searchColumns: ['name', 'admission_no'],
  },
  expenditure: {
    table: 'expenditures',
    defaultSort: 'date',
    searchColumns: ['title', 'vendor_name', 'category'],
  },
  tc: {
    table: 'transfer_certificates',
    join: 'JOIN students s ON transfer_certificates.student_id = s.id',
    select: 'transfer_certificates.*, s.name as student_name, s.admission_no, s.grade, s.parent_name, s.mother_name, s.parent_phone',
    defaultSort: 'transfer_certificates.issued_date',
    searchColumns: ['transfer_certificates.tc_number', 's.name'],
  }
};

const checkReportAccess = (userRole, moduleName) => {
  if (userRole === 'super_admin' || userRole === 'principal') return true;
  if (userRole === 'teacher') return ['students', 'attendance', 'exams', 'teachers'].includes(moduleName);
  if (userRole === 'clerk') return ['students', 'fees', 'admissions', 'tc', 'staff', 'expenditure'].includes(moduleName);
  return false;
};

// @desc    Generate a dynamic report for a specific module
// @route   GET /api/reports/:module
// @access  Auth (Role specific)
exports.generateReport = async (req, res) => {
  try {
    const { module } = req.params;
    
    if (module === 'dashboard') {
      return await getDashboardMetrics(req, res);
    }

    const config = MODULE_CONFIG[module];
    if (!config) {
      return res.status(400).json({ success: false, message: 'Invalid report module' });
    }

    if (!checkReportAccess(req.user.role, module)) {
      return res.status(403).json({ success: false, message: 'Access denied to this report module' });
    }

    const limit = parseInt(req.query.limit) || 0;
    const page = parseInt(req.query.page) || 1;
    const sortBy = req.query.sortBy || config.defaultSort;
    const sortDesc = req.query.sortOrder !== 'asc';
    
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};

    const tablePrefix = config.join ? `${config.table}.` : '';
    const studentPrefix = config.join ? 's.' : '';
    
    let selectFields = config.select || `${config.table}.*`;
    let queryBase = `FROM ${config.table} ${config.join || ''} WHERE 1=1`;

    if (['students', 'employees', 'fee_structures', 'expenditures'].includes(config.table)) {
      queryBase += ` AND ${tablePrefix}deleted_at IS NULL`;
    }
    if (config.join && config.join.includes('JOIN students s')) {
      queryBase += ` AND s.deleted_at IS NULL`;
    }
    let params = [];

    // Academic Year Filter
    if (filters.academicYear) {
      if (['students', 'fee_collections', 'expenditures'].includes(config.table)) {
        queryBase += ` AND ${tablePrefix}academic_year = ?`;
      } else if (['attendance', 'exam_marks', 'transfer_certificates'].includes(config.table)) {
        queryBase += ` AND ${studentPrefix}academic_year = ?`;
      }
      params.push(filters.academicYear);
    }

    // Student Filters
    const hasStudentJoin = ['students', 'fee_collections', 'attendance', 'exam_marks', 'transfer_certificates'].includes(config.table);
    if (hasStudentJoin) {
      if (filters.grade) { queryBase += ` AND ${studentPrefix}grade = ?`; params.push(filters.grade); }
      if (filters.section) { queryBase += ` AND ${studentPrefix}section = ?`; params.push(filters.section); }
      if (filters.gender) { queryBase += ` AND ${studentPrefix}gender = ?`; params.push(filters.gender); }
      if (filters.admissionStatus) { queryBase += ` AND ${studentPrefix}admission_status = ?`; params.push(filters.admissionStatus); }
      if (filters.admissionNo) { queryBase += ` AND ${studentPrefix}admission_no LIKE ?`; params.push(`%${filters.admissionNo}%`); }
      if (filters.studentName) { queryBase += ` AND ${studentPrefix}name LIKE ?`; params.push(`%${filters.studentName}%`); }
      if (filters.fatherName) { queryBase += ` AND ${studentPrefix}parent_name LIKE ?`; params.push(`%${filters.fatherName}%`); }
      if (filters.motherName) { queryBase += ` AND ${studentPrefix}mother_name LIKE ?`; params.push(`%${filters.motherName}%`); }
      if (filters.mobileNumber) { queryBase += ` AND ${studentPrefix}parent_phone LIKE ?`; params.push(`%${filters.mobileNumber}%`); }
    }

    if (filters.feeStatus && config.table === 'fee_collections') {
      queryBase += ' AND fee_collections.status = ?';
      params.push(filters.feeStatus);
    }
    
    // Date Filters
    if (filters.startDate && filters.endDate) {
      const dateCol = config.defaultSort.includes('date') ? config.defaultSort : `${tablePrefix}created_at`;
      queryBase += ` AND ${dateCol} >= ? AND ${dateCol} <= ?`;
      params.push(filters.startDate, filters.endDate);
    }

    // Search
    if (filters.search && config.searchColumns) {
      const orClauses = config.searchColumns.map((col) => {
        params.push(`%${filters.search}%`);
        return `${col} LIKE ?`;
      });
      if (orClauses.length > 0) {
        queryBase += ` AND (${orClauses.join(' OR ')})`;
      }
    }

    // First, get the total count for pagination
    const countQuery = `SELECT COUNT(*) as total ${queryBase}`;
    const [countResult] = await req.db.query(countQuery, params);
    const totalCount = countResult[0].total;

    // Then, get the paginated data
    let dataQuery = `SELECT ${selectFields} ${queryBase}`;
    
    // Convert generic sort column if needed
    let actualSortBy = sortBy;
    if (!sortBy.includes('.') && config.join) {
      actualSortBy = `${tablePrefix}${sortBy}`;
    }
    
    dataQuery += ` ORDER BY ${actualSortBy} ${sortDesc ? 'DESC' : 'ASC'}`;

    if (limit > 0) {
      const offset = (page - 1) * limit;
      dataQuery += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);
    }

    const [dataResult] = await req.db.query(dataQuery, params);

    res.json({
      success: true,
      data: dataResult,
      pagination: limit > 0 ? {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      } : { total: totalCount }
    });

  } catch (error) {
    console.error('Report Generation Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDashboardMetrics = async (req, res) => {
  try {
    if (req.user && req.user.role === 'super_admin') {
      const { getMasterPool } = require('../config/database');
      const { getSchoolPool } = require('../config/tenantPool');
      const masterPool = await getMasterPool();
      
      const [schools] = await masterPool.query('SELECT db_name FROM schools');
      
      let globalStudentCount = 0;
      let globalTeacherCount = 0;
      let globalFeesCommitted = 0;
      let globalFeesPaid = 0;
      
      const tasks = schools.map(async (school) => {
        try {
          const pool = await getSchoolPool(school.db_name);
          const [[sRes], [tRes], [fRes]] = await Promise.all([
            pool.query("SELECT COUNT(*) as count FROM students WHERE is_active = 1"),
            pool.query("SELECT COUNT(*) as count FROM employees WHERE is_active = 1"),
            pool.query("SELECT SUM(committed_fee) as committed, SUM(total_paid) as paid FROM fee_collections")
          ]);
          globalStudentCount += (sRes[0]?.count || 0);
          globalTeacherCount += (tRes[0]?.count || 0);
          globalFeesCommitted += Number(fRes[0]?.committed || 0);
          globalFeesPaid += Number(fRes[0]?.paid || 0);
        } catch (e) {
          // Ignore if a tenant DB has an error
        }
      });
      
      await Promise.all(tasks);
      
      return res.json({
        success: true,
        data: {
          studentCount: globalStudentCount,
          teacherCount: globalTeacherCount,
          totalFeesCommitted: globalFeesCommitted,
          totalFeesPaid: globalFeesPaid,
          pendingFees: globalFeesCommitted - globalFeesPaid,
          isSuperAdmin: true
        }
      });
    }

    const [[studentsResult], [teachersResult], [feesResult]] = await Promise.all([
      req.db.query("SELECT COUNT(*) as count FROM students WHERE is_active = 1"),
      req.db.query("SELECT COUNT(*) as count FROM employees WHERE is_active = 1"),
      req.db.query("SELECT SUM(committed_fee) as committed, SUM(total_paid) as paid FROM fee_collections")
    ]);

    const studentCount = studentsResult[0].count || 0;
    const teacherCount = teachersResult[0].count || 0;
    
    const feesData = feesResult[0];
    const totalFeesCommitted = feesData.committed || 0;
    const totalFeesPaid = feesData.paid || 0;
    const pendingFees = totalFeesCommitted - totalFeesPaid;

    res.json({
      success: true,
      data: {
        studentCount,
        teacherCount,
        totalFeesCommitted,
        totalFeesPaid,
        pendingFees,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
