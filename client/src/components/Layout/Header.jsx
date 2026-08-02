import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, Settings, ChevronDown, Building2, LogOut, User, Lock, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CommandPalette from './CommandPalette';

const Header = ({ title, collapsed, setMobileOpen, schoolData }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState([
    { id: 1, title: 'Welcome to SchoolMS!', desc: 'Your workspace is ready to use.', time: 'Just now' },
    { id: 2, title: 'System Update', desc: 'New bulk import features are available.', time: '1 hr ago' }
  ]);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for global custom event to open command palette
  useEffect(() => {
    const openPalette = () => setIsCommandPaletteOpen(true);
    document.addEventListener('open-command-palette', openPalette);
    return () => document.removeEventListener('open-command-palette', openPalette);
  }, []);

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

  const markAllRead = () => {
    setUnreadNotifications([]);
    setShowNotifications(false);
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className={`header ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="header-left">
          <button
            className="btn btn-ghost btn-icon mobile-menu-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
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
          <div className="header-search" onClick={() => setIsCommandPaletteOpen(true)}>
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search students, fees, reports..." 
              className="search-input" 
              readOnly 
            />
            <div className="search-shortcut">⌘K</div>
          </div>

          {/* Notifications Dropdown */}
          <div className="header-dropdown-container" ref={notifRef}>
            <button 
              className={`btn btn-ghost btn-icon header-icon-btn ${showNotifications ? 'active' : ''}`} 
              style={{ position: 'relative' }}
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              aria-label={unreadNotifications.length > 0 ? `Notifications (${unreadNotifications.length} unread)` : 'Notifications'}
            >
              <Bell size={20} />
              {unreadNotifications.length > 0 && (
                <span style={{ position: 'absolute', top: 6, right: 8, width: 8, height: 8, background: 'var(--danger-500)', borderRadius: '50%', border: '2px solid var(--bg-secondary)' }}></span>
              )}
            </button>
            
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="header-dropdown notifications-dropdown"
                >
                  <div className="dropdown-header">
                    <h4>Notifications</h4>
                    {unreadNotifications.length > 0 && (
                      <button className="mark-read-btn" onClick={markAllRead}>
                        <Check size={14} /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="dropdown-body">
                    {unreadNotifications.length > 0 ? (
                      unreadNotifications.map(notif => (
                        <div key={notif.id} className="notification-item">
                          <div className="notif-indicator"></div>
                          <div className="notif-content">
                            <p className="notif-title">{notif.title}</p>
                            <p className="notif-desc">{notif.desc}</p>
                            <span className="notif-time">{notif.time}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <Bell size={32} />
                        <p>No new notifications</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>



          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 0.5rem' }}></div>

          {/* User Profile Dropdown */}
          <div className="header-dropdown-container" ref={profileRef}>
            <div 
              className={`header-user ${showProfileMenu ? 'active' : ''}`}
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
            >
              <div className="header-avatar">
                {getInitials(user?.name)}
              </div>
              <div className="header-user-info">
                <span className="header-user-name">{user?.name || 'User'}</span>
                <span className="header-user-role">{user?.role || 'teacher'}</span>
              </div>
              <ChevronDown size={16} style={{ color: 'var(--text-muted)', marginLeft: '0.25rem' }} />
            </div>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="header-dropdown profile-dropdown"
                >
                  <div className="profile-header">
                    <div className="header-avatar lg">
                      {getInitials(user?.name)}
                    </div>
                    <div>
                      <h4 className="profile-name">{user?.name || 'User'}</h4>
                      <p className="profile-email">{user?.email}</p>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  
                  {user?.role === 'principal' && (
                    <button className="dropdown-item" onClick={() => { setShowProfileMenu(false); navigate('/school-setup'); }}>
                      <Settings size={16} /> School Setup
                    </button>
                  )}
                  <button className="dropdown-item" onClick={() => { setShowProfileMenu(false); navigate('/change-password'); }}>
                    <Lock size={16} /> Change Password
                  </button>
                  
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item text-danger" onClick={handleLogout}>
                    <LogOut size={16} /> Log Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
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
            cursor: pointer;
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
            cursor: pointer;
          }
          .search-input:hover {
            border-color: var(--border-color);
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
          .header-icon-btn:hover, .header-icon-btn.active {
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
          .header-user:hover, .header-user.active {
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
          .header-avatar.lg {
            width: 48px;
            height: 48px;
            font-size: 1.2rem;
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
            color: var(--text-secondary);
            text-transform: capitalize;
            font-weight: 500;
          }

          /* Dropdowns */
          .header-dropdown-container {
            position: relative;
          }
          .header-dropdown {
            position: absolute;
            top: calc(100% + 0.5rem);
            right: 0;
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            z-index: 100;
            overflow: hidden;
          }
          .notifications-dropdown {
            width: 320px;
          }
          .profile-dropdown {
            width: 240px;
          }
          
          .dropdown-header {
            padding: 1rem;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .dropdown-header h4 {
            margin: 0;
            font-size: 0.95rem;
            font-weight: 600;
          }
          .mark-read-btn {
            background: none;
            border: none;
            font-size: 0.75rem;
            color: var(--primary-600);
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0;
          }
          .mark-read-btn:hover {
            text-decoration: underline;
          }
          
          .dropdown-body {
            max-height: 300px;
            overflow-y: auto;
          }
          .notification-item {
            padding: 1rem;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            gap: 0.75rem;
            transition: background 0.2s;
            cursor: pointer;
          }
          .notification-item:hover {
            background: var(--bg-tertiary);
          }
          .notif-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--primary-500);
            margin-top: 0.35rem;
          }
          .notif-content {
            flex: 1;
          }
          .notif-title {
            margin: 0 0 0.25rem 0;
            font-size: 0.85rem;
            font-weight: 600;
          }
          .notif-desc {
            margin: 0 0 0.5rem 0;
            font-size: 0.8rem;
            color: var(--text-muted);
            line-height: 1.4;
          }
          .notif-time {
            font-size: 0.7rem;
            color: var(--text-placeholder);
          }
          .empty-state {
            padding: 2rem;
            text-align: center;
            color: var(--text-muted);
          }
          .empty-state svg {
            color: var(--text-placeholder);
            margin-bottom: 0.5rem;
          }
          .empty-state p {
            margin: 0;
            font-size: 0.85rem;
          }
          
          .profile-header {
            padding: 1.25rem 1rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            background: var(--bg-secondary);
          }
          .profile-name {
            margin: 0 0 0.15rem 0;
            font-size: 1rem;
            font-weight: 600;
          }
          .profile-email {
            margin: 0;
            font-size: 0.8rem;
            color: var(--text-muted);
          }
          .dropdown-divider {
            height: 1px;
            background: var(--border-color);
          }
          .dropdown-item {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            background: none;
            border: none;
            font-size: 0.875rem;
            color: var(--text-primary);
            cursor: pointer;
            text-align: left;
            transition: background 0.2s;
          }
          .dropdown-item:hover {
            background: var(--bg-tertiary);
          }
          .dropdown-item.text-danger {
            color: var(--danger-600);
          }
          .dropdown-item.text-danger:hover {
            background: var(--danger-50);
          }
        `}</style>
      </header>

      {/* Render Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />
    </>
  );
};

export default Header;
