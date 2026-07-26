import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Shield, Calendar, User, Leaf, Info } from 'lucide-react';
import './Payslip.css';

// Simple helper to convert number to words for Indian Rupees
const numberToWords = (num) => {
  if (!num) return 'Zero Rupees Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  // Round the number to avoid decimal overflowing the 9-digit limit
  num = Math.round(num);

  if ((num = num.toString()).length > 9) return 'Amount too large';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
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
      let totalEarnings = 0;
      if (salaryRecord.basic_salary) {
        earningsList.push({ particulars: 'Basic Salary', amount: Number(salaryRecord.basic_salary) });
        totalEarnings += Number(salaryRecord.basic_salary);
      }
      if (salaryRecord.allowances && Array.isArray(salaryRecord.allowances)) {
        salaryRecord.allowances.forEach(a => {
          earningsList.push({ particulars: a.name, amount: Number(a.amount) });
          totalEarnings += Number(a.amount);
        });
      }

      const deductionsList = [];
      let totalDeductions = 0;
      let hasAdvance = false;
      if (salaryRecord.deductions && Array.isArray(salaryRecord.deductions)) {
        salaryRecord.deductions.forEach(d => {
          let name = d.name;
          if (name.toLowerCase().includes('advance')) {
            name = 'Salary Taken in Advance';
            hasAdvance = true;
          }
          deductionsList.push({ particulars: name, amount: Number(d.amount) });
          totalDeductions += Number(d.amount);
        });
      }
      
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
          grossEarnings: totalEarnings,
          totalDeductions: totalDeductions,
          netSalary: salaryRecord.net_salary || 0,
          netSalaryWords: numberToWords(salaryRecord.net_salary || 0),
          hasAdvance: hasAdvance || salaryRecord.payment_mode?.toLowerCase() === 'advance'
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
        <button onClick={handlePrint} style={{ backgroundColor: '#245842', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Print / Save PDF</button>
      </div>

      <div className="payslip-container" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', backgroundColor: '#e2e2e2', fontFamily: '"Inter", "Segoe UI", Arial, sans-serif' }}>
        <div className="payslip-page" style={{ padding: '40px', backgroundColor: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', backgroundColor: '#245842', borderRadius: '50%', color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
                {school.name.substring(0, 3).toUpperCase()}
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0', color: '#245842', fontFamily: 'Georgia, serif' }}>{school.name.toUpperCase()}</h1>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>Inspiring Minds. Shaping Futures.</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#333', margin: '0 0 5px 0', letterSpacing: '2px' }}>SALARY SLIP</h2>
              <div style={{ fontSize: '14px', color: '#666' }}>For the month of {period.monthYear}</div>
              {summary.hasAdvance && (
                <div style={{ marginTop: '10px', display: 'inline-block', backgroundColor: '#fff3cd', color: '#856404', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #ffeeba' }}>
                  SALARY TAKEN IN ADVANCE
                </div>
              )}
            </div>
          </div>

          <div style={{ height: '2px', backgroundColor: '#245842', marginBottom: '30px' }}></div>

          {/* Employee Details */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '40px', color: '#444' }}>
            <div style={{ width: '45%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ color: '#666' }}>Employee Name</span>
                <span style={{ fontWeight: '500', color: '#000' }}>{employee.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ color: '#666' }}>Designation</span>
                <span style={{ fontWeight: '500', color: '#000' }}>{employee.designation}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ color: '#666' }}>Date of Joining</span>
                <span style={{ fontWeight: '500', color: '#000' }}>{employee.joiningDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Bank Account No.</span>
                <span style={{ fontWeight: '500', color: '#000' }}>N/A</span>
              </div>
            </div>
            
            <div style={{ width: '45%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ color: '#666' }}>Employee ID</span>
                <span style={{ fontWeight: '500', color: '#000' }}>{employee.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ color: '#666' }}>Department</span>
                <span style={{ fontWeight: '500', color: '#000' }}>{employee.department}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ color: '#666' }}>PAN No.</span>
                <span style={{ fontWeight: '500', color: '#000' }}>N/A</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Days Worked / Total</span>
                <span style={{ fontWeight: '500', color: '#000' }}>{period.daysWorked} / {period.totalDays}</span>
              </div>
            </div>
          </div>

          {/* Earnings & Deductions Tables */}
          <div style={{ display: 'flex', gap: '30px', marginBottom: '30px' }}>
            
            {/* Earnings Table */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ backgroundColor: '#245842', color: 'white', padding: '12px 15px', fontWeight: 'bold', fontSize: '14px', marginBottom: '10px' }}>
                EARNINGS
              </div>
              <div style={{ padding: '10px 15px', flex: 1 }}>
                {paddedEarnings.map((e, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '14px', color: '#333' }}>
                    <span>{e.particulars}</span>
                    <span>{e.amount !== null ? `₹ ${formatCurrency(e.amount)}` : ''}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', backgroundColor: '#f8f9fa', fontWeight: 'bold', fontSize: '15px', color: '#245842', marginTop: 'auto' }}>
                <span>Gross Earnings</span>
                <span>₹ {formatCurrency(summary.grossEarnings)}</span>
              </div>
            </div>

            {/* Deductions Table */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ backgroundColor: '#245842', color: 'white', padding: '12px 15px', fontWeight: 'bold', fontSize: '14px', marginBottom: '10px' }}>
                DEDUCTIONS
              </div>
              <div style={{ padding: '10px 15px', flex: 1 }}>
                {paddedDeductions.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '14px', color: '#333' }}>
                    <span>{d.particulars}</span>
                    <span>{d.amount !== null ? `₹ ${formatCurrency(d.amount)}` : ''}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', backgroundColor: '#f8f9fa', fontWeight: 'bold', fontSize: '15px', color: '#245842', marginTop: 'auto' }}>
                <span>Total Deductions</span>
                <span>₹ {formatCurrency(summary.totalDeductions)}</span>
              </div>
            </div>
            
          </div>

          {/* Net Pay Box */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', border: '1px solid #245842', padding: '25px', marginBottom: '50px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#245842', letterSpacing: '1px' }}>NET PAY</span>
              <span style={{ fontSize: '13px', color: '#666', fontStyle: 'italic' }}>{summary.netSalaryWords}</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#245842' }}>
              ₹ {formatCurrency(summary.netSalary)}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '12px', color: '#666' }}>
            <div style={{ maxWidth: '50%', fontStyle: 'italic' }}>
              This is a computer-generated payslip and does not require a signature. For queries, contact the Accounts Office.
            </div>
            <div style={{ textAlign: 'center', width: '200px' }}>
              <div style={{ borderBottom: '1px solid #000', marginBottom: '8px' }}></div>
              <div style={{ color: '#333' }}>Authorized Signatory</div>
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
