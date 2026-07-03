import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineMail, HiOutlineArrowLeft, HiOutlineCheckCircle } from 'react-icons/hi';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (error) {
      toast.error('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-effects">
        <div className="auth-bg-orb auth-bg-orb-1" />
        <div className="auth-bg-orb auth-bg-orb-2" />
        <div className="auth-bg-orb auth-bg-orb-3" />
      </div>

      <div className="auth-card animate-slide-up">
        {sent ? (
          <div className="auth-success">
            <div className="auth-success-icon">
              <HiOutlineCheckCircle size={48} />
            </div>
            <h1 className="auth-title">Check Your Email</h1>
            <p className="auth-subtitle">
              If that email is registered, you'll receive a reset link.
              Please check your inbox and spam folder.
            </p>
            <Link to="/login" className="auth-btn auth-btn-outline" style={{ marginTop: '1.5rem' }}>
              <HiOutlineArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <div className="auth-header">
              <div className="auth-logo">
                <span className="auth-logo-icon">🔑</span>
              </div>
              <h1 className="auth-title">Forgot Password</h1>
              <p className="auth-subtitle">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-field">
                <label className="auth-label" htmlFor="reset-email">
                  <HiOutlineMail className="auth-label-icon" />
                  Email Address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  className="auth-input"
                  placeholder="you@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <button
                id="forgot-password-submit"
                type="submit"
                className="auth-btn auth-btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="auth-spinner" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            <div className="auth-footer">
              <Link to="/login" className="auth-link">
                <HiOutlineArrowLeft size={14} style={{ marginRight: '0.25rem' }} />
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
