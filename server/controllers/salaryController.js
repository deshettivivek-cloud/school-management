// @desc    Get Salary Dashboard Metrics
// @route   GET /api/salary/dashboard
// @access  Private (Principal)
exports.getSalaryDashboard = async (req, res) => {
  try {
    const { month, year } = req.query; // Optional filters

    const [employees] = await req.db.execute('SELECT id, basic_salary FROM employees WHERE is_active = 1');
    
    let totalMonthlyCommitment = employees.reduce((sum, emp) => sum + (Number(emp.basic_salary) || 0), 0);
    
    let paidSalary = 0;
    let pendingSalary = 0;

    if (month && year) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthIndex = typeof month === 'string' ? monthNames.indexOf(month) + 1 : month;
      const monthNumStr = monthIndex > 0 ? String(monthIndex).padStart(2, '0') : '01';
      const monthStr = `${year}-${monthNumStr}`;
      
      const [salaries] = await req.db.execute('SELECT net_salary, status FROM salary_records WHERE month = ?', [monthStr]);
      
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

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = typeof month === 'string' ? monthNames.indexOf(month) + 1 : month;
    const monthNumStr = monthIndex > 0 ? String(monthIndex).padStart(2, '0') : '01';
    const monthStr = `${year}-${monthNumStr}`;
    const empIdsList = employee_ids.map(() => '?').join(',');

    const [employees] = await req.db.query(`SELECT * FROM employees WHERE id IN (${empIdsList})`, employee_ids);
    
    const [existResult] = await req.db.query(`SELECT employee_id FROM salary_records WHERE month = ? AND employee_id IN (${empIdsList})`, [monthStr, ...employee_ids]);
    const existingIds = existResult.map(e => e.employee_id);
    
    const toGenerate = employees.filter(emp => !existingIds.includes(emp.id));

    if (toGenerate.length === 0) {
      return res.status(400).json({ success: false, message: 'Salaries already generated for selected employees for this month' });
    }

    let valuesArr = [];
    let params = [];

    toGenerate.forEach((emp) => {
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
      if (details.advance) {
        deductions.push({ name: 'Salary Taken in Advance', amount: Number(details.advance) });
        totalDeductions += Number(details.advance);
      }

      let net_salary = basic + totalAllowances - totalDeductions;
      
      if (details.salaryAmount !== undefined && details.salaryAmount !== '') {
        net_salary = Number(details.salaryAmount);
      }

      let leaves_taken = details.leaves ? Number(details.leaves) : 0;
      let paid_amount = net_salary; // Default paid_amount to net_salary

      valuesArr.push(`(?, ?, ?, ?, ?, ?, 'pending', ?, ?)`);
      params.push(emp.id, monthStr, basic, JSON.stringify(allowances), JSON.stringify(deductions), net_salary, leaves_taken, paid_amount);
    });

    await req.db.query(`
      INSERT INTO salary_records (employee_id, month, basic_salary, allowances, deductions, net_salary, status, leaves_taken, paid_amount)
      VALUES ${valuesArr.join(', ')}
    `, params);

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
    let params = [];

    if (month && year) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthIndex = typeof month === 'string' ? monthNames.indexOf(month) + 1 : month;
      const monthNumStr = monthIndex > 0 ? String(monthIndex).padStart(2, '0') : '01';
      const monthStr = `${year}-${monthNumStr}`;
      query += ' AND sr.month = ?';
      params.push(monthStr);
    } else if (month) { 
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthIndex = typeof month === 'string' ? monthNames.indexOf(month) + 1 : month;
      const monthNumStr = monthIndex > 0 ? String(monthIndex).padStart(2, '0') : '01';
      // If no year provided, use LIKE to match the month part
      query += ' AND sr.month LIKE ?';
      params.push(`%-${monthNumStr}`);
    }

    if (status) {
      query += ' AND sr.status = ?';
      params.push(status);
    }
    if (employee_id) {
      query += ' AND sr.employee_id = ?';
      params.push(employee_id);
    }
    if (department) {
      query += ' AND e.department = ?';
      params.push(department);
    }

    query += ' ORDER BY sr.created_at DESC';

    const [rows] = await req.db.query(query, params);

    const formattedData = rows.map(r => {
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

    const formattedDate = payment_date ? payment_date.split('T')[0] : new Date().toISOString().split('T')[0];

    await req.db.execute(`
        UPDATE salary_records 
        SET status = ?, payment_mode = ?, paid_date = ?
        WHERE id = ?
      `, [status.toLowerCase(), payment_mode || 'bank_transfer', formattedDate, req.params.id]);

    const [rows] = await req.db.execute('SELECT * FROM salary_records WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Salary record not found' });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error updating salary:', error);
    res.status(500).json({ success: false, message: 'Failed to update salary status' });
  }
};
