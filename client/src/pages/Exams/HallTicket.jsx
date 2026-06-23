import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlinePrinter, HiOutlineArrowLeft, HiOutlineSearch, HiOutlineDocumentText } from 'react-icons/hi';
import { format } from 'date-fns';
import '../../styles/hallticket.css';

const ASSESSMENT_TYPES = [
  'FA1 – Formative Assessment 1',
  'FA2 – Formative Assessment 2',
  'FA3 – Formative Assessment 3',
  'FA4 – Formative Assessment 4',
  'SA1 – Summative Assessment 1',
  'SA2 – Summative Assessment 2',
  'Quarterly Examination',
  'Half Yearly Examination',
  'Annual Examination',
  'Unit Test',
  'Pre-Final Examination',
];

const DEFAULT_SUBJECTS = [
  { name: 'English', date: '' },
  { name: 'Hindi', date: '' },
  { name: 'Telugu', date: '' },
  { name: 'Mathematics', date: '' },
  { name: 'Science', date: '' },
  { name: 'Social Studies', date: '' },
];

const DEFAULT_INSTRUCTIONS = [
  'Students must carry this hall ticket to the examination hall.',
  'Students should report 30 minutes before the examination.',
  'Electronic devices including mobile phones are strictly prohibited.',
  'Students must bring their own stationery. Sharing of materials is not allowed.',
  'Any form of malpractice will lead to cancellation of the examination.',
];

const HallTicket = () => {
  const navigate = useNavigate();
  const hallTicketRef = useRef();

  // Data states
  const [school, setSchool] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  // Form states
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [assessmentName, setAssessmentName] = useState('');
  const [customAssessment, setCustomAssessment] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [instructions, setInstructions] = useState(DEFAULT_INSTRUCTIONS);
  const [newInstruction, setNewInstruction] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Class/section options
  const classes = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const sections = ['A', 'B', 'C', 'D'];

  useEffect(() => {
    fetchSchool();
  }, []);

  const fetchSchool = async () => {
    try {
      const res = await api.get('/schools');
      setSchool(res.data.data);
    } catch (error) {
      toast.error('Failed to load school data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    if (!selectedClass) {
      toast.error('Please select a class');
      return;
    }
    setSearchLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('grade', selectedClass);
      if (selectedSection) params.append('section', selectedSection);
      const res = await api.get(`/students?${params.toString()}`);
      setStudents(res.data.data || []);
      if ((res.data.data || []).length === 0) {
        toast.error('No students found');
      }
    } catch (error) {
      toast.error('Failed to fetch students');
      setStudents([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddSubject = () => {
    setSubjects([...subjects, { name: '', date: '' }]);
  };

  const handleRemoveSubject = (index) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleSubjectChange = (index, field, value) => {
    const updated = [...subjects];
    updated[index][field] = value;
    setSubjects(updated);
  };

  const handleAddInstruction = () => {
    if (newInstruction.trim()) {
      setInstructions([...instructions, newInstruction.trim()]);
      setNewInstruction('');
    }
  };

  const handleRemoveInstruction = (index) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const getAssessmentTitle = () => {
    if (assessmentName === 'custom') return customAssessment;
    return assessmentName;
  };

  const handleGeneratePreview = () => {
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }
    if (!assessmentName || (assessmentName === 'custom' && !customAssessment.trim())) {
      toast.error('Please select or enter an assessment name');
      return;
    }
    if (subjects.filter(s => s.name.trim()).length === 0) {
      toast.error('Please add at least one subject');
      return;
    }
    setShowPreview(true);
  };

  const handlePrint = () => {
    const content = hallTicketRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Hall Ticket - ${selectedStudent?.name || 'Student'}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              color: #0f172a;
              background: white;
              padding: 0;
            }
            .ht-page {
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              padding: 12mm 15mm;
              position: relative;
            }
            .ht-border {
              border: 3px solid #1e3a5f;
              padding: 8mm;
              min-height: calc(297mm - 24mm);
              position: relative;
            }
            .ht-border::before {
              content: '';
              position: absolute;
              inset: 3px;
              border: 1px solid #1e3a5f;
              pointer-events: none;
            }
            .ht-header {
              display: flex;
              align-items: center;
              gap: 1rem;
              padding-bottom: 0.75rem;
              border-bottom: 2px solid #1e3a5f;
              margin-bottom: 0.5rem;
            }
            .ht-logo {
              width: 70px;
              height: 70px;
              object-fit: contain;
              flex-shrink: 0;
            }
            .ht-logo-placeholder {
              width: 70px;
              height: 70px;
              border: 2px solid #1e3a5f;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 0.7rem;
              color: #64748b;
              text-transform: uppercase;
              font-weight: 600;
              flex-shrink: 0;
              background: #f0f4f8;
            }
            .ht-school-info {
              flex: 1;
              text-align: center;
            }
            .ht-school-name {
              font-family: 'Outfit', sans-serif;
              font-size: 1.6rem;
              font-weight: 800;
              color: #1e3a5f;
              text-transform: uppercase;
              letter-spacing: 0.04em;
              line-height: 1.2;
            }
            .ht-school-address {
              font-size: 0.82rem;
              color: #475569;
              margin-top: 0.2rem;
            }
            .ht-school-contact {
              font-size: 0.78rem;
              color: #64748b;
              margin-top: 0.15rem;
            }
            .ht-title-row {
              text-align: center;
              margin: 0.75rem 0;
            }
            .ht-title {
              display: inline-block;
              font-family: 'Outfit', sans-serif;
              font-size: 1.3rem;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.15em;
              color: #1e3a5f;
              padding: 0.4rem 2rem;
              border: 2px solid #1e3a5f;
              background: #edf2f7;
            }
            .ht-assessment {
              text-align: center;
              font-size: 1rem;
              font-weight: 700;
              color: #1e3a5f;
              margin: 0.5rem 0 1rem;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .ht-student-section {
              display: flex;
              gap: 1.5rem;
              margin-bottom: 1.25rem;
            }
            .ht-student-details {
              flex: 1;
            }
            .ht-detail-row {
              display: flex;
              padding: 0.4rem 0;
              border-bottom: 1px dotted #94a3b8;
              font-size: 0.88rem;
            }
            .ht-detail-label {
              font-weight: 700;
              min-width: 160px;
              color: #334155;
              text-transform: uppercase;
              font-size: 0.78rem;
              letter-spacing: 0.03em;
            }
            .ht-detail-value {
              font-weight: 600;
              color: #0f172a;
            }
            .ht-photo-box {
              width: 110px;
              height: 130px;
              border: 2px solid #1e3a5f;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 0.7rem;
              color: #64748b;
              text-transform: uppercase;
              font-weight: 600;
              flex-shrink: 0;
              background: #f8fafc;
            }
            .ht-photo-box img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .ht-section-title {
              font-family: 'Outfit', sans-serif;
              font-size: 0.85rem;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: white;
              background: #1e3a5f;
              padding: 0.4rem 0.75rem;
              margin: 1rem 0 0.5rem;
            }
            .ht-schedule-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 0.5rem;
            }
            .ht-schedule-table th {
              background: #edf2f7;
              padding: 0.55rem 0.75rem;
              font-size: 0.75rem;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              text-align: left;
              color: #1e3a5f;
              border: 1.5px solid #1e3a5f;
            }
            .ht-schedule-table td {
              padding: 0.5rem 0.75rem;
              font-size: 0.85rem;
              border: 1px solid #94a3b8;
              color: #0f172a;
            }
            .ht-schedule-table tbody tr:nth-child(even) {
              background: #f8fafc;
            }
            .ht-instructions-list {
              list-style: none;
              padding: 0;
              margin: 0.25rem 0;
            }
            .ht-instructions-list li {
              position: relative;
              padding: 0.3rem 0 0.3rem 1.25rem;
              font-size: 0.82rem;
              color: #334155;
              line-height: 1.5;
            }
            .ht-instructions-list li::before {
              content: '•';
              position: absolute;
              left: 0.25rem;
              color: #1e3a5f;
              font-weight: 700;
              font-size: 1rem;
            }
            .ht-signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 2.5rem;
              padding-top: 0.5rem;
            }
            .ht-sig-block {
              text-align: center;
              min-width: 140px;
            }
            .ht-sig-line {
              border-top: 1.5px solid #1e3a5f;
              padding-top: 0.5rem;
              font-size: 0.78rem;
              font-weight: 700;
              color: #1e3a5f;
              text-transform: uppercase;
              letter-spacing: 0.03em;
            }
            .ht-seal-note {
              text-align: center;
              margin-top: 1.5rem;
              font-size: 0.75rem;
              color: #64748b;
              font-style: italic;
            }
            .ht-footer-line {
              text-align: center;
              margin-top: 1rem;
              padding-top: 0.5rem;
              border-top: 1px solid #cbd5e1;
              font-size: 0.7rem;
              color: #94a3b8;
            }
            .print-section-footer { display: none !important; }
            @media print {
              body { padding: 0; }
              .ht-page { padding: 0; width: 100%; }
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
    }, 400);
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    try { return format(new Date(d), 'dd MMM yyyy (EEEE)'); } catch { return d; }
  };

  const fmtDateShort = (d) => {
    if (!d) return '—';
    try { return format(new Date(d), 'dd/MM/yyyy'); } catch { return d; }
  };

  if (loading) {
    return <div className="spinner-container" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;
  }

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1>📋 Hall Ticket</h1>
          <p>Generate and print examination hall tickets</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            <HiOutlineArrowLeft /> Back
          </button>
          {showPreview && (
            <button className="btn btn-primary" onClick={handlePrint}>
              <HiOutlinePrinter /> Print Hall Ticket
            </button>
          )}
        </div>
      </div>

      {/* Configuration Panel */}
      {!showPreview && (
        <div className="ht-config-panel">
          {/* Assessment Selection */}
          <div className="card ht-config-card">
            <div className="card-header">
              <h3 className="card-title">📝 Assessment Details</h3>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Assessment / Examination Name *</label>
                <select
                  id="assessment-select"
                  className="form-select"
                  value={assessmentName}
                  onChange={(e) => setAssessmentName(e.target.value)}
                >
                  <option value="">Select assessment type</option>
                  {ASSESSMENT_TYPES.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                  <option value="custom">Custom — Enter manually</option>
                </select>
              </div>
              {assessmentName === 'custom' && (
                <div className="form-group">
                  <label className="form-label">Custom Assessment Name *</label>
                  <input
                    id="custom-assessment-input"
                    className="form-input"
                    type="text"
                    placeholder="e.g. Mid-Term Examination 2025"
                    value={customAssessment}
                    onChange={(e) => setCustomAssessment(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Student Selection */}
          <div className="card ht-config-card">
            <div className="card-header">
              <h3 className="card-title">👤 Select Student</h3>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Class *</label>
                <select
                  id="class-select"
                  className="form-select"
                  value={selectedClass}
                  onChange={(e) => { setSelectedClass(e.target.value); setSelectedStudent(null); setStudents([]); }}
                >
                  <option value="">Select class</option>
                  {classes.map(c => (
                    <option key={c} value={c}>{c === 'Nursery' || c === 'LKG' || c === 'UKG' ? c : `Class ${c}`}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Section</label>
                <select
                  id="section-select"
                  className="form-select"
                  value={selectedSection}
                  onChange={(e) => { setSelectedSection(e.target.value); setSelectedStudent(null); setStudents([]); }}
                >
                  <option value="">All Sections</option>
                  {sections.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              id="search-students-btn"
              className="btn btn-primary"
              onClick={fetchStudents}
              disabled={searchLoading || !selectedClass}
            >
              <HiOutlineSearch /> {searchLoading ? 'Searching...' : 'Search Students'}
            </button>

            {/* Student List */}
            {students.length > 0 && (
              <div className="ht-student-list">
                {students.map(student => (
                  <div
                    key={student.id}
                    className={`ht-student-item ${selectedStudent?.id === student.id ? 'selected' : ''}`}
                    onClick={() => setSelectedStudent(student)}
                  >
                    <div className="ht-student-item-avatar">
                      {(student.photo_url || student.photoUrl) ? (
                        <img src={student.photo_url || student.photoUrl} alt={student.name} />
                      ) : (
                        <span>{student.name?.charAt(0)?.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="ht-student-item-info">
                      <div className="ht-student-item-name">{student.name}</div>
                      <div className="ht-student-item-meta">
                        {student.admission_no || student.admissionNo} • Class {student.grade}{student.section ? `-${student.section}` : ''}
                        {(student.roll_no || student.rollNo) ? ` • Roll: ${student.roll_no || student.rollNo}` : ''}
                      </div>
                    </div>
                    {selectedStudent?.id === student.id && (
                      <div className="ht-student-item-check">✓</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Examination Schedule */}
          <div className="card ht-config-card">
            <div className="card-header">
              <h3 className="card-title">📅 Examination Schedule</h3>
              <button className="btn btn-sm btn-secondary" onClick={handleAddSubject}>+ Add Subject</button>
            </div>
            <div className="ht-subjects-editor">
              {subjects.map((subject, index) => (
                <div key={index} className="ht-subject-row">
                  <div className="ht-subject-num">{index + 1}</div>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Subject name"
                    value={subject.name}
                    onChange={(e) => handleSubjectChange(index, 'name', e.target.value)}
                  />
                  <input
                    className="form-input ht-date-input"
                    type="date"
                    value={subject.date}
                    onChange={(e) => handleSubjectChange(index, 'date', e.target.value)}
                  />
                  <button
                    className="btn btn-sm btn-ghost ht-remove-btn"
                    onClick={() => handleRemoveSubject(index)}
                    title="Remove subject"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="card ht-config-card">
            <div className="card-header">
              <h3 className="card-title">📌 Instructions</h3>
            </div>
            <div className="ht-instructions-editor">
              {instructions.map((inst, index) => (
                <div key={index} className="ht-instruction-row">
                  <span className="ht-instruction-text">{inst}</span>
                  <button
                    className="btn btn-sm btn-ghost ht-remove-btn"
                    onClick={() => handleRemoveInstruction(index)}
                    title="Remove instruction"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="ht-add-instruction-row">
                <input
                  className="form-input"
                  type="text"
                  placeholder="Add a new instruction..."
                  value={newInstruction}
                  onChange={(e) => setNewInstruction(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddInstruction()}
                />
                <button className="btn btn-sm btn-secondary" onClick={handleAddInstruction}>Add</button>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="ht-generate-row">
            <button
              id="generate-hallticket-btn"
              className="btn btn-lg btn-primary"
              onClick={handleGeneratePreview}
            >
              <HiOutlineDocumentText /> Generate Hall Ticket Preview
            </button>
          </div>
        </div>
      )}

      {/* Back to Edit button */}
      {showPreview && (
        <div style={{ marginBottom: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowPreview(false)}>
            ← Back to Edit
          </button>
        </div>
      )}

      {/* ======================== HALL TICKET PREVIEW ======================== */}
      {showPreview && selectedStudent && (
        <div ref={hallTicketRef}>
          <div className="ht-page">
            <div className="ht-border">
              {/* Header */}
              <div className="ht-header">
                {(school?.logo_url || school?.logo) ? (
                  <img className="ht-logo" src={school.logo_url || school.logo} alt="School Logo" />
                ) : (
                  <div className="ht-logo-placeholder">Logo</div>
                )}
                <div className="ht-school-info">
                  <div className="ht-school-name">{school?.name || 'School Name'}</div>
                  {school?.address && <div className="ht-school-address">{school.address}</div>}
                  <div className="ht-school-contact">
                    {school?.phone && <span>Phone: {school.phone}</span>}
                    {school?.email && <span> | Email: {school.email}</span>}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="ht-title-row">
                <div className="ht-title">HALL TICKET</div>
              </div>

              {/* Assessment Name */}
              <div className="ht-assessment">{getAssessmentTitle()}</div>

              {/* Student Information */}
              <div className="ht-student-section">
                <div className="ht-student-details">
                  <div className="ht-detail-row">
                    <span className="ht-detail-label">Student Name</span>
                    <span className="ht-detail-value">{selectedStudent.name || '—'}</span>
                  </div>
                  <div className="ht-detail-row">
                    <span className="ht-detail-label">Admission No</span>
                    <span className="ht-detail-value">{selectedStudent.admission_no || selectedStudent.admissionNo || '—'}</span>
                  </div>
                  <div className="ht-detail-row">
                    <span className="ht-detail-label">Class</span>
                    <span className="ht-detail-value">{selectedStudent.grade || '—'}</span>
                  </div>
                  <div className="ht-detail-row">
                    <span className="ht-detail-label">Section</span>
                    <span className="ht-detail-value">{selectedStudent.section || '—'}</span>
                  </div>
                  <div className="ht-detail-row">
                    <span className="ht-detail-label">Roll Number</span>
                    <span className="ht-detail-value">{selectedStudent.roll_no || selectedStudent.rollNo || '—'}</span>
                  </div>
                  <div className="ht-detail-row">
                    <span className="ht-detail-label">Parent / Guardian</span>
                    <span className="ht-detail-value">{selectedStudent.parent_name || selectedStudent.parentName || '—'}</span>
                  </div>
                </div>
                <div className="ht-photo-box">
                  {(selectedStudent.photo_url || selectedStudent.photoUrl) ? (
                    <img src={selectedStudent.photo_url || selectedStudent.photoUrl} alt="Student" />
                  ) : (
                    <span>Student<br/>Photo</span>
                  )}
                </div>
              </div>

              {/* Examination Schedule */}
              <div className="ht-section-title">Examination Schedule</div>
              <table className="ht-schedule-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>S.No</th>
                    <th>Subject</th>
                    <th style={{ width: '200px' }}>Date of Examination</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.filter(s => s.name.trim()).map((subject, index) => (
                    <tr key={index}>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                      <td>{subject.name}</td>
                      <td>{subject.date ? fmtDate(subject.date) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Instructions */}
              <div className="ht-section-title">Instructions to Students</div>
              <ul className="ht-instructions-list">
                {instructions.map((inst, index) => (
                  <li key={index}>{inst}</li>
                ))}
              </ul>

              {/* Signatures */}
              <div className="ht-signatures">
                <div className="ht-sig-block">
                  <div style={{ height: '50px' }}></div>
                  <div className="ht-sig-line">Class Teacher</div>
                </div>
                <div className="ht-sig-block">
                  <div style={{ height: '50px' }}></div>
                  <div className="ht-sig-line">Exam Incharge</div>
                </div>
                <div className="ht-sig-block">
                  <div style={{ height: '50px' }}></div>
                  <div className="ht-sig-line">Principal</div>
                </div>
              </div>

              {/* Seal Note */}
              <div className="ht-seal-note">( School Seal )</div>

              {/* Footer */}
              <div className="ht-footer-line">
                This is a computer-generated hall ticket. Valid only with school seal and authorized signatures.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Footer */}
      {showPreview && (
        <div className="print-section-footer">
          <button className="btn btn-print" onClick={handlePrint}>
            <HiOutlinePrinter size={18} />
            Print Hall Ticket
          </button>
        </div>
      )}
    </div>
  );
};

export default HallTicket;
