const supabase = require('../config/supabase');

// @desc    Get all employees for a school
// @route   GET /api/employees
// @access  Private (Principal, Admin)
exports.getEmployees = async (req, res) => {
  try {
    const { search, department, designation, status } = req.query;

    let query = supabase
      .from('employees')
      .select(`
        *,
        user:profiles(email, role)
      `)
      .eq('school_id', req.user.schoolId)
      .order('created_at', { ascending: false });

    if (department) query = query.eq('department', department);
    if (designation) query = query.eq('designation', designation);
    if (status) query = query.eq('status', status);

    const { data: employees, error } = await query;

    if (error) throw error;

    // Optional: Filter by search client-side or we can use ilike in Supabase, but since Supabase REST ilike is for specific columns, we can do it in JS for simple names
    let filtered = employees;
    if (search) {
      const q = search.toLowerCase();
      filtered = employees.filter(emp => 
        (emp.name && emp.name.toLowerCase().includes(q)) ||
        (emp.emp_id && emp.emp_id.toLowerCase().includes(q)) ||
        (emp.department && emp.department.toLowerCase().includes(q))
      );
    }

    res.json({
      success: true,
      count: filtered.length,
      data: filtered
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
    const employeeData = { ...req.body, school_id: req.user.schoolId };
    
    const { data: employee, error } = await supabase
      .from('employees')
      .insert([employeeData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ success: false, message: 'Failed to create employee' });
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
exports.getEmployee = async (req, res) => {
  try {
    const { data: employee, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', req.params.id)
      .eq('school_id', req.user.schoolId)
      .single();

    if (error) throw error;

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({
      success: true,
      data: employee
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
    const { data: employee, error } = await supabase
      .from('employees')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('school_id', req.user.schoolId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: employee
    });
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
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', req.params.id)
      .eq('school_id', req.user.schoolId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ success: false, message: 'Failed to delete employee' });
  }
};
