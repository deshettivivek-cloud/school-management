import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Lock, Eye, EyeOff, BookOpen, Heart, Users, CreditCard, BarChart2, ArrowRight } from 'lucide-react';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!identifier || !password) {
      toast.error('Please enter both your credentials');
      return;
    }

    setLoading(true);
    try {
      const userData = await signIn(identifier, password);

      if (userData.mustChangePassword) {
        toast('Please change your password to continue', { icon: '🔑' });
        navigate('/change-password', { replace: true });
      } else {
        toast.success('Welcome back!');
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-mockup-split">
      {/* LEFT PANE: Light Canvas */}
      <div className="mockup-left-pane">
        
        {/* Header */}
        <div className="mockup-left-header">
          <div className="mockup-logo-area">
            <BookOpen size={28} color="#6D5AE0" />
            <span>ClassOrbit</span>
          </div>
          <div className="mockup-trusted-badge">
            <Heart size={16} fill="currentColor" />
            Trusted by modern schools
          </div>
        </div>

        {/* Content */}
        <div className="mockup-left-content">
          
          <div style={{ position: 'relative' }}>
            <span className="mockup-handwritten" style={{ top: '-1rem', right: '-4rem' }}>
              Better tools.<br/>A brighter tomorrow.
            </span>
            <h1 className="mockup-title">
              Welcome to<br/>
              <span>ClassOrbit</span>
            </h1>
          </div>
          
          <p className="mockup-subtitle">
            A smarter way to manage your school. Simplify attendance, fees, academics and everything in between — all in one place.
          </p>

          <div className="mockup-feature-row">
            <div className="mockup-feature-icon mockup-icon-purple">
              <Users size={24} />
            </div>
            <div className="mockup-feature-text">
              <h3>Attendance Tracking</h3>
              <p>Accurate. Instant. Hassle-free.</p>
            </div>
          </div>

          <div className="mockup-feature-row">
            <div className="mockup-feature-icon mockup-icon-green">
              <CreditCard size={24} />
            </div>
            <div className="mockup-feature-text">
              <h3>Fee Management</h3>
              <p>Simple. Secure. Transparent.</p>
            </div>
          </div>

          <div className="mockup-feature-row">
            <div className="mockup-feature-icon mockup-icon-orange">
              <BarChart2 size={24} />
            </div>
            <div className="mockup-feature-text">
              <h3>Real-time Reports</h3>
              <p>Better insights. Better decisions.</p>
            </div>
          </div>
          
          <div style={{ position: 'relative', marginTop: '2rem' }}>
            <span className="mockup-handwritten" style={{ bottom: '-1rem', left: '0', fontSize: '1.25rem', transform: 'rotate(-3deg)' }}>
              Empowering<br/>Smarter Education
            </span>
          </div>

        </div>
      </div>

      {/* RIGHT PANE: Purple Gradient & Login Card */}
      <div className="mockup-right-pane">
        
        <div className="mockup-wavy-bg"></div>
        <div className="mockup-wavy-bg-2"></div>

        <div className="mockup-login-card">
          
          <div className="mockup-card-header">
            <div className="mockup-card-logo">
              <BookOpen className="mockup-card-logo-icon" size={28} />
              ClassOrbit
            </div>
            <p className="mockup-card-subtitle">Sign in to your school account</p>
          </div>

          <form onSubmit={handleSubmit}>
            
            <div className="mockup-input-group">
              <label className="mockup-label" htmlFor="login-identifier">
                Email or Username
              </label>
              <div className="mockup-input-wrapper">
                <User size={18} className="mockup-input-icon" />
                <input
                  id="login-identifier"
                  type="text"
                  className="mockup-input"
                  placeholder="Enter email or username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="mockup-input-group">
              <label className="mockup-label" htmlFor="login-password">
                Password
              </label>
              <div className="mockup-input-wrapper">
                <Lock size={18} className="mockup-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="mockup-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  style={{ position: 'absolute', right: '1rem', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', display: 'flex' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#4B5563', cursor: 'pointer', fontWeight: 500 }}>
                <input type="checkbox" style={{ accentColor: '#6D5AE0', width: '1rem', height: '1rem', cursor: 'pointer' }} />
                Keep me signed in
              </label>
              <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: '#6D5AE0', fontWeight: 600, textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="mockup-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderColor: 'white', borderTopColor: 'transparent' }} />
                  Signing in...
                </>
              ) : (
                <>
                  <ArrowRight size={18} /> Sign In
                </>
              )}
            </button>
          </form>
          
          <div className="mockup-footer-link">
            Need help? <a href="#">Contact your school admin</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
