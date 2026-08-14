import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { SidebarProvider, SidebarInset } from '../ui/sidebar';

const Layout = ({ title }) => {
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
    <SidebarProvider defaultOpen={true}>
      <Sidebar schoolData={schoolData} />

      <SidebarInset className="flex-1 min-w-0">
        <Header
          title={title}
          schoolData={schoolData}
        />
        <main className="page-content animate-fade-in">
          <Outlet context={{ schoolData }} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
