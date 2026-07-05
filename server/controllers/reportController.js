const supabase = require('../config/supabase');
const { logAuditAction } = require('../utils/auditLogger');

// Configuration mapping for different report modules
const MODULE_CONFIG = {
  students: {
    table: 'students',
    select: '*',
    defaultSort: 'created_at',
    searchColumns: ['name', 'admission_no', 'parent_name'],
  },
  fees: {
    table: 'fee_collections',
    select: '*, students!inner(name, admission_no, grade, section, parent_phone, parent_name, mother_name)',
    defaultSort: 'created_at',
    searchColumns: ['students.name', 'students.admission_no'], 
  },
  attendance: {
    table: 'attendance',
    select: '*, students!inner(name, admission_no, grade, section, parent_phone, parent_name, mother_name)',
    defaultSort: 'date',
    searchColumns: ['students.name'],
  },
  exams: {
    table: 'exam_marks',
    select: '*, exams(name, term), students!inner(name, admission_no, grade, section, parent_phone, parent_name, mother_name)',
    defaultSort: 'created_at',
    searchColumns: ['students.name'],
  },
  teachers: {
    table: 'teachers',
    select: '*',
    defaultSort: 'created_at',
    searchColumns: ['name', 'employee_id', 'department'],
  },
  staff: {
    table: 'staff',
    select: '*',
    defaultSort: 'created_at',
    searchColumns: ['name', 'employee_id', 'department'],
  },
  admissions: {
    table: 'students',
    select: '*',
    defaultSort: 'admission_date',
    searchColumns: ['name', 'admission_no'],
  },
  expenditure: {
    table: 'expenditures',
    select: '*',
    defaultSort: 'date',
    searchColumns: ['title', 'vendor_name', 'category'],
  },
  tc: {
    table: 'transfer_certificates',
    select: '*, students!inner(name, admission_no, grade, parent_name, mother_name, parent_phone)',
    defaultSort: 'issued_date',
    searchColumns: ['tc_number', 'students.name'],
  },
  dashboard: {
    // Handled separately by metrics endpoint
  }
};

/**
 * Validates role-based access to specific modules
 */
const checkReportAccess = (userRole, moduleName) => {
  if (userRole === 'super_admin' || userRole === 'principal') return true;

  if (userRole === 'teacher') {
    return ['students', 'attendance', 'exams', 'teachers'].includes(moduleName);
  }

  if (userRole === 'clerk') {
    return ['students', 'fees', 'admissions', 'tc', 'staff', 'expenditure'].includes(moduleName);
  }

  return false;
};

// @desc    Generate a dynamic report for a specific module
// @route   GET /api/reports/:module
// @access  Auth (Role specific)
exports.generateReport = async (req, res) => {
  try {
    const { module } = req.params;
    const config = MODULE_CONFIG[module];

    if (!config && module !== 'dashboard') {
      return res.status(400).json({ success: false, message: 'Invalid report module' });
    }

    if (!checkReportAccess(req.user.role, module)) {
      return res.status(403).json({ success: false, message: 'Access denied to this report module' });
    }

    // Handle dashboard metrics separately
    if (module === 'dashboard') {
      return await getDashboardMetrics(req, res);
    }

    // Pagination (0 limit means export all, else paginated)
    const limit = parseInt(req.query.limit);
    const page = parseInt(req.query.page) || 1;
    
    // Sorting
    const sortBy = req.query.sortBy || config.defaultSort;
    const sortDesc = req.query.sortOrder !== 'asc';

    // Start building query
    let query = supabase
      .from(config.table)
      .select(config.select, { count: 'exact' });

    // Enforce Tenant Isolation (School ID)
    if (req.user.role !== 'super_admin' && config.table !== 'schools') {
      query = query.eq('school_id', req.user.schoolId);
    } else if (req.user.role === 'super_admin' && req.query.schoolId) {
      query = query.eq('school_id', req.query.schoolId);
    }

    // Dynamic Filters passed via query params
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};

    // Determine if we need to filter on primary table or joined students table
    const pfx = config.table === 'students' ? '' : 'students.';

    // Safely apply Academic Year filter
    if (filters.academicYear) {
      if (['students', 'fee_collections', 'expenditures'].includes(config.table)) {
        query = query.eq('academic_year', filters.academicYear);
      } else if (['attendance', 'exam_marks', 'transfer_certificates'].includes(config.table)) {
        query = query.eq('students.academic_year', filters.academicYear);
      }
    }

    // Apply Student-specific filters only if the table is students or joins students
    const hasStudentJoin = ['students', 'fee_collections', 'attendance', 'exam_marks', 'transfer_certificates'].includes(config.table);
    
    if (hasStudentJoin) {
      if (filters.grade) query = query.eq(`${pfx}grade`, filters.grade);
      if (filters.section) query = query.eq(`${pfx}section`, filters.section);
      if (filters.gender) query = query.eq(`${pfx}gender`, filters.gender);
      if (filters.admissionStatus) query = query.eq(`${pfx}admission_status`, filters.admissionStatus);
      
      if (filters.admissionNo) query = query.ilike(`${pfx}admission_no`, `%${filters.admissionNo}%`);
      if (filters.studentName) query = query.ilike(`${pfx}name`, `%${filters.studentName}%`);
      if (filters.fatherName) query = query.ilike(`${pfx}parent_name`, `%${filters.fatherName}%`);
      if (filters.motherName) query = query.ilike(`${pfx}mother_name`, `%${filters.motherName}%`);
      if (filters.mobileNumber) query = query.ilike(`${pfx}parent_phone`, `%${filters.mobileNumber}%`);
    }

    if (filters.feeStatus && config.table === 'fee_collections') {
      query = query.eq('status', filters.feeStatus);
    }
    
    // Date Range (handles createdAt, date, or specific date columns based on module)
    if (filters.startDate && filters.endDate) {
      const dateCol = config.defaultSort.includes('date') ? config.defaultSort : 'created_at';
      query = query.gte(dateCol, filters.startDate).lte(dateCol, filters.endDate);
    }

    // Search logic (simple ilike across defined search columns)
    if (filters.search && config.searchColumns) {
      const localSearchCols = config.searchColumns.filter(c => !c.includes('.'));
      if (localSearchCols.length > 0) {
        const orQuery = localSearchCols.map(col => `${col}.ilike.%${filters.search}%`).join(',');
        query = query.or(orQuery);
      }
    }

    // Role-specific row-level narrowing (e.g., Teacher only sees assigned classes)
    if (req.user.role === 'teacher' && config.table === 'students') {
      if (req.user.assigned_classes && req.user.assigned_classes.length > 0) {
        const allowedGrades = req.user.assigned_classes.map(c => c.grade);
        query = query.in('grade', allowedGrades);
      }
    }

    // Apply pagination if limit is > 0 (for export, limit=0 returns all matching records)
    if (limit > 0) {
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);
    }

    // Execute paginated query
    const { data, count, error } = await query
      .order(sortBy, { ascending: !sortDesc });

    if (error) throw error;

    res.json({
      success: true,
      data,
      pagination: limit > 0 ? {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      } : { total: count }
    });

  } catch (error) {
    console.error('Report Generation Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Specialized handler for the Reports Dashboard summary metrics
 */
const getDashboardMetrics = async (req, res) => {
  const schoolId = req.user.role === 'super_admin' ? req.query.schoolId : req.user.schoolId;
  const matchObj = schoolId ? { school_id: schoolId } : {};

  // Fire parallel counts using exact head requests for speed
  const getCount = (table) => supabase.from(table).select('*', { count: 'exact', head: true }).match(matchObj);
  
  const [students, teachers, fees] = await Promise.all([
    getCount('students'),
    getCount('teachers'),
    supabase.from('fee_collections').select('committed_fee, total_paid').match(matchObj)
  ]);

  let totalCommitted = 0;
  let totalPaid = 0;
  
  if (fees.data) {
    fees.data.forEach(f => {
      totalCommitted += Number(f.committed_fee) || 0;
      totalPaid += Number(f.total_paid) || 0;
    });
  }

  res.json({
    success: true,
    data: {
      studentCount: students.count || 0,
      teacherCount: teachers.count || 0,
      totalFeesCommitted: totalCommitted,
      totalFeesPaid: totalPaid,
      pendingFees: totalCommitted - totalPaid,
    }
  });
};
