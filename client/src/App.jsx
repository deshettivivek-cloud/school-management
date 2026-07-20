import { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import SuperAdminLayout from './components/Layout/SuperAdminLayout';
import Login from './pages/Login';
import SuperAdminLogin from './pages/SuperAdminLogin';
import ChangePassword from './pages/ChangePassword';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import SchoolSetup from './pages/SchoolSetup';
import AdmissionsList from './pages/Admissions/AdmissionsList';
import AdmissionForm from './pages/Admissions/AdmissionForm';
import VirtualAdmissionForm from './pages/Admissions/VirtualAdmissionForm';
import StudentDirectory from './pages/Students/StudentDirectory';
import StudentProfile from './pages/Students/StudentProfile';
import FeeStructure from './pages/Fees/FeeStructure';
import FeeCollection from './pages/Fees/FeeCollection';
import PendingFees from './pages/Fees/PendingFees';
import ReceiptView from './pages/Fees/ReceiptView';
import YearEndPromotion from './pages/Promotion/YearEndPromotion';
import IssueTc from './pages/TC/IssueTc';
import TcRegister from './pages/TC/TcRegister';
import TcView from './pages/TC/TcView';
import Unauthorized from './pages/Unauthorized';
import RoleManagement from './pages/Admin/RoleManagement';
import SchoolExpenditure from './pages/Expenditure/SchoolExpenditure';
import HallTicket from './pages/Exams/HallTicket';
import EmployeeDashboard from './pages/Employees/EmployeeDashboard';
import AddEmployee from './pages/Employees/AddEmployee';
import EmployeeProfile from './pages/Employees/EmployeeProfile';
import SalaryDashboard from './pages/Salary/SalaryDashboard';
import SalaryStructure from './pages/Salary/SalaryStructure';
import MonthlySalary from './pages/Salary/MonthlySalary';
import SalaryHistory from './pages/Salary/SalaryHistory';
import SalaryReports from './pages/Salary/SalaryReports';
import PayslipView from './pages/Salary/PayslipView';
import SuperAdminDashboard from './pages/SuperAdmin/SuperAdminDashboard';
import ManageSchools from './pages/SuperAdmin/ManageSchools';
import ManageUsers from './pages/SuperAdmin/ManageUsers';
import AuditLogs from './pages/SuperAdmin/AuditLogs';
import ReportsDashboard from './pages/Reports/ReportsDashboard';
import ReportViewer from './pages/Reports/ReportViewer';
import AttendanceRegister from './pages/Attendance/AttendanceRegister';
import CalendarView from './pages/CalendarView';
import AnnouncementsDashboard from './pages/Announcements/AnnouncementsDashboard';

// Protected route wrapper — requires authentication
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, hasAccess, user } = useAuth();

  if (loading) {
    return (
      <div className="spinner-container" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Force password change redirect
  if (user?.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles && !hasAccess(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Super Admin route guard — only super_admin can access
const SuperAdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="spinner-container" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/super-admin/login" replace />;
  }

  if (user?.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  if (user?.role !== 'super_admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// School user route guard — blocks super_admin from school pages
const SchoolUserRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="spinner-container" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  if (user?.role === 'super_admin') {
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  return children;
};

// School requirement wrapper
const RequireSchool = ({ children }) => {
  const { user } = useAuth();
  if (user && !user.schoolId) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-default)', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: 500, textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>No School Assigned</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Your account has not yet been assigned to a school workspace. 
            Please contact your platform administrator to provision your account.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.href = '/login'}>Return to Login</button>
        </div>
      </div>
    );
  }
  return children;
};

// Smart login router for portal-aware session handling
const PortalLoginRoute = ({ children, expectedPortal }) => {
  const { isAuthenticated, loading, user, logout } = useAuth();
  
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (expectedPortal === 'super_admin' && user.role !== 'super_admin') {
        logout();
      } else if (expectedPortal === 'school_user' && user.role === 'super_admin') {
        logout();
      }
    }
  }, [loading, isAuthenticated, user, expectedPortal, logout]);
  
  if (loading) {
    return (
      <div className="spinner-container" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    if (expectedPortal === 'super_admin') {
      if (user.role === 'super_admin') {
        return <Navigate to="/super-admin/dashboard" replace />;
      } else {
        // Wrong portal (school user on super admin login)
        return <div className="spinner-container"><div className="spinner" /></div>;
      }
    } else if (expectedPortal === 'school_user') {
      if (user.role === 'super_admin') {
        // Wrong portal (super admin on school user login)
        return <div className="spinner-container"><div className="spinner" /></div>;
      } else {
        // Correct portal
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  // Not authenticated or logged out, show the login page
  return children;
};

const CatchAllRoute = () => {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'super_admin' ? '/super-admin/dashboard' : '/dashboard'} replace />;
  }
  return <Navigate to="/login" replace />;
};

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* ──── Public Auth Routes ──── */}
      <Route
        path="/login"
        element={
          <PortalLoginRoute expectedPortal="school_user">
            <Login />
          </PortalLoginRoute>
        }
      />
      <Route
        path="/super-admin/login"
        element={
          <PortalLoginRoute expectedPortal="super_admin">
            <SuperAdminLogin />
          </PortalLoginRoute>
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ForgotPassword />} />

      {/* ──── Change Password (protected, both roles) ──── */}
      <Route path="/change-password" element={
        isAuthenticated ? <ChangePassword /> : <Navigate to="/login" replace />
      } />

      {/* ──── Unauthorized ──── */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* ──── Super Admin Routes ──── */}
      <Route
        element={
          <SuperAdminRoute>
            <SuperAdminLayout />
          </SuperAdminRoute>
        }
      >
        <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
        <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/super-admin/schools" element={<ManageSchools />} />
        <Route path="/super-admin/users" element={<ManageUsers />} />
        <Route path="/super-admin/audit-logs" element={<AuditLogs />} />
        
        {/* Reports */}
        <Route path="/super-admin/reports" element={<ReportsDashboard />} />
        <Route path="/super-admin/reports/:module" element={<ReportViewer />} />
      </Route>

      {/* ──── School User Routes ──── */}
      <Route
        element={
          <SchoolUserRoute>
            <RequireSchool>
              <Layout />
            </RequireSchool>
          </SchoolUserRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/announcements" element={<AnnouncementsDashboard />} />
        <Route path="/students/directory" element={<StudentDirectory />} />
        <Route path="/students/:id" element={<StudentProfile />} />
        <Route path="/attendance" element={<AttendanceRegister />} />
        <Route path="/admissions" element={<AdmissionsList />} />
        <Route path="/admissions/new" element={<AdmissionForm />} />
        <Route path="/admissions/edit/:id" element={<AdmissionForm />} />
        <Route path="/admissions/form/:id" element={<VirtualAdmissionForm />} />
        <Route path="/fees/structure" element={<FeeStructure />} />
        <Route path="/fees/collection" element={<FeeCollection />} />
        <Route path="/fees/pending" element={<PendingFees />} />
        <Route path="/fees/receipt/:collectionId/:paymentId" element={<ReceiptView />} />
        <Route path="/expenditure" element={<SchoolExpenditure />} />
        <Route path="/tc/issue" element={<IssueTc />} />
        <Route path="/tc/register" element={<TcRegister />} />
        <Route path="/tc/view/:id" element={<TcView />} />
        <Route path="/exams/hall-ticket" element={<HallTicket />} />
        
        {/* Employees */}
        <Route path="/employees" element={<EmployeeDashboard />} />
        <Route path="/employees/add" element={<AddEmployee />} />
        <Route path="/employees/:id" element={<EmployeeProfile />} />

        {/* Salary Management */}
        <Route path="/salary/dashboard" element={<SalaryDashboard />} />
        <Route path="/salary/structure" element={<SalaryStructure />} />
        <Route path="/salary/monthly" element={<MonthlySalary />} />
        <Route path="/salary/history" element={<SalaryHistory />} />
        <Route path="/salary/reports" element={<SalaryReports />} />
        <Route path="/salary/slip/:employeeId/:month" element={<PayslipView />} />
        
        {/* Reports */}
        <Route path="/reports" element={<ReportsDashboard />} />
        <Route path="/reports/:module" element={<ReportViewer />} />

        {/* Principal Only */}
        <Route element={<ProtectedRoute allowedRoles={['principal']}><Outlet /></ProtectedRoute>}>
          <Route path="/school-setup" element={<SchoolSetup />} />
          <Route path="/promotion" element={<YearEndPromotion />} />
        </Route>
      </Route>

      {/* ──── Catch-All ──── */}
      <Route path="*" element={<CatchAllRoute />} />
    </Routes>
  );
}

export default App;
