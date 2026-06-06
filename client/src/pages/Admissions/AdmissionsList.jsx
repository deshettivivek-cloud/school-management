import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineSearch, HiOutlineCheckCircle, HiOutlineClock } from 'react-icons/hi';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const AdmissionsList = () => {
  const { hasAccess } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchStudents();
  }, [gradeFilter, statusFilter]);

  const fetchStudents = async () => {
    try {
      const params = new URLSearchParams();
      if (gradeFilter) params.append('grade', gradeFilter);
      if (statusFilter) params.append('status', statusFilter);
      params.append('active', 'true');

      const res = await api.get(`/students?${params}`);
      setStudents(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (gradeFilter) params.append('grade', gradeFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/students?${params}`);
      setStudents(res.data.data);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/students/${id}/status`, { admissionStatus: status });
      toast.success(`Status updated to ${status}`);
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const grades = [...new Set(students.map((s) => s.grade))].sort();

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-info">
          <h1>Admissions</h1>
          <p>Manage student admissions and registrations</p>
        </div>
        <div className="page-header-actions">
          <Link to="/admissions/new" className="btn btn-primary">
            <HiOutlinePlus /> New Admission
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-bar">
          <HiOutlineSearch className="search-bar-icon" />
          <input
            id="student-search"
            type="text"
            placeholder="Search by name or admission no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <select
          id="grade-filter"
          className="form-select"
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
        >
          <option value="">All Grades</option>
          {['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((g) => (
            <option key={g} value={g}>Class {g}</option>
          ))}
        </select>

        <select
          id="status-filter"
          className="form-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="table-wrapper">
          {loading ? (
            <div className="spinner-container"><div className="spinner" /></div>
          ) : students.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👨‍🎓</div>
              <h3 className="empty-state-title">No Students Found</h3>
              <p className="empty-state-text">Start by adding a new admission</p>
              <Link to="/admissions/new" className="btn btn-primary">
                <HiOutlinePlus /> Add Student
              </Link>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Admission No</th>
                  <th>Name</th>
                  <th>Grade</th>
                  <th>Parent</th>
                  <th>Phone</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-400)' }}>
                      {student.admission_no || student.admissionNo}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {student.photo_url || student.photo ? (
                          <img
                            src={student.photo_url || student.photo}
                            alt=""
                            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'var(--gradient-accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.75rem', fontWeight: 700, color: 'white'
                          }}>
                            {student.name?.charAt(0)}
                          </div>
                        )}
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          {student.name}
                        </span>
                      </div>
                    </td>
                    <td>Class {student.grade}{student.section ? `-${student.section}` : ''}</td>
                    <td>{student.parent_name || student.parentName}</td>
                    <td>{student.parent_phone || student.parentPhone}</td>
                    <td>{(student.admission_date || student.admissionDate) ? format(new Date(student.admission_date || student.admissionDate), 'dd MMM yyyy') : '-'}</td>
                    <td>
                      <span className={`badge ${(student.admission_status || student.admissionStatus) === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>
                        {(student.admission_status || student.admissionStatus) === 'confirmed' ? <HiOutlineCheckCircle /> : <HiOutlineClock />}
                        {student.admission_status || student.admissionStatus}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {hasAccess(['principal', 'clerk']) && (student.admission_status || student.admissionStatus) === 'pending' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => updateStatus(student.id || student._id, 'confirmed')}
                          >
                            Confirm
                          </button>
                        )}
                        <Link
                          to={`/admissions/edit/${student.id || student._id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdmissionsList;
