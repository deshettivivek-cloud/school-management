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
  const [schoolData, setSchoolData] = useState(null);

  useEffect(() => {
    if (user?.tenantDb) {
      api.get('/schools')
        .then(res => {
          if (res.data.data) {
            setSchoolData(res.data.data);
          }
        })
        .catch(err => console.error('Failed to fetch school data:', err));
    }
  }, [user]);

  return (
    <div className="app-layout">
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
          schoolData={schoolData}
        />
        <main className="page-content animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
