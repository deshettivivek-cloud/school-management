import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlinePrinter, HiOutlineArrowLeft } from 'react-icons/hi';
import { format } from 'date-fns';
import { getImageUrl } from '../../utils/helpers';

const TcView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tc, setTc] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const formRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tcRes, schoolRes] = await Promise.all([
          api.get(`/tc/${id}`),
          api.get('/schools'),
        ]);
        setTc(tcRes.data.data);
        setSchool(schoolRes.data.data);
      } catch (error) {
        toast.error('Failed to load TC');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handlePrint = () => {
    const content = formRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Transfer Certificate - ${tc?.student?.name || 'Student'}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Inter', -apple-system, sans-serif;
              padding: 2rem;
              color: #0f172a;
              background: white;
            }
            .tc-form-container { padding: 0; border: none; max-width: 100%; }
            .tc-form {
              max-width: 100%;
              margin: 0 auto;
            }
            .form-header {
              display: flex;
              align-items: center;
              gap: 1.5rem;
              border-bottom: 3px solid #0f172a;
              padding-bottom: 1rem;
              margin-bottom: 1.5rem;
            }
            .form-header img {
              width: 80px;
              height: 80px;
              object-fit: contain;
            }
            .school-name-print {
              font-family: 'Outfit', sans-serif;
              font-size: 1.8rem;
              font-weight: 800;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .school-info-print { font-size: 0.95rem; color: #475569; margin-top: 0.25rem; }
            .form-title-print {
              text-align: center;
              font-size: 1.4rem;
              font-weight: 800;
              margin: 1.5rem 0;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              padding: 0.75rem;
              background: #f8fafc;
              border: 2px solid #0f172a;
              color: #0f172a;
            }
            .tc-meta-row {
              display: flex;
              justify-content: space-between;
              font-size: 0.95rem;
              font-weight: 700;
              margin-bottom: 1.5rem;
              padding-bottom: 0.75rem;
              border-bottom: 1px solid #cbd5e1;
            }
            .info-grid-print {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 0.75rem;
              margin-bottom: 1.5rem;
            }
            .info-item-print {
              display: flex;
              padding: 0.4rem 0;
              border-bottom: 1px dotted #94a3b8;
            }
            .info-item-print.full-width {
              grid-column: 1 / -1;
            }
            .info-label-print {
              font-weight: 700;
              min-width: 180px;
              font-size: 0.9rem;
              color: #475569;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .info-value-print {
              font-size: 0.95rem;
              color: #0f172a;
              font-weight: 600;
            }
            .sl-no {
              display: inline-block;
              width: 2rem;
              color: #64748b;
              font-weight: 600;
            }
            .section-title-print {
              font-size: 1.1rem;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #0f172a;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 0.4rem;
              margin: 2rem 0 1rem;
            }
            .photo-box-print {
              width: 120px;
              height: 150px;
              border: 2px solid #0f172a;
              float: right;
              margin-left: 1.5rem;
              margin-bottom: 1rem;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 0.8rem;
              color: #64748b;
              text-transform: uppercase;
              font-weight: 600;
              background: #f8fafc;
            }
            .photo-box-print img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .declaration-print {
              margin-top: 2.5rem;
              padding: 1rem;
              border: 2px solid #0f172a;
              font-size: 0.9rem;
              color: #0f172a;
              line-height: 1.6;
              background: #fefce8;
              font-weight: 500;
            }
            .footer-signatures {
              margin-top: 4rem;
              display: flex;
              justify-content: space-between;
              font-size: 0.9rem;
            }
            .signature-line-print {
              border-top: 2px solid #0f172a;
              padding-top: 0.75rem;
              min-width: 200px;
              text-align: center;
              color: #0f172a;
              font-weight: 700;
              text-transform: uppercase;
              font-size: 0.85rem;
              letter-spacing: 0.05em;
            }
            .seal-box {
              text-align: center;
              margin-top: 2rem;
              font-size: 0.85rem;
              color: #64748b;
              font-weight: 600;
            }
            .tc-note {
              margin-top: 2rem;
              padding-top: 1rem;
              border-top: 1px solid #cbd5e1;
              font-size: 0.8rem;
              color: #64748b;
              text-align: center;
              font-style: italic;
            }
            .print-section-footer { display: none !important; }
            @media print { 
              body { padding: 0.5rem; } 
              .page-header { display: none !important; }
            }
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

  if (!tc) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📜</div>
        <h3 className="empty-state-title">TC Not Found</h3>
        <button className="btn btn-primary" onClick={() => navigate('/tc/register')}>Back to Register</button>
      </div>
    );
  }

  const student = tc.student || {};
  const fmtDate = (d) => {
    if (!d) return '—';
    try { return format(new Date(d), 'dd MMM yyyy'); } catch { return d; }
  };
  const fmtDateWords = (d) => {
    if (!d) return '—';
    try { return format(new Date(d), 'dd MMMM yyyy'); } catch { return d; }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-info">
          <h1>Transfer Certificate</h1>
          <p>TC for {student.name}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/tc/register')}>
            <HiOutlineArrowLeft /> Back
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <HiOutlinePrinter /> Print Transfer Certificate
          </button>
        </div>
      </div>

      <div ref={formRef}>
        <div className="tc-form-container">
          <div className="tc-form">
            {/* Header — same style as admission form */}
            <div className="form-header">
              {(school?.logo_url || school?.logo) && (
                <img src={getImageUrl(school.logo_url || school.logo)} alt="Logo" style={{ width: 70, height: 70, objectFit: 'contain' }} />
              )}
              <div>
                <div className="school-name-print">{school?.name || 'School'}</div>
                <div className="school-info-print">
                  {school?.address && <span>{school.address}</span>}
                  {school?.phone && <span> • {school.phone}</span>}
                  {school?.email && <span> • {school.email}</span>}
                </div>
              </div>
            </div>

            <div className="form-title-print">Transfer Certificate</div>

            {/* TC Number & Date */}
            <div className="tc-meta-row">
              <span>TC No: {tc.tc_number || tc.tcNumber}</span>
              <span>Date: {fmtDate(tc.issued_date || tc.issuedDate)}</span>
            </div>

            {/* Photo + Student Details */}
            <div style={{ overflow: 'hidden', marginBottom: '1.5rem' }}>
              <div className="photo-box-print">
                {(student.photo_url || student.photoUrl) ? (
                  <img src={getImageUrl(student.photo_url || student.photoUrl)} alt="Student" />
                ) : (
                  <span>Photo</span>
                )}
              </div>

              <div className="section-title-print" style={{ marginTop: 0 }}>Student Details</div>
              <div className="info-grid-print">
                <div className="info-item-print">
                  <span className="info-label-print"><span className="sl-no">1.</span>Name of the Pupil:</span>
                  <span className="info-value-print">{student.name || '—'}</span>
                </div>
                <div className="info-item-print">
                  <span className="info-label-print"><span className="sl-no">2.</span>Admission No:</span>
                  <span className="info-value-print">{student.admission_no || student.admissionNo || '—'}</span>
                </div>
                <div className="info-item-print">
                  <span className="info-label-print"><span className="sl-no">3.</span>Father / Mother:</span>
                  <span className="info-value-print">{student.parent_name || student.parentName || '—'}</span>
                </div>
                <div className="info-item-print">
                  <span className="info-label-print"><span className="sl-no">4.</span>Date of Birth:</span>
                  <span className="info-value-print">{fmtDateWords(student.dob)}</span>
                </div>
                <div className="info-item-print">
                  <span className="info-label-print"><span className="sl-no">5.</span>Gender:</span>
                  <span className="info-value-print" style={{ textTransform: 'capitalize' }}>{student.gender || '—'}</span>
                </div>
                <div className="info-item-print">
                  <span className="info-label-print"><span className="sl-no">6.</span>Aadhaar No:</span>
                  <span className="info-value-print">{student.aadhar_no || student.aadharNo || '—'}</span>
                </div>
                <div className="info-item-print">
                  <span className="info-label-print"><span className="sl-no">7.</span>Class / Section:</span>
                  <span className="info-value-print">Class {student.grade}{student.section ? ` — ${student.section}` : ''}</span>
                </div>
                <div className="info-item-print">
                  <span className="info-label-print"><span className="sl-no">8.</span>Academic Year:</span>
                  <span className="info-value-print">{student.academic_year || student.academicYear || '—'}</span>
                </div>
                <div className="info-item-print">
                  <span className="info-label-print"><span className="sl-no">9.</span>Date of Admission:</span>
                  <span className="info-value-print">{fmtDate(student.admission_date || student.admissionDate)}</span>
                </div>
                <div className="info-item-print">
                  <span className="info-label-print"><span className="sl-no">10.</span>Phone No:</span>
                  <span className="info-value-print">{student.parent_phone || student.parentPhone || '—'}</span>
                </div>
                <div className="info-item-print full-width">
                  <span className="info-label-print"><span className="sl-no">11.</span>Address:</span>
                  <span className="info-value-print">{student.address || '—'}</span>
                </div>
              </div>
            </div>

            {/* Transfer Details */}
            <div className="section-title-print">Transfer Details</div>
            <div className="info-grid-print">
              <div className="info-item-print">
                <span className="info-label-print"><span className="sl-no">12.</span>Date of Leaving:</span>
                <span className="info-value-print">{fmtDateWords(tc.date_of_leaving || tc.dateOfLeaving)}</span>
              </div>
              <div className="info-item-print">
                <span className="info-label-print"><span className="sl-no">13.</span>General Conduct:</span>
                <span className="info-value-print">{tc.conduct || 'Good'}</span>
              </div>
              <div className="info-item-print full-width">
                <span className="info-label-print"><span className="sl-no">14.</span>Reason for Leaving:</span>
                <span className="info-value-print">{tc.reason || '—'}</span>
              </div>
              <div className="info-item-print">
                <span className="info-label-print"><span className="sl-no">15.</span>All Dues Paid:</span>
                <span className="info-value-print">Yes</span>
              </div>
              <div className="info-item-print">
                <span className="info-label-print"><span className="sl-no">16.</span>Date of Issue:</span>
                <span className="info-value-print">{fmtDateWords(tc.issued_date || tc.issuedDate)}</span>
              </div>
              <div className="info-item-print full-width">
                <span className="info-label-print"><span className="sl-no">17.</span>Remarks:</span>
                <span className="info-value-print">{tc.remarks || 'Nil'}</span>
              </div>
            </div>

            {/* Declaration */}
            <div className="declaration-print">
              <strong>Note:</strong> This Transfer Certificate is issued on the request of the parent/guardian of the above-named pupil.
              The character and conduct of the pupil has been <strong>{tc.conduct || 'Good'}</strong> during the stay in this school.
              This Transfer Certificate should be presented at the time of admission to another school. No duplicate shall be issued.
            </div>

            {/* Signatures */}
            <div className="footer-signatures">
              <div style={{ textAlign: 'center' }}>
                <div className="signature-line-print">
                  Class Teacher
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="signature-line-print">
                  Office Seal & Stamp
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="signature-line-print">
                  Principal / Head Master
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
          Print Transfer Certificate
        </button>
      </div>
    </div>
  );
};

export default TcView;
