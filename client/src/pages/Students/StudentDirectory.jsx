import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  UploadCloud, UserPlus, Search, Users, Phone, Mail, FileSpreadsheet
} from 'lucide-react';
import { getImageUrl } from '../../utils/helpers';

const StudentDirectory = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get(`/students?active=true`);
      setStudents(res.data.data || []);
      
      // Select first grade by default if exists
      const uniqueGrades = [...new Set((res.data.data || []).map(s => s.grade))].sort((a, b) => {
        const gradeOrder = { 'LKG': -2, 'UKG': -1 };
        const valA = gradeOrder[a] !== undefined ? gradeOrder[a] : parseInt(a) || 0;
        const valB = gradeOrder[b] !== undefined ? gradeOrder[b] : parseInt(b) || 0;
        return valA - valB;
      });
      if (uniqueGrades.length > 0) {
        setSelectedGrade(uniqueGrades[0]);
      }
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    let filtered = students;
    if (selectedGrade) {
      filtered = filtered.filter(s => s.grade === selectedGrade);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(st => 
        st.name?.toLowerCase().includes(s) || 
        st.admission_no?.toLowerCase().includes(s) ||
        (st.parent_name && st.parent_name.toLowerCase().includes(s)) ||
        (st.parent_phone && st.parent_phone.includes(s))
      );
    }
    return filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [students, selectedGrade, search]);

  const grades = useMemo(() => {
    const gradeMap = {};
    students.forEach(s => {
      if (s.grade) {
        gradeMap[s.grade] = (gradeMap[s.grade] || 0) + 1;
      }
    });
    return Object.entries(gradeMap).map(([grade, count]) => ({ grade, count })).sort((a, b) => {
      const gradeOrder = { 'LKG': -2, 'UKG': -1 };
      const valA = gradeOrder[a.grade] !== undefined ? gradeOrder[a.grade] : parseInt(a.grade) || 0;
      const valB = gradeOrder[b.grade] !== undefined ? gradeOrder[b.grade] : parseInt(b.grade) || 0;
      return valA - valB;
    });
  }, [students]);

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem' }}>
      {/* Top Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="page-header-info">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Student Directory</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>Class-wise directory of all active students</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/students/import')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
          >
            <UploadCloud size={18} /> Import Students (.xlsx)
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/admissions/new')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <UserPlus size={18} /> Add Student
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      {!loading && students.length === 0 ? (
        /* Brand-New School Account Zero-Student Onboarding Empty State */
        <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '650px', margin: '2rem auto' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--primary-50, #f5f3ff)',
            color: 'var(--primary-600, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem auto'
          }}>
            <FileSpreadsheet size={36} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.75rem 0', color: 'var(--text-primary)' }}>
            No Student Records Yet
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 2rem 0' }}>
            Get started quickly by importing your existing student roster from an Excel (.xlsx) or CSV file, or add students individually.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/students/import')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: 600 }}
            >
              <UploadCloud size={20} /> Import Students (.xlsx)
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/admissions/new')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '1rem' }}
            >
              <UserPlus size={20} /> Add Student Manually
            </button>
          </div>
        </div>
      ) : (
        /* Existing Student Directory Grid */
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Left Sidebar - Class List */}
          <div style={{
            flex: '1 1 250px',
            maxWidth: '300px',
            background: 'var(--surface)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} /> Classes
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {grades.map(({ grade, count }) => (
                <button
                  key={grade}
                  onClick={() => { setSelectedGrade(grade); setSearch(''); }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: selectedGrade === grade ? 'var(--primary-50)' : 'transparent',
                    color: selectedGrade === grade ? 'var(--primary-600)' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: selectedGrade === grade ? '600' : '500',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                >
                  <span>Class {grade}</span>
                  <span style={{
                    background: selectedGrade === grade ? 'var(--primary-100)' : 'var(--surface-hover)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    color: selectedGrade === grade ? 'var(--primary-700)' : 'var(--text-tertiary)'
                  }}>
                    {count}
                  </span>
                </button>
              ))}
              {grades.length === 0 && !loading && (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>No active classes found.</p>
              )}
            </div>
          </div>

          {/* Right Content - Student List */}
          <div style={{ flex: '3 1 600px', background: 'var(--surface)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>
                {selectedGrade ? `Class ${selectedGrade} Students` : 'Select a Class'}
              </h2>
              <div className="search-bar" style={{ margin: 0, minWidth: '250px', position: 'relative' }}>
                <Search size={18} className="search-bar-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div className="table-container" style={{ margin: 0, boxShadow: 'none', border: '1px solid var(--border)' }}>
              {loading ? (
                <div className="spinner-container" style={{ padding: '3rem' }}><div className="spinner" /></div>
              ) : filteredStudents.length === 0 ? (
                <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
                  <div className="empty-state-icon" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👨‍🎓</div>
                  <h3 className="empty-state-title" style={{ fontSize: '1.1rem', fontWeight: 600 }}>No Students Found</h3>
                  <p className="empty-state-text" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {search ? 'No students match your search criteria' : 'No active students in this class'}
                  </p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', background: 'var(--bg-muted, #f9fafb)' }}>
                      <th style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>Admission No</th>
                      <th style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>Student Name</th>
                      <th style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>Parent Name</th>
                      <th style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>Contact</th>
                      <th style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>Section</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr 
                        key={student.id} 
                        onClick={() => navigate(`/students/${student.id}`)}
                        style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--primary-600, #4f46e5)' }}>
                          {student.admission_no || student.admissionNo}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {student.photo_url || student.photo ? (
                              <img
                                src={getImageUrl(student.photo_url || student.photo)}
                                alt=""
                                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div style={{
                                width: 36, height: 36, borderRadius: '50%',
                                background: 'var(--gradient-accent, linear-gradient(135deg, #6366f1, #a855f7))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.875rem', fontWeight: 700, color: 'white'
                              }}>
                                {student.name?.charAt(0)}
                              </div>
                            )}
                            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                              {student.name}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>{student.parent_name || student.parentName || '-'}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {student.parent_phone || student.parentPhone ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                <Phone size={14} /> {student.parent_phone || student.parentPhone}
                              </span>
                            ) : null}
                            {student.parent_email || student.parentEmail ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                <Mail size={14} /> {student.parent_email || student.parentEmail}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {student.section ? (
                            <span style={{
                              background: 'var(--surface-hover)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              color: 'var(--text-secondary)'
                            }}>
                              {student.section}
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDirectory;
