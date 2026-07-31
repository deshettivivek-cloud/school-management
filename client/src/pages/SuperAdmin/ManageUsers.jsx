import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  HiOutlineUserGroup,
  HiOutlineUserAdd,
  HiOutlineSearch,
  HiOutlineTrash,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineOfficeBuilding,
  HiOutlineKey,
  HiOutlineBan,
  HiOutlineCheckCircle,
} from 'react-icons/hi';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'teacher',
    schoolId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, schoolsRes] = await Promise.all([
        api.get('/super-admin/users'),
        api.get('/super-admin/schools'),
      ]);
      setUsers(usersRes.data.data || []);
      setSchools(schoolsRes.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password || !form.schoolId) {
      toast.error('All fields are required');
      return;
    }

    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setCreating(true);
    try {
      const res = await api.post('/super-admin/users', form);
      toast.success(res.data.message || 'User created successfully');
      setShowCreateModal(false);
      setForm({ name: '', email: '', password: '', role: 'teacher', schoolId: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (userId, userName, schoolId, email) => {
    if (!window.confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/super-admin/users/${userId}`, { data: { schoolId, email } });
      toast.success('User deleted');
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleResetPassword = async (userId, userName, schoolId) => {
    if (!window.confirm(`Are you sure you want to reset the password for "${userName}"?`)) return;
    try {
      const res = await api.post(`/super-admin/users/${userId}/reset-password`, { schoolId });
      toast.success(`Password reset! New Temp Password: ${res.data.data.temporaryPassword}`, { duration: 8000 });
      fetchData(); // Refresh to show pending change
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleUpdateStatus = async (userId, status, userName, schoolId) => {
    if (!window.confirm(`Are you sure you want to mark "${userName}" as ${status}?`)) return;
    try {
      await api.patch(`/super-admin/users/${userId}/status`, { status, schoolId });
      toast.success(`User ${status} successfully`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    setForm({ ...form, password: pwd });
    setShowPassword(true);
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase()) ||
    u.school_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (role) => {
    const styles = {
      principal: { bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' },
      clerk: { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' },
      teacher: { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' },
    };
    const s = styles[role] || styles.teacher;
    return (
      <span style={{
        padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)',
        fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize',
        background: s.bg, color: s.color,
      }}>{role}</span>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="page-header">
        <div className="page-header-info">
          <h1>Users</h1>
          <p>Manage school users across all institutions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <HiOutlineUserAdd size={18} />
          Create User
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <HiOutlineSearch size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, email, role, or school..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)} />
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HiOutlineUserAdd />
                Create School User
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form className="modal-body" onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <HiOutlineMail size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="user@school.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    <HiOutlineLockClosed size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
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
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showPassword ? <HiOutlineEyeOff size={16} /> : <HiOutlineEye size={16} />}
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  User must change this password on first login
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <HiOutlineOfficeBuilding size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                  School
                </label>
                <select
                  className="form-select"
                  value={form.schoolId}
                  onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
                >
                  <option value="">Select a school</option>
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-select"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="principal">Principal</option>
                  <option value="clerk">Clerk</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={creating}>
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Users Table */}
      <div className="table-container">
        <div className="table-wrapper">
          {loading ? (
            <div className="spinner-container"><div className="spinner" /></div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <HiOutlineUserGroup size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p>{search ? 'No users match your search' : 'No users created yet'}</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>School</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem' }}>
                        <HiOutlineOfficeBuilding size={14} style={{ color: 'var(--text-muted)' }} />
                        {user.school_name}
                      </span>
                    </td>
                    <td>
                      {user.is_active === 0 || user.is_active === false ? (
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 600, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                          Suspended
                        </span>
                      ) : user.must_change_password ? (
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 600, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                          Pending Password Change
                        </span>
                      ) : (
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 600, background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}>
                          Active
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="btn btn-ghost btn-sm" style={{ color: '#f59e0b' }} onClick={() => handleResetPassword(user.id, user.name, user.school_id)} title="Reset Password">
                          <HiOutlineKey size={16} />
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ color: '#f97316' }} onClick={() => handleUpdateStatus(user.id, 'suspended', user.name, user.school_id)} title="Suspend User">
                          <HiOutlineBan size={16} />
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ color: '#10b981' }} onClick={() => handleUpdateStatus(user.id, 'active', user.name, user.school_id)} title="Activate User">
                          <HiOutlineCheckCircle size={16} />
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} onClick={() => handleDelete(user.id, user.name, user.school_id, user.email)} title="Delete user">
                          <HiOutlineTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ManageUsers;
