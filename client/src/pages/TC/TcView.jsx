import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineArrowLeft, HiOutlinePrinter } from 'react-icons/hi';
import { format } from 'date-fns';

const TcView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tc, setTc] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

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
    const printContent = document.getElementById('tc-printable');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Transfer Certificate — ${tc?.tc_number || tc?.tcNumber}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Inter', 'Times New Roman', serif;
              color: #1a1a1a;
              padding: 0;
              line-height: 1.7;
              background: white;
            }
            .tc-page {
              max-width: 800px;
              margin: 0 auto;
              padding: 2rem 2.5rem;
            }
            .tc-header {
              text-align: center;
              margin-bottom: 1.5rem;
              padding-bottom: 1rem;
              border-bottom: 3px double #1a1a1a;
            }
            .tc-school-name {
              font-family: 'Outfit', sans-serif;
              font-size: 1.6rem;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #0f172a;
              margin-bottom: 0.25rem;
            }
            .tc-school-address {
              font-size: 0.85rem;
              color: #475569;
              margin-bottom: 0.5rem;
            }
            .tc-title {
              font-family: 'Outfit', sans-serif;
              font-size: 1.3rem;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              margin-top: 0.75rem;
              color: #0f172a;
            }
            .tc-subtitle {
              font-size: 0.8rem;
              color: #64748b;
              margin-top: 0.25rem;
            }
            .tc-meta {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1.5rem;
              font-size: 0.85rem;
              font-weight: 600;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 0.75rem;
            }
            .tc-body {
              margin-bottom: 1.5rem;
            }
            .tc-row {
              display: flex;
              border-bottom: 1px solid #f1f5f9;
              padding: 0.55rem 0;
              font-size: 0.88rem;
            }
            .tc-row:last-child {
              border-bottom: none;
            }
            .tc-label {
              width: 42%;
              font-weight: 600;
              color: #334155;
              padding-right: 1rem;
            }
            .tc-label .sl-no {
              display: inline-block;
              width: 2rem;
              color: #94a3b8;
            }
            .tc-value {
              flex: 1;
              color: #0f172a;
              font-weight: 500;
              border-bottom: 1px dotted #cbd5e1;
              padding-left: 0.25rem;
            }
            .tc-footer {
              margin-top: 3rem;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              font-size: 0.85rem;
            }
            .tc-footer-col {
              text-align: center;
            }
            .tc-footer-col .line {
              border-top: 1px solid #1a1a1a;
              width: 160px;
              margin-bottom: 0.25rem;
            }
            .tc-footer-col .label {
              font-weight: 600;
              color: #475569;
              font-size: 0.8rem;
            }
            .tc-note {
              margin-top: 2rem;
              padding-top: 1rem;
              border-top: 1px solid #e2e8f0;
              font-size: 0.75rem;
              color: #94a3b8;
              text-align: center;
              font-style: italic;
            }
            .tc-seal {
              margin-top: 2.5rem;
              text-align: center;
              font-size: 0.8rem;
              color: #64748b;
            }
            @media print {
              body { padding: 0; }
              .tc-page { padding: 1.5rem; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  };

  if (loading) {
    return (
      <div className="spinner-container" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!tc) {
    return (
      <div className="animate-fade-in">
        <div className="empty-state">
          <div className="empty-state-icon">📜</div>
          <h3 className="empty-state-title">TC Not Found</h3>
          <button className="btn btn-primary" onClick={() => navigate('/tc/register')}>
            Back to Register
          </button>
        </div>
      </div>
    );
  }

  const student = tc.student || {};
  const fmtDate = (d) => {
    if (!d) return '—';
    try { return format(new Date(d), 'dd MMMM yyyy'); } catch { return d; }
  };

  // Build the serial numbered TC fields
  const tcFields = [
    { label: 'Name of the Pupil', value: student.name || '—' },
    { label: "Father's / Mother's Name", value: student.parent_name || student.parentName || '—' },
    { label: 'Date of Birth (in words)', value: student.dob ? fmtDate(student.dob) : '—' },
    { label: 'Gender', value: student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : '—' },
    { label: 'Nationality / Religion / Caste', value: '—' },
    { label: 'Aadhaar Number', value: student.aadhar_no || student.aadharNo || '—' },
    { label: 'Admission Number', value: student.admission_no || student.admissionNo || '—' },
    { label: 'Date of Admission', value: fmtDate(student.admission_date || student.admissionDate) },
    { label: 'Class in which the pupil was studying', value: student.grade ? `Class ${student.grade}${student.section ? ` — Section ${student.section}` : ''}` : '—' },
    { label: 'Academic Year', value: student.academic_year || student.academicYear || '—' },
    { label: 'Date of Leaving the School', value: fmtDate(tc.date_of_leaving || tc.dateOfLeaving) },
    { label: 'Reason for Leaving', value: tc.reason || '—' },
    { label: 'Whether the pupil has paid all dues', value: 'Yes' },
    { label: 'General Conduct', value: tc.conduct || 'Good' },
    { label: 'Date of issue of Transfer Certificate', value: fmtDate(tc.issued_date || tc.issuedDate) },
    { label: 'Remarks', value: tc.remarks || 'Nil' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-info">
          <h1>Transfer Certificate</h1>
          <p>TC No: {tc.tc_number || tc.tcNumber}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/tc/register')}>
            <HiOutlineArrowLeft /> Back
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <HiOutlinePrinter /> Print TC
          </button>
        </div>
      </div>

      {/* Printable TC */}
      <div id="tc-printable">
        <div className="tc-page" style={{
          maxWidth: 800,
          margin: '0 auto',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '2rem 2.5rem',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '3px double var(--text-primary)' }}>
            {school?.logo_url && (
              <img src={school.logo_url} alt="School Logo" style={{ height: 60, marginBottom: '0.5rem' }} />
            )}
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
              {school?.name || 'School Name'}
            </div>
            {school?.address && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                {school.address}
                {school.phone ? ` | Phone: ${school.phone}` : ''}
                {school.email ? ` | Email: ${school.email}` : ''}
              </div>
            )}
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.75rem', color: 'var(--text-primary)' }}>
              Transfer Certificate
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              (Issued under the provisions of Right to Education Act)
            </div>
          </div>

          {/* TC Number & Date */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '0.88rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', color: 'var(--text-primary)' }}>
            <span>TC No: <span style={{ color: 'var(--primary-400)' }}>{tc.tc_number || tc.tcNumber}</span></span>
            <span>Date: {fmtDate(tc.issued_date || tc.issuedDate)}</span>
          </div>

          {/* TC Body — Serial Numbered Fields */}
          <div style={{ marginBottom: '1.5rem' }}>
            {tcFields.map((field, i) => (
              <div key={i} style={{
                display: 'flex',
                borderBottom: `1px solid ${i === tcFields.length - 1 ? 'transparent' : 'rgba(255,255,255,0.05)'}`,
                padding: '0.55rem 0',
                fontSize: '0.88rem',
              }}>
                <div style={{ width: '45%', fontWeight: 600, color: 'var(--text-secondary)', paddingRight: '1rem' }}>
                  <span style={{ display: 'inline-block', width: '2rem', color: 'var(--text-muted)' }}>{i + 1}.</span>
                  {field.label}
                </div>
                <div style={{
                  flex: 1,
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                  borderBottom: '1px dotted var(--border-color)',
                  paddingLeft: '0.25rem',
                }}>
                  {field.value}
                </div>
              </div>
            ))}
          </div>

          {/* Signatures */}
          <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.85rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid var(--text-primary)', width: 160, marginBottom: '0.25rem' }}></div>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Class Teacher</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid var(--text-primary)', width: 160, marginBottom: '0.25rem' }}></div>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Office Clerk</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid var(--text-primary)', width: 160, marginBottom: '0.25rem' }}></div>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Principal / Head Master</div>
            </div>
          </div>

          {/* Seal placeholder */}
          <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            ( School Seal )
          </div>

          {/* Note */}
          <div style={{
            marginTop: '2rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            fontStyle: 'italic',
          }}>
            Note: This Transfer Certificate should be presented at the time of admission to another school. No duplicate shall be issued.
            <br />
            Issued by: {tc.issuedBy?.name || 'Admin'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TcView;
