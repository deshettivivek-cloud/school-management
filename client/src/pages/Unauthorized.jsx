import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineShieldExclamation, HiOutlineHome } from 'react-icons/hi';

const Unauthorized = () => {
  const { user, isAuthenticated } = useAuth();

  const getDashboardLink = () => {
    if (!isAuthenticated) return '/login';
    if (user?.role === 'super_admin') return '/super-admin/dashboard';
    return '/dashboard';
  };

  const getDashboardLabel = () => {
    if (!isAuthenticated) return 'Go to Login';
    if (user?.role === 'super_admin') return 'Return to Admin Dashboard';
    return 'Return to Dashboard';
  };

  return (
    <div className="auth-page" style={{ flexDirection: 'column' }}>
      <div className="auth-bg-effects">
        <div className="auth-bg-orb auth-bg-orb-1" style={{ background: 'radial-gradient(circle, rgba(239, 68, 68, 0.15), transparent 70%)' }} />
        <div className="auth-bg-orb auth-bg-orb-2" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1), transparent 70%)' }} />
      </div>

      <div className="auth-card animate-slide-up" style={{ textAlign: 'center' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', margin: '0 auto 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.1))',
          border: '2px solid rgba(239, 68, 68, 0.2)',
        }}>
          <HiOutlineShieldExclamation size={36} style={{ color: '#ef4444' }} />
        </div>

        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, color: '#ef4444', marginBottom: '0.5rem', lineHeight: 1 }}>
          403
        </h1>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
          Access Denied
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: 400, lineHeight: 1.6 }}>
          You do not have the required permissions to access this page.
          {user?.role === 'super_admin'
            ? ' This area is restricted to school users.'
            : ' If you believe this is an error, please contact your administrator.'}
        </p>

        <Link to={getDashboardLink()} className="auth-btn auth-btn-primary" style={{ display: 'inline-flex', padding: '0.75rem 2rem' }}>
          <HiOutlineHome size={18} />
          {getDashboardLabel()}
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
