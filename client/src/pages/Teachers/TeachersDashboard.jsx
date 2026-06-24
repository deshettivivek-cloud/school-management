import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { motion } from 'framer-motion';
import {
  Search, Bell, Plus, Star, Users, BookOpen, Hash, UserPlus
} from 'lucide-react';
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
        <button
          className="teachers-add-btn"
          onClick={() => navigate('/school-setup')}
          id="add-faculty-btn"
        >
          <Plus size={18} />
          Add Faculty
        </button>
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
              {!search && (
                <button
                  className="teachers-add-btn"
                  onClick={() => navigate('/school-setup')}
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
    </div>
  );
};

export default TeachersDashboard;
