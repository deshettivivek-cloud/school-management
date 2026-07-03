import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff, HiOutlineShieldCheck } from 'react-icons/hi';

const SuperAdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { superAdminSignIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const userData = await superAdminSignIn(email, password);

      if (userData.mustChangePassword) {
        toast('Please change your password to continue', { icon: '🔑' });
        navigate('/change-password', { replace: true });
      } else {
        toast.success('Welcome, Super Admin!');
        navigate('/super-admin/dashboard', { replace: true });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page-admin">
      <div className="auth-bg-effects">
        <div className="auth-bg-orb auth-bg-orb-1 auth-bg-orb-admin" />
        <div className="auth-bg-orb auth-bg-orb-2 auth-bg-orb-admin" />
        <div className="auth-bg-orb auth-bg-orb-3 auth-bg-orb-admin" />
      </div>

      <div className="auth-card animate-slide-up">
        <div className="auth-header">
          <div className="auth-logo auth-logo-admin">
            <HiOutlineShieldCheck className="auth-logo-shield" />
          </div>
          <h1 className="auth-title">Administration Portal</h1>
          <p className="auth-subtitle">Super Admin access only</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="admin-email">
              <HiOutlineMail className="auth-label-icon" />
              Email Address
            </label>
            <input
              id="admin-email"
              type="email"
              className="auth-input"
              placeholder="admin@schoolms.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="admin-password">
              <HiOutlineLockClosed className="auth-label-icon" />
              Password
            </label>
            <div className="auth-input-group">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
              </button>
            </div>
          </div>

          <button
            id="admin-login-submit"
            type="submit"
            className="auth-btn auth-btn-admin"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="auth-spinner" />
                Authenticating...
              </>
            ) : (
              <>
                <HiOutlineShieldCheck size={18} />
                Sign In as Super Admin
              </>
            )}
          </button>
        </form>

        <div className="auth-footer" style={{ padding: '0.5rem', border: 'none' }}>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
