import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlinePrinter, HiOutlineArrowLeft, HiOutlineSearch, HiOutlineDocumentText } from 'react-icons/hi';
import { format } from 'date-fns';
import '../../styles/hallticket.css';

const ASSESSMENT_TYPES = [
  'TERM TEST – II',
  'TERM TEST – I',
  'FA1 – Formative Assessment 1',
  'FA2 – Formative Assessment 2',
  'SA1 – Summative Assessment 1',
  'SA2 – Summative Assessment 2',
  'Quarterly Examination',
  'Half Yearly Examination',
  'Annual Examination',
  'Pre-Final Examination',
];

const DEFAULT_SUBJECTS = [
  { name: 'ENGLISH', code: 'SUB001', date: '' },
  { name: 'MATHEMATICS', code: 'SUB002', date: '' },
  { name: 'SCIENCE', code: 'SUB003', date: '' },
  { name: 'SOCIAL SCIENCE', code: 'SUB004', date: '' },
  { name: 'SECOND LANGUAGE (HINDI)', code: 'SUB005', date: '' },
  { name: 'COMPUTER APPLICATIONS', code: 'SUB006', date: '' },
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
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [showPreview, setShowPreview] = useState(false);
  
  // New States for Redesign
  const [fnTiming, setFnTiming] = useState('09:30 AM – 12:30 PM');
  const [anTiming, setAnTiming] = useState('01:30 PM – 04:30 PM');
  const [issueDate, setIssueDate] = useState(format(new Date(), 'dd-MM-yyyy'));

  // Class/section options
  const classes = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
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
      setSelectedStudents([]);
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
    setSubjects([...subjects, { name: '', code: '', date: '' }]);
  };

  const handleRemoveSubject = (index) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleSubjectChange = (index, field, value) => {
    const updated = [...subjects];
    updated[index][field] = value;
    setSubjects(updated);
  };

  const getAssessmentTitle = () => {
    if (assessmentName === 'custom') return customAssessment.toUpperCase();
    return assessmentName.toUpperCase();
  };

  const handleGeneratePreview = () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
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
          <title>Hall Tickets</title>
          <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Great+Vibes&family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Inter', sans-serif;
              color: #0f172a;
              background: white;
            }
            .ht-page {
              width: 297mm; /* Landscape */
              min-height: 210mm;
              margin: 0 auto;
              padding: 10mm;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .ht-border {
              border: 3px solid #002b5e;
              border-radius: 12px;
              padding: 6mm 10mm;
              width: 100%;
              max-width: 280mm;
              background: #fff;
              position: relative;
            }
            .ht-border::before {
              content: '';
              position: absolute;
              inset: 2px;
              border: 1px solid #002b5e;
              border-radius: 9px;
              pointer-events: none;
            }
            
            /* Header Section */
            .ht-header-wrapper {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 15px;
            }
            .ht-logo-col {
              display: flex;
              align-items: center;
              gap: 15px;
              width: 28%;
            }
            .ht-logo {
              width: 90px;
              height: 90px;
              object-fit: contain;
            }
            .ht-school-text {
              display: flex;
              flex-direction: column;
            }
            .ht-school-name-main {
              font-family: 'Outfit', sans-serif;
              font-size: 1.5rem;
              font-weight: 800;
              color: #002b5e;
              line-height: 1.1;
              letter-spacing: 0.5px;
            }
            .ht-school-name-sub {
              font-family: 'Outfit', sans-serif;
              font-size: 1.1rem;
              font-weight: 600;
              color: #002b5e;
            }
            .ht-tagline {
              font-size: 0.75rem;
              color: #002b5e;
              margin-top: 4px;
              font-weight: 500;
              letter-spacing: 0.5px;
            }
            
            .ht-title-col {
              text-align: center;
              flex: 1;
            }
            .ht-exam-title {
              font-family: 'Outfit', sans-serif;
              font-size: 1.8rem;
              font-weight: 900;
              color: #002b5e;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 8px;
            }
            .ht-pill-container {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 15px;
            }
            .ht-line {
              height: 2px;
              width: 50px;
              background: #002b5e;
              position: relative;
            }
            .ht-line::after {
              content: '';
              position: absolute;
              width: 6px;
              height: 6px;
              background: #002b5e;
              border-radius: 50%;
              top: -2px;
            }
            .ht-line:first-child::after { right: -3px; }
            .ht-line:last-child::after { left: -3px; }
            .ht-pill {
              background: #002b5e;
              color: white;
              font-family: 'Outfit', sans-serif;
              font-size: 1.1rem;
              font-weight: 700;
              padding: 4px 20px;
              border-radius: 20px;
              letter-spacing: 2px;
            }
            
            .ht-photo-col {
              width: 28%;
              display: flex;
              justify-content: flex-end;
            }
            .ht-photo-box {
              width: 100px;
              height: 125px;
              border: 2px solid #002b5e;
              border-radius: 4px;
              background: #f8fafc;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            .ht-photo-box img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }

            /* Tables */
            .ht-table {
              width: 100%;
              border-collapse: collapse;
              border: 2px solid #002b5e;
              border-radius: 6px;
              overflow: hidden;
              margin-bottom: 15px;
            }
            .ht-table th, .ht-table td {
              border: 1px solid #002b5e;
              padding: 8px 12px;
            }
            .ht-table th {
              background: #002b5e;
              color: white;
              font-weight: 600;
              font-size: 0.85rem;
              text-align: center;
              text-transform: uppercase;
            }
            .ht-table td {
              font-weight: 700;
              font-size: 0.9rem;
              color: #1e293b;
              text-align: center;
            }
            
            .ht-student-table th { font-size: 0.8rem; }
            .ht-student-table td { font-size: 1rem; padding: 10px 12px; }
            
            .ht-subject-table th { font-size: 0.8rem; }
            .ht-subject-table td { font-size: 0.85rem; }
            .ht-subject-table td:nth-child(2) { text-align: left; }

            /* Footer Box */
            .ht-footer-box {
              border: 2px solid #002b5e;
              border-radius: 6px;
              padding: 12px 20px;
              margin-top: 10px;
            }
            .ht-footer-flex {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-bottom: 20px;
            }
            
            /* Timings */
            .ht-timings {
              flex: 1;
            }
            .ht-timing-title {
              font-weight: 800;
              color: #002b5e;
              font-size: 0.9rem;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .ht-timing-row {
              display: flex;
              font-size: 0.85rem;
              font-weight: 700;
              color: #1e293b;
              margin-bottom: 4px;
            }
            .ht-timing-label { width: 120px; }
            .ht-timing-colon { margin: 0 10px; }
            
            /* Signatures */
            .ht-sig-col {
              text-align: center;
              width: 200px;
            }
            .ht-sig-cursive {
              font-family: 'Caveat', cursive;
              font-size: 2rem;
              color: #334155;
              height: 40px;
              display: flex;
              align-items: flex-end;
              justify-content: center;
              margin-bottom: 5px;
            }
            .ht-sig-cursive.principal {
              color: #16a34a;
              font-size: 2.2rem;
              font-family: 'Great Vibes', cursive;
            }
            .ht-sig-line {
              border-top: 2px solid #002b5e;
              padding-top: 6px;
              font-weight: 700;
              color: #002b5e;
              font-size: 0.8rem;
              letter-spacing: 0.5px;
            }

            /* Seal */
            .ht-seal-col {
              text-align: center;
              width: 150px;
              display: flex;
              justify-content: center;
            }
            .ht-seal-circle {
              width: 90px;
              height: 90px;
              border-radius: 50%;
              border: 2px dashed #002b5e;
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
            }
            .ht-seal-inner {
              width: 76px;
              height: 76px;
              border-radius: 50%;
              border: 1px solid #002b5e;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 0.5rem;
              color: #002b5e;
              text-align: center;
              font-weight: bold;
              text-transform: uppercase;
            }

            /* Footer Bottom */
            .ht-footer-bottom {
              display: flex;
              align-items: center;
              border-top: 1px solid rgba(0, 43, 94, 0.2);
              padding-top: 12px;
              font-size: 0.85rem;
              font-weight: 600;
              color: #002b5e;
            }
            .ht-issue-date {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .ht-divider-vert {
              height: 15px;
              width: 1px;
              background: #002b5e;
              margin: 0 20px;
            }
            .ht-address {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            @media print {
              @page { size: landscape; margin: 0; }
              body { -webkit-print-color-adjust: exact; padding: 0; }
              .ht-page { padding: 0; width: 100vw; height: 100vh; }
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
    }, 500);
  };

  const fmtDateShort = (d) => {
    if (!d) return '—';
    try { return format(new Date(d), 'dd-MM-yyyy'); } catch { return d; }
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
          {/* Assessment & Timings */}
          <div className="card ht-config-card">
            <div className="card-header">
              <h3 className="card-title">📝 Assessment Details</h3>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Assessment Name *</label>
                <select
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
                  <label className="form-label">Custom Name *</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. TERM TEST - II"
                    value={customAssessment}
                    onChange={(e) => setCustomAssessment(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="form-row" style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label">FN Timing (First Half)</label>
                <input
                  className="form-input"
                  type="text"
                  value={fnTiming}
                  onChange={(e) => setFnTiming(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">AN Timing (Second Half)</label>
                <input
                  className="form-input"
                  type="text"
                  value={anTiming}
                  onChange={(e) => setAnTiming(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date of Issue</label>
                <input
                  className="form-input"
                  type="text"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>
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
                  className="form-select"
                  value={selectedClass}
                  onChange={(e) => { setSelectedClass(e.target.value); setSelectedStudents([]); setStudents([]); }}
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
                  className="form-select"
                  value={selectedSection}
                  onChange={(e) => { setSelectedSection(e.target.value); setSelectedStudents([]); setStudents([]); }}
                >
                  <option value="">All Sections</option>
                  {sections.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={fetchStudents}
              disabled={searchLoading || !selectedClass}
            >
              <HiOutlineSearch /> {searchLoading ? 'Searching...' : 'Search Students'}
            </button>

            {/* Student List */}
            {students.length > 0 && (
              <div className="ht-student-list-container" style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#334155' }}>
                    Select Students ({selectedStudents.length}/{students.length})
                  </h4>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500, color: '#0f172a' }}>
                    <input
                      type="checkbox"
                      checked={selectedStudents.length === students.length && students.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedStudents([...students]);
                        else setSelectedStudents([]);
                      }}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    Select All
                  </label>
                </div>
                <div className="ht-student-list" style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem' }}>
                  {students.map(student => {
                    const isSelected = selectedStudents.some(s => s.id === student.id);
                    return (
                      <div
                        key={student.id}
                        className={`ht-student-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedStudents(selectedStudents.filter(s => s.id !== student.id));
                          } else {
                            setSelectedStudents([...selectedStudents, student]);
                          }
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', border: isSelected ? '1px solid #0f172a' : '1px solid transparent', background: isSelected ? '#f1f5f9' : 'white' }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          style={{ width: '18px', height: '18px', cursor: 'pointer', pointerEvents: 'none' }}
                        />
                        <div className="ht-student-item-avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {(student.photo_url || student.photoUrl) ? (
                            <img src={student.photo_url || student.photoUrl} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontWeight: 'bold', color: '#64748b' }}>{student.name?.charAt(0)?.toUpperCase()}</span>
                          )}
                        </div>
                        <div className="ht-student-item-info" style={{ flex: 1 }}>
                          <div className="ht-student-item-name" style={{ fontWeight: 600, color: '#0f172a' }}>{student.name}</div>
                          <div className="ht-student-item-meta" style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            {student.admission_no || student.admissionNo} • Class {student.grade}{student.section ? `-${student.section}` : ''}
                            {(student.roll_no || student.rollNo) ? ` • Roll: ${student.roll_no || student.rollNo}` : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Examination Schedule */}
          <div className="card ht-config-card">
            <div className="card-header">
              <h3 className="card-title">📅 Subjects & Dates</h3>
              <button className="btn btn-sm btn-secondary" onClick={handleAddSubject}>+ Add Subject</button>
            </div>
            <div className="ht-subjects-editor">
              {subjects.map((subject, index) => (
                <div key={index} className="ht-subject-row">
                  <div className="ht-subject-num">{index + 1}</div>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Subject Name"
                    value={subject.name}
                    onChange={(e) => handleSubjectChange(index, 'name', e.target.value)}
                  />
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Subject Code"
                    value={subject.code}
                    style={{ maxWidth: '140px' }}
                    onChange={(e) => handleSubjectChange(index, 'code', e.target.value)}
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
                  >✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="ht-generate-row">
            <button className="btn btn-lg btn-primary" onClick={handleGeneratePreview}>
              <HiOutlineDocumentText /> Generate Hall Ticket Preview
            </button>
          </div>
        </div>
      )}

      {/* ======================== HALL TICKET PREVIEW ======================== */}
      {showPreview && selectedStudents.length > 0 && (
        <div style={{ overflowX: 'auto', paddingBottom: '2rem' }}>
          <div ref={hallTicketRef} style={{ minWidth: '1000px' }}>
            {selectedStudents.map((currentStudent, sIdx) => {
              const currentAcYear = currentStudent?.academic_year || school?.academic_year || '2025 - 2026';
              return (
                <div className="ht-page" key={currentStudent.id || sIdx} style={sIdx > 0 ? { pageBreakBefore: 'always', marginTop: '2rem' } : {}}>
                  <div className="ht-border">
                    
                    {/* Header */}
                    <div className="ht-header-wrapper">
                      <div className="ht-logo-col">
                        {(school?.logo_url || school?.logo) ? (
                          <img className="ht-logo" src={school.logo_url || school.logo} alt="Logo" />
                        ) : (
                          <div className="ht-logo" style={{ background: '#eee' }}></div>
                        )}
                        <div className="ht-school-text">
                          <div className="ht-school-name-main">{school?.name?.split(' ')[0] || 'SCHOOL'}</div>
                          <div className="ht-school-name-sub">{school?.name?.split(' ').slice(1).join(' ') || 'NAME'}</div>
                          <div className="ht-tagline">Education | Discipline | Excellence</div>
                        </div>
                      </div>
                      
                      <div className="ht-title-col">
                        <div className="ht-exam-title">{getAssessmentTitle()}</div>
                        <div className="ht-pill-container">
                          <div className="ht-line"></div>
                          <div className="ht-pill">HALL TICKET</div>
                          <div className="ht-line"></div>
                        </div>
                      </div>
                      
                      <div className="ht-photo-col">
                        <div className="ht-photo-box">
                          {(currentStudent.photo_url || currentStudent.photoUrl) ? (
                            <img src={currentStudent.photo_url || currentStudent.photoUrl} alt="Student" />
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Photo</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Student Info Table */}
                    <table className="ht-table ht-student-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40%' }}>SCHOOL NAME</th>
                          <th style={{ width: '35%' }}>EXAM FORMAT</th>
                          <th style={{ width: '25%' }}>PHOTO</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{school?.name || 'School Name'}</td>
                          <td>{getAssessmentTitle()}</td>
                          <td></td>
                        </tr>
                        <tr>
                          <th style={{ background: '#002b5e', color: 'white' }}>NAME</th>
                          <th style={{ background: '#002b5e', color: 'white' }}>ROLL NO.</th>
                          <th style={{ background: '#002b5e', color: 'white' }}>CLASS</th>
                          <th style={{ background: '#002b5e', color: 'white' }}>AC YEAR</th>
                        </tr>
                        <tr>
                          <td>{currentStudent.name?.toUpperCase() || '—'}</td>
                          <td>{currentStudent.roll_no || currentStudent.admission_no || '—'}</td>
                          <td>{currentStudent.grade} {currentStudent.section ? `(${currentStudent.section})` : ''}</td>
                          <td>{currentAcYear}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Subjects Table */}
                    <table className="ht-table ht-subject-table">
                      <thead>
                        <tr>
                          <th style={{ width: '60px' }}>SL. NO.</th>
                          <th>SUBJECT</th>
                          <th style={{ width: '130px' }}>SUBJECT CODE</th>
                          <th style={{ width: '130px' }}>DATE</th>
                          <th style={{ width: '130px' }}>ROLL NO.</th>
                          <th style={{ width: '130px' }}>CLASS</th>
                          <th style={{ width: '130px' }}>AC YEAR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.filter(s => s.name.trim()).map((subject, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{subject.name.toUpperCase()}</td>
                            <td>{subject.code.toUpperCase()}</td>
                            <td>{fmtDateShort(subject.date)}</td>
                            <td>{currentStudent.roll_no || currentStudent.admission_no || '—'}</td>
                            <td>{currentStudent.grade} {currentStudent.section ? `(${currentStudent.section})` : ''}</td>
                            <td>{currentAcYear}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Footer Box */}
                    <div className="ht-footer-box">
                      <div className="ht-footer-flex">
                        
                        {/* Timings */}
                        <div className="ht-timings">
                          <div className="ht-timing-title">
                            <i className="far fa-clock" style={{ fontSize: '1.2rem' }}></i> EXAM TIMINGS
                          </div>
                          <div className="ht-timing-row">
                            <div className="ht-timing-label">FIRST HALF (FN)</div>
                            <div className="ht-timing-colon">:</div>
                            <div>{fnTiming}</div>
                          </div>
                          <div className="ht-timing-row">
                            <div className="ht-timing-label">SECOND HALF (AN)</div>
                            <div className="ht-timing-colon">:</div>
                            <div>{anTiming}</div>
                          </div>
                        </div>

                        {/* Seal */}
                        <div className="ht-seal-col">
                          <div className="ht-seal-circle">
                            <div className="ht-seal-inner">
                              SCHOOL<br/>SEAL
                            </div>
                          </div>
                        </div>

                        {/* Signatures */}
                        <div className="ht-sig-col">
                          <div className="ht-sig-cursive principal">Principal</div>
                          <div className="ht-sig-line">PRINCIPAL SIGNATURE</div>
                        </div>
                      </div>

                      <div className="ht-footer-bottom">
                        <div className="ht-issue-date">
                          <i className="far fa-calendar-alt"></i>
                          <span>Date of Issue: {issueDate}</span>
                        </div>
                        <div className="ht-divider-vert"></div>
                        <div className="ht-address">
                          <i className="fas fa-map-marker-alt"></i>
                          <span>{school?.address || 'School Address Not Provided'}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Print Action */}
      {showPreview && (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowPreview(false)}>
            ← Back to Edit
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <HiOutlinePrinter size={18} /> Print Hall Ticket
          </button>
        </div>
      )}
    </div>
  );
};

export default HallTicket;
