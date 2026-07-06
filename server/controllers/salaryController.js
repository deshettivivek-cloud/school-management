const supabase = require('../config/supabase');

// @desc    Get Salary Dashboard Metrics
// @route   GET /api/salary/dashboard
// @access  Private (Principal)
exports.getSalaryDashboard = async (req, res) => {
  try {
    const { month, year } = req.query; // Optional filters

    // Get basic stats
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, basic_salary, status')
      .eq('school_id', req.user.schoolId)
      .eq('status', 'Active');
    
    if (empError) throw empError;

    let totalMonthlyCommitment = employees.reduce((sum, emp) => sum + (Number(emp.basic_salary) || 0), 0);
    
    // Get paid/pending stats for a given month/year
    let paidSalary = 0;
    let pendingSalary = 0;

    if (month && year) {
      const { data: salaries, error: salError } = await supabase
        .from('employee_salaries')
        .select('net_salary, status')
        .eq('school_id', req.user.schoolId)
        .eq('month', month)
        .eq('year', year);
      
      if (!salError && salaries) {
        paidSalary = salaries.filter(s => s.status === 'Paid').reduce((sum, s) => sum + (Number(s.net_salary) || 0), 0);
        pendingSalary = salaries.filter(s => s.status === 'Pending').reduce((sum, s) => sum + (Number(s.net_salary) || 0), 0);
      }
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

    // Fetch employee current structures
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .in('id', employee_ids)
      .eq('school_id', req.user.schoolId);

    if (empError) throw empError;

    // Check if salaries already exist for this month/year for these employees
    const { data: existing, error: existError } = await supabase
      .from('employee_salaries')
      .select('employee_id')
      .eq('month', month)
      .eq('year', year)
      .eq('school_id', req.user.schoolId)
      .in('employee_id', employee_ids);

    if (existError) throw existError;
    
    const existingIds = existing.map(e => e.employee_id);
    const toGenerate = employees.filter(emp => !existingIds.includes(emp.id));

    if (toGenerate.length === 0) {
      return res.status(400).json({ success: false, message: 'Salaries already generated for selected employees for this month' });
    }

    const salaryRecords = toGenerate.map(emp => {
      // Calculate earnings
      const basic = Number(emp.basic_salary) || 0;
      const hra = Number(emp.hra) || 0;
      const da = Number(emp.da) || 0;
      const ma = Number(emp.medical_allowance) || 0;
      const sa = Number(emp.special_allowance) || 0;
      const bonus = Number(emp.bonus) || 0;
      const gross = basic + hra + da + ma + sa + bonus;

      // Calculate deductions
      const pf = Number(emp.pf) || 0;
      const pt = Number(emp.professional_tax) || 0;
      const od = Number(emp.other_deductions) || 0;
      let totalDed = pf + pt + od;

      const details = employee_details && employee_details[emp.id] ? employee_details[emp.id] : {};
      const leaves_taken = Number(details.leaves) || 0;
      
      let paid_amount;
      if (details.salaryAmount !== undefined && details.salaryAmount !== '') {
        paid_amount = Number(details.salaryAmount);
        // If paid amount is less than gross, the difference is the true total deduction
        if (gross > paid_amount) {
          totalDed = gross - paid_amount;
        }
      } else {
        paid_amount = gross - totalDed;
      }

      return {
        school_id: req.user.schoolId,
        employee_id: emp.id,
        month,
        year,
        basic_salary: basic,
        hra, da, medical_allowance: ma, special_allowance: sa, bonus,
        pf, professional_tax: pt, other_deductions: od,
        gross_salary: gross,
        total_deductions: totalDed,
        net_salary: paid_amount,
        leaves_taken,
        paid_amount,
        status: 'Pending'
      };
    });

    const { data: inserted, error: insertError } = await supabase
      .from('employee_salaries')
      .insert(salaryRecords)
      .select();

    if (insertError) throw insertError;

    res.status(201).json({
      success: true,
      message: `Generated ${inserted.length} salary records`,
      data: inserted
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

    let query = supabase
      .from('employee_salaries')
      .select(`
        *,
        employees!inner(name, emp_id, department, designation)
      `)
      .eq('school_id', req.user.schoolId)
      .order('created_at', { ascending: false });

    if (month) query = query.eq('month', month);
    if (year) query = query.eq('year', year);
    if (status) query = query.eq('status', status);
    if (employee_id) query = query.eq('employee_id', employee_id);
    if (department) query = query.eq('employees.department', department);

    const { data: salaries, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      count: salaries.length,
      data: salaries
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

    const { data: salary, error } = await supabase
      .from('employee_salaries')
      .update({ status, payment_mode, payment_date })
      .eq('id', req.params.id)
      .eq('school_id', req.user.schoolId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: salary
    });
  } catch (error) {
    console.error('Error updating salary:', error);
    res.status(500).json({ success: false, message: 'Failed to update salary status' });
  }
};
