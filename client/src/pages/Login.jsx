import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineLockClosed, HiOutlineMail } from 'react-icons/hi';



const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back! 🎉');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="login-page">
      <div className="login-card animate-slide-up">
        <div className="login-logo">🏫</div>
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Sign in to your School Management System</p>



        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <HiOutlineMail style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="admin@school.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <HiOutlineLockClosed style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Default: admin@school.com / admin123
        </p>
      </div>
    </div>
  );
};

export default Login;
