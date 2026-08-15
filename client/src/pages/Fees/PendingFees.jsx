import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlineExclamationCircle } from 'react-icons/hi';
import StatCard from '../../components/Common/StatCard';
import PrintSection from '../../components/PrintSection';

const PendingFees = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState('');
  const [totalPending, setTotalPending] = useState(0);
  const [academicYear, setAcademicYear] = useState('');
  const [inputYear, setInputYear] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecords = records.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = r.student?.name?.toLowerCase() || '';
    const admNo = r.student?.admission_no?.toLowerCase() || r.student?.admissionNo?.toLowerCase() || '';
    return name.includes(q) || admNo.includes(q);
  });

  useEffect(() => {
    fetchSchoolYear();
  }, []);

  useEffect(() => {
    if (academicYear) fetchPending();
  }, [academicYear, gradeFilter]);

  const handleApplyYear = (year) => {
    if (year && !/^\d{4}-\d{2}(\d{2})?$/.test(year)) {
      toast.error('Please enter a valid academic year (e.g., 2024-25)');
      return;
    }
    setAcademicYear(year);
  };

  const fetchSchoolYear = async () => {
    try {
      const res = await api.get('/schools');
      if (res.data.data?.academic_year) {
        setAcademicYear(res.data.data.academic_year);
        setInputYear(res.data.data.academic_year);
      }
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

  const handleSendReminders = async () => {
    if (records.length === 0) return;
    if (!window.confirm(`Are you sure you want to send WhatsApp fee reminders to ${records.length} students?`)) return;

    setSending(true);
    try {
      const studentIds = records.map(r => r.student_id);
      const res = await api.post('/fees/collection/reminders', { studentIds });
      toast.success(res.data?.message || 'Reminders sent successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reminders');
    } finally {
      setSending(false);
    }
  };

  const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

  const getStatusBadge = (status) => {
    const map = { partial: 'badge-warning', pending: 'badge-info', overdue: 'badge-danger' };
    return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>;
  };

  return (
    <PrintSection title="Pending Fees">
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-info">
          <h1>Pending Fees</h1>
          <p>Students with outstanding dues — {academicYear}</p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard className="" title={gradeFilter ? `Total Pending Amount (Class ${gradeFilter})` : "Total Pending Amount"} value={totalPending} formatValue={formatCurrency} icon={HiOutlineExclamationCircle} color="red" periodLabel={`${filteredRecords.length} students`} hideDelta={true} loading={loading} />
      </div>

      {/* Filter */}
      <div className="filter-bar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          <div className="search-bar" style={{ borderRight: 'none', borderTopRightRadius: 0, borderBottomRightRadius: 0, margin: 0 }}>
            <HiOutlineSearch className="search-bar-icon" />
            <input
              type="text"
              placeholder="Search by name or admission no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '250px' }}
            />
          </div>
          <button className="btn btn-primary" style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, marginRight: '1rem' }}>
            Search
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          <input
            type="text"
            className="form-input"
            style={{ width: '130px', borderTopRightRadius: 0, borderBottomRightRadius: 0, margin: 0 }}
            value={inputYear}
            onChange={(e) => setInputYear(e.target.value)}
            onBlur={() => handleApplyYear(inputYear)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyYear(inputYear)}
            placeholder="Academic Year"
          />
          <button className="btn btn-secondary" onClick={() => handleApplyYear(inputYear)} title="Apply Filter" style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, margin: 0, marginLeft: '-1px', zIndex: 0 }}>
            <HiOutlineSearch />
          </button>
        </div>
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
        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleSendReminders} 
            disabled={sending || records.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10b981', border: 'none' }}
          >
            <HiOutlineExclamationCircle />
            {sending ? 'Sending...' : 'Send WhatsApp Reminders'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="spinner-container"><div className="spinner" /></div>
        ) : filteredRecords.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎉</div>
            <h3 className="empty-state-title">All Clear!</h3>
            <p className="empty-state-text">No data in that year</p>
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
                {filteredRecords.map((r) => (
                  <tr key={r.id || r._id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-400)' }}>{r.student?.admission_no || r.student?.admissionNo}</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.student?.name}</td>
                    <td>Class {r.student?.grade}</td>
                    <td>{r.student?.parent_name || r.student?.parentName}</td>
                    <td>{r.student?.parent_phone || r.student?.parentPhone}</td>
                    <td>{formatCurrency(r.committed_fee || r.committedFee)}</td>
                    <td style={{ color: 'var(--success-400)' }}>{formatCurrency(r.total_paid || r.totalPaid)}</td>
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
    </PrintSection>
  );
};

export default PendingFees;
