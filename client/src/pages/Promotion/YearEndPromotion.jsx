import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineArrowUp, HiOutlineExclamationCircle, HiOutlineCheckCircle } from 'react-icons/hi';

const YearEndPromotion = () => {
  const [grade, setGrade] = useState('');
  const [toGrade, setToGrade] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [newAcademicYear, setNewAcademicYear] = useState('');
  const [checkData, setCheckData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(true);

  useEffect(() => {
    fetchSchoolYear();
  }, []);

  const fetchSchoolYear = async () => {
    try {
      const res = await api.get('/schools');
      if (res.data.data?.academicYear) {
        setAcademicYear(res.data.data.academicYear);
        // Auto-generate next year
        const parts = res.data.data.academicYear.split('-');
        if (parts.length === 2) {
          const next = `${parseInt(parts[0]) + 1}-${parseInt(parts[1]) + 1}`;
          setNewAcademicYear(next);
        }
      }
    } catch (err) { /* ignore */ }
  };

  const gradeOrder = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  const getNextGrade = (current) => {
    const idx = gradeOrder.indexOf(current);
    if (idx >= 0 && idx < gradeOrder.length - 1) return gradeOrder[idx + 1];
    return '';
  };

  const handleGradeChange = (g) => {
    setGrade(g);
    setToGrade(getNextGrade(g));
    setCheckData(null);
  };

  const checkPromotion = async () => {
    if (!grade || !academicYear) {
      toast.error('Select a grade');
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/promotion/check/${grade}?academicYear=${academicYear}`);
      setCheckData(res.data.data);
      setSelectedIds(res.data.data.students.map((s) => s.student._id));
      setSelectAll(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to check');
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(checkData.students.map((s) => s.student._id));
    }
    setSelectAll(!selectAll);
  };

  const handlePromote = async (force = false) => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one student');
      return;
    }

    setPromoting(true);
    try {
      const res = await api.post('/promotion/promote', {
        fromGrade: grade,
        toGrade,
        academicYear,
        newAcademicYear,
        studentIds: selectedIds,
        force,
      });
      toast.success(res.data.message);
      setCheckData(null);
      setGrade('');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.data?.studentsWithPendingFees) {
        const pending = error.response.data.data.studentsWithPendingFees;
        const confirmForce = window.confirm(
          `${pending.length} student(s) have pending fees. Promote anyway?`
        );
        if (confirmForce) {
          handlePromote(true);
          return;
        }
      } else {
        toast.error(error.response?.data?.message || 'Promotion failed');
      }
    } finally {
      setPromoting(false);
    }
  };

  const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-info">
          <h1>Year-End Promotion</h1>
          <p>Promote students to the next class</p>
        </div>
      </div>

      {/* Setup */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="form-row" style={{ alignItems: 'flex-end' }}>
          <div className="form-group">
            <label className="form-label">From Grade</label>
            <select className="form-select" value={grade} onChange={(e) => handleGradeChange(e.target.value)}>
              <option value="">Select Grade</option>
              {gradeOrder.map((g) => (
                <option key={g} value={g}>Class {g}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">To Grade</label>
            <input className="form-input" value={toGrade} onChange={(e) => setToGrade(e.target.value)} placeholder="Next grade" />
          </div>
          <div className="form-group">
            <label className="form-label">Current Year</label>
            <input className="form-input" value={academicYear} readOnly style={{ opacity: 0.7 }} />
          </div>
          <div className="form-group">
            <label className="form-label">New Year</label>
            <input className="form-input" value={newAcademicYear} onChange={(e) => setNewAcademicYear(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={checkPromotion} disabled={loading} style={{ height: 44 }}>
            {loading ? 'Checking...' : 'Check Students'}
          </button>
        </div>
      </div>

      {/* Results */}
      {checkData && (
        <div className="card animate-slide-up">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                Class {checkData.grade} — {checkData.totalStudents} Students
              </h3>
              {checkData.withPendingFees > 0 && (
                <p style={{ color: 'var(--warning-400)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  <HiOutlineExclamationCircle style={{ verticalAlign: 'middle' }} /> {checkData.withPendingFees} student(s) have pending fees
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <label className="checkbox-wrapper">
                <input type="checkbox" checked={selectAll} onChange={toggleAll} />
                <span style={{ fontSize: '0.85rem' }}>Select All</span>
              </label>
              <button
                className="btn btn-success"
                onClick={() => handlePromote(false)}
                disabled={promoting || selectedIds.length === 0}
              >
                <HiOutlineArrowUp />
                {promoting ? 'Promoting...' : `Promote ${selectedIds.length} Student(s)`}
              </button>
            </div>
          </div>

          <div className="promotion-student-list">
            {checkData.students.map(({ student, feeStatus, balance, hasPendingFees }) => (
              <div key={student._id} className={`promotion-student-item ${hasPendingFees ? 'has-pending' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(student._id)}
                    onChange={() => toggleStudent(student._id)}
                    style={{ accentColor: 'var(--primary-500)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{student.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{student.admissionNo}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {hasPendingFees ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--warning-400)' }}>
                      <HiOutlineExclamationCircle style={{ verticalAlign: 'middle' }} /> Balance: {formatCurrency(balance)}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--success-400)' }}>
                      <HiOutlineCheckCircle style={{ verticalAlign: 'middle' }} /> {feeStatus === 'no_record' ? 'No fee record' : 'Paid'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default YearEndPromotion;
