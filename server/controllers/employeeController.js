const { sql } = require('../config/database');

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
      WHERE 1=1
    `;
    const request = req.db.request();

    if (department) {
      query += ' AND e.department = @department';
      request.input('department', sql.NVarChar, department);
    }
    if (designation) {
      query += ' AND e.designation = @designation';
      request.input('designation', sql.NVarChar, designation);
    }
    if (status) {
      const isActive = status === 'active' ? 1 : 0;
      query += ' AND e.is_active = @isActive';
      request.input('isActive', sql.Bit, isActive);
    }
    if (search) {
      query += ' AND (e.name LIKE @search OR e.employee_id LIKE @search OR e.department LIKE @search)';
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    query += ' ORDER BY e.created_at DESC';

    const result = await request.query(query);

    // Format nested user object to match previous Supabase structure
    const formattedData = result.recordset.map(row => {
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
      employee_id, name, designation, department, phone, email,
      class_teacher_of, joining_date, basic_salary, user_id, is_active
    } = req.body;

    const result = await req.db.request()
      .input('employeeId', sql.NVarChar, employee_id)
      .input('name', sql.NVarChar, name)
      .input('designation', sql.NVarChar, designation || '')
      .input('department', sql.NVarChar, department || '')
      .input('phone', sql.NVarChar, phone || '')
      .input('email', sql.NVarChar, email || '')
      .input('classTeacherOf', sql.NVarChar, class_teacher_of || '')
      .input('joiningDate', sql.Date, joining_date || new Date().toISOString().split('T')[0])
      .input('basicSalary', sql.Decimal(12,2), basic_salary || 0)
      .input('userId', sql.UniqueIdentifier, user_id || null)
      .input('isActive', sql.Bit, is_active !== undefined ? (is_active ? 1 : 0) : 1)
      .query(`
        INSERT INTO employees (
          employee_id, name, designation, department, phone, email, 
          class_teacher_of, joining_date, basic_salary, user_id, is_active
        )
        OUTPUT INSERTED.*
        VALUES (
          @employeeId, @name, @designation, @department, @phone, @email,
          @classTeacherOf, @joiningDate, @basicSalary, @userId, @isActive
        )
      `);

    res.status(201).json({
      success: true,
      data: result.recordset[0]
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
    const result = await req.db.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query('SELECT * FROM employees WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({
      success: true,
      data: result.recordset[0]
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
    const fields = [
      'employee_id', 'name', 'designation', 'department', 'phone', 'email',
      'class_teacher_of', 'joining_date', 'basic_salary', 'user_id', 'is_active'
    ];
    
    let setClauses = [];
    const request = req.db.request();

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        setClauses.push(`${field} = @${field}`);
        
        if (field === 'joining_date') {
          request.input(field, sql.Date, req.body[field]);
        } else if (field === 'basic_salary') {
          request.input(field, sql.Decimal(12,2), req.body[field]);
        } else if (field === 'is_active') {
          request.input(field, sql.Bit, req.body[field] ? 1 : 0);
        } else if (field === 'user_id') {
          request.input(field, sql.UniqueIdentifier, req.body[field]);
        } else {
          request.input(field, sql.NVarChar, req.body[field]);
        }
      }
    });

    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    setClauses.push('updated_at = SYSDATETIMEOFFSET()');
    
    request.input('id', sql.UniqueIdentifier, req.params.id);
    
    const result = await request.query(`
      UPDATE employees 
      SET ${setClauses.join(', ')} 
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, data: result.recordset[0] });
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
    const result = await req.db.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query('DELETE FROM employees WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

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
    const result = await req.db.request()
      .input('resourceId', sql.NVarChar, req.params.id)
      .query(`
        SELECT * FROM audit_logs 
        WHERE resource_id = @resourceId
        ORDER BY created_at DESC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    if (error.message.includes('Invalid object name')) {
       return res.json({ success: true, data: [] });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};
