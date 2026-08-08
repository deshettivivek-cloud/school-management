import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  Users, CreditCard, AlertCircle, CheckCircle, TrendingUp, UserPlus,
  BookOpen, Calendar, Clock, DollarSign, ArrowRight, Zap, Sparkles, User, Bell,
  FileText, Activity, Wallet, GraduationCap, ChevronRight, BarChart3, PieChart as PieChartIcon, Gift, Megaphone, CheckSquare,
  IndianRupee, ClipboardList, Briefcase
} from 'lucide-react';
import PrintSection from '../components/PrintSection';
import DashboardWidget from '../components/Dashboard/DashboardWidget';
import CalendarWidget from '../components/Dashboard/CalendarWidget';
import StatCard from '../components/Common/StatCard';
import '../styles/dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { schoolData } = useOutletContext() || {};
  const { user } = useAuth();
  const [studentStats, setStudentStats] = useState(null);
  const [feeStats, setFeeStats] = useState(null);
  const [dailyStats, setDailyStats] = useState(null);
  const [widgetData, setWidgetData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [studentRes, feeRes, dailyRes, widgetRes] = await Promise.all([
        api.get('/students/stats'),
        api.get('/fees/stats'),
        api.get('/schools/daily-stats'),
        api.get('/dashboard/widgets')
      ]);
      setStudentStats(studentRes.data.data);
      setFeeStats(feeRes.data.data);
      setDailyStats(dailyRes.data.data);
      setWidgetData(widgetRes.data.data);
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
          style={{ width: 40, height: 40, border: '3px solid var(--primary-100)', borderTopColor: 'var(--primary-600)', borderRadius: '50%' }}
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

  const quickActions = [
    { title: 'Admissions', icon: UserPlus, path: '/admissions', color: 'var(--primary-500)', desc: 'Manage student admissions' },
    { title: 'Fee Collection', icon: IndianRupee, path: '/fees/collection', color: 'var(--success-500)', desc: 'Process student fees' },
    { title: 'Attendance', icon: ClipboardList, path: '/attendance', color: 'var(--warning-500)', desc: 'Mark student attendance' },
    { title: 'Student Directory', icon: Users, path: '/students/directory', color: 'var(--info-500)', desc: 'View all students' },
    { title: 'Employees', icon: Briefcase, path: '/employees', color: 'var(--accent-500)', desc: 'Manage staff and teachers' },
    { title: 'Reports', icon: BarChart3, path: '/reports', color: 'var(--danger-500)', desc: 'View school analytics' },
  ];

  // Derive extra stats for widgets
  const profitLoss = dailyStats?.profitLoss || 0;
  const isProfit = profitLoss >= 0;

  const widgetsConfig = [
    {
      id: 'recentAdmissions',
      title: 'Recent Admissions',
      icon: UserPlus,
      allowedRoles: ['super_admin', 'principal', 'clerk'],
      emptyState: { icon: <UserPlus size={24} />, message: 'No recent admissions found.' },
      renderPrimary: (item) => item.name,
      renderSecondary: (item) => `Grade: ${item.grade}`,
      renderRight: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--success-600)' }}>
            {new Date(item.created_at).toLocaleDateString('en-US')}
          </span>
          <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
        </div>
      )
    },
    {
      id: 'recentPayments',
      title: 'Recent Payments',
      icon: DollarSign,
      allowedRoles: ['super_admin', 'principal', 'clerk'],
      emptyState: { icon: <DollarSign size={24} />, message: 'No recent payments found.' },
      renderPrimary: (item) => item.students?.name || 'Unknown',
      renderSecondary: (item) => `Paid: ₹${item.total_paid}`,
      renderRight: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--success-600)' }}>
            {new Date(item.updated_at).toLocaleDateString('en-US')}
          </span>
          <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
        </div>
      )
    },
    {
      id: 'pendingApprovals',
      title: 'Pending Approvals',
      icon: CheckSquare,
      allowedRoles: ['super_admin', 'principal'],
      emptyState: { icon: <CheckSquare size={24} />, message: 'No pending approvals.' },
      renderPrimary: (item) => item.name,
      renderSecondary: (item) => `Grade: ${item.grade}`,
      renderRight: (item) => (
        <div className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Pending</div>
      )
    },
    {
      id: 'upcomingExams',
      title: 'Upcoming Exams',
      icon: Calendar,
      allowedRoles: ['super_admin', 'principal', 'teacher'],
      emptyState: { icon: <Calendar size={24} />, message: 'No upcoming exams this month.' },
      renderPrimary: (item) => item.name,
      renderSecondary: (item) => item.term || 'Upcoming Exam',
      renderRight: (item) => (
        <div className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
          {new Date(item.start_date).toLocaleDateString()}
        </div>
      )
    },
    {
      id: 'latestAnnouncements',
      title: 'Announcements',
      icon: Megaphone,
      allowedRoles: ['super_admin', 'principal', 'teacher', 'clerk'],
      emptyState: { icon: <Megaphone size={24} />, message: 'No active announcements.' },
      renderPrimary: (item) => item.title,
      renderSecondary: (item) => new Date(item.created_at).toLocaleDateString(),
      renderRight: () => <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
    }
  ];

  return (
    <PrintSection title="Dashboard">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* 1. Hero / Welcome Widget (col-12) */}
        <div className="dashboard-hero">
          <div className="dashboard-hero-bg" />
          <div className="dashboard-hero-content">
            <h1 className="hero-title">{schoolData?.name || 'School Management System'}</h1>
            <p className="hero-subtitle">Welcome Back, {user?.name || 'Principal'} 👋 Here's your school's performance summary for today.</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <div className="badge" style={{ background: '#FFFFFF', color: '#111827', padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <Calendar size={14} color="#6D5AE0" /> Academic Year 2026-27
              </div>
              <div className="badge" style={{ background: '#FFFFFF', color: '#111827', padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }}></div> Term 1
              </div>
            </div>
          </div>
          <div className="hero-stats" style={{ background: '#FFFFFF', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '140px', zIndex: 10 }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#6D5AE0', letterSpacing: '0.05em' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}</span>
            <span style={{ fontSize: '3.5rem', fontWeight: 800, color: '#111827', lineHeight: 1, margin: '0.5rem 0' }}>{new Date().getDate()}</span>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#4B5563' }}>{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        <div className="kpi-grid">
          {/* Row 1: Key Metrics */}
          {/* 1. Total Students */}
          <StatCard title="Total Students" value={studentStats?.total || 0} icon={Users} color="purple" periodLabel="Active Enrolled" />

          {/* 2. New Admissions */}
          <StatCard title="New Admissions" value={studentStats?.newAdmissions || 0} icon={UserPlus} color="blue" periodLabel="This Academic Year" />

          {/* 3. Fully Paid */}
          <StatCard title="Fully Paid" value={feeStats?.paidCount || 0} icon={CheckCircle} color="green" periodLabel="Cleared Dues" />

          {/* 4. Total Collection */}
          <StatCard title="Total Collection" value={feeStats?.totalCollected || 0} formatValue={formatCurrency} icon={Wallet} color="orange" periodLabel="YTD Revenue" />

          {/* 5. Fee Defaulters */}
          <StatCard title="Fee Defaulters" value={feeStats?.pendingCount || 0} formatValue={formatCurrency} icon={AlertCircle} color="red" periodLabel="Students Pending" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <DashboardWidget config={widgetsConfig.find(w => w.id === 'recentAdmissions')} widgetData={widgetData?.recentAdmissions} />
          <DashboardWidget config={widgetsConfig.find(w => w.id === 'recentPayments')} widgetData={widgetData?.recentPayments} />
          <DashboardWidget config={widgetsConfig.find(w => w.id === 'pendingApprovals')} widgetData={widgetData?.pendingApprovals} />
        </div>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {quickActions.map((action, idx) => (
              <div 
                key={idx}
                onClick={() => navigate(action.path)}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.borderColor = action.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: `${action.color}15`, color: action.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <action.icon size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{action.title}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>{action.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </PrintSection>
  );
};

export default Dashboard;
