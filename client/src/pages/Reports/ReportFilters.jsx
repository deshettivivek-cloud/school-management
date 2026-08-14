import { 
  HiOutlineSearch, 
  HiOutlineRefresh, 
  HiOutlineDownload, 
  HiOutlinePrinter 
} from 'react-icons/hi';
import { sanitizeDigitInput } from '../../utils/inputHelpers';

const ReportFilters = ({ 
  module, 
  filters, 
  setFilters, 
  onSearch, 
  onReset, 
  onExport 
}) => {

  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Only show student specific filters for these modules
  const isStudentModule = ['students', 'fees', 'attendance', 'exams', 'tc', 'admissions'].includes(module);

  return (
    <div className="card no-print" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Filters</h3>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '1rem', 
        marginBottom: '1.5rem' 
      }}>
        {/* Core Student Filters */}
        {isStudentModule && (
          <>
            <div className="form-group">
              <label className="form-label">Admission Number</label>
              <input type="text" className="form-input" placeholder="e.g. ADM-2023-001" 
                value={filters.admissionNo || ''} onChange={e => handleChange('admissionNo', e.target.value)} />
            </div>
            
            <div className="form-group">
              <label className="form-label">Student Name</label>
              <input type="text" className="form-input" placeholder="Search name" 
                value={filters.studentName || ''} onChange={e => handleChange('studentName', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Father's Name</label>
              <input type="text" className="form-input" placeholder="Search father" 
                value={filters.fatherName || ''} onChange={e => handleChange('fatherName', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Mother's Name</label>
              <input type="text" className="form-input" placeholder="Search mother" 
                value={filters.motherName || ''} onChange={e => handleChange('motherName', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input type="text" maxLength={10} className="form-input" placeholder="Search phone" 
                value={filters.mobileNumber || ''} onChange={e => handleChange('mobileNumber', sanitizeDigitInput(e.target.value, 10))} />
            </div>

            <div className="form-group">
              <label className="form-label">Class</label>
              <select className="form-select" value={filters.grade || ''} onChange={e => handleChange('grade', e.target.value)}>
                <option value="">All Classes</option>
                {[...Array(10)].map((_, i) => (
                  <option key={i+1} value={`Class ${i+1}`}>Class {i+1}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Section</label>
              <select className="form-select" value={filters.section || ''} onChange={e => handleChange('section', e.target.value)}>
                <option value="">All Sections</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>

            {module === 'students' && (
              <div className="form-group">
                <label className="form-label">Admission Status</label>
                <select className="form-select" value={filters.admissionStatus || ''} onChange={e => handleChange('admissionStatus', e.target.value)}>
                  <option value="">All</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Graduated">Graduated</option>
                  <option value="Transferred">Transferred</option>
                </select>
              </div>
            )}
          </>
        )}

        {/* Generic/Common Filters */}
        <div className="form-group">
          <label className="form-label">Academic Year</label>
          <select className="form-select" value={filters.academicYear || ''} onChange={e => handleChange('academicYear', e.target.value)}>
            <option value="">All Years</option>
            <option value="2023-2024">2023-2024</option>
            <option value="2024-2025">2024-2025</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Start Date</label>
          <input type="date" className="form-input" 
            value={filters.startDate || ''} onChange={e => handleChange('startDate', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">End Date</label>
          <input type="date" className="form-input" 
            value={filters.endDate || ''} onChange={e => handleChange('endDate', e.target.value)} />
        </div>

        {/* Module Specific Overrides */}
        {module === 'fees' && (
          <div className="form-group">
            <label className="form-label">Fee Status</label>
            <select className="form-select" value={filters.feeStatus || ''} onChange={e => handleChange('feeStatus', e.target.value)}>
              <option value="">All</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" onClick={onSearch}>
            <HiOutlineSearch size={18} /> Search
          </button>
          <button className="btn btn-ghost" onClick={onReset}>
            <HiOutlineRefresh size={18} /> Reset
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => onExport('Print')}>
            <HiOutlinePrinter size={16} /> Print
          </button>
          <button className="btn btn-primary" onClick={() => onExport('PDF')}>
            <HiOutlineDownload size={16} /> PDF
          </button>
          <button className="btn btn-secondary" onClick={() => onExport('Excel')}>
            <HiOutlineDownload size={16} /> Excel
          </button>
          <button className="btn btn-ghost" onClick={() => onExport('CSV')}>
            CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;
