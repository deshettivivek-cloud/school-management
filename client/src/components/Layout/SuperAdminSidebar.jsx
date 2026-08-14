import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Users,
  ClipboardList,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bug
} from 'lucide-react';
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
  SidebarProvider,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar';

const SuperAdminSidebarInner = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const { isMobile, openMobile, setOpenMobile, state } = useSidebar();

  useEffect(() => {
    if (mobileOpen !== undefined && mobileOpen !== openMobile) {
      setOpenMobile(mobileOpen);
    }
  }, [mobileOpen, openMobile, setOpenMobile]);

  useEffect(() => {
    if (setMobileOpen && openMobile !== mobileOpen) {
      setMobileOpen(openMobile);
    }
  }, [openMobile, mobileOpen, setMobileOpen]);

  const navItems = [
    { section: 'Platform' },
    { path: '/super-admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/super-admin/schools', icon: Building2, label: 'Schools' },
    { path: '/super-admin/users', icon: Users, label: 'Users' },
    { section: 'System' },
    { path: '/super-admin/bug-reports', icon: Bug, label: 'Bug Reports' },
    { path: '/super-admin/audit-logs', icon: ClipboardList, label: 'Audit Logs' },
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isCollapsed = state === 'collapsed';

  return (
    <ShadcnSidebar collapsible="icon" className="sidebar-admin border-r border-white/10 bg-[#0F172A] text-white">
      <SidebarHeader className="flex flex-row items-center justify-between p-4 border-b border-white/10 min-h-[64px]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-amber-500 text-gray-900 flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck size={20} />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-extrabold text-base text-white">SchoolMS</span>
              <span className="text-xs text-amber-400 font-semibold">Super Admin</span>
            </div>
          )}
        </div>
        {!isMobile && setCollapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-white/60 hover:text-white transition-colors p-1 rounded-md"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </SidebarHeader>

      <SidebarContent className="py-2 px-1">
        <SidebarGroup className="py-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item, idx) => {
                if (item.section) {
                  return !isCollapsed ? (
                    <SidebarGroupLabel key={idx} className="text-[0.7rem] font-bold text-amber-400 uppercase tracking-wider px-3 py-2 mt-2">
                      {item.section}
                    </SidebarGroupLabel>
                  ) : null;
                }

                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={isCollapsed ? item.label : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all font-medium ${
                        active
                          ? 'bg-amber-400/20 text-amber-400 font-semibold border-l-4 border-amber-400'
                          : 'text-white/75 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <NavLink
                        to={item.path}
                        onClick={() => {
                          if (isMobile) setOpenMobile(false);
                        }}
                      >
                        <Icon size={18} strokeWidth={active ? 2.5 : 2} className={active ? 'text-amber-400' : 'text-current'} />
                        {!isCollapsed && <span>{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 mt-auto border-t border-white/10">
        <button
          onClick={logout}
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

const SuperAdminSidebar = (props) => {
  return (
    <SidebarProvider
      open={!props.collapsed}
      onOpenChange={(open) => props.setCollapsed && props.setCollapsed(!open)}
    >
      <SuperAdminSidebarInner {...props} />
    </SidebarProvider>
  );
};

export default SuperAdminSidebar;
