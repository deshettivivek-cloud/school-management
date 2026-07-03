import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import {
  HiOutlineHome,
  HiOutlineOfficeBuilding,
  HiOutlineUserGroup,
  HiOutlineLogout,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineShieldCheck,
  HiOutlineCreditCard,
  HiOutlineChartBar,
  HiOutlineCog,
  HiOutlineClipboardList
} from 'react-icons/hi';

const SuperAdminSidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const { logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { section: 'Platform' },
    { path: '/super-admin/dashboard', icon: HiOutlineHome, label: 'Dashboard' },
    { path: '/super-admin/schools', icon: HiOutlineOfficeBuilding, label: 'Schools' },
    { path: '/super-admin/users', icon: HiOutlineUserGroup, label: 'Users' },
    { section: 'System' },
    { path: '/super-admin/reports', icon: HiOutlineChartBar, label: 'Reports' },
    { path: '/super-admin/audit-logs', icon: HiOutlineClipboardList, label: 'Audit Logs' },
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
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

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`} style={{ background: 'rgba(2, 8, 23, 0.95)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(245, 158, 11, 0.1)' }}>
        <div className="sidebar-header" style={{ borderBottom: '1px solid rgba(245, 158, 11, 0.1)' }}>
          <div className="sidebar-logo" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)' }}>
            <HiOutlineShieldCheck size={20} />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="sidebar-title" style={{ background: 'linear-gradient(to right, #fff, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SchoolMS</div>
              <div className="sidebar-subtitle" style={{ color: '#f59e0b' }}>Super Admin</div>
            </motion.div>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, idx) => {
            if (item.section) {
              return !collapsed ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={idx} className="nav-section-label" style={{ color: 'rgba(245, 158, 11, 0.4)' }}>
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
                    layoutId="activeAdminNavBackground"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.15), rgba(239, 68, 68, 0.05))',
                      borderLeft: '3px solid #f59e0b',
                      borderRadius: 'var(--radius-md)',
                      zIndex: 0
                    }}
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="nav-item-icon" style={{ zIndex: 1, color: active ? '#f59e0b' : 'inherit' }}>
                  <Icon />
                </span>
                {!collapsed && <span style={{ zIndex: 1, color: active ? '#fff' : 'inherit', fontWeight: active ? 600 : 500 }}>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer" style={{ borderTop: '1px solid rgba(245, 158, 11, 0.1)' }}>
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

export default SuperAdminSidebar;
