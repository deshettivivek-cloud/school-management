import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/helpers';
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
  const [anTiming, setAnTiming] = useState('');
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

  const hallTicketStyles = `
    .hall-page-wrapper * { margin: 0; padding: 0; box-sizing: border-box; }
    .hall-page-wrapper { font-family: 'Inter', sans-serif; color: #1a1a1a; background: white; }
    .hall-page {
      width: 210mm; min-height: 297mm; margin: 0 auto; padding: 18mm 20mm;
      page-break-after: always; position: relative; background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1); display: block !important;
      border: 3px double #1E293B;
    }
    .hall-page:last-child { page-break-after: auto; }

    /* ── Centered Header ── */
    .hall-header {
      text-align: center; padding-bottom: 18px; margin-bottom: 20px;
      border-bottom: 3px double #1E293B; width: 100%;
    }
    .hall-header-row {
      display: flex; align-items: center; justify-content: center; gap: 16px;
      margin-bottom: 4px;
    }
    .hall-logo {
      width: 72px; height: 72px; border-radius: 50%; display: flex;
      align-items: center; justify-content: center; font-size: 22px;
      font-weight: 800; background-color: #1E293B; color: white;
      object-fit: contain; flex-shrink: 0;
    }
    .hall-school-name {
      font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 800;
      color: #1E293B; text-transform: uppercase; letter-spacing: 3px;
    }
    .hall-school-address { font-size: 11px; color: #555; margin-bottom: 14px; }
    .hall-title-bar {
      display: inline-block; background: #1E293B; color: #fff; padding: 8px 40px;
      font-size: 16px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase;
      border-radius: 4px; margin-bottom: 6px;
    }
    .hall-assessment-info { font-size: 13px; color: #334155; font-weight: 600; margin-top: 6px; }

    /* ── Student Details ── */
    .hall-details-container {
      display: flex !important; flex-direction: row !important;
      justify-content: space-between !important; align-items: flex-start !important;
      margin-bottom: 25px; width: 100%;
    }
    .hall-details-grid {
      flex: 1; display: grid !important; grid-template-columns: 160px 1fr 160px 1fr;
      gap: 0; padding-right: 20px;
    }
    .hall-details-grid > div {
      border-bottom: 1px solid #e2e8f0; padding: 10px 8px;
    }
    .hall-label {
      color: #475569; font-size: 11px; text-transform: uppercase;
      letter-spacing: 0.5px; font-weight: 600;
    }
    .hall-value { color: #0f172a; font-weight: 700; font-size: 13px; }
    .hall-photo-box {
      width: 120px; height: 150px; background-color: #f8fafc;
      border: 2px solid #1E293B; display: flex; flex-direction: column;
      align-items: center; justify-content: center; text-align: center;
      font-size: 10px; color: #64748b; flex-shrink: 0; overflow: hidden;
    }

    /* ── Schedule Table ── */
    .hall-section-title {
      background-color: #1E293B; color: white; padding: 10px 15px;
      font-size: 12px; font-weight: 700; letter-spacing: 2px;
      text-transform: uppercase; width: 100%;
    }
    .hall-table {
      width: 100%; border-collapse: collapse; margin-bottom: 30px;
      display: table !important; border: 2px solid #1E293B; border-top: none;
    }
    .hall-table th, .hall-table td { padding: 12px 15px; font-size: 12px; text-align: left; }
    .hall-table th {
      background-color: #f1f5f9; color: #1E293B; border-bottom: 2px solid #1E293B;
      text-transform: uppercase; font-weight: 700; font-size: 10px; letter-spacing: 0.5px;
    }
    .hall-table td { border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 500; }
    .hall-table tr:last-child td { border-bottom: none; }
    .hall-table tr:nth-child(even) { background: #f8fafc; }

    /* ── Instructions ── */
    .hall-instructions {
      margin-top: 20px; padding: 12px 16px; border: 1px solid #cbd5e1;
      background: #fffbeb; font-size: 11px; color: #475569; line-height: 1.7;
    }
    .hall-instructions strong { color: #1E293B; }
    .hall-instructions ol { padding-left: 18px; }

    /* ── Footer Signatures ── */
    .hall-signatures {
      display: flex !important; flex-direction: row !important;
      justify-content: space-between !important; margin-top: 60px; width: 100%;
    }
    .hall-sig-line {
      border-top: 2px solid #1a1a1a; width: 200px; text-align: center;
      padding-top: 8px; font-size: 11px; color: #334155; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.5px;
    }

    @media print {
      @page { size: A4 portrait; margin: 0; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
      .hall-page { box-shadow: none; margin: 0; }
    }
  `;

  const handlePrint = () => {
    const content = hallTicketRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Hall Tickets</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
          <style>${hallTicketStyles}</style>
        </head>
        <body>
          <div class="hall-page-wrapper">
            ${content.innerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    
    // Give images time to load before calling print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  const getDayFromDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } catch {
      return '';
    }
  };
  
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const currentAcYear = "2025-26"; // Or fetch from somewhere

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Generate Hall Tickets</h1>
          <p className="page-subtitle">Configure and print examination hall tickets for students.</p>
        </div>
      </div>

      {!showPreview && (
        <div className="ht-config-panel">
          {/* Assessment Details */}
          <div className="card ht-config-card" style={{ padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>📝 Assessment Details</h3>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label className="form-label">Assessment Name *</label>
                <select className="form-select" value={assessmentName} onChange={(e) => setAssessmentName(e.target.value)}>
                  <option value="">Select assessment type</option>
                  {ASSESSMENT_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
                  <option value="custom">Custom — Enter manually</option>
                </select>
              </div>
              {assessmentName === 'custom' && (
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <label className="form-label">Custom Name *</label>
                  <input className="form-input" type="text" value={customAssessment} onChange={(e) => setCustomAssessment(e.target.value)} />
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '15px' }}>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label className="form-label">Default Timing</label>
                <input className="form-input" type="text" value={fnTiming} onChange={(e) => setFnTiming(e.target.value)} />
              </div>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label className="form-label">Exam Centre</label>
                <input className="form-input" type="text" value={anTiming} onChange={(e) => setAnTiming(e.target.value)} placeholder="e.g. Main Block - Room 14" />
              </div>
            </div>
          </div>

          {/* Student Selection */}
          <div className="card ht-config-card" style={{ padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>👤 Select Students</h3>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1' }}>
                <label className="form-label">Class *</label>
                <select className="form-select" value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setSelectedStudents([]); setStudents([]); }}>
                  <option value="">Select class</option>
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ flex: '1' }}>
                <label className="form-label">Section</label>
                <select className="form-select" value={selectedSection} onChange={(e) => { setSelectedSection(e.target.value); setSelectedStudents([]); setStudents([]); }}>
                  <option value="">All</option>
                  {sections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="btn btn-primary" onClick={fetchStudents} disabled={searchLoading}>
                  {searchLoading ? 'Loading...' : 'Fetch Students'}
                </button>
              </div>
            </div>

            {students.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <strong>{students.length} students found</strong>
                  <button className="btn btn-secondary" onClick={() => setSelectedStudents(selectedStudents.length === students.length ? [] : students.map(s => s.id))}>
                    {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                  {students.map(student => (
                    <div key={student.id} style={{ display: 'flex', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedStudents.includes(student.id)} 
                        onChange={(e) => {
                          if (e.target.checked) setSelectedStudents([...selectedStudents, student.id]);
                          else setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                        }}
                        style={{ marginRight: '15px', width: '20px', height: '20px' }}
                      />
                      <div>
                        <div style={{ fontWeight: '600' }}>{student.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Roll No: {student.roll_no || student.admission_no} | Class: {student.grade} {student.section}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Subject Configuration */}
          <div className="card ht-config-card" style={{ padding: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h3>📚 Examination Schedule</h3>
              <button className="btn btn-secondary" onClick={handleAddSubject}>+ Add Subject</button>
            </div>
            
            {subjects.map((subject, index) => (
              <div key={index} style={{ display: 'flex', gap: '15px', marginBottom: '10px', alignItems: 'center' }}>
                <div style={{ flex: '2' }}>
                  <input type="text" className="form-input" placeholder="Subject Name" value={subject.name} onChange={(e) => handleSubjectChange(index, 'name', e.target.value)} />
                </div>
                <div style={{ flex: '1' }}>
                  <input type="date" className="form-input" value={subject.date} onChange={(e) => handleSubjectChange(index, 'date', e.target.value)} />
                </div>
                <div style={{ flex: '1' }}>
                  <input type="text" className="form-input" placeholder="Timing" value={subject.timing || fnTiming} onChange={(e) => handleSubjectChange(index, 'timing', e.target.value)} />
                </div>
                <button className="btn btn-secondary" onClick={() => handleRemoveSubject(index)} style={{ color: 'red' }}>&times;</button>
              </div>
            ))}
          </div>
          
          <button className="btn btn-primary" onClick={handleGeneratePreview} style={{ width: '100%', padding: '15px', fontSize: '16px' }}>
            Generate Hall Tickets Preview
          </button>
        </div>
      )}

      {/* Preview Section */}
      {showPreview && (
        <div className="hall-page-wrapper">
          <style dangerouslySetInnerHTML={{ __html: hallTicketStyles }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', backgroundColor: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <button className="btn btn-secondary" onClick={() => setShowPreview(false)}>← Back to Edit</button>
            <button className="btn btn-primary" onClick={handlePrint}>🖨️ Print {selectedStudents.length} Hall Tickets</button>
          </div>

          {/* A4 Preview Container */}
          <div style={{ background: '#e0e0e0', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>
            <div ref={hallTicketRef}>
              {selectedStudents.map(studentId => {
                const currentStudent = students.find(s => s.id === studentId);
                if (!currentStudent) return null;
                
                // Construct Date of Birth nicely
                let dobDisplay = 'N/A';
                if (currentStudent.dob) {
                  try {
                    dobDisplay = new Date(currentStudent.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                  } catch (e) {}
                }

                return (
                  <div key={studentId} className="hall-page">
                    {/* Centered Header */}
                    <div className="hall-header">
                      <div className="hall-header-row">
                        {(school?.logo_url || school?.logo) ? (
                          <img src={getImageUrl(school.logo_url || school.logo)} alt="Logo" className="hall-logo" style={{ objectFit: 'contain', backgroundColor: '#fff', padding: '4px' }} />
                        ) : (
                          <div className="hall-logo">{(school?.name || 'GHS').substring(0, 3).toUpperCase()}</div>
                        )}
                        <div className="hall-school-name">{school?.name || 'School Name'}</div>
                      </div>
                      <div className="hall-school-address">
                        {school?.address || 'School Address'}{school?.phone ? ` • Phone: ${school.phone}` : ''}
                      </div>
                      <div className="hall-title-bar">Hall Ticket</div>
                      <div className="hall-assessment-info">
                        {getAssessmentTitle()} &nbsp;|&nbsp; Academic Year: {school?.academic_year || currentAcYear}
                      </div>
                    </div>

                    {/* Student Details */}
                    <div className="hall-details-container">
                      <div className="hall-details-grid">
                        <div className="hall-label">Student Name</div>
                        <div className="hall-value">{currentStudent.name}</div>
                        <div className="hall-label">Admission No</div>
                        <div className="hall-value">{currentStudent.admission_no || '—'}</div>

                        <div className="hall-label">Father's Name</div>
                        <div className="hall-value">{currentStudent.parent_name || currentStudent.parentName || '—'}</div>
                        <div className="hall-label">Class / Section</div>
                        <div className="hall-value">{currentStudent.grade} — {currentStudent.section || 'A'}</div>

                        <div className="hall-label">Roll Number</div>
                        <div className="hall-value">{currentStudent.roll_no || '—'}</div>
                        <div className="hall-label">Date of Birth</div>
                        <div className="hall-value">{dobDisplay}</div>

                        {anTiming && (
                          <>
                            <div className="hall-label">Exam Centre</div>
                            <div className="hall-value" style={{ gridColumn: 'span 3' }}>{anTiming}</div>
                          </>
                        )}
                      </div>
                      <div className="hall-photo-box" style={{ padding: currentStudent.photo_url ? '0' : '10px' }}>
                        {currentStudent.photo_url ? (
                          <img src={getImageUrl(currentStudent.photo_url)} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <>Affix<br/>Passport-size<br/>Photograph<br/>(attested)</>
                        )}
                      </div>
                    </div>

                    {/* Schedule Table */}
                    <div className="hall-section-title">Examination Schedule</div>
                    <table className="hall-table">
                      <thead>
                        <tr>
                          <th style={{width:'5%'}}>#</th>
                          <th>Date</th>
                          <th>Day</th>
                          <th>Subject</th>
                          <th>Timing</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.filter(s => s.name.trim() && s.date).map((subject, idx) => (
                          <tr key={idx}>
                            <td style={{fontWeight:600}}>{idx + 1}</td>
                            <td>{formatDateForDisplay(subject.date)}</td>
                            <td>{getDayFromDate(subject.date)}</td>
                            <td style={{fontWeight:600}}>{subject.name}</td>
                            <td>{subject.timing || fnTiming}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Instructions */}
                    <div className="hall-instructions">
                      <strong>Instructions to Students:</strong>
                      <ol>
                        <li>Students must carry this hall ticket to the examination hall on all exam days.</li>
                        <li>Students should be present at the exam centre 15 minutes before the scheduled time.</li>
                        <li>Use of mobile phones and electronic gadgets is strictly prohibited.</li>
                        <li>Any malpractice will lead to cancellation of the exam.</li>
                      </ol>
                    </div>

                    {/* Footer Signatures */}
                    <div className="hall-signatures">
                      <div className="hall-sig-line">Class Teacher</div>
                      <div className="hall-sig-line">Parent / Guardian</div>
                      <div className="hall-sig-line">Principal</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HallTicket;
