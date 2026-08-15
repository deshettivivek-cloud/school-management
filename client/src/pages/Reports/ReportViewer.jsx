import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  HiOutlineDownload, 
  HiOutlinePrinter, 
  HiOutlineSearch, 
  HiOutlineFilter,
  HiOutlineArrowLeft,
  HiOutlineChevronLeft,
  HiOutlineChevronRight
} from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { exportToPDF, exportToExcel, exportToCSV } from '../../utils/exportUtils';
import { format } from 'date-fns';
import ReportFilterModal from './ReportFilterModal';

// Configuration mapping for columns per report type
const REPORT_CONFIG = {
  admissions_daily: {
    title: 'Daily Admissions Report',
    backendModule: 'admissions',
    defaultFilters: { startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] },
    columns: [
      { key: 'admission_date', header: 'Date' },
      { key: 'name', header: 'Student Name' },
      { key: 'grade', header: 'Grade' },
      { key: 'admission_status', header: 'Status' }
    ]
  },
  fee_defaulters: {
    title: 'Fee Defaulters Report',
    backendModule: 'fees',
    defaultFilters: { feeStatus: 'pending' },
    columns: [
      { key: 'student_name', header: 'Student Name' },
      { key: 'grade', header: 'Grade' },
      { key: 'balance', header: 'Pending Amount' },
      { key: 'status', header: 'Status' }
    ]
  },
  fee_collections_daily: {
    title: 'Daily Fee Collections Report',
    backendModule: 'fees',
    defaultFilters: { startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] },
    columns: [
      { key: 'student_name', header: 'Student Name' },
      { key: 'grade', header: 'Grade' },
      { key: 'committed_fee', header: 'Total Fee' },
      { key: 'total_paid', header: 'Paid Amount' }
    ]
  },
  attendance_low: {
    title: 'Low Attendance Report',
    backendModule: 'attendance',
    defaultFilters: { attendanceLow: true },
    columns: [
      { key: 'student_name', header: 'Student Name' },
      { key: 'grade', header: 'Grade' },
      { key: 'date', header: 'Date' },
      { key: 'status', header: 'Status' }
    ]
  },
  expenditure_category: {
    title: 'Category-wise Expenditure',
    backendModule: 'expenditure',
    columns: [
      { key: 'title', header: 'Title' },
      { key: 'category', header: 'Category' },
      { key: 'amount', header: 'Amount' },
      { key: 'date', header: 'Date' }
    ]
  },
  staff_attendance: {
    title: 'Staff Attendance Report',
    backendModule: 'staff',
    columns: [
      { key: 'name', header: 'Staff Name' },
      { key: 'department', header: 'Department' },
      { key: 'designation', header: 'Designation' },
      { key: 'phone', header: 'Phone' }
    ]
  },
  exam_toppers: {
    title: 'Exam Toppers Report',
    backendModule: 'exams',
    columns: [
      { key: 'exam_name', header: 'Exam Name' },
      { key: 'student_name', header: 'Student Name' },
      { key: 'marks_obtained', header: 'Marks Obtained' },
      { key: 'max_marks', header: 'Max Marks' }
    ]
  }
};

const ReportViewer = () => {
  const { module } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schoolInfo, setSchoolInfo] = useState(null);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters State
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    academicYear: '',
    grade: '',
    section: '',
    status: '',
    admissionStatus: '',
    feeStatus: '',
    admissionNo: '',
    studentName: '',
    fatherName: '',
    motherName: '',
    mobileNumber: '',
    startDate: '',
    endDate: '',
    gender: '',
    category: ''
  });

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('Ascending');
  const [groupBy, setGroupBy] = useState('None');

  const config = REPORT_CONFIG[module];

  useEffect(() => {
    if (config) {
      setSelectedColumns(config.columns.map(c => c.key));
    }
  }, [module]);

  useEffect(() => {
    if (!config) {
      toast.error('Invalid report module');
      navigate('/reports');
      return;
    }
    fetchSchoolInfo();
    fetchData();
  }, [module, page, limit, filters]); // Trigger refetch on page/filter change

  const fetchSchoolInfo = async () => {
    if (user?.tenantDb) {
      try {
        const res = await api.get(`/schools`);
        setSchoolInfo(res.data.data);
      } catch (e) {
        console.error('Failed to fetch school info');
      }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Clean empty filters
      const activeFilters = { 
        ...(config.defaultFilters || {}), 
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '')) 
      };
      if (search) activeFilters.search = search;

      const res = await api.get(`/reports/${config.backendModule}`, {
        params: {
          page,
          limit,
          filters: JSON.stringify(activeFilters)
        }
      });

      if (res.data.success) {
        setData(res.data.data);
        setTotal(res.data.pagination.total);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    toast.loading(`Generating ${type}...`, { id: 'export' });
    try {
      // Fetch ALL data matching current filters for export (limit=0)
      const activeFilters = { 
        ...(config.defaultFilters || {}), 
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '')) 
      };
      if (search) activeFilters.search = search;

      const res = await api.get(`/reports/${config.backendModule}`, {
        params: { limit: 0, filters: JSON.stringify(activeFilters) }
      });

      const exportData = res.data.data;

      if (type === 'PDF') {
        await exportToPDF(exportData, config.columns, schoolInfo, config.title, activeFilters);
      } else if (type === 'Excel') {
        await exportToExcel(exportData, config.columns, config.title);
      } else if (type === 'CSV') {
        await exportToCSV(exportData, config.columns, config.title);
      } else if (type === 'Print') {
        window.print();
      }
      
      toast.success(`${type} generated successfully!`, { id: 'export' });
    } catch (error) {
      toast.error(`Failed to generate ${type}`, { id: 'export' });
    }
  };

  // Helper to resolve nested object paths (e.g., 'students.name')
  const getNestedValue = (obj, path) => {
    if (path === 'balance') {
      return (Number(obj.committed_fee) || 0) - (Number(obj.total_paid) || 0);
    }
    return path.split('.').reduce((acc, curr) => (acc ? acc[curr] : null), obj);
  };

  // Formatting helpers
  const formatValue = (key, value) => {
    if (value === null || value === undefined) return '-';
    if (key.includes('date') || key.includes('created_at') || key.includes('dob')) {
      try { return format(new Date(value), 'dd MMM yyyy'); } catch(e) { return value; }
    }
    if (key === 'committed_fee' || key === 'paid_amount' || key === 'total_paid' || key === 'amount' || key === 'balance') {
      return `₹${value}`;
    }
    return value.toString();
  };

  if (!config) return null;

  const activeColumns = config.columns.filter(col => selectedColumns.includes(col.key));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="print-area">
      <div className="page-header no-print">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(user?.role === 'super_admin' ? '/super-admin/reports' : '/reports')}>
              <HiOutlineArrowLeft size={18} />
            </button>
            <div className="page-header-info">
              <h1>{config.title}</h1>
              <p>Generate, view, and export records</p>
            </div>
          </div>
          <div className="page-header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/reports')}>
              ← Back to Reports
            </button>
            <button className="btn btn-primary" onClick={() => setIsFilterModalOpen(true)}>
              <HiOutlineFilter size={18} /> Filter & Customize
            </button>
            <div className="dropdown">
              <button className="btn btn-secondary">
                <HiOutlineDownload size={18} /> Export
              </button>
              <div className="dropdown-menu">
                <button onClick={() => handleExport('PDF')}>PDF</button>
                <button onClick={() => handleExport('Excel')}>Excel</button>
                <button onClick={() => handleExport('CSV')}>CSV</button>
                <button onClick={() => handleExport('Print')}>Print</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReportFilterModal 
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        module={module}
        filters={filters}
        setFilters={setFilters}
        onApply={() => { setPage(1); fetchData(); }}
        selectedColumns={selectedColumns}
        setSelectedColumns={setSelectedColumns}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
      />

      {/* Print Header (Visible only during window.print()) */}
      <div className="print-only-header" style={{ display: 'none', marginBottom: '20px', textAlign: 'center' }}>
        <h2>{schoolInfo?.name || 'School Management System'}</h2>
        <p>{schoolInfo?.address || ''}</p>
        <h3 style={{ marginTop: '10px', textDecoration: 'underline' }}>{config.title}</h3>
      </div>

      {/* Report Table */}
      <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              {activeColumns.map((col, idx) => (
                <th key={idx}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={activeColumns.length + 1} style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner" style={{ margin: '0 auto' }}></div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={activeColumns.length + 1} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No records found matching your filters.
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td>{(page - 1) * limit + idx + 1}</td>
                  {activeColumns.map((col, colIdx) => {
                    const rawVal = getNestedValue(item, col.key);
                    return <td key={colIdx}>{formatValue(col.key, rawVal)}</td>;
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination (No Print) */}
        {!loading && data.length > 0 && (
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} records
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button 
                className="btn btn-ghost btn-sm" 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <HiOutlineChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.875rem' }}>Page {page} of {totalPages}</span>
              <button 
                className="btn btn-ghost btn-sm" 
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                <HiOutlineChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

    </motion.div>
  );
};

export default ReportViewer;
