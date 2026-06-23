import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import {
  HiOutlineHome,
  HiOutlineAcademicCap,
  HiOutlineUserAdd,
  HiOutlineUserGroup,
  HiOutlineCurrencyRupee,
  HiOutlineDocumentText,
  HiOutlineClipboardList,
  HiOutlineCalculator,
  HiOutlineArrowUp,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineUsers,
} from 'react-icons/hi';

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const { logout, hasAccess } = useAuth();
  const location = useLocation();

  const navItems = [
    { section: 'Main' },
    { path: '/', icon: HiOutlineHome, label: 'Dashboard' },
    { path: '/school-setup', icon: HiOutlineCog, label: 'School Setup' },

    { section: 'Students' },
    { path: '/students/directory', icon: HiOutlineUserGroup, label: 'Directory' },
    { path: '/admissions', icon: HiOutlineUsers, label: 'Admissions' },
    { path: '/admissions/new', icon: HiOutlineUserAdd, label: 'New Admission' },

    { section: 'Fees' },
    { path: '/fees/structure', icon: HiOutlineClipboardList, label: 'Fee Structure' },
    { path: '/fees/collection', icon: HiOutlineCurrencyRupee, label: 'Fee Collection' },
    { path: '/fees/pending', icon: HiOutlineDocumentText, label: 'Pending Fees' },
    { path: '/expenditure', icon: HiOutlineCalculator, label: 'Expenditure' },

    { section: 'Academic' },
    { path: '/promotion', icon: HiOutlineArrowUp, label: 'Promotion' },
    { path: '/exams/hall-ticket', icon: HiOutlineClipboardList, label: 'Hall Ticket' },
    { path: '/tc/issue', icon: HiOutlineAcademicCap, label: 'Issue TC' },
    { path: '/tc/register', icon: HiOutlineDocumentText, label: 'TC Register' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="modal-overlay"
          style={{ zIndex: 150 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`} style={{ background: 'rgba(2, 8, 23, 0.95)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <div className="sidebar-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div className="sidebar-logo" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)' }}>🏫</div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="sidebar-title" style={{ background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SchoolMS</div>
              <div className="sidebar-subtitle" style={{ color: 'var(--primary-400)' }}>Premium Edition</div>
            </motion.div>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, idx) => {
            if (item.section) {
              return !collapsed ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={idx} className="nav-section-label" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                  {item.section}
                </motion.div>
              ) : (
                <div key={idx} style={{ height: '1rem' }} />
              );
            }

            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : ''}
                style={{ position: 'relative', overflow: 'hidden', border: 'none', background: 'transparent' }}
              >
                {active && (
                  <motion.div
                    layoutId="activeNavBackground"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.05))',
                      borderLeft: '3px solid var(--primary-500)',
                      borderRadius: 'var(--radius-md)',
                      zIndex: 0
                    }}
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="nav-item-icon" style={{ zIndex: 1, color: active ? 'var(--primary-400)' : 'inherit' }}>
                  <Icon />
                </span>
                {!collapsed && <span style={{ zIndex: 1, color: active ? '#fff' : 'inherit', fontWeight: active ? 600 : 500 }}>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <button className="logout-btn" onClick={logout} style={{ color: 'var(--text-muted)' }}>
            <HiOutlineLogout size={20} />
            {!collapsed && 'Logout'}
          </button>

          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            style={{ color: 'var(--text-muted)' }}
          >
            {collapsed ? <HiOutlineChevronRight size={20} /> : <HiOutlineChevronLeft size={20} />}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
