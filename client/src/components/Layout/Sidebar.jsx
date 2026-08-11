import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Settings, Users, UserPlus, GraduationCap, ClipboardList,
  IndianRupee, FileText, Calculator, ArrowUpCircle, FileArchive, BarChart3,
  Calendar, Megaphone, MessageSquare, Bug, Briefcase, Banknote, History,
  ChevronDown, BookOpen, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { getImageUrl } from '../../utils/helpers';

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen, schoolData }) => {
  const { hasAccess, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const schoolLogo = schoolData?.logo_url || schoolData?.logo;
  const schoolName = schoolData?.name || 'ClassOrbit';

  const [openSection, setOpenSection] = useState(null);

  // ── Lock body scroll when mobile drawer is open ──
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // ── Navigation data ──
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

  // ── Helpers ──
  const isLinkActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const isSectionActive = (section) => {
    return section.links.some(link => {
      if (link.path === '/') return location.pathname === '/' || location.pathname === '/dashboard';
      return location.pathname.startsWith(link.path);
    });
  };

  useEffect(() => {
    const activeIndex = navSections.findIndex(sec => isSectionActive(sec));
    if (activeIndex !== -1) {
      setOpenSection(activeIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // ══════════════════════════════════════════════════════════
  //  Shared sidebar content renderer
  //  Used by BOTH the desktop sidebar and the mobile portal.
  //  `isCollapsed` = true only for desktop collapsed state.
  //  `showCloseBtn` = true only for mobile portal.
  // ══════════════════════════════════════════════════════════
  const renderSidebarContent = (isCollapsed, showCloseBtn) => (
    <>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        minHeight: '64px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {schoolLogo ? (
            <img src={getImageUrl(schoolLogo)} alt="School Logo" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'contain', backgroundColor: '#fff', padding: '2px', flexShrink: 0 }} />
          ) : (
            <span className="logo-icon">C</span>
          )}
          {!isCollapsed && <span className="logo-text" style={{ color: '#fff', fontWeight: 800, fontSize: '1.25rem' }}>{schoolName}</span>}
        </div>
        {showCloseBtn && (
          <button
            onClick={() => setMobileOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
            }}
          >
            <X size={24} />
          </button>
        )}
      </div>

      {/* Nav sections */}
      <div style={{ padding: '1rem 0', overflowY: 'auto', flex: 1 }}>
        {navSections.map((section) => {
          const validLinks = section.links.filter(link => !link.roles || hasAccess(link.roles));
          if (validLinks.length === 0) return null;

          return (
            <div key={section.section} style={{ marginBottom: '0.25rem' }}>
              {!isCollapsed && (
                <div style={{
                  padding: '0.75rem 1.5rem 0.1rem',
                  color: 'rgba(255, 255, 255, 0.45)',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}>
                  {section.section}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {validLinks.map(link => {
                  const linkActive = isLinkActive(link.path);
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      className={`sidebar-link ${linkActive ? 'active' : ''}`}
                      onClick={() => { if (mobileOpen) setMobileOpen(false); }}
                      title={isCollapsed ? link.label : ''}
                      style={{
                        padding: '0.5rem 0.75rem',
                        margin: '0.1rem 0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        color: linkActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)',
                        textDecoration: 'none',
                        fontWeight: linkActive ? 600 : 500,
                        fontSize: '0.825rem',
                        borderRadius: '8px',
                        background: linkActive ? 'rgba(91, 63, 216, 0.3)' : 'transparent',
                        borderLeft: linkActive ? '3px solid #FBBF24' : '3px solid transparent',
                        transition: 'all 0.2s',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: linkActive ? '#FBBF24' : 'inherit' }}>
                        <Icon size={18} strokeWidth={linkActive ? 2.5 : 2} />
                      </span>
                      {!isCollapsed && (
                        <span>{link.label}</span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer — logout */}
      {!isCollapsed && (
        <div style={{ padding: '1rem', marginTop: 'auto', flexShrink: 0 }}>
          <button
            onClick={async () => { await logout(); navigate('/login'); }}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              color: '#EF4444',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              padding: '0.5rem',
              width: '100%',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          DESKTOP SIDEBAR
          Rendered in the normal DOM flow inside .app-layout.
          Hidden on mobile via CSS class "desktop-only-sidebar".
          ═══════════════════════════════════════════════════════ */}
      <aside className={`sidebar sidebar-luxury desktop-only-sidebar ${collapsed ? 'collapsed' : ''}`}>
        {renderSidebarContent(collapsed, false)}
        <button
          className="collapse-btn-bottom"
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.5)',
            cursor: 'pointer',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            flexShrink: 0,
          }}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </aside>

      {/* ═══════════════════════════════════════════════════════
          MOBILE SIDEBAR + BACKDROP
          Rendered via createPortal directly into document.body.
          This guarantees position:fixed is relative to the
          VIEWPORT, not constrained by any parent with
          transform / filter / perspective / overflow.
          Hidden on desktop via CSS class "mobile-portal-*".
          ═══════════════════════════════════════════════════════ */}
      {createPortal(
        <>
          {/* ── Backdrop: covers entire viewport ── */}
          <div
            className="mobile-portal-backdrop"
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9998,
              opacity: mobileOpen ? 1 : 0,
              pointerEvents: mobileOpen ? 'auto' : 'none',
              transition: 'opacity 300ms ease-out',
            }}
          />

          {/* ── Mobile sidebar drawer ── */}
          <aside
            className="mobile-portal-sidebar sidebar-luxury"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              height: '100%',
              width: '280px',
              maxWidth: '85vw',
              zIndex: 9999,
              overflowY: 'auto',
              overflowX: 'hidden',
              background: '#162B5B',
              transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 300ms ease-out',
              display: 'flex',
              flexDirection: 'column',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: mobileOpen ? '4px 0 24px rgba(22, 43, 91, 0.4)' : 'none',
            }}
          >
            {renderSidebarContent(false, true)}
          </aside>
        </>,
        document.body
      )}
    </>
  );
};

export default Sidebar;
