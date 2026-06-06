import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineHome,
  HiOutlineAcademicCap,
  HiOutlineUserAdd,
  HiOutlineCurrencyRupee,
  HiOutlineDocumentText,
  HiOutlineClipboardList,
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
    { section: 'Main', roles: ['principal', 'clerk'] },
    { path: '/', icon: HiOutlineHome, label: 'Dashboard', roles: ['principal', 'clerk'] },
    { path: '/school-setup', icon: HiOutlineCog, label: 'School Setup', roles: ['principal'] },
    { path: '/role-management', icon: HiOutlineUsers, label: 'Role Management', roles: ['principal'] },

    { section: 'Students', roles: ['principal', 'clerk'] },
    { path: '/admissions', icon: HiOutlineUsers, label: 'Admissions', roles: ['principal', 'clerk'] },
    { path: '/admissions/new', icon: HiOutlineUserAdd, label: 'New Admission', roles: ['principal', 'clerk'] },

    { section: 'Fees', roles: ['principal', 'clerk'] },
    { path: '/fees/structure', icon: HiOutlineClipboardList, label: 'Fee Structure', roles: ['principal', 'clerk'] },
    { path: '/fees/collection', icon: HiOutlineCurrencyRupee, label: 'Fee Collection', roles: ['principal', 'clerk'] },
    { path: '/fees/pending', icon: HiOutlineDocumentText, label: 'Pending Fees', roles: ['principal', 'clerk'] },

    { section: 'Academic', roles: ['principal', 'clerk'] },
    { path: '/promotion', icon: HiOutlineArrowUp, label: 'Promotion', roles: ['principal'] },
    { path: '/tc/issue', icon: HiOutlineAcademicCap, label: 'Issue TC', roles: ['principal', 'clerk'] },
    { path: '/tc/register', icon: HiOutlineDocumentText, label: 'TC Register', roles: ['principal', 'clerk'] },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="modal-overlay"
          style={{ zIndex: 150 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">🏫</div>
          {!collapsed && (
            <div>
              <div className="sidebar-title">SchoolMS</div>
              <div className="sidebar-subtitle">Management System</div>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, idx) => {
            if (item.roles && !hasAccess(item.roles)) return null;

            if (item.section) {
              return !collapsed ? (
                <div key={idx} className="nav-section-label">
                  {item.section}
                </div>
              ) : (
                <div key={idx} style={{ height: '1rem' }} />
              );
            }

            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : ''}
              >
                <span className="nav-item-icon">
                  <Icon />
                </span>
                {!collapsed && item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={logout}>
            <HiOutlineLogout size={20} />
            {!collapsed && 'Logout'}
          </button>

          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <HiOutlineChevronRight size={20} /> : <HiOutlineChevronLeft size={20} />}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
