import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlineExclamationCircle } from 'react-icons/hi';

const PendingFees = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState('');
  const [totalPending, setTotalPending] = useState(0);
  const [academicYear, setAcademicYear] = useState('');

  useEffect(() => {
    fetchSchoolYear();
  }, []);

  useEffect(() => {
    if (academicYear) fetchPending();
  }, [academicYear, gradeFilter]);

  const fetchSchoolYear = async () => {
    try {
      const res = await api.get('/school');
      if (res.data.data?.academicYear) setAcademicYear(res.data.data.academicYear);
    } catch (err) { /* ignore */ }
  };

  const fetchPending = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (academicYear) params.append('academicYear', academicYear);
      if (gradeFilter) params.append('grade', gradeFilter);

      const res = await api.get(`/fees/pending?${params}`);
      setRecords(res.data?.data || []);
      setTotalPending(res.data?.totalPending || 0);
    } catch (error) {
      toast.error('Failed to fetch pending fees');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

  const getStatusBadge = (status) => {
    const map = { partial: 'badge-warning', pending: 'badge-info', overdue: 'badge-danger' };
    return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>;
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-info">
          <h1>Pending Fees</h1>
          <p>Students with outstanding dues — {academicYear}</p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card danger">
          <div className="stat-icon danger">
            <HiOutlineExclamationCircle />
          </div>
          <div className="stat-info">
            <div className="stat-label">Total Pending Amount</div>
            <div className="stat-value">{formatCurrency(totalPending)}</div>
            <div className="stat-change negative">{records.length} students</div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="filter-bar">
        <select
          id="pending-grade-filter"
          className="form-select"
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
        >
          <option value="">All Grades</option>
          {['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((g) => (
            <option key={g} value={g}>Class {g}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="spinner-container"><div className="spinner" /></div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎉</div>
            <h3 className="empty-state-title">All Clear!</h3>
            <p className="empty-state-text">No pending fees found</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Admission No</th>
                  <th>Student Name</th>
                  <th>Grade</th>
                  <th>Parent</th>
                  <th>Phone</th>
                  <th>Committed</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r._id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-400)' }}>{r.student?.admissionNo}</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.student?.name}</td>
                    <td>Class {r.student?.grade}</td>
                    <td>{r.student?.parentName}</td>
                    <td>{r.student?.parentPhone}</td>
                    <td>{formatCurrency(r.committedFee)}</td>
                    <td style={{ color: 'var(--success-400)' }}>{formatCurrency(r.totalPaid)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--danger-400)' }}>{formatCurrency(r.balance)}</td>
                    <td>{getStatusBadge(r.status)}</td>
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

export default PendingFees;
