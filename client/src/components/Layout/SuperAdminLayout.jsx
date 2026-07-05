import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SuperAdminSidebar from './SuperAdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { Menu, ShieldCheck, ChevronDown } from 'lucide-react';

const SuperAdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'SA';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="app-layout">
      <SuperAdminSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <header className={`header ${collapsed ? 'sidebar-collapsed' : ''}`}>
          <div className="header-left">
            <button
              className="btn btn-ghost btn-icon sa-mobile-menu-btn"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={22} />
            </button>
          </div>

          <div className="header-right">
            <div className="header-user">
              <div className="header-avatar" style={{ background: 'var(--warning-500)' }}>
                {getInitials(user?.name)}
              </div>
              <div className="header-user-info">
                <span className="header-user-name">{user?.name || 'Super Admin'}</span>
                <span className="header-user-role" style={{ color: 'var(--warning-600)', display: 'flex', alignItems: 'center' }}>
                  <ShieldCheck size={12} style={{ marginRight: '0.2rem' }} />
                  Super Admin
                </span>
              </div>
              <ChevronDown size={16} style={{ color: 'var(--text-muted)', marginLeft: '0.25rem' }} />
            </div>
          </div>

          <style>{`
            .sa-mobile-menu-btn { display: none !important; }
            @media (max-width: 768px) {
              .sa-mobile-menu-btn { display: flex !important; }
            }
          `}</style>
        </header>

        <div className="page-content animate-fade-in">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
