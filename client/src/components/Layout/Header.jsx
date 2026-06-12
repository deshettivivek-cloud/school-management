import { useAuth } from '../../context/AuthContext';
import { HiOutlineMenu } from 'react-icons/hi';
import { motion } from 'framer-motion';

const Header = ({ title, collapsed, setMobileOpen }) => {
  const { user } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className={`header ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="header-left">
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => setMobileOpen(true)}
          style={{ display: 'none' }}
          id="mobile-menu-btn"
        >
          <HiOutlineMenu size={22} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 className="page-title">{title}</h1>
          {title === 'Dashboard' && (
            <motion.span 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.02em', marginTop: '-0.2rem' }}
            >
              Academic Year 2026-2027
            </motion.span>
          )}
        </div>
      </div>

      <div className="header-right">
        <div className="header-user" style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="header-avatar" style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)', boxShadow: '0 0 10px rgba(99, 102, 241, 0.3)' }}>
            {getInitials(user?.name)}
          </div>
          <div className="header-user-info">
            <span className="header-user-name">{user?.name || 'User'}</span>
            <span className="header-user-role" style={{ color: 'var(--accent-400)' }}>{user?.role || 'teacher'}</span>
          </div>
        </div>
      </div>

      <style>{`
        .header {
          background: rgba(2, 8, 23, 0.6) !important;
          backdrop-filter: blur(24px) !important;
          -webkit-backdrop-filter: blur(24px) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
        @media (max-width: 768px) {
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
};

export default Header;
