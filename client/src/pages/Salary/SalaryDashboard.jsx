import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { 
  IndianRupee, Users, TrendingUp, TrendingDown, Clock, CheckCircle,
  FileText, PlusCircle, CreditCard, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SalaryDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    totalMonthlySalary: 0,
    paidSalary: 0,
    pendingSalary: 0,
    pendingSalary: 0,
    averageSalary: 0
  });
  const [recentSalaries, setRecentSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // For MVP, default to current month
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear().toString();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get(`/salary/dashboard?month=${currentMonth}&year=${currentYear}`);
        setMetrics(res.data.data);
        
        // Also fetch recent salaries for this month to populate the table
        const historyRes = await api.get(`/salary/history?month=${currentMonth}&year=${currentYear}`);
        setRecentSalaries(historyRes.data.data || []);
      } catch (error) {
        toast.error('Failed to load salary dashboard metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [currentMonth, currentYear]);

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-info">
          <h1>Salary Dashboard</h1>
          <p>Payroll overview for {currentMonth} {currentYear}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Total Monthly Commitment */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--primary-50)', color: 'var(--primary-600)', padding: '1rem', borderRadius: '12px' }}>
            <IndianRupee size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Total Commitment</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>₹{metrics.totalMonthlySalary.toLocaleString()}</h3>
          </div>
        </div>

        {/* Paid Salary */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--success-50)', color: 'var(--success-600)', padding: '1rem', borderRadius: '12px' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Paid Salary</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>₹{metrics.paidSalary.toLocaleString()}</h3>
          </div>
        </div>

        {/* Pending Salary */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--warning-50)', color: 'var(--warning-600)', padding: '1rem', borderRadius: '12px' }}>
            <Clock size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Pending Salary</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>₹{metrics.pendingSalary.toLocaleString()}</h3>
          </div>
        </div>

        {/* Avg Salary */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--accent-50)', color: 'var(--accent-600)', padding: '1rem', borderRadius: '12px' }}>
            <Users size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Avg. Basic Salary</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>₹{Number(metrics.averageSalary).toLocaleString()}</h3>
          </div>
        </div>

      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        
        {/* Quick Actions */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button 
              className="btn btn-outline" 
              style={{ justifyContent: 'flex-start', padding: '0.8rem 1rem', width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
              onClick={() => navigate('/salary/monthly')}
            >
              <PlusCircle size={18} className="text-primary" />
              <span style={{ flex: 1, textAlign: 'left' }}>Generate Monthly Salary</span>
              <ArrowRight size={16} className="text-muted" />
            </button>
            <button 
              className="btn btn-outline" 
              style={{ justifyContent: 'flex-start', padding: '0.8rem 1rem', width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
              onClick={() => navigate('/salary/structure')}
            >
              <FileText size={18} className="text-primary" />
              <span style={{ flex: 1, textAlign: 'left' }}>Manage Salary Structures</span>
              <ArrowRight size={16} className="text-muted" />
            </button>
            <button 
              className="btn btn-outline" 
              style={{ justifyContent: 'flex-start', padding: '0.8rem 1rem', width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
              onClick={() => navigate('/salary/reports')}
            >
              <TrendingUp size={18} className="text-primary" />
              <span style={{ flex: 1, textAlign: 'left' }}>View Salary Reports</span>
              <ArrowRight size={16} className="text-muted" />
            </button>
          </div>
        </div>

        {/* Recent Salary Processing Table */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Recent Processing ({currentMonth})</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/salary/history')}>View All</button>
          </div>
          
          {recentSalaries.length > 0 ? (
            <div className="table-responsive">
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Designation</th>
                    <th>Net Salary</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSalaries.slice(0, 5).map((salary) => (
                    <tr key={salary.id}>
                      <td style={{ fontWeight: 500 }}>{salary.employees?.name}</td>
                      <td>{salary.employees?.designation || '-'}</td>
                      <td style={{ fontWeight: 600 }}>₹{Number(salary.net_salary).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${salary.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                          {salary.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentSalaries.length > 5 && (
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <p className="text-muted" style={{ fontSize: '0.875rem' }}>And {recentSalaries.length - 5} more records...</p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
              <CreditCard size={32} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <p style={{ color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>No salaries generated yet for {currentMonth}</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }} onClick={() => navigate('/salary/monthly')}>Generate Now</button>
            </div>
          )}
        </div>
        
      </div>

    </div>
  );
};

export default SalaryDashboard;
