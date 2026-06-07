import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlinePrinter, HiOutlineArrowLeft } from 'react-icons/hi';
import { format } from 'date-fns';

const VirtualAdmissionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [school, setSchool] = useState(null);
  const [feeRecord, setFeeRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const formRef = useRef();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [studentRes, schoolRes] = await Promise.all([
        api.get(`/students/${id}`),
        api.get('/schools'),
      ]);
      const studentData = studentRes.data.data;
      setStudent(studentData);
      setSchool(schoolRes.data.data);

      // Try to fetch fee record
      try {
        const academicYear = schoolRes.data.data?.academic_year || studentData?.academic_year || studentData?.academicYear;
        if (academicYear) {
          const feeRes = await api.get(`/fees/collection/${id}?academicYear=${academicYear}`);
          setFeeRecord(feeRes.data.data);
        }
      } catch (feeErr) {
        // Fee record may not exist, that's OK
      }
    } catch (error) {
      toast.error('Failed to load student details');
      navigate('/admissions');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const content = formRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Admission Form - ${student?.name || 'Student'}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Inter', -apple-system, sans-serif;
              padding: 2rem;
              color: #1a1a1a;
              background: white;
            }
            .admission-form {
              max-width: 800px;
              margin: 0 auto;
            }
            .form-header {
              display: flex;
              align-items: center;
              gap: 1rem;
              border-bottom: 3px double #1a1a1a;
              padding-bottom: 1rem;
              margin-bottom: 1.5rem;
            }
            .form-header img {
              width: 70px;
              height: 70px;
              object-fit: contain;
            }
            .school-name {
              font-family: 'Outfit', sans-serif;
              font-size: 1.5rem;
              font-weight: 800;
              color: #0f172a;
            }
            .school-info { font-size: 0.85rem; color: #64748b; }
            .form-title {
              text-align: center;
              font-size: 1.15rem;
              font-weight: 700;
              margin: 1.25rem 0;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              padding: 0.5rem;
              background: #f1f5f9;
              border: 1px solid #e2e8f0;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 0.6rem;
              margin-bottom: 1.5rem;
            }
            .info-item {
              display: flex;
              padding: 0.35rem 0;
              border-bottom: 1px dotted #cbd5e1;
            }
            .info-label {
              font-weight: 600;
              min-width: 150px;
              font-size: 0.85rem;
              color: #475569;
            }
            .info-value {
              font-size: 0.9rem;
              color: #0f172a;
              font-weight: 500;
            }
            .photo-box {
              width: 100px;
              height: 120px;
              border: 2px solid #1a1a1a;
              float: right;
              margin-left: 1rem;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 0.7rem;
              color: #94a3b8;
            }
            .photo-box img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .section-title {
              font-size: 0.9rem;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #0f172a;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 0.25rem;
              margin: 1.5rem 0 0.75rem;
            }
            .fee-table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; }
            .fee-table th {
              background: #f1f5f9;
              padding: 0.5rem 0.75rem;
              font-size: 0.75rem;
              font-weight: 600;
              text-transform: uppercase;
              text-align: left;
              border: 1px solid #e2e8f0;
              color: #475569;
            }
            .fee-table td {
              padding: 0.5rem 0.75rem;
              font-size: 0.85rem;
              border: 1px solid #e2e8f0;
              color: #334155;
            }
            .fee-total td {
              font-weight: 700;
              background: #f8fafc;
              color: #0f172a;
            }
            .footer {
              margin-top: 3rem;
              display: flex;
              justify-content: space-between;
              font-size: 0.85rem;
            }
            .signature-line {
              border-top: 1px solid #1a1a1a;
              padding-top: 0.5rem;
              min-width: 200px;
              text-align: center;
              color: #475569;
              font-size: 0.8rem;
            }
            .declaration {
              margin-top: 2rem;
              padding: 0.75rem;
              border: 1px solid #e2e8f0;
              font-size: 0.8rem;
              color: #64748b;
              line-height: 1.6;
              background: #fefce8;
            }
            @media print { body { padding: 0.5rem; } }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  };

  if (loading) {
    return <div className="spinner-container"><div className="spinner" /></div>;
  }

  if (!student) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📋</div>
        <h3 className="empty-state-title">Student Not Found</h3>
      </div>
    );
  }

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-info">
          <h1>Admission Form</h1>
          <p>Virtual admission form for {student.name}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/admissions')}>
            <HiOutlineArrowLeft /> Back
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <HiOutlinePrinter /> Print Admission Form
          </button>
        </div>
      </div>

      <div ref={formRef}>
        <div className="admission-form-container">
          <div className="admission-form">
            {/* Header */}
            <div className="form-header">
              {(school?.logo_url || school?.logo) && (
                <img src={school.logo_url || school.logo} alt="Logo" style={{ width: 70, height: 70, objectFit: 'contain' }} />
              )}
              <div>
                <div className="school-name-print">{school?.name || 'School'}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {school?.address && <span>{school.address}</span>}
                  {school?.phone && <span> • {school.phone}</span>}
                  {school?.email && <span> • {school.email}</span>}
                </div>
              </div>
            </div>

            <div className="form-title-print">Admission Form / Fee Receipt</div>

            {/* Photo + Student Info */}
            <div style={{ overflow: 'hidden', marginBottom: '1.5rem' }}>
              <div className="photo-box-print">
                {(student.photo_url || student.photoUrl) ? (
                  <img src={student.photo_url || student.photoUrl} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>Photo</span>
                )}
              </div>

              <div className="info-grid-print">
                <div className="info-item-print">
                  <span className="info-label-print">Admission No:</span>
                  <span className="info-value-print">{student.admission_no || student.admissionNo}</span>
                </div>
                <div className="info-item-print">
                  <span className="info-label-print">Admission Date:</span>
                  <span className="info-value-print">
                    {(student.admission_date || student.admissionDate) ? format(new Date(student.admission_date || student.admissionDate), 'dd MMM yyyy') : '-'}
                  </span>
                </div>
                <div className="info-item-print">
                  <span className="info-label-print">Student Name:</span>
                  <span className="info-value-print">{student.name}</span>
                </div>
                <div className="info-item-print">
                  <span className="info-label-print">Date of Birth:</span>
                  <span className="info-value-print">
                    {student.dob ? format(new Date(student.dob), 'dd MMM yyyy') : '-'}
                  </span>
                </div>
                <div className="info-item-print">
                  <span className="info-label-print">Gender:</span>
                  <span className="info-value-print" style={{ textTransform: 'capitalize' }}>{student.gender}</span>
                </div>
                <div className="info-item-print">
                  <span className="info-label-print">Aadhar No:</span>
                  <span className="info-value-print">{student.aadhar_no || student.aadharNo || '-'}</span>
                </div>
                <div className="info-item-print">
                  <span className="info-label-print">Class / Section:</span>
                  <span className="info-value-print">Class {student.grade}{student.section ? `-${student.section}` : ''}</span>
                </div>
                <div className="info-item-print">
                  <span className="info-label-print">Academic Year:</span>
                  <span className="info-value-print">{student.academic_year || student.academicYear}</span>
                </div>
              </div>
            </div>

            {/* Parent/Guardian Details */}
            <div className="section-title-print">Parent / Guardian Details</div>
            <div className="info-grid-print">
              <div className="info-item-print">
                <span className="info-label-print">Parent Name:</span>
                <span className="info-value-print">{student.parent_name || student.parentName}</span>
              </div>
              <div className="info-item-print">
                <span className="info-label-print">Phone:</span>
                <span className="info-value-print">{student.parent_phone || student.parentPhone}</span>
              </div>
              <div className="info-item-print">
                <span className="info-label-print">Email:</span>
                <span className="info-value-print">{student.parent_email || student.parentEmail || '-'}</span>
              </div>
              <div className="info-item-print">
                <span className="info-label-print">Address:</span>
                <span className="info-value-print">{student.address || '-'}</span>
              </div>
            </div>

            {/* Fee Summary */}
            {feeRecord && (
              <>
                <div className="section-title-print">Fee Details</div>
                <table className="fee-table-print">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Committed Fee</td>
                      <td style={{ textAlign: 'right' }}>
                        {(feeRecord.committed_fee || feeRecord.committedFee || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td>Total Paid</td>
                      <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>
                        {(feeRecord.total_paid || feeRecord.totalPaid || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td>Balance</td>
                      <td style={{ textAlign: 'right', color: (feeRecord.balance || 0) > 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                        {(feeRecord.balance || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="fee-total-row">
                      <td style={{ fontWeight: 700, background: '#f8fafc' }}>Status</td>
                      <td style={{ fontWeight: 700, textAlign: 'right', background: '#f8fafc', textTransform: 'uppercase' }}>
                        {feeRecord.status}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Payment History */}
                {feeRecord.payments && feeRecord.payments.length > 0 && (
                  <>
                    <div className="section-title-print" style={{ marginTop: '1rem' }}>Payment History</div>
                    <table className="fee-table-print">
                      <thead>
                        <tr>
                          <th>Receipt No</th>
                          <th>Date</th>
                          <th>Mode</th>
                          <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feeRecord.payments.map((p, i) => (
                          <tr key={i}>
                            <td>{p.receiptNo}</td>
                            <td>{p.date ? format(new Date(p.date), 'dd MMM yyyy') : '-'}</td>
                            <td style={{ textTransform: 'capitalize' }}>{p.mode?.replace('_', ' ')}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{(p.amount || 0).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </>
            )}

            {/* Declaration */}
            <div className="declaration-print">
              <strong>Declaration:</strong> I hereby confirm that the information provided above is true and correct.
              I agree to abide by the rules and regulations of the school.
            </div>

            {/* Signatures */}
            <div className="footer-signatures">
              <div style={{ textAlign: 'center' }}>
                <div className="signature-line-print">
                  Parent/Guardian Signature
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="signature-line-print">
                  Office Stamp
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="signature-line-print">
                  Authorized Signature
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print button at bottom */}
      <div className="print-section-footer">
        <button className="btn btn-print" onClick={handlePrint}>
          <HiOutlinePrinter size={18} />
          Print Admission Form & Fee Receipt
        </button>
      </div>
    </div>
  );
};

export default VirtualAdmissionForm;
