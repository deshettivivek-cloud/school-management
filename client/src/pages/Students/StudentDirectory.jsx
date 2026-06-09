import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlineUserGroup, HiOutlineMail, HiOutlinePhone } from 'react-icons/hi';

const StudentDirectory = () => {
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
      setStudents(res.data.data);
      
      // Select first grade by default if exists
      const uniqueGrades = [...new Set(res.data.data.map(s => s.grade))].sort((a, b) => {
        // Custom sort for grades (LKG, UKG, 1, 2, ... 12)
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
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedGrade, search]);

  const grades = useMemo(() => {
    const gradeMap = {};
    students.forEach(s => {
      gradeMap[s.grade] = (gradeMap[s.grade] || 0) + 1;
    });
    return Object.entries(gradeMap).map(([grade, count]) => ({ grade, count })).sort((a, b) => {
        const gradeOrder = { 'LKG': -2, 'UKG': -1 };
        const valA = gradeOrder[a.grade] !== undefined ? gradeOrder[a.grade] : parseInt(a.grade) || 0;
        const valB = gradeOrder[b.grade] !== undefined ? gradeOrder[b.grade] : parseInt(b.grade) || 0;
        return valA - valB;
    });
  }, [students]);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-info">
          <h1>Student Directory</h1>
          <p>Class-wise directory of all active students</p>
        </div>
      </div>

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
            <HiOutlineUserGroup /> Classes
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
            <div className="search-bar" style={{ margin: 0, minWidth: '250px' }}>
              <HiOutlineSearch className="search-bar-icon" />
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container" style={{ margin: 0, boxShadow: 'none', border: '1px solid var(--border)' }}>
            {loading ? (
              <div className="spinner-container" style={{ padding: '3rem' }}><div className="spinner" /></div>
            ) : filteredStudents.length === 0 ? (
              <div className="empty-state" style={{ padding: '3rem' }}>
                <div className="empty-state-icon">👨‍🎓</div>
                <h3 className="empty-state-title">No Students Found</h3>
                <p className="empty-state-text">
                  {search ? 'No students match your search criteria' : 'No active students in this class'}
                </p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Admission No</th>
                    <th>Student Name</th>
                    <th>Parent Name</th>
                    <th>Contact</th>
                    <th>Section</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary-400)' }}>
                        {student.admission_no || student.admissionNo}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {student.photo_url || student.photo ? (
                            <img
                              src={student.photo_url || student.photo}
                              alt=""
                              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{
                              width: 36, height: 36, borderRadius: '50%',
                              background: 'var(--gradient-accent)',
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
                      <td>{student.parent_name || student.parentName || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {student.parent_phone || student.parentPhone ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                              <HiOutlinePhone size={14} /> {student.parent_phone || student.parentPhone}
                            </span>
                          ) : null}
                          {student.parent_email || student.parentEmail ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                              <HiOutlineMail size={14} /> {student.parent_email || student.parentEmail}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td>
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
    </div>
  );
};

export default StudentDirectory;
