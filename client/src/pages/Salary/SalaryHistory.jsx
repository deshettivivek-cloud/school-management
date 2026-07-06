import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FileArchive, Search, Filter, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SalaryHistory = () => {
  const navigate = useNavigate();
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      // get all history without month/year filter
      const res = await api.get('/salary/history');
      setSalaries(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load salary history');
    } finally {
      setLoading(false);
    }
  };

  const filtered = salaries.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.employees?.name?.toLowerCase().includes(q) || 
           s.month.toLowerCase().includes(q) || 
           s.year.includes(q);
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-info">
          <h1>Salary History</h1>
          <p>Complete historical record of all generated salaries</p>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="search-bar" style={{ margin: 0, minWidth: '300px' }}>
            <Search className="search-bar-icon" size={18} />
            <input type="text" placeholder="Search by Employee, Month, Year..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="table-container" style={{ margin: 0, border: '1px solid var(--border)', boxShadow: 'none' }}>
          {loading ? (
            <div className="spinner-container" style={{ padding: '3rem' }}><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <div className="empty-state-icon"><FileArchive /></div>
              <h3 className="empty-state-title">No History Found</h3>
              <p className="empty-state-text">There are no salary records in the system yet.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee</th>
                  <th>Designation</th>
                  <th>Gross Salary</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(sal => (
                  <tr key={sal.id}>
                    <td style={{ fontWeight: 500 }}>{sal.month} {sal.year}</td>
                    <td style={{ color: 'var(--primary-600)', fontWeight: 500 }}>{sal.employees?.name}</td>
                    <td>{sal.employees?.designation}</td>
                    <td>₹{sal.gross_salary}</td>
                    <td style={{ color: 'var(--danger-500)' }}>₹{sal.total_deductions}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success-600)' }}>₹{sal.net_salary}</td>
                    <td>
                      <span style={{
                        display: 'inline-flex', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                        backgroundColor: sal.status === 'Paid' ? 'var(--success-50)' : 'var(--warning-50)',
                        color: sal.status === 'Paid' ? 'var(--success-700)' : 'var(--warning-700)'
                      }}>
                        {sal.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => navigate(`/salary/slip/${sal.employee_id}/${sal.month}-${sal.year}`)}
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <FileText size={14} /> Slip
                      </button>
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

export default SalaryHistory;
