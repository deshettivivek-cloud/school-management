import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  Users, CreditCard, AlertCircle, CheckCircle, TrendingUp, UserPlus,
  BookOpen, Calendar, Clock, DollarSign, ArrowRight, Zap, Sparkles, User, Bell,
  FileText, Activity, Wallet, GraduationCap, ChevronRight, BarChart3, PieChart as PieChartIcon, Gift, Megaphone, CheckSquare
} from 'lucide-react';
import PrintSection from '../components/PrintSection';
import DashboardWidget from '../components/Dashboard/DashboardWidget';
import CalendarWidget from '../components/Dashboard/CalendarWidget';
import StatCard from '../components/Common/StatCard';
import '../styles/dashboard.css';

const DashboardCharts = lazy(() => import('../components/Dashboard/DashboardCharts'));

const Dashboard = () => {
  const navigate = useNavigate();
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

  const gradeData = studentStats?.gradeWise?.map((g) => ({
    name: `Class ${g._id}`,
    students: g.count,
  })) || [];

  const pieData = [
    { name: 'Paid', value: feeStats?.paidCount || 0, color: 'var(--success-500)' },
    { name: 'Partial', value: feeStats?.partialCount || 0, color: 'var(--warning-500)' },
    { name: 'Pending', value: feeStats?.pendingCount || 0, color: 'var(--danger-500)' },
  ].filter((d) => d.value > 0);

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
        <div className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
          {new Date(item.created_at).toLocaleDateString()}
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
        <div className="badge badge-success" style={{ fontSize: '0.7rem' }}>
          {new Date(item.updated_at).toLocaleDateString()}
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
            <h1 className="hero-title">Welcome Back, Principal 👋</h1>
            <p className="hero-subtitle">Here's your school's performance summary for today.</p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-label">Date</span>
              <span className="hero-stat-value">{new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* UPPER DASHBOARD: Snapshot Widgets */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={20} className="text-warning-500" /> Today's Snapshot
          </h2>
          <div className="dashboard-grid">
            <DashboardWidget config={widgetsConfig.find(w => w.id === 'recentAdmissions')} widgetData={widgetData?.recentAdmissions} />
            <DashboardWidget config={widgetsConfig.find(w => w.id === 'recentPayments')} widgetData={widgetData?.recentPayments} />
            <DashboardWidget config={widgetsConfig.find(w => w.id === 'pendingApprovals')} widgetData={widgetData?.pendingApprovals} />
            <DashboardWidget config={widgetsConfig.find(w => w.id === 'upcomingExams')} widgetData={widgetData?.upcomingExams} />
            <DashboardWidget config={widgetsConfig.find(w => w.id === 'latestAnnouncements')} widgetData={widgetData?.latestAnnouncements} />
          </div>
        </div>



        <div className="dashboard-grid">
          {/* Row 1: Key Metrics */}
          {/* 2. Total Students */}
          <StatCard title="Total Students" value={studentStats?.total || 0} icon={Users} color="blue" periodLabel="Active Enrolled" />

          {/* 3. New Admissions */}
          <StatCard title="New Admissions" value={studentStats?.newAdmissions || 0} icon={UserPlus} color="purple" periodLabel="This Academic Year" />

          {/* 4. Fee Defaulters */}
          <StatCard title="Fee Defaulters" value={feeStats?.pendingCount || 0} icon={AlertCircle} color="red" periodLabel="Students Pending" />

          {/* 5. Paid Students */}
          <StatCard title="Fully Paid" value={feeStats?.paidCount || 0} icon={CheckCircle} color="green" periodLabel="Cleared Dues" />

          {/* Row 2: Financial Overview */}
          {/* 6. Total Collection (Month) */}
          <StatCard title="Total Collection (YTD)" value={feeStats?.totalCollected || 0} formatValue={formatCurrency} icon={Wallet} color="blue" periodLabel="Gross Revenue" className="col-span-4" />

          {/* 7. Today's Revenue */}
          <StatCard title="Today's Collection" value={dailyStats?.totalCollection || 0} formatValue={formatCurrency} icon={DollarSign} color="green" periodLabel="Received Today" className="col-span-4" />

          {/* 8. Today's Expenditure */}
          <StatCard title="Today's Expenditure" value={dailyStats?.totalExpenditure || 0} formatValue={formatCurrency} icon={CreditCard} color="amber" periodLabel="Spent Today" className="col-span-4" />

          {/* Row 3: Analytics & Charts */}
          <Suspense fallback={
            <>
              <div className="widget-card col-span-8" style={{ minHeight: '360px' }}>
                <div className="spinner-container" style={{ height: '100%' }}><div className="spinner" /></div>
              </div>
              <div className="widget-card col-span-4" style={{ minHeight: '360px' }}>
                <div className="spinner-container" style={{ height: '100%' }}><div className="spinner" /></div>
              </div>
            </>
          }>
            <DashboardCharts gradeData={gradeData} pieData={pieData} />
          </Suspense>

          {/* Row 4: Actions & More Stats */}
          {/* 11. Net Profit / Loss */}
          <StatCard title="Net Profit / Loss" value={profitLoss} formatValue={(val) => `${val >= 0 ? '+' : ''}${formatCurrency(val)}`} icon={Activity} color={isProfit ? 'green' : 'red'} periodLabel="Today's Performance" />

          {/* 12. Quick Action: Admission */}
          <div className="widget-card col-span-3 stat-card" style={{ cursor: 'pointer', background: 'var(--bg-tertiary)' }} onClick={() => navigate('/admissions/new')}>
            <div className="stat-card-header">
              <span className="stat-card-label" style={{ color: 'var(--primary-600)' }}>Quick Action</span>
              <div className="stat-card-icon blue"><UserPlus size={20} /></div>
            </div>
            <div className="stat-card-value" style={{ fontSize: '1.25rem', marginTop: '0.5rem' }}>New Admission</div>
            <div className="stat-card-trend neutral" style={{ marginTop: 'auto' }}>
              <span>Enroll a student</span> <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
            </div>
          </div>

          {/* 13. Quick Action: Collect Fee */}
          <div className="widget-card col-span-3 stat-card" style={{ cursor: 'pointer', background: 'var(--bg-tertiary)' }} onClick={() => navigate('/fees/collection')}>
            <div className="stat-card-header">
              <span className="stat-card-label" style={{ color: 'var(--success-700)' }}>Quick Action</span>
              <div className="stat-card-icon green"><DollarSign size={20} /></div>
            </div>
            <div className="stat-card-value" style={{ fontSize: '1.25rem', marginTop: '0.5rem' }}>Collect Fee</div>
            <div className="stat-card-trend neutral" style={{ marginTop: 'auto' }}>
              <span>Process payment</span> <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
            </div>
          </div>

          {/* 14. Quick Action: View Reports */}
          <div className="widget-card col-span-3 stat-card" style={{ cursor: 'pointer', background: 'var(--bg-tertiary)' }} onClick={() => navigate('/reports')}>
            <div className="stat-card-header">
              <span className="stat-card-label" style={{ color: 'var(--warning-700)' }}>Quick Action</span>
              <div className="stat-card-icon amber"><FileText size={20} /></div>
            </div>
            <div className="stat-card-value" style={{ fontSize: '1.25rem', marginTop: '0.5rem' }}>View Reports</div>
            <div className="stat-card-trend neutral" style={{ marginTop: 'auto' }}>
              <span>Analytics & Data</span> <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
            </div>
          </div>

        </div>
      </motion.div>
    </PrintSection>
  );
};

export default Dashboard;
