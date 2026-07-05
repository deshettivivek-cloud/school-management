import { useAuth } from '../../context/AuthContext';
import { Menu, Search, Bell, Settings, ChevronDown, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Header = ({ title, collapsed, setMobileOpen, schoolData }) => {
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

  const logo = schoolData?.logo_url || schoolData?.logo;
  const schoolName = schoolData?.name || 'School Management System';
  const academicYear = schoolData?.academic_year || '2026-2027';

  return (
    <header className={`header ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="header-left">
        <button
          className="btn btn-ghost btn-icon mobile-menu-btn"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={22} />
        </button>

        {title === 'Dashboard' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {logo ? (
              <img src={logo} alt="School Logo" style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', objectFit: 'contain', background: '#fff' }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--primary-50)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                <Building2 size={24} />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h1 className="page-title" style={{ fontSize: '1.1rem' }}>{schoolName}</h1>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.02em' }}>
                Academic Year {academicYear}
              </span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 className="page-title">{title}</h1>
          </div>
        )}
      </div>

      <div className="header-right">
        {/* Search Bar */}
        <div className="header-search">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Search students, fees, reports..." className="search-input" />
          <div className="search-shortcut">⌘K</div>
        </div>

        {/* Notifications */}
        <button className="btn btn-ghost btn-icon header-icon-btn" style={{ position: 'relative' }}>
          <Bell size={20} />
          <span style={{ position: 'absolute', top: 6, right: 8, width: 8, height: 8, background: 'var(--danger-500)', borderRadius: '50%', border: '2px solid var(--bg-secondary)' }}></span>
        </button>

        <button className="btn btn-ghost btn-icon header-icon-btn">
          <Settings size={20} />
        </button>

        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 0.5rem' }}></div>

        {/* User Profile */}
        <div className="header-user">
          <div className="header-avatar">
            {getInitials(user?.name)}
          </div>
          <div className="header-user-info">
            <span className="header-user-name">{user?.name || 'User'}</span>
            <span className="header-user-role">{user?.role || 'teacher'}</span>
          </div>
          <ChevronDown size={16} style={{ color: 'var(--text-muted)', marginLeft: '0.25rem' }} />
        </div>
      </div>

      <style>{`
        .header {
          position: fixed;
          top: 0;
          right: 0;
          left: var(--sidebar-width);
          height: var(--header-height);
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          z-index: 90;
          transition: left var(--transition-base);
        }
        .header.sidebar-collapsed {
          left: var(--sidebar-collapsed);
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .mobile-menu-btn {
          display: none !important;
        }
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
          .header-search { display: none !important; }
        }
        .page-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .header-search {
          position: relative;
          display: flex;
          align-items: center;
          margin-right: 0.5rem;
        }
        .search-icon {
          position: absolute;
          left: 0.75rem;
          color: var(--text-muted);
        }
        .search-input {
          width: 280px;
          height: 38px;
          padding: 0 3rem 0 2.5rem;
          background: var(--bg-tertiary);
          border: 1px solid transparent;
          border-radius: var(--radius-full);
          font-size: 0.875rem;
          color: var(--text-primary);
          transition: all var(--transition-fast);
        }
        .search-input:focus {
          background: var(--bg-secondary);
          border-color: var(--primary-300);
          box-shadow: 0 0 0 3px var(--primary-50);
          outline: none;
        }
        .search-input::placeholder {
          color: var(--text-placeholder);
        }
        .search-shortcut {
          position: absolute;
          right: 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          background: var(--bg-secondary);
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          border: 1px solid var(--border-color);
        }
        .header-icon-btn {
          color: var(--text-secondary);
        }
        .header-icon-btn:hover {
          color: var(--text-primary);
          background: var(--bg-tertiary);
        }
        .header-user {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.35rem 0.5rem 0.35rem 0.35rem;
          border-radius: var(--radius-full);
          border: 1px solid transparent;
          transition: all var(--transition-fast);
          cursor: pointer;
        }
        .header-user:hover {
          background: var(--bg-tertiary);
        }
        .header-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: 600;
          flex-shrink: 0;
          box-shadow: var(--shadow-sm);
        }
        .header-user-info {
          display: flex;
          flex-direction: column;
        }
        .header-user-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .header-user-role {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: capitalize;
          font-weight: 500;
        }
      `}</style>
    </header>
  );
};

export default Header;
