import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { sanitizeDigitInput } from '../../utils/inputHelpers';
import {
  HiOutlineOfficeBuilding,
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineSearch,
  HiOutlineClipboardCopy,
  HiPlus,
  HiOutlineEye,
  HiOutlineEyeOff,
} from 'react-icons/hi';

const ManageSchools = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editSchool, setEditSchool] = useState(null);
  const [updating, setUpdating] = useState(false);
  
  const [form, setForm] = useState({
    schoolName: '',
    schoolCode: '',
    dbName: '',
    address: '',
    phone: '',
    email: '',
    academicYear: '2023-2024',
    logo: '',
    principalName: '',
    principalEmail: '',
    temporaryPassword: '',
  });

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const res = await api.get('/super-admin/schools');
      setSchools(res.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch schools');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const viewSchoolDetails = async (schoolId) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/super-admin/schools/${schoolId}`);
      setSelectedSchool(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch school details');
    } finally {
      setDetailLoading(false);
    }
  };

  const copyJoinCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Join code "${code}" copied!`);
  };

  const filteredSchools = schools.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.join_code?.toLowerCase().includes(search.toLowerCase())
  );

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    setForm({ ...form, temporaryPassword: pwd });
    setShowPassword(true);
  };

  const handleCreateSchool = async (e) => {
    e.preventDefault();
    if (!form.schoolName || !form.principalName || !form.principalEmail || !form.temporaryPassword) {
      toast.error('Please fill required fields (School Name, Principal Name, Principal Email, Password)');
      return;
    }
    
    setCreating(true);
    try {
      const res = await api.post('/super-admin/schools', form);
      toast.success(res.data.message || 'School Created Successfully');
      setShowCreateModal(false);
      setForm({
        schoolName: '', schoolCode: '', dbName: '', address: '', phone: '', email: '', academicYear: '2023-2024',
        logo: '',
        principalName: '', principalEmail: '', temporaryPassword: '',
      });
      fetchSchools();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create school');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateSchool = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const payload = {
        name: editSchool.name,
        address: editSchool.address,
        phone: editSchool.phone,
        email: editSchool.email,
        status: editSchool.status,
        academicYear: editSchool.academic_year,
        updated_at: editSchool.updated_at
      };
      const res = await api.patch(`/super-admin/schools/${editSchool.id}`, payload);
      toast.success(res.data.message || 'School updated successfully');
      setEditSchool(null);
      fetchSchools();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update school');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteSchool = async (school) => {
    if (window.confirm(`Are you sure you want to permanently delete ${school.name}? This action cannot be undone.`)) {
      try {
        const res = await api.delete(`/super-admin/schools/${school.id}`, {
          data: { updated_at: school.updated_at }
        });
        toast.success(res.data.message || 'School deleted successfully');
        fetchSchools();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete school');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="page-header">
        <div className="page-header-info">
          <h1>Schools</h1>
          <p>View and manage all registered schools</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <HiPlus size={18} />
          Create School
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <HiOutlineSearch size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search schools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* Create School Modal */}
      {showCreateModal && (
        <>
          <div className="modal-overlay" onClick={() => !creating && setShowCreateModal(false)} />
          <div className="modal" style={{ maxWidth: 800 }}>
            <div className="modal-header">
              <h2>Create New School</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => !creating && setShowCreateModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateSchool}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  
                  {/* School Details */}
                  <div>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--primary-600)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>School Details</h3>
                    <div className="form-group">
                      <label className="form-label">School Name *</label>
                      <input className="form-input" type="text" required value={form.schoolName} onChange={e => setForm({...form, schoolName: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Database Name (Optional)</label>
                      <input className="form-input" type="text" placeholder="Auto-generated if left blank" value={form.dbName} onChange={e => setForm({...form, dbName: e.target.value})} />
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Leave blank to automatically create a database for this school.</p>
                    </div>
                    <div className="form-group">
                      <label className="form-label">School Join Code (Optional)</label>
                      <input className="form-input" type="text" placeholder="e.g. KV1234" value={form.schoolCode} onChange={e => setForm({...form, schoolCode: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Academic Year</label>
                      <input className="form-input" type="text" value={form.academicYear} onChange={e => setForm({...form, academicYear: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">School Email</label>
                      <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">School Phone</label>
                      <input className="form-input" type="text" maxLength={10} placeholder="10-digit phone number" value={form.phone} onChange={e => setForm({...form, phone: sanitizeDigitInput(e.target.value, 10)})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Address</label>
                      <input className="form-input" type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">School Logo (.png)</label>
                      <input 
                        className="form-input" 
                        type="file" 
                        accept=".png" 
                        onChange={e => {
                          const file = e.target.files[0];
                          if (file) {
                            if (file.type !== 'image/png') {
                              toast.error('Only PNG images are allowed');
                              e.target.value = '';
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setForm({...form, logo: reader.result});
                            };
                            reader.readAsDataURL(file);
                          }
                        }} 
                      />
                      {form.logo && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <img src={form.logo} alt="Preview" style={{ height: '40px', borderRadius: '4px' }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Principal Details */}
                  <div>
                    <h3 style={{ marginBottom: '1rem', color: '#16a34a', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Principal Details</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>This creates the admin user for the school.</p>
                    <div className="form-group">
                      <label className="form-label">Principal Name *</label>
                      <input className="form-input" type="text" required value={form.principalName} onChange={e => setForm({...form, principalName: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Principal Email *</label>
                      <input className="form-input" type="email" required value={form.principalEmail} onChange={e => setForm({...form, principalEmail: e.target.value})} />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Temporary Password *</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            className="form-input"
                            required
                            value={form.temporaryPassword}
                            onChange={e => setForm({...form, temporaryPassword: e.target.value})}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                          >
                            {showPassword ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
                          </button>
                        </div>
                        <button type="button" className="btn btn-outline" onClick={generatePassword} style={{ whiteSpace: 'nowrap' }}>Generate</button>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Principal must change this upon first login.</p>
                    </div>
                  </div>
                </div>

                <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)} disabled={creating}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={creating}>
                    {creating ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Create School'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Edit School Modal */}
      {editSchool && (
        <>
          <div className="modal-overlay" onClick={() => !updating && setEditSchool(null)} />
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2>Edit School</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => !updating && setEditSchool(null)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpdateSchool}>
                <div className="form-group">
                  <label className="form-label">School Name</label>
                  <input className="form-input" type="text" required value={editSchool.name} onChange={e => setEditSchool({...editSchool, name: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={editSchool.status || 'active'} onChange={e => setEditSchool({...editSchool, status: e.target.value})}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Academic Year</label>
                    <input className="form-input" type="text" value={editSchool.academic_year || ''} onChange={e => setEditSchool({...editSchool, academic_year: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={editSchool.email || ''} onChange={e => setEditSchool({...editSchool, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" type="text" maxLength={10} placeholder="10-digit phone number" value={editSchool.phone || ''} onChange={e => setEditSchool({...editSchool, phone: sanitizeDigitInput(e.target.value, 10)})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" type="text" value={editSchool.address || ''} onChange={e => setEditSchool({...editSchool, address: e.target.value})} />
                </div>

                <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditSchool(null)} disabled={updating}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={updating}>
                    {updating ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* School Detail Modal */}
      {selectedSchool && (
        <>
          <div className="modal-overlay" onClick={() => setSelectedSchool(null)} />
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HiOutlineOfficeBuilding />
                {selectedSchool.name}
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedSchool(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Join Code</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '1.1rem', letterSpacing: '2px', color: '#f59e0b' }}>{selectedSchool.join_code}</strong>
                    <button className="btn btn-ghost btn-sm" onClick={() => copyJoinCode(selectedSchool.join_code)}>
                      <HiOutlineClipboardCopy size={14} />
                    </button>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Academic Year</span>
                  <div style={{ fontWeight: 600 }}>{selectedSchool.academic_year}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Students</span>
                  <div style={{ fontWeight: 600 }}>{selectedSchool.studentCount || 0}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Staff</span>
                  <div style={{ fontWeight: 600 }}>{selectedSchool.users?.length || 0}</div>
                </div>
                {selectedSchool.email && (
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email</span>
                    <div>{selectedSchool.email}</div>
                  </div>
                )}
                {selectedSchool.phone && (
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phone</span>
                    <div>{selectedSchool.phone}</div>
                  </div>
                )}
              </div>

              {selectedSchool.users?.length > 0 && (
                <>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Staff Members</h3>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSchool.users.map(u => (
                          <tr key={u.id}>
                            <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{u.name}</td>
                            <td>{u.email}</td>
                            <td>
                              <span style={{
                                padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize',
                                background: 'var(--bg-elevated)',
                                color: u.role === 'principal' ? 'var(--info-500)' : u.role === 'clerk' ? 'var(--success-500)' : 'var(--accent-500)',
                              }}>{u.role}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Schools Table */}
      <div className="table-container">
        <div className="table-wrapper">
          {loading ? (
            <div className="spinner-container"><div className="spinner" /></div>
          ) : filteredSchools.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <HiOutlineOfficeBuilding size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p>{search ? 'No schools match your search' : 'No schools registered yet'}</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>School Name</th>
                  <th>Join Code</th>
                  <th>Academic Year</th>
                  <th>Status</th>
                  <th>Staff</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchools.map((school) => (
                  <tr key={school.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <HiOutlineOfficeBuilding size={16} style={{ color: '#f59e0b' }} />
                        {school.name}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <code style={{ background: '#fffbeb', color: '#d97706', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', letterSpacing: '1px', border: '1px solid #fde68a' }}>
                          {school.join_code}
                        </code>
                        <button className="btn btn-ghost" style={{ padding: '0.2rem' }} onClick={() => copyJoinCode(school.join_code)}>
                          <HiOutlineClipboardCopy size={14} />
                        </button>
                      </div>
                    </td>
                    <td>{school.academic_year}</td>
                    <td>
                      <span style={{ padding: '0.2rem 0.5rem', background: school.status === 'inactive' ? '#fef2f2' : '#f0fdf4', color: school.status === 'inactive' ? '#dc2626' : '#16a34a', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600 }}>
                        {(school.status || 'active').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <HiOutlineUserGroup size={14} />
                        {school.userCount}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(school.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => viewSchoolDetails(school.id)} disabled={detailLoading}>
                          View
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => setEditSchool(school)}>
                          Edit
                        </button>
                        <button className="btn btn-outline btn-sm" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }} onClick={() => handleDeleteSchool(school)}>
                          Delete
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

export default ManageSchools;
