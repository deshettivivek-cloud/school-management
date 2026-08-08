import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Settings, Users, UserPlus, GraduationCap, ClipboardList,
  IndianRupee, FileText, Calculator, ArrowUpCircle, FileArchive, BarChart3,
  Calendar, Megaphone, MessageSquare, Bug, Briefcase, Banknote, History, ChevronDown, BookOpen
} from 'lucide-react';

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { hasAccess } = useAuth();
  const location = useLocation();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const navRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navSections = [
    {
      section: 'Main',
      links: [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/calendar', icon: Calendar, label: 'Calendar' },
        { path: '/announcements', icon: Megaphone, label: 'Announcements' },
        { path: '/communications', icon: MessageSquare, label: 'Communications' },
        { path: '/school-setup', icon: Settings, label: 'School Setup' },
      ]
    },
    {
      section: 'Students',
      links: [
        { path: '/students/directory', icon: Users, label: 'Directory' },
        { path: '/attendance', icon: ClipboardList, label: 'Attendance' },
        { path: '/admissions', icon: BookOpen, label: 'Admissions' },
        { path: '/admissions/new', icon: UserPlus, label: 'New Admission' },
      ]
    },
    {
      section: 'Fees',
      links: [
        { path: '/fees/structure', icon: ClipboardList, label: 'Fee Structure' },
        { path: '/fees/collection', icon: IndianRupee, label: 'Fee Collection' },
        { path: '/fees/pending', icon: FileText, label: 'Pending Fees' },
        { path: '/expenditure', icon: Calculator, label: 'Expenditure' },
      ]
    },
    {
      section: 'Academic',
      links: [
        { path: '/promotion', icon: ArrowUpCircle, label: 'Promotion', roles: ['principal'] },
        { path: '/exams/hall-ticket', icon: ClipboardList, label: 'Hall Ticket' },
        { path: '/tc/issue', icon: GraduationCap, label: 'Issue TC' },
        { path: '/tc/register', icon: FileArchive, label: 'TC Register' },
        { path: '/reports', icon: BarChart3, label: 'Reports' },
      ]
    },
    {
      section: 'Staff & HR',
      links: [
        { path: '/employees', icon: Briefcase, label: 'Employees' },
        { path: '/employees/add', icon: UserPlus, label: 'Add Employee' },
      ]
    },
    {
      section: 'Salary',
      links: [
        { path: '/salary/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/salary/structure', icon: FileText, label: 'Structure' },
        { path: '/salary/monthly', icon: Banknote, label: 'Monthly Salary' },
        { path: '/salary/history', icon: History, label: 'Salary History' },
        { path: '/salary/reports', icon: BarChart3, label: 'Salary Reports' },
      ]
    },
    {
      section: 'Support',
      links: [
        { path: '/report-bug', icon: Bug, label: 'Report a Bug' },
        { path: '/bug-reports', icon: Bug, label: 'Bug Reports', roles: ['principal'] },
      ]
    }
  ];

  // A section is active if any of its links match the current path
  const isSectionActive = (section) => {
    return section.links.some(link => {
      if (link.path === '/') return location.pathname === '/';
      return location.pathname.startsWith(link.path);
    });
  };

  const isLinkActive = (path) => {
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

      <nav className={`top-navbar ${mobileOpen ? 'mobile-open' : ''}`} ref={navRef}>
        <div className="top-navbar-container">
          {navSections.map((section, idx) => {
            // Filter links by roles
            const validLinks = section.links.filter(link => !link.roles || hasAccess(link.roles));
            if (validLinks.length === 0) return null;
            
            const active = isSectionActive(section);
            const isOpen = activeDropdown === idx;

            return (
              <div 
                key={section.section} 
                className={`top-nav-item ${active ? 'active' : ''}`}
                onMouseEnter={() => setActiveDropdown(idx)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <div 
                  className="top-nav-trigger"
                  onClick={() => setActiveDropdown(isOpen ? null : idx)}
                >
                  <span style={{ fontWeight: active ? 600 : 500 }}>{section.section}</span>
                  <ChevronDown size={14} className={`dropdown-icon ${isOpen ? 'open' : ''}`} />
                </div>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="top-nav-dropdown"
                    >
                      {validLinks.map(link => {
                        const linkActive = isLinkActive(link.path);
                        const Icon = link.icon;
                        return (
                          <NavLink
                            key={link.path}
                            to={link.path}
                            className={`dropdown-link ${linkActive ? 'active' : ''}`}
                            onClick={() => {
                              setActiveDropdown(null);
                              setMobileOpen(false);
                            }}
                          >
                            <span className="dropdown-icon-wrapper">
                              <Icon size={16} strokeWidth={linkActive ? 2.5 : 2} color={linkActive ? 'var(--primary-600)' : 'var(--text-muted)'} />
                            </span>
                            <span style={{ fontWeight: linkActive ? 600 : 500, color: linkActive ? 'var(--primary-700)' : 'var(--text-primary)' }}>
                              {link.label}
                            </span>
                          </NavLink>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
