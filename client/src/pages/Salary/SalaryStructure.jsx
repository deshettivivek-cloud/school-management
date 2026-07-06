import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const SalaryStructure = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get('/employees');
        setEmployees(res.data.data || []);
      } catch (error) {
        toast.error('Failed to load salary structures');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-info">
          <h1>Salary Structure</h1>
          <p>Overview of current compensation packages</p>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="table-container" style={{ margin: 0, border: '1px solid var(--border)', boxShadow: 'none' }}>
          {loading ? (
            <div className="spinner-container" style={{ padding: '3rem' }}><div className="spinner" /></div>
          ) : employees.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <p className="empty-state-text">No employees found.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Designation</th>
                  <th>Basic Salary</th>
                  <th>Total Allowances</th>
                  <th>Total Deductions</th>
                  <th>Bank Account</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => {
                  const allowances = (Number(emp.hra)||0) + (Number(emp.da)||0) + (Number(emp.medical_allowance)||0) + (Number(emp.special_allowance)||0) + (Number(emp.bonus)||0);
                  const deductions = (Number(emp.pf)||0) + (Number(emp.professional_tax)||0) + (Number(emp.other_deductions)||0);
                  return (
                    <tr key={emp.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/employees/${emp.id}`)}>
                      <td style={{ fontWeight: 500, color: 'var(--primary-600)' }}>{emp.name}</td>
                      <td>{emp.designation}</td>
                      <td style={{ fontWeight: 600 }}>₹{emp.basic_salary || 0}</td>
                      <td style={{ color: 'var(--success-600)' }}>+ ₹{allowances}</td>
                      <td style={{ color: 'var(--danger-500)' }}>- ₹{deductions}</td>
                      <td>
                        <span style={{ fontSize: '0.875rem' }}>{emp.bank_name || 'N/A'}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{emp.account_no}</div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalaryStructure;
