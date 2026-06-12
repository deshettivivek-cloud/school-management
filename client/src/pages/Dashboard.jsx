import { useState, useEffect } from 'react';
import api from '../api/axios';
import { motion } from 'framer-motion';
import {
  Users, CreditCard, AlertCircle, CheckCircle, TrendingUp, UserPlus,
  BookOpen, Calendar, Clock, DollarSign, ArrowRight, Zap, Sparkles, User, Bell
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

  // Mock Data for new widgets
  const attendanceData = [
    { name: 'Mon', rate: 94 }, { name: 'Tue', rate: 96 }, { name: 'Wed', rate: 95 },
    { name: 'Thu', rate: 98 }, { name: 'Fri', rate: 93 }
  ];

  const recentActivities = [
    { id: 1, title: 'New admission: Rahul Sharma', time: '10 mins ago', icon: <UserPlus size={14} />, color: '#6366f1' },
    { id: 2, title: 'Fee collected: ₹15,000 (Class 10)', time: '1 hour ago', icon: <CreditCard size={14} />, color: '#22c55e' },
    { id: 3, title: 'Term 1 Exam Schedule published', time: '3 hours ago', icon: <Calendar size={14} />, color: '#8b5cf6' },
    { id: 4, title: 'Teacher absent: Mrs. Smith', time: '5 hours ago', icon: <AlertCircle size={14} />, color: '#ef4444' }
  ];

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
          
          <motion.div 
            className="hero-stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="hero-stat">
              <span className="hero-stat-label">Performance Score</span>
              <span className="hero-stat-value" style={{ color: '#4ade80' }}>A+</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-label">Today's Attendance</span>
              <span className="hero-stat-value">95.2%</span>
            </div>
          </motion.div>
        </div>

        {/* 2. KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-glow" style={{ '--glow-color': 'rgba(99, 102, 241, 0.2)' }} />
            <div className="kpi-content">
              <div className="kpi-header">
                <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  <Users size={20} />
                </div>
                <div className="kpi-trend positive"><TrendingUp size={14} /> +12%</div>
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
                <div className="kpi-trend positive"><TrendingUp size={14} /> +5.4%</div>
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
                <div className="kpi-trend negative"><TrendingUp size={14} style={{ transform: 'rotate(180deg)' }} /> +2%</div>
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
                <div className="kpi-trend positive"><TrendingUp size={14} /> +24</div>
              </div>
              <div className="kpi-value-container">
                <span className="kpi-value">128</span>
                <span className="kpi-label">New Admissions (YTD)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. AI Insights Section */}
        <div className="ai-insights">
          <Sparkles className="ai-sparkle" size={24} />
          <h3 className="ai-title"><Zap size={18} /> AI School Insights</h3>
          <div className="ai-grid">
            <div className="ai-card">
              <div className="ai-card-icon" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }}>
                <TrendingUp size={18} />
              </div>
              <div className="ai-card-text">
                <strong>Grade 10 performance</strong> improved by 8% in the latest mock exams.
              </div>
            </div>
            <div className="ai-card">
              <div className="ai-card-icon" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
                <CreditCard size={18} />
              </div>
              <div className="ai-card-text">
                <strong>Fee collection rate</strong> is 12% above the monthly target.
              </div>
            </div>
            <div className="ai-card">
              <div className="ai-card-icon" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
                <AlertCircle size={18} />
              </div>
              <div className="ai-card-text">
                <strong>15 students</strong> have attendance below 75% this month and need attention.
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
        <div className="dashboard-grid-2">
          {/* 7. Quick Actions */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>Quick Actions</h3>
            <div className="quick-actions-grid">
              <div className="action-card">
                <div className="action-icon-wrapper"><UserPlus size={22} /></div>
                <span className="action-label">Add Student</span>
              </div>
              <div className="action-card">
                <div className="action-icon-wrapper"><CreditCard size={22} /></div>
                <span className="action-label">Collect Fee</span>
              </div>
              <div className="action-card">
                <div className="action-icon-wrapper"><BookOpen size={22} /></div>
                <span className="action-label">Create Exam</span>
              </div>
              <div className="action-card">
                <div className="action-icon-wrapper"><Bell size={22} /></div>
                <span className="action-label">Send Alert</span>
              </div>
            </div>
          </div>

          {/* 5. Recent Activities */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>Recent Activities</h3>
            <div className="timeline">
              {recentActivities.map((activity, i) => (
                <motion.div 
                  key={activity.id} 
                  className="timeline-item"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + (i * 0.1) }}
                >
                  <div className="timeline-icon" style={{ background: `${activity.color}20`, color: activity.color }}>
                    {activity.icon}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-title">{activity.title}</div>
                    <div className="timeline-time">{activity.time}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Widgets Row */}
        <div className="dashboard-grid-2">
          {/* 8. Student Performance Widget */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>Top Performing Students</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { name: 'Aarav Patel', grade: 'Class 10', score: '98%', avatar: 'A' },
                { name: 'Priya Sharma', grade: 'Class 9', score: '96%', avatar: 'P' },
                { name: 'Rohan Gupta', grade: 'Class 12', score: '95%', avatar: 'R' }
              ].map((student, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{student.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{student.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.grade}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#4ade80' }}>{student.score}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Upcoming Events Widget */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>Upcoming Events</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { title: 'Term 1 Examinations', date: 'Oct 15 - Oct 25', days: 'In 3 days', color: '#ef4444' },
                { title: 'Parent-Teacher Meeting', date: 'Nov 2, 2026', days: 'In 21 days', color: '#8b5cf6' },
                { title: 'Diwali Holidays', date: 'Nov 10 - Nov 14', days: 'Next month', color: '#eab308' }
              ].map((event, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '0.75rem', borderLeft: `3px solid ${event.color}`, background: 'rgba(255,255,255,0.02)', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{event.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{event.date}</div>
                  </div>
                  <div style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: `${event.color}20`, color: event.color, borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                    {event.days}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </motion.div>
    </PrintSection>
  );
};

export default Dashboard;
