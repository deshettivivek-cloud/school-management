import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { motion } from 'framer-motion';
import {
  Users, CreditCard, AlertCircle, CheckCircle, TrendingUp, UserPlus,
  BookOpen, Calendar, Clock, DollarSign, ArrowRight, Zap, Sparkles, User, Bell,
  FileText
} from 'lucide-react';
import PrintSection from '../components/PrintSection';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import '../styles/dashboard.css';

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(2, 8, 23, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
      }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || '#fff', fontSize: '0.9rem', fontWeight: 600 }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [studentStats, setStudentStats] = useState(null);
  const [feeStats, setFeeStats] = useState(null);
  const [dailyStats, setDailyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [studentRes, feeRes, dailyRes] = await Promise.all([
        api.get('/students/stats'),
        api.get('/fees/stats'),
        api.get('/schools/daily-stats')
      ]);
      setStudentStats(studentRes.data.data);
      setFeeStats(feeRes.data.data);
      setDailyStats(dailyRes.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          style={{ width: 40, height: 40, border: '3px solid rgba(99, 102, 241, 0.3)', borderTopColor: '#6366f1', borderRadius: '50%' }}
        />
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

  const attendanceData = [];
  const recentActivities = [];

  return (
    <PrintSection title="Dashboard">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* 1. Hero Section */}
        <div className="dashboard-hero">
          <div className="dashboard-hero-bg" />
          <div className="dashboard-hero-content">
            <motion.h1 
              className="hero-title"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              Welcome Back, Principal 👋
            </motion.h1>
            <motion.p 
              className="hero-subtitle"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Here's what's happening at your school today.
            </motion.p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('overview')}
            style={{ 
              background: 'transparent', border: 'none', 
              color: activeTab === 'overview' ? '#fff' : 'rgba(255,255,255,0.5)', 
              fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
              borderBottom: activeTab === 'overview' ? '2px solid var(--primary-500)' : 'none',
              paddingBottom: '0.5rem'
            }}>
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('daily')}
            style={{ 
              background: 'transparent', border: 'none', 
              color: activeTab === 'daily' ? '#fff' : 'rgba(255,255,255,0.5)', 
              fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
              borderBottom: activeTab === 'daily' ? '2px solid var(--primary-500)' : 'none',
              paddingBottom: '0.5rem'
            }}>
            Daily Report
          </button>
        </div>

        {activeTab === 'overview' ? (
          <>
            {/* 2. KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-glow" style={{ '--glow-color': 'rgba(99, 102, 241, 0.2)' }} />
            <div className="kpi-content">
              <div className="kpi-header">
                <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  <Users size={20} />
                </div>
              </div>
              <div className="kpi-value-container">
                <span className="kpi-value">{studentStats?.total || 0}</span>
                <span className="kpi-label">Total Active Students</span>
              </div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-glow" style={{ '--glow-color': 'rgba(34, 197, 94, 0.2)' }} />
            <div className="kpi-content">
              <div className="kpi-header">
                <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
                  <DollarSign size={20} />
                </div>
              </div>
              <div className="kpi-value-container">
                <span className="kpi-value">{formatCurrency(feeStats?.totalCollected)}</span>
                <span className="kpi-label">Fee Collection This Month</span>
              </div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-glow" style={{ '--glow-color': 'rgba(239, 68, 68, 0.2)' }} />
            <div className="kpi-content">
              <div className="kpi-header">
                <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}>
                  <AlertCircle size={20} />
                </div>
              </div>
              <div className="kpi-value-container">
                <span className="kpi-value">{feeStats?.pendingCount || 0}</span>
                <span className="kpi-label">Students with Pending Fees</span>
              </div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-glow" style={{ '--glow-color': 'rgba(168, 85, 247, 0.2)' }} />
            <div className="kpi-content">
              <div className="kpi-header">
                <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #a855f7, #d946ef)' }}>
                  <UserPlus size={20} />
                </div>
              </div>
              <div className="kpi-value-container">
                <span className="kpi-value">{studentStats?.newAdmissions || 0}</span>
                <span className="kpi-label">New Admissions (YTD)</span>
              </div>
            </div>
          </div>

          {/* New P&L Widget */}
          <div className="kpi-card" style={{ border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            <div className="kpi-glow" style={{ '--glow-color': (dailyStats?.profitLoss || 0) >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)' }} />
            <div className="kpi-content">
              <div className="kpi-header">
                <div className="kpi-icon" style={{ background: (dailyStats?.profitLoss || 0) >= 0 ? 'linear-gradient(135deg, #22c55e, #10b981)' : 'linear-gradient(135deg, #ef4444, #f97316)' }}>
                  <TrendingUp size={20} />
                </div>
                <div className={`kpi-trend ${(dailyStats?.profitLoss || 0) >= 0 ? 'positive' : 'negative'}`}>
                  Today
                </div>
              </div>
              <div className="kpi-value-container">
                <span className="kpi-value" style={{ color: (dailyStats?.profitLoss || 0) >= 0 ? '#22c55e' : '#ef4444' }}>
                  {(dailyStats?.profitLoss || 0) >= 0 ? '+' : ''}{formatCurrency(dailyStats?.profitLoss)}
                </span>
                <span className="kpi-label">Today's Net Profit / Loss</span>
              </div>
            </div>
          </div>
        </div>


        {/* 3. Analytics Area */}
        <div className="dashboard-grid-2">
          {/* Main Chart */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Student Distribution</h3>
                <p className="card-subtitle">Number of students enrolled per grade</p>
              </div>
            </div>
            {gradeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gradeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="students" fill="url(#barGradient)" radius={[4, 4, 0, 0]} barSize={30} />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="premium-empty">
                <Users className="premium-empty-icon" />
                <h4 className="premium-empty-title">No Students Yet</h4>
                <p className="premium-empty-text">Add your first student to see the distribution chart.</p>
                <button className="btn btn-primary btn-sm">Add Student</button>
              </div>
            )}
          </div>

          {/* Fee Target / Progress */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">Fee Status Overview</h3>
                <p className="card-subtitle">Current collection distribution</p>
              </div>
            </div>
            {pieData.length > 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                  {pieData.map((d) => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, boxShadow: `0 0 10px ${d.color}` }} />
                      {d.name}: <strong>{d.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="premium-empty" style={{ flex: 1 }}>
                <CreditCard className="premium-empty-icon" />
                <h4 className="premium-empty-title">No Fee Data</h4>
                <p className="premium-empty-text">Start collecting fees to generate analytics.</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Area */}
        <div className="dashboard-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
          {/* 7. Quick Actions */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>Quick Actions</h3>
            <div className="quick-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <div className="action-card" onClick={() => navigate('/admissions/new')} style={{ cursor: 'pointer' }}>
                <div className="action-icon-wrapper"><UserPlus size={22} /></div>
                <span className="action-label">Add Student</span>
              </div>
              <div className="action-card" onClick={() => navigate('/fees/collection')} style={{ cursor: 'pointer' }}>
                <div className="action-icon-wrapper"><CreditCard size={22} /></div>
                <span className="action-label">Collect Fee</span>
              </div>
              <div className="action-card" onClick={() => navigate('/tc/issue')} style={{ cursor: 'pointer' }}>
                <div className="action-icon-wrapper"><FileText size={22} /></div>
                <span className="action-label">Issue TC</span>
              </div>
              <div className="action-card" onClick={() => navigate('/students/directory')} style={{ cursor: 'pointer' }}>
                <div className="action-icon-wrapper"><Users size={22} /></div>
                <span className="action-label">Directory</span>
              </div>
            </div>
          </div>
        </div>
        </>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="dashboard-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}
          >
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Today's Summary</h3>
                  <p className="card-subtitle">Financial performance for {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
              
              <div className="kpi-grid" style={{ marginTop: '1.5rem' }}>
                <div className="kpi-card">
                  <div className="kpi-glow" style={{ '--glow-color': 'rgba(34, 197, 94, 0.2)' }} />
                  <div className="kpi-content">
                    <div className="kpi-header">
                      <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
                        <DollarSign size={20} />
                      </div>
                    </div>
                    <div className="kpi-value-container">
                      <span className="kpi-value" style={{ color: '#22c55e' }}>{formatCurrency(dailyStats?.totalCollection)}</span>
                      <span className="kpi-label">Total Fee Collection</span>
                    </div>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-glow" style={{ '--glow-color': 'rgba(239, 68, 68, 0.2)' }} />
                  <div className="kpi-content">
                    <div className="kpi-header">
                      <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}>
                        <AlertCircle size={20} />
                      </div>
                    </div>
                    <div className="kpi-value-container">
                      <span className="kpi-value" style={{ color: '#ef4444' }}>{formatCurrency(dailyStats?.totalExpenditure)}</span>
                      <span className="kpi-label">Total Expenditures</span>
                    </div>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-glow" style={{ '--glow-color': 'rgba(99, 102, 241, 0.2)' }} />
                  <div className="kpi-content">
                    <div className="kpi-header">
                      <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        <TrendingUp size={20} />
                      </div>
                    </div>
                    <div className="kpi-value-container">
                      <span className="kpi-value" style={{ color: (dailyStats?.profitLoss || 0) >= 0 ? '#22c55e' : '#ef4444' }}>
                        {(dailyStats?.profitLoss || 0) >= 0 ? '+' : ''}{formatCurrency(dailyStats?.profitLoss)}
                      </span>
                      <span className="kpi-label">Net Profit / Loss</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </motion.div>
    </PrintSection>
  );
};

export default Dashboard;
