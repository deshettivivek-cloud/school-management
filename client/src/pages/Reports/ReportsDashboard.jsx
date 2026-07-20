import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  HiOutlineUserGroup, 
  HiOutlineCash, 
  HiOutlineCalendar, 
  HiOutlineDocumentText, 
  HiOutlineAcademicCap, 
  HiOutlineBadgeCheck, 
  HiOutlineDocumentDuplicate,
  HiOutlineChartBar
} from 'react-icons/hi';
import StatCard from '../../components/Common/StatCard';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ReportsDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    studentCount: 0,
    teacherCount: 0,
    totalFeesCommitted: 0,
    totalFeesPaid: 0,
    pendingFees: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/reports/dashboard');
      if (res.data.success) {
        setMetrics(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load report metrics');
    } finally {
      setLoading(false);
    }
  };

  const allReports = [
    { id: 'admissions_daily', title: 'Daily Admissions', icon: HiOutlineUserGroup, color: '#3b82f6', desc: 'Daily admission trends', roles: ['super_admin', 'principal', 'clerk'] },
    { id: 'fee_defaulters', title: 'Fee Defaulters', icon: HiOutlineCash, color: '#ef4444', desc: 'Pending fee dues', roles: ['super_admin', 'principal', 'clerk'] },
    { id: 'fee_collections_daily', title: 'Daily Fee Collections', icon: HiOutlineCash, color: '#10b981', desc: 'Daily fee collection', roles: ['super_admin', 'principal', 'clerk'] },
    { id: 'attendance_low', title: 'Low Attendance', icon: HiOutlineCalendar, color: '#f59e0b', desc: 'Students with low attendance', roles: ['super_admin', 'principal', 'teacher'] },
    { id: 'expenditure_category', title: 'Category-wise Expenditure', icon: HiOutlineCash, color: '#8b5cf6', desc: 'Expenses by category', roles: ['super_admin', 'principal', 'clerk'] },
    { id: 'staff_attendance', title: 'Staff Attendance', icon: HiOutlineAcademicCap, color: '#ec4899', desc: 'Staff attendance records', roles: ['super_admin', 'principal'] },
    { id: 'exam_toppers', title: 'Exam Toppers', icon: HiOutlineDocumentText, color: '#06b6d4', desc: 'Top performing students', roles: ['super_admin', 'principal', 'teacher'] },
  ];

  const allowedReports = allReports.filter(r => r.roles.includes(user?.role));

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="page-header">
        <div className="page-header-info">
          <h1>Centralized Reports</h1>
          <p>Generate, view, and export enterprise reports</p>
        </div>
      </div>

      {/* High Level Metrics */}
      <div className="stat-grid" style={{ marginBottom: '2rem' }}>
        <StatCard className="" title="Total Students" value={loading ? '...' : metrics.studentCount} icon={HiOutlineUserGroup} color="blue" hideDelta={true} />
        <StatCard className="" title="Total Teachers" value={loading ? '...' : metrics.teacherCount} icon={HiOutlineAcademicCap} color="green" hideDelta={true} />
        <StatCard className="" title="Total Fee Collection" value={loading ? '...' : metrics.totalFeesPaid} formatValue={loading ? undefined : formatCurrency} icon={HiOutlineCash} color="amber" hideDelta={true} />
        <StatCard className="" title="Pending Fees" value={loading ? '...' : metrics.pendingFees} formatValue={loading ? undefined : formatCurrency} icon={HiOutlineChartBar} color="red" hideDelta={true} />
      </div>

      {/* Report Modules Grid */}
      <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1.25rem' }}>Available Reports</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {allowedReports.map((report, idx) => {
          const Icon = report.icon;
          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate(user?.role === 'super_admin' ? `/super-admin/reports/${report.id}` : `/reports/${report.id}`)}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                transition: 'all 0.2s',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = report.color;
                e.currentTarget.style.boxShadow = `0 10px 15px -3px ${report.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: `${report.color}15`, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: report.color
                }}>
                  <Icon size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{report.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{report.desc}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ReportsDashboard;
