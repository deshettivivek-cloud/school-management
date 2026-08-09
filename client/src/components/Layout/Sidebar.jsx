import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Settings, Users, UserPlus, GraduationCap, ClipboardList,
  IndianRupee, FileText, Calculator, ArrowUpCircle, FileArchive, BarChart3,
  Calendar, Megaphone, MessageSquare, Bug, Briefcase, Banknote, History, ChevronDown, BookOpen,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const { hasAccess } = useAuth();
  const location = useLocation();
  
  const [openSection, setOpenSection] = useState(null);

  const navSections = [
    {
      section: 'Main',
      links: [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
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

  const isSectionActive = (section) => {
    return section.links.some(link => {
      if (link.path === '/') return location.pathname === '/' || location.pathname === '/dashboard';
      return location.pathname.startsWith(link.path);
    });
  };

  const isLinkActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    const activeIndex = navSections.findIndex(sec => isSectionActive(sec));
    if (activeIndex !== -1) {
      setOpenSection(activeIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mobile-overlay"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">C</span>
            {!collapsed && <span className="logo-text">ClassOrbit</span>}
          </div>
          
          
          <button 
            className="close-mobile-btn show-on-mobile"
            onClick={() => setMobileOpen(false)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="sidebar-content">
          {navSections.map((section, idx) => {
            const validLinks = section.links.filter(link => !link.roles || hasAccess(link.roles));
            if (validLinks.length === 0) return null;
            
            const active = isSectionActive(section);
            const isOpen = openSection === idx;

            return (
              <div key={section.section} className="sidebar-section">
                {!collapsed && (
                  <div 
                    className="sidebar-section-header"
                    onClick={() => setOpenSection(isOpen ? null : idx)}
                  >
                    <span className={`section-title ${active ? 'text-primary-600' : ''}`}>
                      {section.section}
                    </span>
                    
                  </div>
                )}
                
                <AnimatePresence initial={false}>
                  {(isOpen || collapsed) && (
                    <motion.div
                      initial={collapsed ? false : { height: 0, opacity: 0 }}
                      animate={collapsed ? { height: 'auto', opacity: 1 } : { height: 'auto', opacity: 1 }}
                      exit={collapsed ? false : { height: 0, opacity: 0 }}
                      className={`sidebar-links ${collapsed ? 'collapsed-links' : ''}`}
                      style={{ overflow: 'hidden' }}
                    >
                      {validLinks.map(link => {
                        const linkActive = isLinkActive(link.path);
                        const Icon = link.icon;
                        return (
                          <NavLink
                            key={link.path}
                            to={link.path}
                            className={`sidebar-link ${linkActive ? 'active' : ''}`}
                            onClick={() => {
                              if (mobileOpen) setMobileOpen(false);
                            }}
                            title={collapsed ? link.label : ''}
                          >
                            <span className="sidebar-icon-wrapper">
                              <Icon size={20} strokeWidth={linkActive ? 2.5 : 2} />
                            </span>
                            {!collapsed && (
                              <span className="sidebar-link-text">
                                {link.label}
                              </span>
                            )}
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
      
        {!collapsed && (
          <div className="sidebar-footer-new" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: 'auto' }}>
            <div className="empowering-card" style={{ background: '#F0F5FF', borderRadius: '12px', padding: '1.25rem' }}>
              <h3 style={{ color: '#3730A3', fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Empowering<br/>Education</h3>
              <p style={{ color: '#6366F1', fontSize: '0.75rem', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                One student at a time
                <GraduationCap size={28} color="#818CF8" strokeWidth={1.5} style={{ opacity: 0.8 }} />
              </p>
            </div>
            
            <button className="logout-btn" style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#EF4444', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', padding: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Logout
            </button>
          </div>
        )}

        <button 
          className="collapse-btn-bottom hidden-on-mobile"
          onClick={() => setCollapsed(!collapsed)}
          style={{ background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer', padding: '1rem', display: 'flex', justifyContent: 'center', width: '100%' }}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </aside>

    </>
  );
};

export default Sidebar;
