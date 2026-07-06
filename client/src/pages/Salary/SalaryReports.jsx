import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { BarChart3, Download, Printer, Filter } from 'lucide-react';

const SalaryReports = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('Department Wise'); // 'Department Wise' or 'Monthly Summary'

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/salary/history');
        setSalaries(res.data.data || []);
      } catch (error) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const reportData = useMemo(() => {
    if (reportType === 'Department Wise') {
      const grouped = {};
      salaries.forEach(sal => {
        const dept = sal.employees?.department || 'Unassigned';
        if (!grouped[dept]) {
          grouped[dept] = { department: dept, employeeCount: new Set(), totalGross: 0, totalNet: 0, totalPaid: 0 };
        }
        grouped[dept].employeeCount.add(sal.employee_id);
        grouped[dept].totalGross += Number(sal.gross_salary) || 0;
        grouped[dept].totalNet += Number(sal.net_salary) || 0;
        grouped[dept].totalPaid += Number(sal.paid_amount || sal.net_salary) || 0;
      });
      return Object.values(grouped).map(g => ({
        ...g,
        employeeCount: g.employeeCount.size
      })).sort((a, b) => b.totalPaid - a.totalPaid);
    } else {
      const grouped = {};
      salaries.forEach(sal => {
        const key = `${sal.month} ${sal.year}`;
        if (!grouped[key]) {
          grouped[key] = { monthYear: key, sortKey: `${sal.year}-${sal.month}`, employeeCount: new Set(), totalGross: 0, totalNet: 0, totalPaid: 0 };
        }
        grouped[key].employeeCount.add(sal.employee_id);
        grouped[key].totalGross += Number(sal.gross_salary) || 0;
        grouped[key].totalNet += Number(sal.net_salary) || 0;
        grouped[key].totalPaid += Number(sal.paid_amount || sal.net_salary) || 0;
      });
      return Object.values(grouped).map(g => ({
        ...g,
        employeeCount: g.employeeCount.size
      })).sort((a, b) => a.sortKey.localeCompare(b.sortKey)); // simple sort
    }
  }, [salaries, reportType]);

  const totalExpense = reportData.reduce((sum, row) => sum + row.totalPaid, 0);

  const exportToCSV = () => {
    if (reportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = reportType === 'Department Wise' 
      ? ['Department', 'Employees Count', 'Total Gross Salary', 'Total Net Salary', 'Total Paid Amount']
      : ['Month', 'Employees Count', 'Total Gross Salary', 'Total Net Salary', 'Total Paid Amount'];

    const csvRows = [];
    csvRows.push(headers.join(','));

    reportData.forEach(row => {
      const firstCol = reportType === 'Department Wise' ? row.department : row.monthYear;
      csvRows.push([
        `"${firstCol}"`,
        row.employeeCount,
        row.totalGross,
        row.totalNet,
        row.totalPaid
      ].join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `salary_report_${reportType.toLowerCase().replace(' ', '_')}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="page-header-info">
          <h1>Salary Reports</h1>
          <p>Generate comprehensive financial reports</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={() => window.print()}>
            <Printer size={16} /> Print
          </button>
          <button className="btn btn-primary" onClick={exportToCSV}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ background: 'var(--surface)', padding: '0.5rem', borderRadius: '8px', display: 'flex', gap: '0.5rem', border: '1px solid var(--border)' }}>
          <button 
            onClick={() => setReportType('Department Wise')}
            style={{ 
              padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer',
              fontWeight: 600, background: reportType === 'Department Wise' ? 'var(--primary-50)' : 'transparent',
              color: reportType === 'Department Wise' ? 'var(--primary-600)' : 'var(--text-secondary)'
            }}
          >
            Department Wise
          </button>
          <button 
            onClick={() => setReportType('Monthly Summary')}
            style={{ 
              padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer',
              fontWeight: 600, background: reportType === 'Monthly Summary' ? 'var(--primary-50)' : 'transparent',
              color: reportType === 'Monthly Summary' ? 'var(--primary-600)' : 'var(--text-secondary)'
            }}
          >
            Monthly Summary
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={20} className="icon-blue" />
            {reportType} Report
          </h2>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary-600)' }}>
            Total Expense: ₹{totalExpense.toLocaleString()}
          </div>
        </div>

        <div className="table-container" style={{ margin: 0, border: '1px solid var(--border)', boxShadow: 'none' }}>
          {loading ? (
            <div className="spinner-container" style={{ padding: '3rem' }}><div className="spinner" /></div>
          ) : reportData.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <p className="empty-state-text">No salary data available for reports.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{reportType === 'Department Wise' ? 'Department' : 'Month'}</th>
                  <th>Employees Count</th>
                  <th>Total Gross Salary</th>
                  <th>Total Net Salary</th>
                  <th>Total Paid Amount</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {reportType === 'Department Wise' ? row.department : row.monthYear}
                    </td>
                    <td>{row.employeeCount}</td>
                    <td>₹{row.totalGross.toLocaleString()}</td>
                    <td>₹{row.totalNet.toLocaleString()}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success-600)' }}>₹{row.totalPaid.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalaryReports;
