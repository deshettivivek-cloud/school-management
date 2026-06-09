import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlineSave, HiOutlineArrowLeft } from 'react-icons/hi';
import PrintSection from '../../components/PrintSection';

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
    <PrintSection title="Issue Transfer Certificate">
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-info">
          <h1>Issue Transfer Certificate</h1>
          <p>Issue TC for a leaving student</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/tc/register')}>
          View TC Register
        </button>
      </div>

      <div className="card" style={{ maxWidth: 800 }}>
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
                  <strong>{s.name}</strong> — {s.admissionNo} — Class {s.grade}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Student */}
        {selectedStudent && (
          <div style={{
            padding: '1rem', background: 'rgba(99, 102, 241, 0.1)',
            borderRadius: 'var(--radius-md)', marginBottom: '1.5rem',
            border: '1px solid rgba(99, 102, 241, 0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                  {selectedStudent.name}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {selectedStudent.admissionNo} • Class {selectedStudent.grade} • Parent: {selectedStudent.parentName}
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
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date of Leaving *</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.dateOfLeaving}
                  onChange={(e) => setForm({ ...form, dateOfLeaving: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Conduct</label>
                <select
                  className="form-select"
                  value={form.conduct}
                  onChange={(e) => setForm({ ...form, conduct: e.target.value })}
                >
                  <option value="Excellent">Excellent</option>
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
                placeholder="e.g., Family relocation, Admission in another school"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Remarks</label>
              <textarea
                className="form-textarea"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                placeholder="Optional additional remarks"
                rows={2}
              />
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
    </PrintSection>
  );
};

export default IssueTc;
