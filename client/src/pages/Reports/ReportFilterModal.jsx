import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  HiOutlineX,
  HiOutlineUserGroup, 
  HiOutlineCash, 
  HiOutlineCalendar, 
  HiOutlineDocumentText, 
  HiOutlineAcademicCap, 
  HiOutlineBadgeCheck, 
  HiOutlineDocumentDuplicate,
  HiOutlineShieldCheck,
  HiOutlineChartBar,
  HiOutlineFilter,
  HiOutlineRefresh,
  HiChevronUp,
  HiOutlineSearch
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

const ALL_REPORTS = [
  { id: 'students', title: 'Student Report', icon: HiOutlineUserGroup, roles: ['super_admin', 'principal', 'teacher', 'clerk'] },
  { id: 'fees', title: 'Fee Report', icon: HiOutlineCash, roles: ['super_admin', 'principal', 'clerk'] },
  { id: 'attendance', title: 'Attendance Report', icon: HiOutlineCalendar, roles: ['super_admin', 'principal', 'teacher'] },
  { id: 'exams', title: 'Exam Report', icon: HiOutlineDocumentText, roles: ['super_admin', 'principal', 'teacher'] },
  { id: 'teachers', title: 'Teacher Report', icon: HiOutlineAcademicCap, roles: ['super_admin', 'principal', 'teacher'] },
  { id: 'staff', title: 'Staff Report', icon: HiOutlineBadgeCheck, roles: ['super_admin', 'principal', 'clerk'] },
  { id: 'admissions', title: 'Admission Report', icon: HiOutlineUserGroup, roles: ['super_admin', 'principal', 'clerk'] },
  { id: 'expenditure', title: 'Expenditure Report', icon: HiOutlineCash, roles: ['super_admin', 'principal', 'clerk'] },
  { id: 'tc', title: 'TC Report', icon: HiOutlineDocumentDuplicate, roles: ['super_admin', 'principal', 'clerk'] },
  { id: 'user', title: 'User Report', icon: HiOutlineShieldCheck, roles: ['super_admin'] },
  { id: 'dashboard', title: 'Dashboard Report', icon: HiOutlineChartBar, roles: ['super_admin', 'principal'] }
];

const COLUMNS_BY_MODULE = {
  students: [
    { key: 'name', label: 'Student Name' },
    { key: 'admission_no', label: 'Admission No.' },
    { key: 'roll_no', label: 'Roll No.' },
    { key: 'grade', label: 'Class' },
    { key: 'section', label: 'Section' },
    { key: 'parent_name', label: 'Father Name' },
    { key: 'mother_name', label: 'Mother Name' },
    { key: 'parent_phone', label: 'Parent Mobile No.' },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'gender', label: 'Gender' },
    { key: 'address', label: 'Address' },
    { key: 'admission_date', label: 'Admission Date' },
    { key: 'blood_group', label: 'Blood Group' },
    { key: 'category', label: 'Category' },
    { key: 'rte', label: 'RTE' },
    { key: 'admission_status', label: 'Status' }
  ],
  fees: [
    { key: 'students.name', label: 'Student Name' },
    { key: 'students.admission_no', label: 'Admission No' },
    { key: 'students.grade', label: 'Class' },
    { key: 'academic_year', label: 'Academic Year' },
    { key: 'committed_fee', label: 'Total Fee' },
    { key: 'paid_amount', label: 'Paid Amount' },
    { key: 'status', label: 'Fee Status' }
  ],
  attendance: [
    { key: 'students.name', label: 'Student Name' },
    { key: 'students.grade', label: 'Class' },
    { key: 'students.section', label: 'Section' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status' },
    { key: 'remarks', label: 'Remarks' }
  ],
  exams: [
    { key: 'students.name', label: 'Student Name' },
    { key: 'exams.name', label: 'Exam Name' },
    { key: 'subject', label: 'Subject' },
    { key: 'marks_obtained', label: 'Marks Obtained' },
    { key: 'max_marks', label: 'Max Marks' },
    { key: 'grade', label: 'Grade' }
  ],
  teachers: [
    { key: 'name', label: 'Teacher Name' },
    { key: 'employee_id', label: 'Emp ID' },
    { key: 'department', label: 'Department' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'joining_date', label: 'Joining Date' }
  ],
  staff: [
    { key: 'name', label: 'Staff Name' },
    { key: 'employee_id', label: 'Emp ID' },
    { key: 'role', label: 'Role' },
    { key: 'department', label: 'Department' },
    { key: 'phone', label: 'Phone' }
  ],
  admissions: [
    { key: 'name', label: 'Student Name' },
    { key: 'admission_no', label: 'Admission No' },
    { key: 'grade', label: 'Applied Class' },
    { key: 'admission_date', label: 'Date' },
    { key: 'admission_status', label: 'Status' }
  ],
  expenditure: [
    { key: 'date', label: 'Date' },
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'amount', label: 'Amount' },
    { key: 'payment_mode', label: 'Payment Mode' }
  ],
  tc: [
    { key: 'tc_number', label: 'TC Number' },
    { key: 'students.name', label: 'Student Name' },
    { key: 'students.grade', label: 'Class' },
    { key: 'issue_date', label: 'Issue Date' },
    { key: 'reason', label: 'Reason' },
    { key: 'status', label: 'Status' }
  ]
};

const ReportFilterModal = ({
  isOpen,
  onClose,
  module,
  filters,
  setFilters,
  onApply,
  selectedColumns,
  setSelectedColumns,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  groupBy,
  setGroupBy
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const allowedReports = ALL_REPORTS.filter(r => r.roles.includes(user?.role));

  const [localFilters, setLocalFilters] = useState(filters);
  const [localColumns, setLocalColumns] = useState(selectedColumns || []);
  const [localSortBy, setLocalSortBy] = useState(sortBy || '');
  const [localSortOrder, setLocalSortOrder] = useState(sortOrder || 'Ascending');
  const [localGroupBy, setLocalGroupBy] = useState(groupBy || 'None');

  const columnsOptions = COLUMNS_BY_MODULE[module] || [];

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
      setLocalColumns(selectedColumns?.length ? selectedColumns : columnsOptions.map(c => c.key));
      setLocalSortBy(sortBy || (columnsOptions[0]?.key || ''));
      setLocalSortOrder(sortOrder || 'Ascending');
      setLocalGroupBy(groupBy || 'None');
    }
  }, [isOpen, filters, selectedColumns, module, sortBy, sortOrder, groupBy, columnsOptions]);

  const handleChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleColumn = (key) => {
    setLocalColumns(prev => 
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    );
  };

  const handleApply = () => {
    setFilters(localFilters);
    setSelectedColumns(localColumns);
    setSortBy(localSortBy);
    setSortOrder(localSortOrder);
    setGroupBy(localGroupBy);
    onApply();
    onClose();
  };

  const handleReset = () => {
    setLocalFilters({
      academicYear: '',
      grade: '', section: '', status: '', admissionStatus: '', feeStatus: '',
      admissionNo: '', studentName: '', fatherName: '', motherName: '', mobileNumber: '',
      startDate: '', endDate: '', gender: '', category: '', search: ''
    });
    setLocalColumns(columnsOptions.map(c => c.key));
    setLocalSortBy(columnsOptions[0]?.key || '');
    setLocalSortOrder('Ascending');
    setLocalGroupBy('None');
  };

  const handleReportChange = (reportId) => {
    const basePath = user?.role === 'super_admin' ? '/super-admin/reports' : '/reports';
    navigate(`${basePath}/${reportId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="filter-modal-overlay">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0, scale: 0.95 }}
          className="filter-modal-container card"
        >
          {/* Header */}
          <div className="filter-modal-header">
            <div className="header-title">
              <HiOutlineFilter size={24} className="icon-blue" />
              <div>
                <h2>Filters</h2>
                <p>Apply filters to customize and generate your report</p>
              </div>
            </div>
            <button className="close-btn btn btn-ghost" onClick={onClose}><HiOutlineX size={20} /></button>
          </div>

          <div className="filter-modal-body">
            {/* Left Sidebar */}
            <div className="filter-sidebar">
              <h3 className="sidebar-title">SELECT REPORT</h3>
              <ul className="report-list">
                {allowedReports.map(report => {
                  const Icon = report.icon;
                  return (
                    <li 
                      key={report.id} 
                      className={`report-item ${module === report.id ? 'active' : ''}`}
                      onClick={() => handleReportChange(report.id)}
                    >
                      <Icon size={20} /> <span>{report.title}</span>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Right Content */}
            <div className="filter-content">
              <div className="content-header">
                <h3 className="section-title">APPLY FILTERS</h3>
                <button className="btn btn-ghost btn-sm hide-filters-btn">
                  Hide Filters <HiChevronUp size={16} />
                </button>
              </div>

              <div className="filter-grid">
                <div className="form-group">
                  <label className="form-label">Academic Year</label>
                  <input
                    type="text"
                    className="form-input"
                    value={localFilters.academicYear || ''}
                    onChange={e => handleChange('academicYear', e.target.value)}
                    placeholder="e.g. 2025-2026"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Class</label>
                  <select className="form-select" value={localFilters.grade || ''} onChange={e => handleChange('grade', e.target.value)}>
                    <option value="">All Classes</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i+1} value={`Class ${i+1}`}>Class {i+1}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Section</label>
                  <select className="form-select" value={localFilters.section || ''} onChange={e => handleChange('section', e.target.value)}>
                    <option value="">All Sections</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Admission Status</label>
                  <select className="form-select" value={localFilters.admissionStatus || ''} onChange={e => handleChange('admissionStatus', e.target.value)}>
                    <option value="All">All</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Graduated">Graduated</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={localFilters.gender || ''} onChange={e => handleChange('gender', e.target.value)}>
                    <option value="All">All</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={localFilters.category || ''} onChange={e => handleChange('category', e.target.value)}>
                    <option value="All">All</option>
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC/ST">SC/ST</option>
                  </select>
                </div>

                <div className="form-group date-range-group">
                  <label className="form-label">Date Range</label>
                  <div className="date-inputs">
                    <input type="date" className="form-input" value={localFilters.startDate || ''} onChange={e => handleChange('startDate', e.target.value)} />
                    <span className="date-separator">-</span>
                    <input type="date" className="form-input" value={localFilters.endDate || ''} onChange={e => handleChange('endDate', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Student</label>
                  <select className="form-select" value={localFilters.studentName || ''} onChange={e => handleChange('studentName', e.target.value)}>
                    <option value="">Select Student</option>
                    {/* Placeholder for actual student search dropdown */}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Search</label>
                  <div className="search-input-wrapper" style={{ position: 'relative' }}>
                    <input type="text" className="form-input" placeholder="Search by name, roll no..." value={localFilters.search || ''} onChange={e => handleChange('search', e.target.value)} style={{ paddingRight: '2rem' }} />
                    <HiOutlineSearch size={18} style={{ position: 'absolute', right: '10px', top: '10px', color: 'var(--text-muted)' }} />
                  </div>
                </div>
              </div>

              {/* SELECT COLUMNS */}
              <div className="columns-section">
                <h3 className="section-title">SELECT COLUMNS</h3>
                <div className="columns-grid">
                  {columnsOptions.map((col) => (
                    <label key={col.key} className="checkbox-label">
                      <input 
                        type="checkbox" 
                        className="custom-checkbox" 
                        checked={localColumns.includes(col.key)} 
                        onChange={() => toggleColumn(col.key)} 
                      />
                      <span>{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort & Group */}
              <div className="sort-group-section">
                <div className="form-group">
                  <label className="form-label">Sort By</label>
                  <select className="form-select" value={localSortBy} onChange={e => setLocalSortBy(e.target.value)}>
                    {columnsOptions.map(col => (
                      <option key={col.key} value={col.key}>{col.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Sort Order</label>
                  <select className="form-select" value={localSortOrder} onChange={e => setLocalSortOrder(e.target.value)}>
                    <option value="Ascending">Ascending</option>
                    <option value="Descending">Descending</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Group By</label>
                  <select className="form-select" value={localGroupBy} onChange={e => setLocalGroupBy(e.target.value)}>
                    <option value="None">None</option>
                    <option value="grade">Class</option>
                    <option value="gender">Gender</option>
                    <option value="category">Category</option>
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* Footer Actions */}
          <div className="filter-modal-footer">
            <button className="btn btn-ghost reset-btn" onClick={handleReset}>
              <HiOutlineRefresh size={18} /> Reset Filters
            </button>
            <div className="footer-right">
              <button className="btn btn-secondary cancel-btn" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary apply-btn" onClick={handleApply}>
                <HiOutlineFilter size={18} /> Apply Filters
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReportFilterModal;
