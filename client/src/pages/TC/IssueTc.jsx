import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlineSave } from 'react-icons/hi';

const IssueTc = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    dateOfLeaving: new Date().toISOString().split('T')[0],
    reason: '',
    conduct: 'Good',
    remarks: '',
  });
  const [saving, setSaving] = useState(false);

  const searchStudents = async () => {
    if (!search.trim()) return;
    try {
      const res = await api.get(`/students?search=${encodeURIComponent(search)}&active=true`);
      setStudents(res.data.data);
    } catch (error) {
      toast.error('Search failed');
    }
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setStudents([]);
    setSearch('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      toast.error('Select a student first');
      return;
    }
    if (!form.dateOfLeaving || !form.reason) {
      toast.error('Date of leaving and reason are required');
      return;
    }

    setSaving(true);
    try {
      await api.post('/tc', {
        studentId: selectedStudent.id,
        ...form,
      });
      toast.success('TC issued successfully! 📜');
      navigate('/tc/register');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to issue TC');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-info">
          <h1>Issue Transfer Certificate</h1>
          <p>Process a new TC request and generate the certificate</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/tc/register')}>
            ← Back to Register
          </button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 850 }}>
        {/* Student Search */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Search Student</label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              className="form-input"
              placeholder="Type student name or admission number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchStudents()}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={searchStudents}>
              <HiOutlineSearch />
            </button>
          </div>

          {students.length > 0 && (
            <div style={{ marginTop: '0.75rem', maxHeight: 200, overflowY: 'auto' }}>
              {students.map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)', marginBottom: '0.35rem',
                    cursor: 'pointer', fontSize: '0.9rem',
                  }}
                  onClick={() => selectStudent(s)}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-400)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <strong>{s.name}</strong> — {s.admission_no || s.admissionNo} — Class {s.grade}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Student Info */}
        {selectedStudent && (
          <div style={{
            padding: '1.25rem', background: 'rgba(99, 102, 241, 0.08)',
            borderRadius: 'var(--radius-md)', marginBottom: '1.5rem',
            border: '1px solid rgba(99, 102, 241, 0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  {selectedStudent.name}
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                }}>
                  <div><strong>Admission No:</strong> {selectedStudent.admission_no || selectedStudent.admissionNo}</div>
                  <div><strong>Class:</strong> {selectedStudent.grade}{selectedStudent.section ? ` — ${selectedStudent.section}` : ''}</div>
                  <div><strong>DOB:</strong> {selectedStudent.dob || '—'}</div>
                  <div><strong>Gender:</strong> {selectedStudent.gender ? selectedStudent.gender.charAt(0).toUpperCase() + selectedStudent.gender.slice(1) : '—'}</div>
                  <div><strong>Father/Mother:</strong> {selectedStudent.parent_name || selectedStudent.parentName || '—'}</div>
                  <div><strong>Phone:</strong> {selectedStudent.parent_phone || selectedStudent.parentPhone || '—'}</div>
                  <div><strong>Aadhaar:</strong> {selectedStudent.aadhar_no || selectedStudent.aadharNo || '—'}</div>
                  <div><strong>Academic Year:</strong> {selectedStudent.academic_year || selectedStudent.academicYear || '—'}</div>
                  <div style={{ gridColumn: '1 / -1' }}><strong>Address:</strong> {selectedStudent.address || '—'}</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedStudent(null)}>
                Change
              </button>
            </div>
          </div>
        )}

        {/* TC Form */}
        {selectedStudent && (
          <form onSubmit={handleSubmit}>
            <div style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--border-color)',
            }}>
              Transfer Certificate Details
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date of Leaving *</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.dateOfLeaving}
                  onChange={(e) => setForm({ ...form, dateOfLeaving: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">General Conduct</label>
                <select
                  className="form-select"
                  value={form.conduct}
                  onChange={(e) => setForm({ ...form, conduct: e.target.value })}
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Very Good">Very Good</option>
                  <option value="Good">Good</option>
                  <option value="Satisfactory">Satisfactory</option>
                  <option value="Needs Improvement">Needs Improvement</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Reason for Leaving *</label>
              <textarea
                className="form-textarea"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="e.g., Family relocation, Admission in another school, Higher studies"
                rows={3}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Remarks</label>
              <textarea
                className="form-textarea"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                placeholder="Optional additional remarks (e.g., scholarship details, achievements)"
                rows={2}
              />
            </div>

            {/* Warning note */}
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
              color: 'var(--warning-400)',
              marginTop: '0.5rem',
            }}>
              ⚠️ <strong>Important:</strong> Once a TC is issued, the student will be marked as inactive and cannot be reversed. Please verify all details carefully before proceeding.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/tc/register')}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <HiOutlineSave /> {saving ? 'Issuing...' : 'Issue TC'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default IssueTc;
