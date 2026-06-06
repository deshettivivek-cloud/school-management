import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineOfficeBuilding, HiOutlineKey } from 'react-icons/hi';

const Onboarding = () => {
  const { user, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('create');
  
  useEffect(() => {
    if (user?.schoolId) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);
  
  // Create Form State
  const [schoolName, setSchoolName] = useState('');
  const [academicYear, setAcademicYear] = useState('2024-2025');
  
  // Join Form State
  const [joinCode, setJoinCode] = useState('');
  
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!schoolName || !academicYear) return toast.error('Please fill all fields');
    
    setLoading(true);
    try {
      await api.post('/schools/register', { name: schoolName, academicYear });
      await refreshProfile();
      toast.success('School created! You are now the Principal.');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create school');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode) return toast.error('Please enter a join code');
    
    setLoading(true);
    try {
      await api.post('/schools/join', { joinCode });
      await refreshProfile();
      toast.success('Successfully joined the school!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid join code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card animate-slide-up" style={{ maxWidth: 500 }}>
        <div className="login-logo">🎓</div>
        <h1 className="login-title">Welcome, {user?.name}!</h1>
        <p className="login-subtitle">You need to connect to a school to continue.</p>

        <div className="tabs" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn ${activeTab === 'create' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1 }}
            onClick={() => setActiveTab('create')}
          >
            Create New School
          </button>
          <button 
            className={`btn ${activeTab === 'join' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1 }}
            onClick={() => setActiveTab('join')}
          >
            Join Existing School
          </button>
        </div>

        {activeTab === 'create' ? (
          <form className="login-form animate-fade-in" onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">
                <HiOutlineOfficeBuilding style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />
                School Name
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Springfield Elementary"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Academic Year</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 2024-2025"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: '1rem' }}>
              {loading ? 'Creating...' : 'Create School & Become Principal'}
            </button>
          </form>
        ) : (
          <form className="login-form animate-fade-in" onSubmit={handleJoin}>
            <div className="form-group">
              <label className="form-label">
                <HiOutlineKey style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />
                Join Code
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter 6-character code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                style={{ textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'center', fontSize: '1.25rem' }}
                maxLength={6}
              />
              <p className="form-help" style={{ textAlign: 'center', marginTop: '0.5rem' }}>Ask your Principal for this code</p>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: '1rem' }}>
              {loading ? 'Joining...' : 'Join School'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button className="btn btn-ghost" onClick={logout}>Sign out and use a different account</button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
