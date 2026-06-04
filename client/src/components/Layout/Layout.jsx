import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ title }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
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
