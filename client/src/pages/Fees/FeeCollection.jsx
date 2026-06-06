import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlineCurrencyRupee, HiOutlineReceiptRefund } from 'react-icons/hi';
import { format } from 'date-fns';

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

  useEffect(() => {
    fetchSchoolYear();
  }, []);

  const fetchSchoolYear = async () => {
    try {
      const res = await api.get('/schools');
      if (res.data.data?.academic_year) setAcademicYear(res.data.data.academic_year);
    } catch (err) { /* ignore */ }
  };

  const searchStudents = async () => {
    if (!search.trim()) return;
    setLoading(true);
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
      setShowPayModal(false);
      setPayForm({ amount: '', mode: 'cash', remarks: '' });
      toast.success('Payment recorded! 🎉');

      // Navigate to receipt
      const payment = res.data.data.payment;
      if (payment) {
        navigate(`/fees/receipt/${res.data.data.collection.id}/${payment._id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    }
  };

  const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

  const getStatusBadge = (status) => {
    const map = { paid: 'badge-success', partial: 'badge-warning', pending: 'badge-info', overdue: 'badge-danger' };
    return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>;
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-info">
          <h1>Fee Collection</h1>
          <p>Search for a student to manage their fees</p>
        </div>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">Search Student</label>
            <input
              id="fee-search"
              className="form-input"
              placeholder="Type student name or admission number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchStudents()}
            />
          </div>
          <button className="btn btn-primary" onClick={searchStudents}>
            <HiOutlineSearch /> Search
          </button>
        </div>

        {/* Search Results */}
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
                {feeRecord ? 'Update Committed Fee' : 'Set Committed Fee'}
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
                <div className="stat-card primary" style={{ padding: '1rem' }}>
                  <div className="stat-info">
                    <div className="stat-label">Committed Fee</div>
                    <div className="stat-value" style={{ fontSize: '1.35rem' }}>{formatCurrency(feeRecord.committed_fee || feeRecord.committedFee)}</div>
                  </div>
                </div>
                <div className="stat-card success" style={{ padding: '1rem' }}>
                  <div className="stat-info">
                    <div className="stat-label">Total Paid</div>
                    <div className="stat-value" style={{ fontSize: '1.35rem' }}>{formatCurrency(feeRecord.total_paid || feeRecord.totalPaid)}</div>
                  </div>
                </div>
                <div className="stat-card warning" style={{ padding: '1rem' }}>
                  <div className="stat-info">
                    <div className="stat-label">Balance</div>
                    <div className="stat-value" style={{ fontSize: '1.35rem' }}>{formatCurrency(feeRecord.balance)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {getStatusBadge(feeRecord.status)}
                </div>
              </div>

              {feeStructure && (
                <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Standard Fee for Class {selectedStudent.grade}: {formatCurrency(feeStructure.total_standard_fee || feeStructure.totalStandardFee)}
                  {(feeRecord.committed_fee || feeRecord.committedFee) < (feeStructure.total_standard_fee || feeStructure.totalStandardFee) && (
                    <span style={{ color: 'var(--warning-400)', marginLeft: '0.5rem' }}>
                      (Discount: {formatCurrency((feeStructure.total_standard_fee || feeStructure.totalStandardFee) - (feeRecord.committed_fee || feeRecord.committedFee))})
                    </span>
                  )}
                </div>
              )}

              {/* Payment History */}
              {feeRecord.payments.length > 0 && (
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
              <h3 className="modal-title">Set Committed Fee</h3>
              <button className="modal-close" onClick={() => setShowCommitModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {feeStructure && (
                <p className="form-help" style={{ marginBottom: '1rem' }}>
                  Standard fee for Class {selectedStudent.grade}: {formatCurrency(feeStructure.total_standard_fee || feeStructure.totalStandardFee)}
                </p>
              )}
              <div className="form-group">
                <label className="form-label">Committed / Negotiated Fee (₹)</label>
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
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3 className="modal-title">Record Payment</h3>
              <button className="modal-close" onClick={() => setShowPayModal(false)}>×</button>
            </div>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeCollection;
