const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client', 'src', 'pages', 'Exams', 'HallTicket.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetIndex = content.indexOf('  const hallTicketStyles = `');

if (targetIndex === -1) {
  console.log("Could not find hallTicketStyles");
  process.exit(1);
}

const beforePrint = content.substring(0, targetIndex);

const newPrintAndRender = `  const hallTicketStyles = \`
    .hall-page-wrapper * { margin: 0; padding: 0; box-sizing: border-box; }
    .hall-page-wrapper {
      font-family: 'Inter', sans-serif;
      color: #1a1a1a;
      background: white;
    }
    .hall-page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 20mm;
      page-break-after: always;
      position: relative;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      display: block !important;
    }
    .hall-page:last-child {
      page-break-after: auto;
    }
    /* Header */
    .hall-header {
      display: flex !important;
      flex-direction: row !important;
      justify-content: space-between !important;
      align-items: center !important;
      border-bottom: 2px solid #295F48;
      padding-bottom: 15px;
      margin-bottom: 20px;
      width: 100%;
    }
    .hall-logo-wrapper {
      display: flex;
      flex-direction: row !important;
      align-items: center;
      gap: 15px;
    }
    .hall-logo {
      width: 70px;
      height: 70px;
      background-color: #295F48;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 800;
    }
    .hall-school-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
    }
    .hall-school-info h1 {
      color: #295F48;
      font-family: 'Outfit', sans-serif;
      font-size: 24px;
      margin-bottom: 4px;
    }
    .hall-school-info p {
      color: #555;
      font-size: 11px;
    }
    .hall-title-wrapper {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .hall-title-wrapper h2 {
      font-size: 18px;
      color: #1a1a1a;
      letter-spacing: 2px;
      margin-bottom: 4px;
    }
    .hall-title-wrapper p {
      font-size: 11px;
      color: #555;
    }
    
    /* Student Details Grid */
    .hall-details-container {
      display: flex !important;
      flex-direction: row !important;
      justify-content: space-between !important;
      align-items: flex-start !important;
      margin-bottom: 25px;
      width: 100%;
    }
    .hall-details-grid {
      flex: 1;
      display: grid !important;
      grid-template-columns: auto 1fr auto 1fr;
      gap: 15px 25px;
      padding-right: 20px;
    }
    .hall-details-grid > div {
      border-bottom: 1px dashed #ccc;
      padding-bottom: 5px;
    }
    .hall-label {
      color: #555;
      font-size: 11px;
    }
    .hall-value {
      font-weight: 600;
      font-size: 12px;
      text-align: right;
    }
    .hall-photo-box {
      width: 120px;
      height: 150px;
      background-color: #e8f5e9;
      border: 1px solid #295F48;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 10px;
      color: #295F48;
      padding: 10px;
      flex-shrink: 0;
    }
    
    /* Schedule Table */
    .hall-section-title {
      background-color: #295F48;
      color: white;
      padding: 8px 15px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 1px;
      margin-bottom: 0;
      display: block;
      width: 100%;
    }
    .hall-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      display: table !important;
    }
    .hall-table th, .hall-table td {
      border: 1px solid #b2dfdb;
      padding: 10px 15px;
      font-size: 11px;
      text-align: left;
    }
    .hall-table th {
       background-color: #f0f7f4;
       color: #295F48;
    }
    
    /* Footer Signatures */
    .hall-signatures {
      display: flex !important;
      flex-direction: row !important;
      justify-content: space-between !important;
      margin-top: 80px;
      width: 100%;
    }
    .hall-sig-line {
      border-top: 1px solid #1a1a1a;
      width: 200px;
      text-align: center;
      padding-top: 8px;
      font-size: 11px;
      color: #555;
    }
    
    @media print {
      @page { size: A4 portrait; margin: 0; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
      .hall-page {
        box-shadow: none;
        margin: 0;
      }
    }
  \`;

  const handlePrint = () => {
    const content = hallTicketRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(\`
      <html>
        <head>
          <title>Hall Tickets</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
          <style>\${hallTicketStyles}</style>
        </head>
        <body>
          <div class="hall-page-wrapper">
            \${content.innerHTML}
          </div>
        </body>
      </html>
    \`);
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
                    {/* Header */}
                    <div className="hall-header">
                      <div className="hall-logo-wrapper">
                        <div className="hall-logo">{(school?.name || 'GHS').substring(0, 3).toUpperCase()}</div>
                        <div className="hall-school-info">
                          <h1>{school?.name || 'Greenwood Public High School'}</h1>
                          <p>{school?.address || '12 Lakeview Road, Hyderabad, Telangana'} • {school?.affiliation_no ? \`Affiliation No. \${school.affiliation_no}\` : 'Affiliation No. 2201456'}</p>
                        </div>
                      </div>
                      <div className="hall-title-wrapper">
                        <h2>HALL TICKET</h2>
                        <p>{getAssessmentTitle()} — {currentAcYear}</p>
                      </div>
                    </div>

                    {/* Student Details */}
                    <div className="hall-details-container">
                      <div className="hall-details-grid">
                        <div className="hall-label">Student Name</div>
                        <div className="hall-value">{currentStudent.name}</div>
                        <div className="hall-label"></div>
                        <div className="hall-value"></div>

                        <div className="hall-label">Roll Number</div>
                        <div className="hall-value">{currentStudent.roll_no || currentStudent.admission_no || '—'}</div>
                        <div className="hall-label">Class / Section</div>
                        <div className="hall-value">{currentStudent.grade} — {currentStudent.section || 'A'}</div>

                        <div className="hall-label">Father's Name</div>
                        <div className="hall-value">{currentStudent.parents_details?.father?.name || '—'}</div>
                        <div className="hall-label">Date of Birth</div>
                        <div className="hall-value">{dobDisplay}</div>

                        <div className="hall-label">Exam Centre</div>
                        <div className="hall-value" style={{ gridColumn: 'span 3', textAlign: 'left' }}>{anTiming || 'Main Block — Room 14'}</div>
                      </div>
                      
                      <div className="hall-photo-box">
                        Affix<br/>Passport-size<br/>Photograph<br/>(attested)
                      </div>
                    </div>

                    {/* Schedule Table */}
                    <div className="hall-section-title">EXAMINATION SCHEDULE</div>
                    <table className="hall-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Day</th>
                          <th>Subject</th>
                          <th>Timing</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.filter(s => s.name.trim()).map((subject, idx) => (
                          <tr key={idx}>
                            <td>{formatDateForDisplay(subject.date)}</td>
                            <td>{getDayFromDate(subject.date)}</td>
                            <td>{subject.name}</td>
                            <td>{subject.timing || fnTiming}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Footer Signatures */}
                    <div className="hall-signatures">
                      <div className="hall-sig-line">Class Teacher's Signature</div>
                      <div className="hall-sig-line">Principal's Signature & Seal</div>
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
`;

fs.writeFileSync(filePath, beforePrint + newPrintAndRender);
console.log("Successfully renamed classes to isolate CSS");
