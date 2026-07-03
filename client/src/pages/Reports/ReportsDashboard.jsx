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
  HiOutlineGlobe,
  HiOutlineChartBar
} from 'react-icons/hi';
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
    { id: 'students', title: 'Student Reports', icon: HiOutlineUserGroup, color: '#3b82f6', desc: 'Lists, contacts, admissions', roles: ['super_admin', 'principal', 'teacher', 'clerk'] },
    { id: 'fees', title: 'Fee Reports', icon: HiOutlineCash, color: '#10b981', desc: 'Collections, pending, dues', roles: ['super_admin', 'principal', 'clerk'] },
    { id: 'attendance', title: 'Attendance Reports', icon: HiOutlineCalendar, color: '#f59e0b', desc: 'Daily, monthly, low attendance', roles: ['super_admin', 'principal', 'teacher'] },
    { id: 'exams', title: 'Exam Reports', icon: HiOutlineDocumentText, color: '#8b5cf6', desc: 'Marks, ranks, performance', roles: ['super_admin', 'principal', 'teacher'] },
    { id: 'teachers', title: 'Teacher Reports', icon: HiOutlineAcademicCap, color: '#ec4899', desc: 'Directory, assignments', roles: ['super_admin', 'principal', 'teacher'] },
    { id: 'staff', title: 'Staff Reports', icon: HiOutlineBadgeCheck, color: '#06b6d4', desc: 'Staff directory, roles', roles: ['super_admin', 'principal', 'clerk'] },
    { id: 'admissions', title: 'Admission Reports', icon: HiOutlineUserGroup, color: '#14b8a6', desc: 'Daily, monthly trends', roles: ['super_admin', 'principal', 'clerk'] },
    { id: 'expenditure', title: 'Expenditure Reports', icon: HiOutlineCash, color: '#ef4444', desc: 'Expenses, categories', roles: ['super_admin', 'principal', 'clerk'] },
    { id: 'tc', title: 'TC Reports', icon: HiOutlineDocumentDuplicate, color: '#6366f1', desc: 'Issued, pending transfers', roles: ['super_admin', 'principal', 'clerk'] }
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <div className="stat-header">
            <h3 style={{ color: '#60a5fa' }}>Total Students</h3>
            <HiOutlineUserGroup size={24} color="#60a5fa" />
          </div>
          <p className="stat-value">{loading ? '...' : metrics.studentCount}</p>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div className="stat-header">
            <h3 style={{ color: '#34d399' }}>Total Teachers</h3>
            <HiOutlineAcademicCap size={24} color="#34d399" />
          </div>
          <p className="stat-value">{loading ? '...' : metrics.teacherCount}</p>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <div className="stat-header">
            <h3 style={{ color: '#fbbf24' }}>Total Fee Collection</h3>
            <HiOutlineCash size={24} color="#fbbf24" />
          </div>
          <p className="stat-value">{loading ? '...' : formatCurrency(metrics.totalFeesPaid)}</p>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div className="stat-header">
            <h3 style={{ color: '#f87171' }}>Pending Fees</h3>
            <HiOutlineChartBar size={24} color="#f87171" />
          </div>
          <p className="stat-value">{loading ? '...' : formatCurrency(metrics.pendingFees)}</p>
        </div>
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
