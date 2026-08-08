import React, { useState, useEffect } from 'react';
import { HiOutlineCalendar, HiOutlineUserGroup, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import StatCard from '../../components/Common/StatCard';
import { getImageUrl } from '../../utils/helpers';

const AttendanceRegister = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // If teacher, they can only see their assigned class (we could enforce this in the UI or let backend reject)
    // Fetch all active students to extract unique grades
    const fetchClasses = async () => {
      try {
        const res = await api.get('/students?active=true');
        const uniqueGrades = [...new Set(res.data.data.map(s => s.grade))].sort((a, b) => {
          const gradeOrder = { 'LKG': -2, 'UKG': -1 };
          const valA = gradeOrder[a] !== undefined ? gradeOrder[a] : parseInt(a) || 0;
          const valB = gradeOrder[b] !== undefined ? gradeOrder[b] : parseInt(b) || 0;
          return valA - valB;
        });
        setClasses(uniqueGrades);
        
        // If they are a teacher, try to auto-select their class by fetching their profile
        if (user.role === 'teacher') {
          const empRes = await api.get(`/employees/user/${user.id}`).catch(() => null);
          if (empRes && empRes.data?.data?.class_teacher_of) {
            setSelectedClass(empRes.data.data.class_teacher_of);
          } else if (uniqueGrades.length > 0) {
            setSelectedClass(uniqueGrades[0]);
          }
        } else if (uniqueGrades.length > 0) {
          setSelectedClass(uniqueGrades[0]);
        }
      } catch (err) {
        toast.error('Failed to load classes');
      }
    };
    fetchClasses();
  }, [user]);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchAttendance();
    }
  }, [selectedClass, selectedDate]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance?classReference=${selectedClass}&date=${selectedDate}`);
      setStudents(res.data.data);
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error(err.response.data.message || 'Attendance module not configured');
      } else {
        toast.error('Failed to fetch roster');
      }
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, status } : s));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, remarks } : s));
  };

  const markAll = (status) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = students.map(s => ({
        student_id: s.student_id,
        status: s.status,
        remarks: s.remarks
      }));
      
      await api.post('/attendance', {
        classReference: selectedClass,
        date: selectedDate,
        records
      });
      toast.success('Attendance saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'var(--success-500)';
      case 'absent': return 'var(--danger-500)';
      case 'late': return 'var(--warning-500)';
      case 'leave': return 'var(--primary-500)';
      default: return 'var(--text-secondary)';
    }
  };

  const stats = {
    total: students.length,
    present: students.filter(s => s.status === 'present' || s.status === 'late').length,
    absent: students.filter(s => s.status === 'absent').length,
    leave: students.filter(s => s.status === 'leave').length
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-header-info">
          <h1>Attendance Register</h1>
          <p>Mark and review daily attendance for students</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Class / Section</label>
          <div className="search-bar" style={{ margin: 0, padding: 0 }}>
            <HiOutlineUserGroup className="search-bar-icon" style={{ marginLeft: '1rem' }} />
            <select 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', border: 'none', background: 'transparent', outline: 'none' }}
            >
              {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
        </div>
        
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Date</label>
          <div className="search-bar" style={{ margin: 0, padding: 0 }}>
            <HiOutlineCalendar className="search-bar-icon" style={{ marginLeft: '1rem' }} />
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', border: 'none', background: 'transparent', outline: 'none' }}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={fetchAttendance} disabled={loading}>
            Refresh
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || students.length === 0}>
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>

      {students.length > 0 && (
        <div className="stat-grid" style={{ marginBottom: '2rem' }}>
          <StatCard title="Total Students" value={stats.total} color="blue" hideDelta={true} />
          <StatCard title="Present" value={stats.present} color="green" hideDelta={true} />
          <StatCard title="Absent" value={stats.absent} color="red" hideDelta={true} />
          <StatCard title="On Leave" value={stats.leave} color="amber" hideDelta={true} />
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Student Roster</h3>
          {students.length > 0 && (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => markAll('present')} style={{ borderColor: 'var(--success-500)', color: 'var(--success-600)' }}>
                <HiOutlineCheck /> Mark All Present
              </button>
              <button type="button" className="btn btn-outline" onClick={() => markAll('absent')} style={{ borderColor: 'var(--danger-500)', color: 'var(--danger-600)' }}>
                <HiOutlineX /> Mark All Absent
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="spinner-container" style={{ padding: '3rem' }}><div className="spinner" /></div>
        ) : students.length === 0 ? (
          <div className="empty-state">No students found for this class.</div>
        ) : (
          <div className="table-container" style={{ margin: 0, boxShadow: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.student_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {student.photo_url ? (
                          <img src={getImageUrl(student.photo_url)} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-100)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                            {student.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{student.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{student.admission_no}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['present', 'absent', 'late', 'leave'].map(status => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => handleStatusChange(student.student_id, status)}
                            style={{
                              padding: '0.5rem 1rem',
                              borderRadius: '8px',
                              border: `1px solid ${student.status === status ? getStatusColor(status) : 'var(--border-color)'}`,
                              background: student.status === status ? getStatusColor(status) : 'transparent',
                              color: student.status === status ? 'white' : 'var(--text-secondary)',
                              fontWeight: student.status === status ? 600 : 500,
                              cursor: 'pointer',
                              textTransform: 'capitalize',
                              transition: 'all 0.2s'
                            }}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={student.remarks}
                        onChange={(e) => handleRemarksChange(student.student_id, e.target.value)}
                        placeholder="Optional remarks"
                        style={{
                          padding: '0.5rem',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          width: '100%',
                          outline: 'none',
                          background: 'var(--surface)'
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceRegister;
