import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlineCurrencyRupee, HiOutlineReceiptRefund, HiOutlineArrowLeft } from 'react-icons/hi';
import StatCard from '../../components/Common/StatCard';
import { format } from 'date-fns';
import PrintSection from '../../components/PrintSection';

const FeeCollection = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feeRecord, setFeeRecord] = useState(null);
  const [feeStructure, setFeeStructure] = useState(null);
  const [search, setSearch] = useState('');
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [committedFee, setCommittedFee] = useState('');
  const [payForm, setPayForm] = useState({ amount: '', mode: 'cash', remarks: '' });
  const [loading, setLoading] = useState(false);
  const [academicYear, setAcademicYear] = useState('');
  const [inputYear, setInputYear] = useState('');
  const [pendingRecords, setPendingRecords] = useState([]);
  const [gradeFilter, setGradeFilter] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [dropdownResults, setDropdownResults] = useState([]);

  useEffect(() => {
    fetchSchoolYear();
  }, []);

  useEffect(() => {
    if (academicYear) fetchPendingStudents();
  }, [academicYear, gradeFilter]);

  const fetchPendingStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (academicYear) params.append('academicYear', academicYear);
      if (gradeFilter) params.append('grade', gradeFilter);

      const res = await api.get(`/fees/pending?${params}`);
      setPendingRecords(res.data?.data || []);
    } catch (error) {
      toast.error('Failed to fetch pending fees');
    } finally {
      setLoading(false);
    }
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

  // Debounced live search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (search.trim().length >= 2) {
        setDropdownLoading(true);
        setIsDropdownOpen(true);
        try {
          const res = await api.get(`/students?search=${encodeURIComponent(search)}&active=true&limit=8`);
          // Note: Backend might not support limit=8 natively, so we slice it here just in case.
          const results = res.data.data || [];
          setDropdownResults(results.slice(0, 8));
        } catch (error) {
          console.error('Live search failed', error);
        } finally {
          setDropdownLoading(false);
        }
      } else {
        setIsDropdownOpen(false);
        setDropdownResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const searchStudents = async () => {
    if (!search.trim()) return;
    setLoading(true);
    setIsDropdownOpen(false);
    try {
      const res = await api.get(`/students?search=${encodeURIComponent(search)}&active=true`);
      setStudents(res.data.data);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const selectStudent = async (student) => {
    setSelectedStudent(student);
    setStudents([]);
    setDropdownResults([]);
    setIsDropdownOpen(false);
    setSearch('');

    try {
      const [feeRes, structRes] = await Promise.all([
        api.get(`/fees/collection/${student.id}?academicYear=${academicYear}`),
        api.get(`/fees/structure?academicYear=${academicYear}&grade=${student.grade}`),
      ]);
      setFeeRecord(feeRes.data.data);
      setFeeStructure(structRes.data.data?.[0] || null);

      if (!feeRes.data.data && structRes.data.data?.[0]) {
        setCommittedFee((structRes.data.data[0].total_standard_fee || structRes.data.data[0].totalStandardFee || 0).toString());
      } else if (feeRes.data.data) {
        setCommittedFee((feeRes.data.data.committed_fee || feeRes.data.data.committedFee || 0).toString());
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCommitFee = async () => {
    if (!committedFee || parseFloat(committedFee) <= 0) {
      toast.error('Enter a valid committed fee');
      return;
    }
    try {
      const res = await api.post('/fees/collection/commit', {
        studentId: selectedStudent.id,
        academicYear,
        committedFee: parseFloat(committedFee),
      });
      setFeeRecord(res.data.data);
      setShowCommitModal(false);
      toast.success('Committed fee set! ✅');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    }
  };

  const [lastPayment, setLastPayment] = useState(null);
  const [sendingReceipt, setSendingReceipt] = useState(false);

  const handlePayment = async () => {
    if (!payForm.amount || parseFloat(payForm.amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    try {
      const res = await api.post('/fees/collection/pay', {
        studentId: selectedStudent.id,
        academicYear,
        amount: parseFloat(payForm.amount),
        mode: payForm.mode,
        remarks: payForm.remarks,
      });
      setFeeRecord(res.data.data.collection);
      setPayForm({ amount: '', mode: 'cash', remarks: '' });
      toast.success('Payment recorded! 🎉');

      const payment = res.data.data.payment;
      if (payment) {
        setLastPayment({
          studentId: selectedStudent.id,
          amount: payment.amount,
          receiptNo: payment.receiptNo,
          balance: res.data.data.collection.balance,
          collectionId: res.data.data.collection.id,
          paymentId: payment._id
        });
      } else {
        setShowPayModal(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    }
  };

  const sendReceipt = async (channel) => {
    if (!lastPayment) return;
    setSendingReceipt(true);
    try {
      const endpoint = channel === 'sms' ? '/fees/send-sms-receipt' : '/fees/send-whatsapp-receipt';
      const res = await api.post(endpoint, lastPayment);
      toast.success(res.data.message || `Receipt sent via ${channel.toUpperCase()}`);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to send ${channel.toUpperCase()}`);
    } finally {
      setSendingReceipt(false);
    }
  };

  const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

  const getStatusBadge = (status) => {
    const map = { paid: 'badge-success', partial: 'badge-warning', pending: 'badge-info', overdue: 'badge-danger' };
    return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>;
  };

  return (
    <PrintSection title="Fee Collection">
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            <HiOutlineArrowLeft size={18} />
          </button>
          <div className="page-header-info">
            <h1>Fee Collection</h1>
            <p>Search for a student to manage their fees</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: '1.5rem', overflow: 'visible' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', position: 'relative' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <label className="form-label">Search Student</label>
            <input
              id="fee-search"
              className="form-input"
              placeholder="Type student name or admission number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => {
                if (search.trim().length >= 2) setIsDropdownOpen(true);
              }}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsDropdownOpen(false);
                  searchStudents();
                }
              }}
              autoComplete="off"
            />
            {/* Autocomplete Dropdown */}
            {isDropdownOpen && search.trim().length >= 2 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 50,
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}
              >
                {dropdownLoading ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading...
                  </div>
                ) : dropdownResults.length > 0 ? (
                  dropdownResults.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseDown={(e) => e.preventDefault()} // Prevents blur before click registers
                      onClick={() => selectStudent(s)}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>{s.name}</strong>
                          <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                            ({s.admission_no || s.admissionNo})
                          </span>
                        </div>
                        <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                          Class {s.grade}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No matching students
                  </div>
                )}
              </div>
            )}
          </div>
          <button className="btn btn-primary" onClick={searchStudents}>
            <HiOutlineSearch /> Search
          </button>
        </div>

        {/* Search Results (Inline for explicit search) */}
        {students.length > 0 && (
          <div style={{ marginTop: '1rem', maxHeight: 250, overflowY: 'auto' }}>
            {students.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: '0.75rem', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)', marginBottom: '0.5rem',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
                onClick={() => selectStudent(s)}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-400)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>{s.name}</strong>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '0.75rem', fontSize: '0.85rem' }}>{s.admission_no || s.admissionNo}</span>
                  </div>
                  <span className="badge badge-primary">Class {s.grade}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Parent: {s.parent_name || s.parentName} • {s.parent_phone || s.parentPhone}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Default Pending List */}
        {!selectedStudent && students.length === 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Students with Pending Fees</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '110px' }}
                    value={inputYear}
                    onChange={(e) => setInputYear(e.target.value)}
                    onBlur={() => setAcademicYear(inputYear)}
                    onKeyDown={(e) => e.key === 'Enter' && setAcademicYear(inputYear)}
                    placeholder="Year"
                  />
                  <button className="btn btn-secondary" onClick={() => setAcademicYear(inputYear)} title="Apply Filter">
                    <HiOutlineSearch />
                  </button>
                </div>
                <select
                  className="form-select"
                  style={{ width: 'auto' }}
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                >
                  <option value="">All Grades</option>
                  {['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((g) => (
                    <option key={g} value={g}>Class {g}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {loading ? (
              <div className="spinner-container"><div className="spinner" /></div>
            ) : pendingRecords.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎉</div>
                <h3 className="empty-state-title">All Clear!</h3>
                <p className="empty-state-text">No pending fees found</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Admission No</th>
                      <th>Student Name</th>
                      <th>Grade</th>
                      <th>Negotiated Fee</th>
                      <th>Paid</th>
                      <th>Balance</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRecords.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600, color: 'var(--primary-400)' }}>{r.student?.admissionNo || r.student?.admission_no}</td>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.student?.name}</td>
                        <td>Class {r.student?.grade}</td>
                        <td>{formatCurrency(r.committed_fee || r.committedFee)}</td>
                        <td style={{ color: 'var(--success-400)' }}>{formatCurrency(r.total_paid || r.totalPaid)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--danger-400)' }}>{formatCurrency(r.balance)}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => selectStudent({ ...r.student, id: r.student_id })}
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Student Fee Details */}
      {selectedStudent && (
        <div className="card animate-slide-up">
          <div className="card-header">
            <div>
              <h3 className="card-title">{selectedStudent.name}</h3>
              <p className="card-subtitle">
                {selectedStudent.admission_no || selectedStudent.admissionNo} • Class {selectedStudent.grade} • {academicYear}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowCommitModal(true)}>
                {feeRecord ? 'Edit Negotiated Fee' : 'Set Negotiated Fee'}
              </button>
              {feeRecord && feeRecord.status !== 'paid' && (
                <button className="btn btn-success" onClick={() => setShowPayModal(true)}>
                  <HiOutlineCurrencyRupee /> Record Payment
                </button>
              )}
            </div>
          </div>

          {/* Fee Summary */}
          {feeRecord ? (
            <>
              <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
                <StatCard className="" title="Negotiated Fee" value={feeRecord.committed_fee || feeRecord.committedFee} formatValue={formatCurrency} color="blue" periodLabel="Total" />
                <StatCard className="" title="Total Paid" value={feeRecord.total_paid || feeRecord.totalPaid} formatValue={formatCurrency} color="green" periodLabel="Received" />
                <StatCard className="" title="Balance" value={feeRecord.balance} formatValue={formatCurrency} color="amber" periodLabel="Pending" />
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {getStatusBadge(feeRecord.status)}
                </div>
              </div>

              {!feeRecord && feeStructure && (
                <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Standard Fee for Class {selectedStudent.grade}: {formatCurrency(feeStructure.total_standard_fee || feeStructure.totalStandardFee)}
                </div>
              )}

              {/* Payment History */}
              {feeRecord.payments?.length > 0 && (
                <div className="table-container" style={{ background: 'transparent', border: 'none' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Payment History</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Receipt No</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Mode</th>
                        <th>Remarks</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feeRecord.payments.map((p) => (
                        <tr key={p._id}>
                          <td style={{ fontWeight: 600, color: 'var(--primary-400)' }}>{p.receiptNo}</td>
                          <td>{format(new Date(p.date), 'dd MMM yyyy')}</td>
                          <td style={{ fontWeight: 600, color: 'var(--success-400)' }}>{formatCurrency(p.amount)}</td>
                          <td><span className="badge badge-neutral">{p.mode}</span></td>
                          <td>{p.remarks || '-'}</td>
                          <td>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => navigate(`/fees/receipt/${feeRecord.id}/${p._id}`)}
                            >
                              <HiOutlineReceiptRefund /> Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">💸</div>
              <h3 className="empty-state-title">No Fee Record</h3>
              <p className="empty-state-text">Set a committed fee to start tracking payments for this student</p>
            </div>
          )}
        </div>
      )}

      {/* Commit Fee Modal */}
      {showCommitModal && (
        <div className="modal-overlay" onClick={() => setShowCommitModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3 className="modal-title">Set Negotiated Fee</h3>
              <button className="modal-close" onClick={() => setShowCommitModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {feeStructure && (
                <p className="form-help" style={{ marginBottom: '1rem' }}>
                  Standard fee for Class {selectedStudent.grade}: {formatCurrency(feeStructure.total_standard_fee || feeStructure.totalStandardFee)}
                </p>
              )}
              <div className="form-group">
                <label className="form-label">Negotiated Fee (₹)</label>
                <input
                  className="form-input"
                  type="number"
                  value={committedFee}
                  onChange={(e) => setCommittedFee(e.target.value)}
                  placeholder="Enter negotiated total fee"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCommitModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCommitFee}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <div className="modal-overlay" onClick={() => { setShowPayModal(false); setLastPayment(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3 className="modal-title">{lastPayment ? 'Payment Successful' : 'Record Payment'}</h3>
              <button className="modal-close" onClick={() => { setShowPayModal(false); setLastPayment(null); }}>×</button>
            </div>
            {lastPayment ? (
              <div className="modal-body" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success-500)', marginBottom: '0.5rem' }}>
                  Payment Saved!
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Receipt No: <strong>{lastPayment.receiptNo}</strong><br />
                  Amount: <strong>{formatCurrency(lastPayment.amount)}</strong>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => sendReceipt('sms')}
                    disabled={sendingReceipt}
                    style={{ background: '#3b82f6', border: 'none' }}
                  >
                    {sendingReceipt ? 'Sending...' : '💬 Send SMS Receipt'}
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => sendReceipt('whatsapp')}
                    disabled={sendingReceipt}
                    style={{ background: '#10b981', border: 'none' }}
                  >
                    {sendingReceipt ? 'Sending...' : '📱 Send WhatsApp Receipt'}
                  </button>
                  <button 
                    className="btn btn-outline" 
                    onClick={() => navigate(`/fees/receipt/${lastPayment.collectionId}/${lastPayment.paymentId}`)}
                    style={{ marginTop: '0.5rem' }}
                  >
                    View Receipt
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="modal-body">
                  <p className="form-help" style={{ marginBottom: '1rem' }}>
                    Balance: {formatCurrency(feeRecord?.balance)}
                  </p>
                  <div className="form-group">
                    <label className="form-label">Amount (₹) *</label>
                    <input className="form-input" type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} placeholder="Enter payment amount" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Mode</label>
                    <select className="form-select" value={payForm.mode} onChange={(e) => setPayForm({ ...payForm, mode: e.target.value })}>
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Remarks</label>
                    <input className="form-input" value={payForm.remarks} onChange={(e) => setPayForm({ ...payForm, remarks: e.target.value })} placeholder="Optional remarks" />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowPayModal(false)}>Cancel</button>
                  <button className="btn btn-success" onClick={handlePayment}>
                    <HiOutlineCurrencyRupee /> Record Payment
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
    </PrintSection>
  );
};

export default FeeCollection;
