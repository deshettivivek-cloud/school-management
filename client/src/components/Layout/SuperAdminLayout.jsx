import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SuperAdminSidebar from './SuperAdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineMenu, HiOutlineShieldCheck } from 'react-icons/hi';

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
    <div className="app-layout" style={{ position: 'relative' }}>
      <SuperAdminSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`} style={{ position: 'relative', zIndex: 1 }}>
        <header className={`header ${collapsed ? 'sidebar-collapsed' : ''}`} style={{
          background: 'rgba(2, 8, 23, 0.6)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(245, 158, 11, 0.08)',
        }}>
          <div className="header-left">
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setMobileOpen(true)}
              style={{ display: 'none' }}
              id="sa-mobile-menu-btn"
            >
              <HiOutlineMenu size={22} />
            </button>
          </div>

          <div className="header-right">
            <div className="header-user" style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
              <div className="header-avatar" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', boxShadow: '0 0 10px rgba(245, 158, 11, 0.3)' }}>
                {getInitials(user?.name)}
              </div>
              <div className="header-user-info">
                <span className="header-user-name">{user?.name || 'Super Admin'}</span>
                <span className="header-user-role" style={{ color: '#f59e0b' }}>
                  <HiOutlineShieldCheck size={12} style={{ marginRight: '0.2rem', verticalAlign: 'middle' }} />
                  Super Admin
                </span>
              </div>
            </div>
          </div>

          <style>{`
            @media (max-width: 768px) {
              #sa-mobile-menu-btn { display: flex !important; }
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
