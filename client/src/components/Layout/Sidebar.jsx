import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Settings,
  Users,
  UserPlus,
  GraduationCap,
  ClipboardList,
  IndianRupee,
  FileText,
  Calculator,
  ArrowUpCircle,
  FileArchive,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Briefcase,
  Banknote,
  History,
  Calendar,
  Megaphone,
  MessageSquare
} from 'lucide-react';

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const { logout, hasAccess } = useAuth();
  const location = useLocation();

  const navItems = [
    { section: 'Main' },
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/announcements', icon: Megaphone, label: 'Announcements' },
    { path: '/communications', icon: MessageSquare, label: 'Communications' },
    { path: '/school-setup', icon: Settings, label: 'School Setup' },

    { section: 'Students' },
    { path: '/students/directory', icon: Users, label: 'Directory' },
    { path: '/attendance', icon: ClipboardList, label: 'Attendance' },
    { path: '/admissions', icon: BookOpen, label: 'Admissions' },
    { path: '/admissions/new', icon: UserPlus, label: 'New Admission' },

    { section: 'Staff & HR' },
    { path: '/employees', icon: Briefcase, label: 'Employees' },
    { path: '/employees/add', icon: UserPlus, label: 'Add Employee' },

    { section: 'Salary Management' },
    { path: '/salary/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/salary/structure', icon: FileText, label: 'Structure' },
    { path: '/salary/monthly', icon: Banknote, label: 'Monthly Salary' },
    { path: '/salary/history', icon: History, label: 'Salary History' },
    { path: '/salary/reports', icon: BarChart3, label: 'Salary Reports' },

    { section: 'Fees' },
    { path: '/fees/structure', icon: ClipboardList, label: 'Fee Structure' },
    { path: '/fees/collection', icon: IndianRupee, label: 'Fee Collection' },
    { path: '/fees/pending', icon: FileText, label: 'Pending Fees' },
    { path: '/expenditure', icon: Calculator, label: 'Expenditure' },

    { section: 'Academic' },
    { path: '/promotion', icon: ArrowUpCircle, label: 'Promotion' },
    { path: '/exams/hall-ticket', icon: ClipboardList, label: 'Hall Ticket' },
    { path: '/tc/issue', icon: GraduationCap, label: 'Issue TC' },
    { path: '/tc/register', icon: FileArchive, label: 'TC Register' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
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

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <BookOpen size={20} />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="sidebar-title">SchoolMS</div>
              <div className="sidebar-subtitle">Management System</div>
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
                    layoutId="activeNavBackground"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'var(--primary-50)',
                      borderLeft: '3px solid var(--primary-600)',
                      borderRadius: 'var(--radius-md)',
                      zIndex: 0
                    }}
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="nav-item-icon" style={{ zIndex: 1, color: active ? 'var(--primary-600)' : 'var(--text-muted)' }}>
                  <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                </span>
                {!collapsed && (
                  <span style={{ zIndex: 1, color: active ? 'var(--primary-700)' : 'var(--text-secondary)', fontWeight: active ? 600 : 500 }}>
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

export default Sidebar;
