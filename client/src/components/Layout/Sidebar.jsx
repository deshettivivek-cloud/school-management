import { useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Settings, Users, UserPlus, GraduationCap, ClipboardList,
  IndianRupee, FileText, Calculator, ArrowUpCircle, FileArchive, BarChart3,
  Calendar, Megaphone, MessageSquare, Bug, Briefcase, Banknote, History,
  BookOpen, LogOut
} from 'lucide-react';
import { getImageUrl } from '../../utils/helpers';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';

const Sidebar = ({ schoolData }) => {
  const { hasAccess, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, openMobile, setOpenMobile, state } = useSidebar();

  const schoolLogo = schoolData?.logo_url || schoolData?.logo;
  const schoolName = schoolData?.name || 'ClassOrbit';

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = openMobile ? 'hidden' : '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, openMobile]);

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

  const isLinkActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const isCollapsed = state === 'collapsed';

  return (
    <ShadcnSidebar collapsible="icon" className="sidebar-luxury border-r border-white/10 bg-[#162B5B] text-white">
      <SidebarHeader className="flex flex-row items-center justify-between p-4 border-b border-white/10 min-h-[64px]">
        <div className="flex items-center gap-3 overflow-hidden">
          {schoolLogo ? (
            <img
              src={getImageUrl(schoolLogo)}
              alt="School Logo"
              className="w-9 h-9 rounded-full object-contain bg-white p-0.5 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-[#5B3FD8] text-white font-extrabold flex items-center justify-center text-lg shrink-0">
              C
            </div>
          )}
          {!isCollapsed && (
            <span className="text-white font-extrabold text-xl tracking-tight truncate">
              {schoolName}
            </span>
          )}
        </div>
        <SidebarTrigger className="text-white hover:bg-white/10 transition-colors shrink-0" />
      </SidebarHeader>

      <SidebarContent className="py-2 px-1">
        {navSections.map((section) => {
          const validLinks = section.links.filter(link => !link.roles || hasAccess(link.roles));
          if (validLinks.length === 0) return null;

          return (
            <SidebarGroup key={section.section} className="py-1">
              {!isCollapsed && (
                <SidebarGroupLabel className="text-[0.7rem] font-bold text-white/45 uppercase tracking-wider px-3 py-1">
                  {section.section}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {validLinks.map((link) => {
                    const linkActive = isLinkActive(link.path);
                    const Icon = link.icon;
                    return (
                      <SidebarMenuItem key={link.path}>
                        <SidebarMenuButton
                          asChild
                          isActive={linkActive}
                          tooltip={isCollapsed ? link.label : undefined}
                          className={`flex items-center gap-3 px-3 h-9 rounded-lg text-xs transition-all font-medium ${
                            linkActive
                              ? 'bg-[#5B3FD8]/40 text-white font-semibold border-l-4 border-[#FBBF24]'
                              : 'text-white/75 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <NavLink
                            to={link.path}
                            onClick={() => {
                              if (isMobile) setOpenMobile(false);
                            }}
                          >
                            <Icon
                              strokeWidth={linkActive ? 2.5 : 2}
                              className={`!size-[18px] shrink-0 ${linkActive ? 'text-[#FBBF24]' : 'text-current'}`}
                            />
                            {!isCollapsed && <span>{link.label}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="p-3 mt-auto border-t border-white/10">
        <button
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
          className="flex items-center justify-center gap-2 text-red-400 hover:text-red-300 font-semibold text-sm w-full py-2 hover:bg-red-500/10 rounded-md transition-colors"
        >
          <LogOut size={18} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </SidebarFooter>

      <SidebarRail />
    </ShadcnSidebar>
  );
};

export default Sidebar;
