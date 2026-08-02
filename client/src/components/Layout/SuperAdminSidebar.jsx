import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  ClipboardList,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bug
} from 'lucide-react';

const SuperAdminSidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const { logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { section: 'Platform' },
    { path: '/super-admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/super-admin/schools', icon: Building2, label: 'Schools' },
    { path: '/super-admin/users', icon: Users, label: 'Users' },
    { section: 'System' },
    { path: '/super-admin/bug-reports', icon: Bug, label: 'Bug Reports' },
    { path: '/super-admin/reports', icon: BarChart3, label: 'Reports' },
    { path: '/super-admin/audit-logs', icon: ClipboardList, label: 'Audit Logs' },
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

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo" style={{ background: 'var(--warning-500)' }}>
            <ShieldCheck size={20} />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="sidebar-title">SchoolMS</div>
              <div className="sidebar-subtitle" style={{ color: 'var(--warning-600)' }}>Super Admin</div>
            </motion.div>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, idx) => {
            if (item.section) {
              return !collapsed ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={idx} className="nav-section-label">
                  {item.section}
                </motion.div>
              ) : (
                <div key={idx} style={{ height: '0.75rem' }} />
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
              >
                {active && (
                  <motion.div
                    layoutId="activeAdminNavBackground"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'var(--warning-50)',
                      borderLeft: '3px solid var(--warning-600)',
                      borderRadius: 'var(--radius-md)',
                      zIndex: 0
                    }}
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="nav-item-icon" style={{ zIndex: 1, color: active ? 'var(--warning-600)' : 'var(--text-muted)' }}>
                  <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                </span>
                {!collapsed && (
                  <span style={{ zIndex: 1, color: active ? 'var(--warning-700)' : 'var(--text-secondary)', fontWeight: active ? 600 : 500 }}>
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={logout}>
            <LogOut size={18} />
            {!collapsed && 'Logout'}
          </button>

          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <style>{`
          .logout-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            width: 100%;
            padding: 0.75rem;
            border-radius: var(--radius-md);
            background: transparent;
            color: var(--text-secondary);
            font-size: 0.875rem;
            font-weight: 500;
            transition: all var(--transition-fast);
            margin-bottom: 0.5rem;
          }
          .logout-btn:hover {
            background: var(--danger-50);
            color: var(--danger-600);
          }
        `}</style>
      </aside>
    </>
  );
};

export default SuperAdminSidebar;
