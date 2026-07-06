import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import './Payslip.css';

// Simple helper to convert number to words for Indian Rupees
const numberToWords = (num) => {
  if (!num) return 'Zero Rupees Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if ((num = num.toString()).length > 9) return 'overflow';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return;
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return 'Rupees ' + str.trim() + ' Only';
};

const PayslipView = () => {
  const { employeeId, month } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payslipData, setPayslipData] = useState(null);

  useEffect(() => {
    fetchPayslipData();
  }, [employeeId, month]);

  const fetchPayslipData = async () => {
    try {
      setLoading(true);
      const [monthStr, yearStr] = month.split('-');

      // Fetch School, Employee, and specific Salary History concurrently
      const [schoolRes, employeeRes, salaryRes] = await Promise.all([
        api.get('/schools'),
        api.get(`/employees/${employeeId}`),
        api.get('/salary/history', { 
          params: { employee_id: employeeId, month: monthStr, year: yearStr } 
        })
      ]);

      const schoolInfo = schoolRes.data?.data;
      const employeeInfo = employeeRes.data?.data;
      const salaryRecord = salaryRes.data?.data?.[0];

      if (!salaryRecord) {
        toast.error('Payslip not found for this month');
        setLoading(false);
        return;
      }

      const formatJoinDate = (d) => {
        if (!d) return 'N/A';
        const date = new Date(d);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      };

      // Build earnings and deductions from the db record
      const earningsList = [];
      if (salaryRecord.basic_salary) earningsList.push({ particulars: 'Basic Pay', amount: salaryRecord.basic_salary });
      if (salaryRecord.da) earningsList.push({ particulars: 'Dearness Allowance', amount: salaryRecord.da });
      if (salaryRecord.hra) earningsList.push({ particulars: 'House Rent Allowance', amount: salaryRecord.hra });
      if (salaryRecord.medical_allowance) earningsList.push({ particulars: 'Medical Allowance', amount: salaryRecord.medical_allowance });
      if (salaryRecord.special_allowance) earningsList.push({ particulars: 'Special Allowance', amount: salaryRecord.special_allowance });
      if (salaryRecord.bonus) earningsList.push({ particulars: 'Bonus', amount: salaryRecord.bonus });

      const deductionsList = [];
      if (salaryRecord.pf) deductionsList.push({ particulars: 'Provident Fund (PF)', amount: salaryRecord.pf });
      if (salaryRecord.professional_tax) deductionsList.push({ particulars: 'Professional Tax', amount: salaryRecord.professional_tax });
      if (salaryRecord.other_deductions) deductionsList.push({ particulars: 'Other Deductions', amount: salaryRecord.other_deductions });
      
      // Calculate Days (Assuming standard 30 minus leaves_taken, or custom if tracked)
      const totalDays = 30; // Typically a standard for monthly
      const leavesTaken = salaryRecord.leaves_taken || 0;
      const daysWorked = Math.max(0, totalDays - leavesTaken);

      setPayslipData({
        school: {
          name: schoolInfo?.name || 'Greenwood Public High School',
          address: `${schoolInfo?.address || ''}, ${schoolInfo?.city || ''}, ${schoolInfo?.state || ''}`,
          affiliation: schoolInfo?.affiliation_no ? `Affiliation No. ${schoolInfo.affiliation_no}` : ''
        },
        period: {
          monthYear: `${monthStr} ${yearStr}`,
          daysWorked: daysWorked.toString(),
          totalDays: totalDays.toString()
        },
        employee: {
          name: employeeInfo?.name || salaryRecord.employees?.name,
          id: employeeInfo?.emp_id || salaryRecord.employees?.emp_id,
          designation: employeeInfo?.designation || salaryRecord.employees?.designation,
          department: employeeInfo?.department || salaryRecord.employees?.department,
          joiningDate: formatJoinDate(employeeInfo?.joining_date),
          panNo: employeeInfo?.pan_no || 'N/A',
          bankAccount: employeeInfo?.bank_account_no || 'N/A'
        },
        earnings: earningsList,
        deductions: deductionsList,
        summary: {
          grossEarnings: salaryRecord.gross_salary || 0,
          totalDeductions: salaryRecord.total_deductions || 0,
          netSalary: salaryRecord.net_salary || 0,
          netSalaryWords: numberToWords(salaryRecord.net_salary || 0)
        }
      });
    } catch (error) {
      console.error('Failed to load payslip data', error);
      toast.error('Failed to load dynamic payslip data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner">Loading Payslip...</div>
      </div>
    );
  }

  if (!payslipData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '20px' }}>
        <h2>Payslip Data Not Found</h2>
        <button onClick={() => navigate(-1)} className="btn btn-primary">Go Back</button>
      </div>
    );
  }

  const { school, period, employee, earnings, deductions, summary } = payslipData;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Pad arrays to equal length for better side-by-side rendering
  const maxRows = Math.max(earnings.length, deductions.length, 1);
  const paddedEarnings = [...earnings];
  const paddedDeductions = [...deductions];
  
  while (paddedEarnings.length < maxRows) {
    paddedEarnings.push({ particulars: '', amount: null });
  }
  while (paddedDeductions.length < maxRows) {
    paddedDeductions.push({ particulars: '', amount: null });
  }

  return (
    <div>
      <div className="no-print" style={{ padding: '20px', textAlign: 'center', backgroundColor: '#fff', borderBottom: '1px solid #ddd' }}>
        <button onClick={() => navigate(-1)} style={{ marginRight: '10px', padding: '8px 16px', cursor: 'pointer' }}>&larr; Back</button>
        <button onClick={handlePrint} style={{ backgroundColor: '#295F48', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Print / Save PDF</button>
      </div>

      <div className="payslip-container">
        <div className="payslip-page">
          
          {/* Header */}
          <div className="payslip-header flex justify-between items-center">
            <div className="flex items-center">
              <div className="payslip-logo">
                {school.name.substring(0, 3).toUpperCase()}
              </div>
              <div className="payslip-info">
                <h1>{school.name}</h1>
                <p>{school.address} {school.affiliation && `• ${school.affiliation}`}</p>
              </div>
            </div>
            <div className="payslip-title">
              <h2>SALARY SLIP</h2>
              <p>For the month of {period.monthYear}</p>
            </div>
          </div>

          <div className="payslip-divider"></div>

          {/* Details Section */}
          <div className="details-grid">
            {/* Left Column */}
            <div>
              <div className="detail-row">
                <span className="detail-label">Employee Name</span>
                <span className="detail-value">{employee.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Designation</span>
                <span className="detail-value">{employee.designation}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date of Joining</span>
                <span className="detail-value">{employee.joiningDate}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Bank Account No.</span>
                <span className="detail-value">{employee.bankAccount}</span>
              </div>
            </div>
            
            {/* Right Column */}
            <div>
              <div className="detail-row">
                <span className="detail-label">Employee ID</span>
                <span className="detail-value">{employee.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Department</span>
                <span className="detail-value">{employee.department}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">PAN No.</span>
                <span className="detail-value">{employee.panNo}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Days Worked / Total</span>
                <span className="detail-value">{period.daysWorked} / {period.totalDays}</span>
              </div>
            </div>
          </div>

          {/* Tables Section */}
          <div className="tables-grid">
            {/* Earnings */}
            <table className="payslip-table">
              <thead>
                <tr>
                  <th>Earnings</th>
                  <th className="amount-col"></th>
                </tr>
              </thead>
              <tbody>
                {paddedEarnings.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.particulars}</td>
                    <td className="amount-col">{item.amount !== null ? `₹ ${formatCurrency(item.amount)}` : ''}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td>Gross Earnings</td>
                  <td className="amount-col">₹ {formatCurrency(summary.grossEarnings)}</td>
                </tr>
              </tbody>
            </table>

            {/* Deductions */}
            <table className="payslip-table">
              <thead>
                <tr>
                  <th>Deductions</th>
                  <th className="amount-col"></th>
                </tr>
              </thead>
              <tbody>
                {paddedDeductions.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.particulars}</td>
                    <td className="amount-col">{item.amount !== null ? `₹ ${formatCurrency(item.amount)}` : ''}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td>Total Deductions</td>
                  <td className="amount-col">₹ {formatCurrency(summary.totalDeductions)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Net Pay Box */}
          <div className="net-pay-box">
            <div className="net-pay-left">
              <div className="label">NET PAY</div>
              <div className="words">{summary.netSalaryWords}</div>
            </div>
            <div className="net-pay-amount">
              ₹ {formatCurrency(summary.netSalary)}
            </div>
          </div>

          {/* Footer */}
          <div className="payslip-footer">
            <div className="footer-note">
              This is a computer-generated payslip and does not require a signature. For queries, contact the Accounts Office.
            </div>
            <div className="signature-box">
              <div className="signature-line"></div>
              <div className="signature-text">Authorized Signatory</div>
            </div>
          </div>

        </div>
      </div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default PayslipView;
