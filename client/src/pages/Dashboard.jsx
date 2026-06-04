import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  HiOutlineUsers,
  HiOutlineCurrencyRupee,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const Dashboard = () => {
  const [studentStats, setStudentStats] = useState(null);
  const [feeStats, setFeeStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [studentRes, feeRes] = await Promise.all([
        api.get('/students/stats'),
        api.get('/fees/stats'),
      ]);
      setStudentStats(studentRes.data.data);
      setFeeStats(feeRes.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner" />
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const gradeData = studentStats?.gradeWise?.map((g) => ({
    name: `Class ${g._id}`,
    students: g.count,
  })) || [];

  const pieData = [
    { name: 'Paid', value: feeStats?.paidCount || 0, color: '#22c55e' },
    { name: 'Partial', value: feeStats?.partialCount || 0, color: '#eab308' },
    { name: 'Pending', value: feeStats?.pendingCount || 0, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-info">
          <h1>Dashboard</h1>
          <p>Welcome to your School Management System</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card primary">
          <div className="stat-icon primary">
            <HiOutlineUsers />
          </div>
          <div className="stat-info">
            <div className="stat-label">Total Students</div>
            <div className="stat-value">{studentStats?.total || 0}</div>
            <div className="stat-change positive">
              {studentStats?.confirmed || 0} confirmed
            </div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon success">
            <HiOutlineCurrencyRupee />
          </div>
          <div className="stat-info">
            <div className="stat-label">Total Collected</div>
            <div className="stat-value">{formatCurrency(feeStats?.totalCollected)}</div>
            <div className="stat-change positive">
              {feeStats?.collectionRate || 0}% collection rate
            </div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon warning">
            <HiOutlineExclamationCircle />
          </div>
          <div className="stat-info">
            <div className="stat-label">Pending Fees</div>
            <div className="stat-value">{formatCurrency(feeStats?.totalPending)}</div>
            <div className="stat-change negative">
              {(feeStats?.partialCount || 0) + (feeStats?.pendingCount || 0)} students
            </div>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon info">
            <HiOutlineCheckCircle />
          </div>
          <div className="stat-info">
            <div className="stat-label">Fully Paid</div>
            <div className="stat-value">{feeStats?.paidCount || 0}</div>
            <div className="stat-change positive">students cleared</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
        {/* Bar Chart - Students per Grade */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Students per Grade</h3>
              <p className="card-subtitle">Distribution of active students across classes</p>
            </div>
          </div>
          {gradeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gradeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid rgba(148,163,184,0.15)',
                    borderRadius: '10px',
                    color: '#f1f5f9',
                  }}
                />
                <Bar dataKey="students" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <p className="empty-state-text">No student data yet. Add students to see the chart.</p>
            </div>
          )}
        </div>

        {/* Pie Chart - Fee Status */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Fee Status</h3>
              <p className="card-subtitle">Payment status overview</p>
            </div>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid rgba(148,163,184,0.15)',
                    borderRadius: '10px',
                    color: '#f1f5f9',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📈</div>
              <p className="empty-state-text">No fee data yet</p>
            </div>
          )}

          {/* Legend */}
          {pieData.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              {pieData.map((d) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
                  {d.name} ({d.value})
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
