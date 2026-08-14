import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { sanitizeDigitInput } from '../../utils/inputHelpers';
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
      <div className="glass-panel" style={{
        position: 'relative',
        padding: '3rem 3.5rem',
        borderRadius: 'var(--radius-xl)',
        marginBottom: '2.5rem',
        overflow: 'hidden',
      }}>
        <div className="animate-float" style={{
          position: 'absolute', top: -80, right: -40, width: 250, height: 250,
          background: 'radial-gradient(circle, rgba(91, 63, 216, 0.15), transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div className="animate-float" style={{
          position: 'absolute', bottom: -50, left: 200, width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(251, 191, 36, 0.1), transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none', animationDelay: '1s'
        }} />
        
        <motion.div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', position: 'relative', zIndex: 1 }}
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
        >
          <div style={{ padding: '12px', background: 'rgba(251, 191, 36, 0.15)', borderRadius: '14px', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
            <HiOutlineShieldCheck size={32} style={{ color: '#d97706' }} />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#102A56', letterSpacing: '-0.03em' }}>
            Super Admin Portal
          </h1>
        </motion.div>
        <motion.p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', position: 'relative', zIndex: 1, marginLeft: '4.5rem' }}
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
        >
          Command center for all schools, users, and platform analytics
        </motion.p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        <motion.div className="glass-panel" style={{ cursor: 'pointer', padding: '1.5rem', borderRadius: 'var(--radius-xl)' }}
          onClick={() => navigate('/super-admin/schools')}
          whileHover={{ scale: 1.03, y: -5, boxShadow: 'var(--shadow-premium-hover)' }} transition={{ type: 'spring', stiffness: 400 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)', boxShadow: '0 8px 16px rgba(217, 119, 6, 0.2)'
            }}>
              <HiOutlineOfficeBuilding size={26} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#102A56', lineHeight: 1, marginBottom: '0.25rem' }}>
                {stats?.totalSchools || 0}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Total Schools</div>
            </div>
          </div>
        </motion.div>

        <motion.div className="glass-panel" style={{ cursor: 'pointer', padding: '1.5rem', borderRadius: 'var(--radius-xl)' }}
          onClick={() => navigate('/super-admin/users')}
          whileHover={{ scale: 1.03, y: -5, boxShadow: 'var(--shadow-premium-hover)' }} transition={{ type: 'spring', stiffness: 400 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--gradient-indigo)', boxShadow: '0 8px 16px rgba(91, 63, 216, 0.2)'
            }}>
              <HiOutlineUserGroup size={26} color="var(--text-inverse)" />
            </div>
            <div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#102A56', lineHeight: 1, marginBottom: '0.25rem' }}>
                {stats?.totalUsers || 0}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Total Users</div>
            </div>
          </div>
        </motion.div>

        <motion.div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)' }}
          whileHover={{ scale: 1.03, y: -5, boxShadow: 'var(--shadow-premium-hover)' }} transition={{ type: 'spring', stiffness: 400 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--gradient-success)', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)'
            }}>
              <HiOutlineAcademicCap size={26} color="var(--text-inverse)" />
            </div>
            <div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#102A56', lineHeight: 1, marginBottom: '0.25rem' }}>
                {stats?.totalStudents || 0}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Total Students</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Users by Role & Recent */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: '#102A56', fontWeight: 700 }}>Users by Role</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.entries(stats?.roleCounts || {}).map(([role, count]) => (
              <div key={role} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: 600, textTransform: 'capitalize', color: 'var(--text-primary)' }}>{role}</span>
                <span style={{
                  padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-elevated)',
                  color: role === 'principal' ? 'var(--info-500)' : role === 'clerk' ? 'var(--success-500)' : 'var(--accent-500)',
                  fontWeight: 700, fontSize: '0.85rem',
                }}>{count}</span>
              </div>
            ))}
            {Object.keys(stats?.roleCounts || {}).length === 0 && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No users yet</p>
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: '#102A56', fontWeight: 700 }}>Recent Schools</h3>
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
              maxLength={12}
              placeholder="e.g. 919876543210" 
              value={testPhone} 
              onChange={(e) => setTestPhone(sanitizeDigitInput(e.target.value, 12))}
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
