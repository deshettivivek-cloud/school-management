import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SchoolSetup from './pages/SchoolSetup';
import AdmissionsList from './pages/Admissions/AdmissionsList';
import AdmissionForm from './pages/Admissions/AdmissionForm';
import VirtualAdmissionForm from './pages/Admissions/VirtualAdmissionForm';
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
import Onboarding from './pages/Onboarding';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, hasAccess } = useAuth();

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

  if (allowedRoles && !hasAccess(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

const RequireSchool = ({ children }) => {
  const { user } = useAuth();
  if (user && !user.schoolId) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
};

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="spinner-container" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />

      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route path="/onboarding" element={
        <ProtectedRoute>
          <Onboarding />
        </ProtectedRoute>
      } />

      <Route
        element={
          <ProtectedRoute>
            <RequireSchool>
              <Layout />
            </RequireSchool>
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admissions" element={<AdmissionsList />} />
        <Route path="/admissions/new" element={<AdmissionForm />} />
        <Route path="/admissions/edit/:id" element={<AdmissionForm />} />
        <Route path="/admissions/form/:id" element={<VirtualAdmissionForm />} />
        <Route path="/fees/structure" element={<FeeStructure />} />
        <Route path="/fees/collection" element={<FeeCollection />} />
        <Route path="/fees/pending" element={<PendingFees />} />
        <Route path="/fees/receipt/:collectionId/:paymentId" element={<ReceiptView />} />
        <Route path="/tc/issue" element={<IssueTc />} />
        <Route path="/tc/register" element={<TcRegister />} />
        <Route path="/tc/view/:id" element={<TcView />} />

        {/* Principal Only */}
        <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
          <Route path="/school-setup" element={<SchoolSetup />} />
          <Route path="/promotion" element={<YearEndPromotion />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
