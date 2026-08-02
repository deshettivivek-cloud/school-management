import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import { 
  Search, Plus, UserCheck, Briefcase, FileText, Download, Printer, Filter
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const departments = useMemo(() => {
    const depts = new Set(employees.map(e => e.department).filter(Boolean));
    return ['All', ...Array.from(depts)].sort();
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = search === '' || 
        emp.name?.toLowerCase().includes(search.toLowerCase()) ||
        emp.emp_id?.toLowerCase().includes(search.toLowerCase()) ||
        emp.designation?.toLowerCase().includes(search.toLowerCase());
      
      const matchesDept = selectedDept === 'All' || emp.department === selectedDept;

      return matchesSearch && matchesDept;
    });
  }, [employees, search, selectedDept]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (filteredEmployees.length === 0) {
      toast.error('No employees to export');
      return;
    }
    const columns = [
      { header: 'Emp ID', key: 'emp_id' },
      { header: 'Name', key: 'name' },
      { header: 'Department', key: 'department' },
      { header: 'Designation', key: 'designation' },
      { header: 'Contact', key: 'mobile' },
      { header: 'Status', key: 'status' }
    ];
    await exportToPDF(filteredEmployees, columns, { name: 'School MS' }, 'Employee Directory');
  };

  const handleExportExcel = async () => {
    if (filteredEmployees.length === 0) {
      toast.error('No employees to export');
      return;
    }
    const columns = [
      { header: 'Emp ID', key: 'emp_id' },
      { header: 'Name', key: 'name' },
      { header: 'Department', key: 'department' },
      { header: 'Designation', key: 'designation' },
      { header: 'Contact', key: 'mobile' },
      { header: 'Status', key: 'status' }
    ];
    await exportToExcel(filteredEmployees, columns, 'Employee Directory');
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="page-header-info">
          <h1>Employee Management</h1>
          <p>Manage teachers, clerks, drivers, and all school staff</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={handlePrint}>
            <Printer size={16} /> Print
          </button>
          <button className="btn btn-outline" onClick={handleExportPDF}>
            <Download size={16} /> Export PDF
          </button>
          <button className="btn btn-outline" onClick={handleExportExcel}>
            <FileText size={16} /> Export Excel
          </button>
          {(user?.role === 'principal' || user?.role === 'super_admin') && (
            <>
              <button 
                className="btn btn-primary" 
                onClick={() => navigate('/employees/import')}
                style={{ background: 'var(--primary-100)', color: 'var(--primary-700)' }}
              >
                Import Employees (.xlsx)
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/employees/add')}>
                <Plus size={16} /> Add Employee
              </button>
            </>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--primary-50)', color: 'var(--primary-600)', padding: '1rem', borderRadius: '12px' }}>
            <Briefcase size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Total Employees</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{employees.length}</h3>
          </div>
        </div>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--success-50)', color: 'var(--success-600)', padding: '1rem', borderRadius: '12px' }}>
            <UserCheck size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Active Staff</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {employees.filter(e => e.status === 'Active').length}
            </h3>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-bar" style={{ margin: 0, minWidth: '300px' }}>
              <Search className="search-bar-icon" size={18} />
              <input
                type="text"
                placeholder="Search by Name, ID, or Designation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} color="var(--text-secondary)" />
              <select 
                className="form-input" 
                style={{ width: 'auto', padding: '0.5rem 1rem' }}
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                {departments.map(d => (
                  <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="table-container" style={{ margin: 0, border: '1px solid var(--border)', boxShadow: 'none' }}>
          {loading ? (
            <div className="spinner-container" style={{ padding: '3rem' }}><div className="spinner" /></div>
          ) : filteredEmployees.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <div className="empty-state-icon">👥</div>
              <h3 className="empty-state-title">No Employees Found</h3>
              <p className="empty-state-text">
                {search || selectedDept !== 'All' ? 'No employees match your filters' : 'Start by adding an employee to your organization.'}
              </p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Employee Info</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Contact</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/employees/${emp.id}`)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {emp.photo_url ? (
                          <img src={emp.photo_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-100)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                            {emp.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{emp.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Joined: {emp.joining_date ? new Date(emp.joining_date).toLocaleDateString() : '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--primary-600)' }}>{emp.emp_id || '-'}</td>
                    <td>{emp.department || '-'}</td>
                    <td>{emp.designation || '-'}</td>
                    <td>
                      <div style={{ fontSize: '0.875rem' }}>{emp.mobile || '-'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{emp.email || '-'}</div>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: emp.status === 'Active' ? 'var(--success-50)' : 'var(--danger-50)',
                        color: emp.status === 'Active' ? 'var(--success-700)' : 'var(--danger-700)'
                      }}>
                        {emp.status || 'Unknown'}
                      </span>
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

export default EmployeeDashboard;
