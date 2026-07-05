import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { motion } from 'framer-motion';
import {
  Search, Bell, Plus, Star, Users, BookOpen, Hash, UserPlus, X, Mail, Lock, Eye, EyeOff, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import '../../styles/teachers.css';

const AVATAR_COLORS = ['avatar-navy', 'avatar-gold', 'avatar-teal', 'avatar-rose', 'avatar-purple', 'avatar-orange'];

const TeachersDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [totalDepartments, setTotalDepartments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Add Faculty Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/teachers');
      const data = res.data.data;
      setTeachers(data.teachers || []);
      setTotalTeachers(data.totalTeachers || 0);
      setTotalDepartments(data.totalDepartments || 0);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = useMemo(() => {
    if (!search.trim()) return teachers;
    const q = search.toLowerCase();
    return teachers.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.subject?.toLowerCase().includes(q) ||
        t.teacherIdCode?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q)
    );
  }, [teachers, search]);

  const getInitial = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    // Return first letter of last name, or first letter of first name
    return (parts.length > 1 ? parts[parts.length - 1][0] : parts[0][0]).toUpperCase();
  };

  const getAvatarColor = (index) => {
    return AVATAR_COLORS[index % AVATAR_COLORS.length];
  };

  // Compute a pseudo-rating based on students count (placeholder)
  const getRating = (teacher) => {
    const base = 4.0;
    const bonus = Math.min(teacher.studentsCount / 100, 0.9);
    return (base + bonus).toFixed(1);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    setAddForm({ ...addForm, password: pwd });
    setShowPassword(true);
  };

  const handleAddFaculty = async (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.email || !addForm.password) {
      toast.error('All fields are required');
      return;
    }
    if (addForm.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setAdding(true);
    try {
      const res = await api.post('/auth/register', {
        ...addForm,
        role: 'teacher'
      });
      toast.success(res.data.message || 'Faculty added successfully');
      setShowAddModal(false);
      setAddForm({ name: '', email: '', password: '' });
      fetchTeachers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add faculty');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="teachers-page">
      {/* Top Bar: Breadcrumb + Search + User */}
      <div className="teachers-top-bar">
        <nav className="teachers-breadcrumb">
          <Link to="/dashboard">School</Link>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-active">Teachers</span>
        </nav>

        <div className="teachers-top-right">
          <div className="teachers-search-wrapper">
            <Search className="teachers-search-icon" size={16} />
            <input
              type="text"
              placeholder="Quick search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="teachers-search-input"
            />
          </div>
          <button className="teachers-notification-btn" title="Notifications">
            <Bell size={18} />
          </button>
          <div className="teachers-user-avatar" title={user?.name || 'User'}>
            {getInitials(user?.name)}
          </div>
        </div>
      </div>

      {/* Header: Title + Add Button */}
      <motion.div
        className="teachers-header"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="teachers-header-info">
          <h1>Teaching Staff</h1>
          <p>
            {totalTeachers} faculty member{totalTeachers !== 1 ? 's' : ''} across{' '}
            {totalDepartments} department{totalDepartments !== 1 ? 's' : ''}
          </p>
        </div>
        {user?.role === 'principal' && (
          <button
            className="teachers-add-btn"
            onClick={() => setShowAddModal(true)}
            id="add-faculty-btn"
          >
            <Plus size={18} />
            Add Faculty
          </button>
        )}
      </motion.div>

      {/* Teacher Cards Grid */}
      {loading ? (
        <div className="teachers-loading">
          <div className="teachers-spinner" />
        </div>
      ) : (
        <motion.div
          className="teachers-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          {filteredTeachers.length === 0 ? (
            <div className="teachers-empty">
              <div className="teachers-empty-icon">
                <Users size={32} />
              </div>
              <h3>{search ? 'No Matching Teachers' : 'No Teachers Yet'}</h3>
              <p>
                {search
                  ? 'No teachers match your search criteria. Try a different search.'
                  : 'Teachers will appear here once they join your school and are assigned the teacher role.'}
              </p>
              {!search && user?.role === 'principal' && (
                <button
                  className="teachers-add-btn"
                  onClick={() => setShowAddModal(true)}
                >
                  <UserPlus size={18} />
                  Invite Teachers
                </button>
              )}
            </div>
          ) : (
            filteredTeachers.map((teacher, index) => (
              <motion.div
                key={teacher.id}
                className="teacher-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
              >
                {/* Top: Avatar + Name + Rating */}
                <div className="teacher-card-top">
                  <div className={`teacher-avatar ${getAvatarColor(index)}`}>
                    {getInitial(teacher.name)}
                  </div>
                  <div className="teacher-card-name-area">
                    <h3 className="teacher-card-name">{teacher.name}</h3>
                    <p className="teacher-card-subject">
                      {teacher.subject || 'General'}
                    </p>
                  </div>
                  <div className="teacher-card-rating">
                    <Star size={16} />
                    <span>{getRating(teacher)}</span>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="teacher-card-stats">
                  <div className="teacher-stat">
                    <span className="teacher-stat-label">Classes</span>
                    <span className="teacher-stat-value">
                      {teacher.classesCount}
                    </span>
                  </div>
                  <div className="teacher-stat">
                    <span className="teacher-stat-label">Students</span>
                    <span className="teacher-stat-value">
                      {teacher.studentsCount}
                    </span>
                  </div>
                  <div className="teacher-stat">
                    <span className="teacher-stat-label">ID</span>
                    <span className="teacher-stat-value">
                      {teacher.teacherIdCode}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      {/* Add Faculty Modal */}
      {showAddModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowAddModal(false)} />
          <div className="modal card" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={20} className="icon-blue" />
                Add New Faculty
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <form className="modal-body" onSubmit={handleAddFaculty}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter teacher's name"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Mail size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="teacher@school.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    <Lock size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                    Temporary Password
                  </span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={generatePassword} style={{ fontSize: '0.75rem' }}>
                    Generate
                  </button>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Min. 8 characters"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  The teacher will be required to change this password on their first login.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={adding}>
                  {adding ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default TeachersDashboard;
