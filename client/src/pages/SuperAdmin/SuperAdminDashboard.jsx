import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
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
  const [testPhone, setTestPhone] = useState('');
  const [messageType, setMessageType] = useState('template'); // 'template' or 'text'
  const [testTemplate, setTestTemplate] = useState('hello_world');
  const [testText, setTestText] = useState('Hello from SchoolMS!');
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/super-admin/dashboard-stats');
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
          style={{ width: 40, height: 40, border: '3px solid #fef3c7', borderTopColor: '#d97706', borderRadius: '50%' }}
        />
      </div>
    );
  }

  const handleSendTestMessage = async () => {
    if (!testPhone) {
      toast.error('Please enter a phone number');
      return;
    }
    setTestLoading(true);
    try {
      const payload = { 
        phone: testPhone, 
        messageType,
        template: testTemplate,
        text: testText 
      };
      const res = await api.post('/whatsapp/test', payload);
      toast.success('WhatsApp test message sent successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send WhatsApp message');
    } finally {
      setTestLoading(false);
    }
  };

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
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-xs)',
      }}>
        <div style={{
          position: 'absolute', top: -60, right: -60, width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.06), transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <motion.div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
        >
          <HiOutlineShieldCheck size={28} style={{ color: '#f59e0b' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
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
        <motion.div className="card" style={{ cursor: 'pointer', border: '1px solid var(--border-color)' }}
          onClick={() => navigate('/super-admin/schools')}
          whileHover={{ scale: 1.02, y: -2 }} transition={{ type: 'spring', stiffness: 400 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#d97706',
            }}>
              <HiOutlineOfficeBuilding size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                {stats?.totalSchools || 0}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Schools</div>
            </div>
          </div>
        </motion.div>

        <motion.div className="card" style={{ cursor: 'pointer', border: '1px solid var(--border-color)' }}
          onClick={() => navigate('/super-admin/users')}
          whileHover={{ scale: 1.02, y: -2 }} transition={{ type: 'spring', stiffness: 400 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#2563eb',
            }}>
              <HiOutlineUserGroup size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                {stats?.totalUsers || 0}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Users</div>
            </div>
          </div>
        </motion.div>

        <motion.div className="card" style={{ border: '1px solid var(--border-color)' }}
          whileHover={{ scale: 1.02, y: -2 }} transition={{ type: 'spring', stiffness: 400 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#16a34a',
            }}>
              <HiOutlineAcademicCap size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
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
              <div key={role} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: 600, textTransform: 'capitalize', color: 'var(--text-primary)' }}>{role}</span>
                <span style={{
                  padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)',
                  background: role === 'principal' ? '#eff6ff' : role === 'clerk' ? '#f0fdf4' : '#f5f3ff',
                  color: role === 'principal' ? '#2563eb' : role === 'clerk' ? '#16a34a' : '#7c3aed',
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
                  background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onClick={() => navigate('/super-admin/schools')}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#fde68a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
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

      {/* WhatsApp Integration Test */}
      <div className="card" style={{ marginTop: '1.5rem', border: '1px solid var(--border-color)' }}>
        <h3 className="card-title" style={{ marginBottom: '1rem', color: '#10b981' }}>💬 WhatsApp API Integration (Test)</h3>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="radio" name="msgType" checked={messageType === 'template'} onChange={() => setMessageType('template')} />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Send Template</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="radio" name="msgType" checked={messageType === 'text'} onChange={() => setMessageType('text')} />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Send Free Text</span>
          </label>
        </div>

        {messageType === 'template' ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', background: '#fffbeb', padding: '10px', borderRadius: '6px', borderLeft: '4px solid #f59e0b' }}>
            <strong>Note:</strong> Your live phone number cannot send the default "hello_world" template. You must type the name of a template you have explicitly approved in your Meta Dashboard.
          </p>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', background: '#eff6ff', padding: '10px', borderRadius: '6px', borderLeft: '4px solid #3b82f6' }}>
            <strong>Note:</strong> Free text messages can only be delivered if you have sent a WhatsApp message from your personal phone TO your business number within the last 24 hours. (This opens a 24-hour customer service window).
          </p>
        )}

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', maxWidth: '700px' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Phone Number (with country code)</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. 919876543210" 
              value={testPhone} 
              onChange={(e) => setTestPhone(e.target.value)}
            />
          </div>
          
          <div style={{ flex: 2, minWidth: '250px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>{messageType === 'template' ? 'Template Name' : 'Message Content'}</label>
            {messageType === 'template' ? (
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. fee_receipt_en" 
                value={testTemplate} 
                onChange={(e) => setTestTemplate(e.target.value)}
              />
            ) : (
              <input 
                type="text" 
                className="form-input" 
                placeholder="Type your message here..." 
                value={testText} 
                onChange={(e) => setTestText(e.target.value)}
              />
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleSendTestMessage} 
              disabled={testLoading}
              style={{ background: '#10b981', border: 'none', minWidth: '120px' }}
            >
              {testLoading ? 'Sending...' : 'Send Test'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SuperAdminDashboard;
