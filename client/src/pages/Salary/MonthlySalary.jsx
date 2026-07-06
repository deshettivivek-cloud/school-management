import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Play, CheckCircle, Clock } from 'lucide-react';

const MonthlySalary = () => {
  const [employees, setEmployees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employeeDetails, setEmployeeDetails] = useState({});

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = ['2023', '2024', '2025', '2026', '2027'];

  useEffect(() => {
    const d = new Date();
    setSelectedMonth(months[d.getMonth()]);
    setSelectedYear(d.getFullYear().toString());
    fetchData(months[d.getMonth()], d.getFullYear().toString());
    // eslint-disable-next-line
  }, []);

  const fetchData = async (month, year) => {
    setLoading(true);
    try {
      // Fetch all active employees
      const empRes = await api.get('/employees?status=Active');
      const allEmps = empRes.data.data || [];
      setEmployees(allEmps);

      // Fetch existing salaries for this month/year
      const salRes = await api.get(`/salary/history?month=${month}&year=${year}`);
      setSalaries(salRes.data.data || []);
      
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = () => {
    fetchData(selectedMonth, selectedYear);
  };

  // Employees who don't have a generated salary yet for the selected month/year
  const eligibleEmployees = useMemo(() => {
    const existingEmpIds = salaries.map(s => s.employee_id);
    return employees.filter(emp => !existingEmpIds.includes(emp.id));
  }, [employees, salaries]);

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedEmployees(eligibleEmployees.map(emp => emp.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  const toggleSelectEmployee = (id) => {
    if (selectedEmployees.includes(id)) {
      setSelectedEmployees(selectedEmployees.filter(empId => empId !== id));
    } else {
      setSelectedEmployees([...selectedEmployees, id]);
    }
  };

  const handleDetailChange = (empId, field, value) => {
    setEmployeeDetails(prev => ({
      ...prev,
      [empId]: {
        ...(prev[empId] || {}),
        [field]: value
      }
    }));
  };

  const handleGenerate = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Select at least one employee');
      return;
    }

    setGenerating(true);
    try {
      await api.post('/salary/generate', {
        month: selectedMonth,
        year: selectedYear,
        employee_ids: selectedEmployees,
        employee_details: employeeDetails
      });
      toast.success('Salaries generated successfully');
      setSelectedEmployees([]);
      fetchData(selectedMonth, selectedYear);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate salaries');
    } finally {
      setGenerating(false);
    }
  };

  const handlePay = async (salaryId) => {
    try {
      await api.put(`/salary/${salaryId}/status`, {
        status: 'Paid',
        payment_mode: 'Bank Transfer',
        payment_date: new Date().toISOString()
      });
      toast.success('Salary marked as Paid');
      fetchData(selectedMonth, selectedYear);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-info">
          <h1>Monthly Salary Generation</h1>
          <p>Generate and manage salary payouts for staff</p>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '200px', margin: 0 }}>
            <label className="form-label">Month</label>
            <select className="form-input" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: '200px', margin: 0 }}>
            <label className="form-label">Year</label>
            <select className="form-input" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button className="btn btn-outline" onClick={handleFilterChange} disabled={loading}>
            Filter
          </button>
        </div>
      </div>

      {/* Eligible for Generation */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>Pending Generation ({eligibleEmployees.length})</h3>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={generating || selectedEmployees.length === 0}>
            {generating ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Play size={16} />}
            Generate Selected
          </button>
        </div>

        <div className="table-container" style={{ border: '1px solid var(--border)', boxShadow: 'none' }}>
          {loading ? (
            <div className="spinner-container" style={{ padding: '2rem' }}><div className="spinner" /></div>
          ) : eligibleEmployees.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p className="empty-state-text">All active employees have their salaries generated for {selectedMonth} {selectedYear}.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      onChange={toggleSelectAll} 
                      checked={selectedEmployees.length === eligibleEmployees.length && eligibleEmployees.length > 0} 
                    />
                  </th>
                  <th>Employee Name</th>
                  <th>ID</th>
                  <th>Designation</th>
                  <th>Basic Salary</th>
                  <th>Leaves Taken</th>
                  <th>Amount Paid (₹)</th>
                </tr>
              </thead>
              <tbody>
                {eligibleEmployees.map(emp => (
                  <tr key={emp.id}>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedEmployees.includes(emp.id)} 
                        onChange={() => toggleSelectEmployee(emp.id)} 
                      />
                    </td>
                    <td style={{ fontWeight: 500 }}>{emp.name}</td>
                    <td>{emp.emp_id || '-'}</td>
                    <td>{emp.designation || '-'}</td>
                    <td>₹{emp.basic_salary || 0}</td>
                    <td>
                      <input 
                        type="number" 
                        className="form-input" 
                        style={{ width: '80px', padding: '0.25rem 0.5rem', minHeight: '32px' }}
                        value={employeeDetails[emp.id]?.leaves || ''}
                        onChange={(e) => handleDetailChange(emp.id, 'leaves', e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        className="form-input" 
                        style={{ width: '120px', padding: '0.25rem 0.5rem', minHeight: '32px' }}
                        value={employeeDetails[emp.id]?.salaryAmount || ''}
                        onChange={(e) => handleDetailChange(emp.id, 'salaryAmount', e.target.value)}
                        placeholder="Auto"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Already Generated (History for Month) */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: '0 0 1rem' }}>Generated Salaries ({salaries.length})</h3>
        
        <div className="table-container" style={{ border: '1px solid var(--border)', boxShadow: 'none' }}>
          {loading ? (
            <div className="spinner-container" style={{ padding: '2rem' }}><div className="spinner" /></div>
          ) : salaries.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p className="empty-state-text">No salaries generated for {selectedMonth} {selectedYear} yet.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Gross Salary</th>
                  <th>Deductions</th>
                  <th>Leaves</th>
                  <th>Paid Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map(sal => (
                  <tr key={sal.id}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{sal.employees?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{sal.employees?.emp_id}</div>
                    </td>
                    <td>₹{sal.gross_salary}</td>
                    <td style={{ color: 'var(--danger-500)' }}>₹{sal.total_deductions}</td>
                    <td style={{ color: 'var(--warning-600)' }}>{sal.leaves_taken || 0}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success-600)' }}>₹{sal.paid_amount || sal.net_salary}</td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                        backgroundColor: sal.status === 'Paid' ? 'var(--success-50)' : 'var(--warning-50)',
                        color: sal.status === 'Paid' ? 'var(--success-700)' : 'var(--warning-700)'
                      }}>
                        {sal.status === 'Paid' ? <CheckCircle size={12} /> : <Clock size={12} />}
                        {sal.status}
                      </span>
                    </td>
                    <td>
                      {sal.status === 'Pending' && (
                        <button className="btn btn-outline btn-sm" onClick={() => handlePay(sal.id)}>
                          Mark Paid
                        </button>
                      )}
                      {sal.status === 'Paid' && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Paid on {new Date(sal.payment_date).toLocaleDateString()}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlySalary;
