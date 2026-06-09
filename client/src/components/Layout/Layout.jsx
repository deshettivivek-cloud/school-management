import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const Layout = ({ title }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const [schoolLogo, setSchoolLogo] = useState(null);

  useEffect(() => {
    if (user?.schoolId) {
      api.get('/schools')
        .then(res => {
          const logo = res.data.data?.logo_url || res.data.data?.logo;
          if (logo) setSchoolLogo(logo);
        })
        .catch(err => console.error('Failed to fetch school logo:', err));
    }
  }, [user]);

  return (
    <div className="app-layout" style={{ position: 'relative' }}>
      {schoolLogo && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${schoolLogo})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: '500px',
            opacity: 0.03,
            pointerEvents: 'none',
            zIndex: 0
          }}
        />
      )}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`} style={{ position: 'relative', zIndex: 1 }}>
        <Header
          title={title}
          collapsed={collapsed}
          setMobileOpen={setMobileOpen}
        />
        <div className="page-content animate-fade-in">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
