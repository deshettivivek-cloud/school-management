import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { motion } from 'framer-motion';
import {
  HiOutlineOfficeBuilding,
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineArrowRight,
  HiOutlineShieldCheck,
} from 'react-icons/hi';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/super-admin/stats');
      setStats(res.data.data);
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
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          style={{ width: 40, height: 40, border: '3px solid rgba(245, 158, 11, 0.3)', borderTopColor: '#f59e0b', borderRadius: '50%' }}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero */}
      <div style={{
        position: 'relative',
        padding: '2rem 2.5rem',
        borderRadius: 'var(--radius-xl)',
        marginBottom: '2rem',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(239, 68, 68, 0.05))',
        border: '1px solid rgba(245, 158, 11, 0.12)',
      }}>
        <div style={{
          position: 'absolute', top: -60, right: -60, width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15), transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <motion.div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
        >
          <HiOutlineShieldCheck size={28} style={{ color: '#f59e0b' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, background: 'linear-gradient(to right, #fff, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Super Admin Dashboard
          </h1>
        </motion.div>
        <motion.p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
        >
          Platform-wide overview across all schools and users
        </motion.p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <motion.div className="card" style={{ cursor: 'pointer', border: '1px solid rgba(245, 158, 11, 0.1)' }}
          onClick={() => navigate('/super-admin/schools')}
          whileHover={{ scale: 1.02, y: -2 }} transition={{ type: 'spring', stiffness: 400 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
            }}>
              <HiOutlineOfficeBuilding size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {stats?.totalSchools || 0}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Schools</div>
            </div>
          </div>
        </motion.div>

        <motion.div className="card" style={{ cursor: 'pointer', border: '1px solid rgba(99, 102, 241, 0.1)' }}
          onClick={() => navigate('/super-admin/users')}
          whileHover={{ scale: 1.02, y: -2 }} transition={{ type: 'spring', stiffness: 400 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
            }}>
              <HiOutlineUserGroup size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {stats?.totalUsers || 0}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Users</div>
            </div>
          </div>
        </motion.div>

        <motion.div className="card" style={{ border: '1px solid rgba(34, 197, 94, 0.1)' }}
          whileHover={{ scale: 1.02, y: -2 }} transition={{ type: 'spring', stiffness: 400 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #22c55e, #10b981)', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)',
            }}>
              <HiOutlineAcademicCap size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {stats?.totalStudents || 0}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Students</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Users by Role */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>Users by Role</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.entries(stats?.roleCounts || {}).map(([role, count]) => (
              <div key={role} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <span style={{ fontWeight: 600, textTransform: 'capitalize', color: 'var(--text-primary)' }}>{role}</span>
                <span style={{
                  padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)',
                  background: role === 'principal' ? 'rgba(99, 102, 241, 0.15)' : role === 'clerk' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                  color: role === 'principal' ? '#818cf8' : role === 'clerk' ? '#4ade80' : '#c084fc',
                  fontWeight: 700, fontSize: '0.85rem',
                }}>{count}</span>
              </div>
            ))}
            {Object.keys(stats?.roleCounts || {}).length === 0 && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No users yet</p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>Recent Schools</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(stats?.recentSchools || []).map((school) => (
              <div
                key={school.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onClick={() => navigate('/super-admin/schools')}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'; }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{school.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(school.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <HiOutlineArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
              </div>
            ))}
            {(stats?.recentSchools || []).length === 0 && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No schools yet</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SuperAdminDashboard;
