const { sql } = require('../config/database');

// @desc    Get Salary Dashboard Metrics
// @route   GET /api/salary/dashboard
// @access  Private (Principal)
exports.getSalaryDashboard = async (req, res) => {
  try {
    const { month, year } = req.query; // Optional filters

    const empResult = await req.db.request()
      .query('SELECT id, basic_salary FROM employees WHERE is_active = 1');
    
    const employees = empResult.recordset;
    let totalMonthlyCommitment = employees.reduce((sum, emp) => sum + (Number(emp.basic_salary) || 0), 0);
    
    let paidSalary = 0;
    let pendingSalary = 0;

    if (month && year) {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`; // e.g. '2025-07'
      
      const salResult = await req.db.request()
        .input('month', sql.NVarChar, monthStr)
        .query('SELECT net_salary, status FROM salary_records WHERE month = @month');
      
      const salaries = salResult.recordset;
      paidSalary = salaries.filter(s => s.status === 'paid').reduce((sum, s) => sum + (Number(s.net_salary) || 0), 0);
      pendingSalary = salaries.filter(s => s.status === 'pending').reduce((sum, s) => sum + (Number(s.net_salary) || 0), 0);
    }

    res.json({
      success: true,
      data: {
        totalEmployees: employees.length,
        totalMonthlySalary: totalMonthlyCommitment,
        paidSalary,
        pendingSalary,
        averageSalary: employees.length > 0 ? (totalMonthlyCommitment / employees.length).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching salary dashboard:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch metrics' });
  }
};

// @desc    Generate Monthly Salary
// @route   POST /api/salary/generate
// @access  Private (Principal)
exports.generateMonthlySalary = async (req, res) => {
  try {
    const { month, year, employee_ids, employee_details } = req.body;

    if (!month || !year || !employee_ids || !employee_ids.length) {
      return res.status(400).json({ success: false, message: 'Month, year and employee list required' });
    }

    const monthStr = `${year}-${String(month).padStart(2, '0')}`;

    // Fetch employees
    const empIdsList = employee_ids.map((_, i) => `@eid${i}`).join(',');
    const empReq = req.db.request();
    employee_ids.forEach((id, i) => empReq.input(`eid${i}`, sql.UniqueIdentifier, id));
    
    const empResult = await empReq.query(`SELECT * FROM employees WHERE id IN (${empIdsList})`);
    const employees = empResult.recordset;

    // Check existing
    const existReq = req.db.request();
    existReq.input('month', sql.NVarChar, monthStr);
    employee_ids.forEach((id, i) => existReq.input(`eid${i}`, sql.UniqueIdentifier, id));
    
    const existResult = await existReq.query(`SELECT employee_id FROM salary_records WHERE month = @month AND employee_id IN (${empIdsList})`);
    const existingIds = existResult.recordset.map(e => e.employee_id);
    
    const toGenerate = employees.filter(emp => !existingIds.includes(emp.id));

    if (toGenerate.length === 0) {
      return res.status(400).json({ success: false, message: 'Salaries already generated for selected employees for this month' });
    }

    const insertReq = req.db.request();
    insertReq.input('month', sql.NVarChar, monthStr);
    
    let valuesArr = [];
    toGenerate.forEach((emp, i) => {
      const basic = Number(emp.basic_salary) || 0;
      const details = employee_details && employee_details[emp.id] ? employee_details[emp.id] : {};
      
      const allowances = [];
      const deductions = [];
      
      let totalAllowances = 0;
      let totalDeductions = 0;
      
      if (details.hra) { allowances.push({ name: 'HRA', amount: Number(details.hra) }); totalAllowances += Number(details.hra); }
      if (details.da) { allowances.push({ name: 'DA', amount: Number(details.da) }); totalAllowances += Number(details.da); }
      
      if (details.pf) { deductions.push({ name: 'PF', amount: Number(details.pf) }); totalDeductions += Number(details.pf); }
      if (details.pt) { deductions.push({ name: 'Professional Tax', amount: Number(details.pt) }); totalDeductions += Number(details.pt); }
      if (details.leaves) {
        const leaveDeduction = (basic / 30) * Number(details.leaves);
        deductions.push({ name: `Leaves (${details.leaves})`, amount: leaveDeduction });
        totalDeductions += leaveDeduction;
      }

      let net_salary = basic + totalAllowances - totalDeductions;
      
      if (details.salaryAmount !== undefined && details.salaryAmount !== '') {
        net_salary = Number(details.salaryAmount);
      }

      insertReq.input(`empId${i}`, sql.UniqueIdentifier, emp.id);
      insertReq.input(`basic${i}`, sql.Decimal(12,2), basic);
      insertReq.input(`allow${i}`, sql.NVarChar, JSON.stringify(allowances));
      insertReq.input(`deduct${i}`, sql.NVarChar, JSON.stringify(deductions));
      insertReq.input(`net${i}`, sql.Decimal(12,2), net_salary);
      
      valuesArr.push(`(@empId${i}, @month, @basic${i}, @allow${i}, @deduct${i}, @net${i}, 'pending')`);
    });

    await insertReq.query(`
      INSERT INTO salary_records (employee_id, month, basic_salary, allowances, deductions, net_salary, status)
      VALUES ${valuesArr.join(', ')}
    `);

    res.status(201).json({
      success: true,
      message: `Generated ${toGenerate.length} salary records`,
      count: toGenerate.length
    });
  } catch (error) {
    console.error('Error generating salary:', error);
    res.status(500).json({ success: false, message: 'Failed to generate salary' });
  }
};

// @desc    Get Salary History / Reports
// @route   GET /api/salary/history
// @access  Private (Principal)
exports.getSalaryHistory = async (req, res) => {
  try {
    const { month, year, status, employee_id, department } = req.query;

    let query = `
      SELECT sr.*, e.name as employee_name, e.employee_id as emp_code, e.department, e.designation
      FROM salary_records sr
      JOIN employees e ON sr.employee_id = e.id
      WHERE 1=1
    `;
    const request = req.db.request();

    if (month && year) {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      query += ' AND sr.month = @month';
      request.input('month', sql.NVarChar, monthStr);
    } else if (month) { // If it's already in YYYY-MM format from frontend
      query += ' AND sr.month = @monthStr';
      request.input('monthStr', sql.NVarChar, month);
    }

    if (status) {
      query += ' AND sr.status = @status';
      request.input('status', sql.NVarChar, status);
    }
    if (employee_id) {
      query += ' AND sr.employee_id = @employeeId';
      request.input('employeeId', sql.UniqueIdentifier, employee_id);
    }
    if (department) {
      query += ' AND e.department = @department';
      request.input('department', sql.NVarChar, department);
    }

    query += ' ORDER BY sr.created_at DESC';

    const result = await request.query(query);

    const formattedData = result.recordset.map(r => {
      const data = { ...r };
      try { data.allowances = JSON.parse(data.allowances); } catch(e) { data.allowances = []; }
      try { data.deductions = JSON.parse(data.deductions); } catch(e) { data.deductions = []; }
      
      data.employees = {
        name: r.employee_name,
        emp_id: r.emp_code,
        department: r.department,
        designation: r.designation
      };
      
      delete data.employee_name;
      delete data.emp_code;
      delete data.department;
      delete data.designation;
      
      return data;
    });

    res.json({
      success: true,
      count: formattedData.length,
      data: formattedData
    });
  } catch (error) {
    console.error('Error fetching salary history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch salary history' });
  }
};

// @desc    Update Salary Status (Pay)
// @route   PUT /api/salary/:id/status
// @access  Private (Principal)
exports.updateSalaryStatus = async (req, res) => {
  try {
    const { status, payment_mode, payment_date } = req.body;

    const result = await req.db.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('status', sql.NVarChar, status.toLowerCase())
      .input('paymentMode', sql.NVarChar, payment_mode || 'bank_transfer')
      .input('paymentDate', sql.Date, payment_date || new Date().toISOString().split('T')[0])
      .query(`
        UPDATE salary_records 
        SET status = @status, payment_mode = @paymentMode, paid_date = @paymentDate, updated_at = SYSDATETIMEOFFSET()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Salary record not found' });
    }

    res.json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error updating salary:', error);
    res.status(500).json({ success: false, message: 'Failed to update salary status' });
  }
};
