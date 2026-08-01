const crypto = require('crypto');
const { logAuditAction } = require('../utils/auditLogger');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private (Principal, Admin)
exports.getEmployees = async (req, res) => {
  try {
    const { search, department, designation, status } = req.query;

    let query = `
      SELECT e.*, p.email, p.role 
      FROM employees e
      LEFT JOIN profiles p ON e.user_id = p.id
      WHERE e.deleted_at IS NULL
    `;
    let params = [];

    if (department) {
      query += ' AND e.department = ?';
      params.push(department);
    }
    if (designation) {
      query += ' AND e.designation = ?';
      params.push(designation);
    }
    if (status) {
      const isActive = status.toLowerCase() === 'active' ? 1 : 0;
      query += ' AND e.is_active = ?';
      params.push(isActive);
    }
    if (search) {
      query += ' AND (e.name LIKE ? OR e.employee_id LIKE ? OR e.department LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY e.created_at DESC';

    const [rows] = await req.db.query(query, params);

    // Format nested user object to match previous Supabase structure
    const formattedData = rows.map(row => {
      const data = { ...row };
      if (data.email) {
        data.user = { email: data.email, role: data.role };
      }
      delete data.email;
      delete data.role;
      return data;
    });

    res.json({
      success: true,
      count: formattedData.length,
      data: formattedData
    });
  } catch (error) {
    console.error('Error getting employees:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employees' });
  }
};

// @desc    Create a new employee
// @route   POST /api/employees
// @access  Private (Principal)
exports.createEmployee = async (req, res) => {
  try {
    const {
      emp_id, employee_id, name, designation, department, phone, mobile, email,
      class_teacher_of, joining_date, basic_salary, user_id, is_active,
      gender, dob, blood_group, alt_mobile, aadhaar_no, pan_no,
      address, city, state, pincode, employment_type, qualification, experience,
      hra, da, medical_allowance, special_allowance, bonus,
      pf, professional_tax, other_deductions,
      bank_name, account_no, ifsc_code, remarks
    } = req.body;

    const newEmpId = crypto.randomUUID();
    
    // Map fields from frontend payload
    const finalEmployeeId = employee_id || emp_id || `EMP-${Math.floor(Math.random() * 1000000)}`;
    const finalPhone = phone || mobile || '';

    await req.db.query(`
        INSERT INTO employees (
          id, employee_id, name, designation, department, phone, email, 
          class_teacher_of, joining_date, basic_salary, user_id, is_active,
          gender, dob, blood_group, alt_mobile, aadhaar_no, pan_no,
          address, city, state, pincode, employment_type, qualification, experience,
          hra, da, medical_allowance, special_allowance, bonus,
          pf, professional_tax, other_deductions,
          bank_name, account_no, ifsc_code, remarks
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?
        )
      `, [
        newEmpId, finalEmployeeId, name, designation || '', department || '', finalPhone, email || '',
        class_teacher_of || '', joining_date || new Date().toISOString().split('T')[0], basic_salary || 0,
        user_id || null, is_active !== undefined ? (is_active ? 1 : 0) : 1,
        gender || '', dob || null, blood_group || '', alt_mobile || '', aadhaar_no || '', pan_no || '',
        address || '', city || '', state || '', pincode || '', employment_type || 'Full Time', qualification || '', experience || '',
        hra || 0, da || 0, medical_allowance || 0, special_allowance || 0, bonus || 0,
        pf || 0, professional_tax || 0, other_deductions || 0,
        bank_name || '', account_no || '', ifsc_code || '', remarks || ''
      ]);

    const [rows] = await req.db.query('SELECT * FROM employees WHERE id = ?', [newEmpId]);

    await logAuditAction(req, {
      action: 'CREATE_EMPLOYEE',
      resource_type: 'employee',
      resource_id: newEmpId,
      new_values: { name, employee_id: finalEmployeeId, designation, department }
    });

    res.status(201).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ success: false, message: 'Failed to create employee', error: error.message });
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
exports.getEmployee = async (req, res) => {
  try {
    const [rows] = await req.db.query('SELECT * FROM employees WHERE id = ? AND deleted_at IS NULL', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const employeeData = rows[0];
    employeeData.emp_id = employeeData.employee_id;
    employeeData.mobile = employeeData.phone;

    res.json({
      success: true,
      data: employeeData
    });
  } catch (error) {
    console.error('Error getting employee:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employee' });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private
exports.updateEmployee = async (req, res) => {
  try {
    if (req.body.emp_id !== undefined && req.body.employee_id === undefined) {
      req.body.employee_id = req.body.emp_id;
    }
    if (req.body.mobile !== undefined && req.body.phone === undefined) {
      req.body.phone = req.body.mobile;
    }

    const fields = [
      'employee_id', 'name', 'designation', 'department', 'phone', 'email',
      'class_teacher_of', 'joining_date', 'basic_salary', 'user_id', 'is_active',
      'gender', 'dob', 'blood_group', 'alt_mobile', 'aadhaar_no', 'pan_no',
      'address', 'city', 'state', 'pincode', 'employment_type', 'qualification', 'experience',
      'hra', 'da', 'medical_allowance', 'special_allowance', 'bonus',
      'pf', 'professional_tax', 'other_deductions',
      'bank_name', 'account_no', 'ifsc_code', 'remarks'
    ];
    
    let setClauses = [];
    let params = [];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        
        if (field === 'is_active') {
          params.push(req.body[field] ? 1 : 0);
        } else if (field === 'user_id' && !req.body[field]) {
          params.push(null);
        } else {
          params.push(req.body[field]);
        }
      }
    });

    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(req.params.id);
    
    await req.db.query(`
      UPDATE employees 
      SET ${setClauses.join(', ')} 
      WHERE id = ?
    `, params);

    const [rows] = await req.db.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    await logAuditAction(req, {
      action: 'UPDATE_EMPLOYEE',
      resource_type: 'employee',
      resource_id: req.params.id,
      new_values: rows[0]
    });

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ success: false, message: 'Failed to update employee' });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private
exports.deleteEmployee = async (req, res) => {
  try {
    const [result] = await req.db.query('UPDATE employees SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    await logAuditAction(req, {
      action: 'DELETE_EMPLOYEE',
      resource_type: 'employee',
      resource_id: req.params.id
    });

    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ success: false, message: 'Failed to delete employee' });
  }
};

// @desc    Get employee timeline (audit logs)
// @route   GET /api/employees/:id/timeline
// @access  Auth
exports.getEmployeeTimeline = async (req, res) => {
  try {
    const [rows] = await req.db.query(`
        SELECT * FROM audit_logs 
        WHERE resource_id = ?
        ORDER BY created_at DESC
      `, [req.params.id]);

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
