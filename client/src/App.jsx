import { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import SuperAdminLayout from './components/Layout/SuperAdminLayout';
import Login from './pages/Login';
import SuperAdminLogin from './pages/SuperAdminLogin';
import ChangePassword from './pages/ChangePassword';
import ForgotPassword from './pages/ForgotPassword';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SchoolSetup = lazy(() => import('./pages/SchoolSetup'));
const AdmissionsList = lazy(() => import('./pages/Admissions/AdmissionsList'));
const AdmissionForm = lazy(() => import('./pages/Admissions/AdmissionForm'));
const VirtualAdmissionForm = lazy(() => import('./pages/Admissions/VirtualAdmissionForm'));
const StudentDirectory = lazy(() => import('./pages/Students/StudentDirectory'));
const StudentProfile = lazy(() => import('./pages/Students/StudentProfile'));
const FeeStructure = lazy(() => import('./pages/Fees/FeeStructure'));
const FeeCollection = lazy(() => import('./pages/Fees/FeeCollection'));
const PendingFees = lazy(() => import('./pages/Fees/PendingFees'));
const ReceiptView = lazy(() => import('./pages/Fees/ReceiptView'));
const YearEndPromotion = lazy(() => import('./pages/Promotion/YearEndPromotion'));
const IssueTc = lazy(() => import('./pages/TC/IssueTc'));
const TcRegister = lazy(() => import('./pages/TC/TcRegister'));
const TcView = lazy(() => import('./pages/TC/TcView'));
import Unauthorized from './pages/Unauthorized';
const RoleManagement = lazy(() => import('./pages/Admin/RoleManagement'));
const SchoolExpenditure = lazy(() => import('./pages/Expenditure/SchoolExpenditure'));
const HallTicket = lazy(() => import('./pages/Exams/HallTicket'));
const EmployeeDashboard = lazy(() => import('./pages/Employees/EmployeeDashboard'));
const AddEmployee = lazy(() => import('./pages/Employees/AddEmployee'));
const EmployeeProfile = lazy(() => import('./pages/Employees/EmployeeProfile'));
const SalaryDashboard = lazy(() => import('./pages/Salary/SalaryDashboard'));
const SalaryStructure = lazy(() => import('./pages/Salary/SalaryStructure'));
const MonthlySalary = lazy(() => import('./pages/Salary/MonthlySalary'));
const SalaryHistory = lazy(() => import('./pages/Salary/SalaryHistory'));
const SalaryReports = lazy(() => import('./pages/Salary/SalaryReports'));
const PayslipView = lazy(() => import('./pages/Salary/PayslipView'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdmin/SuperAdminDashboard'));
const ManageSchools = lazy(() => import('./pages/SuperAdmin/ManageSchools'));
const ManageUsers = lazy(() => import('./pages/SuperAdmin/ManageUsers'));
const AuditLogs = lazy(() => import('./pages/SuperAdmin/AuditLogs'));
const SuperAdminBugReports = lazy(() => import('./pages/SuperAdmin/SuperAdminBugReports'));
const ReportsDashboard = lazy(() => import('./pages/Reports/ReportsDashboard'));
const ReportViewer = lazy(() => import('./pages/Reports/ReportViewer'));
const AttendanceRegister = lazy(() => import('./pages/Attendance/AttendanceRegister'));
const CalendarView = lazy(() => import('./pages/CalendarView'));
const AnnouncementsDashboard = lazy(() => import('./pages/Announcements/AnnouncementsDashboard'));
const BulkMessaging = lazy(() => import('./pages/Communications/BulkMessaging'));
const SmsHistory = lazy(() => import('./pages/Communications/SmsHistory'));
const ReportBug = lazy(() => import('./pages/BugReports/ReportBug'));
const BugReportsList = lazy(() => import('./pages/BugReports/BugReportsList'));
const ImportStudents = lazy(() => import('./pages/Students/ImportStudents'));
const ImportEmployees = lazy(() => import('./pages/Employees/ImportEmployees'));

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
  if (user && !user.tenantDb) {
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
    <Suspense fallback={
      <div className="spinner-container" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    }>
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
        <Route path="/super-admin/bug-reports" element={<SuperAdminBugReports />} />
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
        <Route path="/communications" element={<BulkMessaging />} />
        <Route path="/communications/history" element={<SmsHistory />} />
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

        {/* Bug Reports */}
        <Route path="/report-bug" element={<ReportBug />} />

        {/* Principal Only */}
        <Route element={<ProtectedRoute allowedRoles={['principal']}><Outlet /></ProtectedRoute>}>
          <Route path="/school-setup" element={<SchoolSetup />} />
          <Route path="/promotion" element={<YearEndPromotion />} />
          <Route path="/bug-reports" element={<BugReportsList />} />
          <Route path="/students/import" element={<ImportStudents />} />
          <Route path="/employees/import" element={<ImportEmployees />} />
        </Route>
      </Route>

      {/* ──── Catch-All ──── */}
      <Route path="*" element={<CatchAllRoute />} />
      </Routes>
    </Suspense>
  );
}

export default App;
