import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import ProfileShell from '../../components/Profile/ProfileShell';
import Timeline from '../../components/Profile/Timeline';
import { 
  User, Briefcase, FileText, IndianRupee, 
  Calendar, Clock, Activity, FileCheck, History
} from 'lucide-react';
import StatCard from '../../components/Common/StatCard';

const InfoItem = ({ label, value }) => (
  <div>
    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{label}</p>
    <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{value || '-'}</p>
  </div>
);

const OverviewTab = ({ employee }) => (
  <div>
    <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Overview</h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
      <StatCard title="Date of Joining" value={employee.joining_date ? new Date(employee.joining_date).toLocaleDateString() : 'N/A'} icon={Calendar} color="blue" hideDelta={true} />
      <StatCard title="Employment Type" value={employee.employment_type || 'N/A'} icon={Briefcase} color="green" hideDelta={true} />
      <StatCard title="Experience" value={employee.experience || 'N/A'} icon={Clock} color="amber" hideDelta={true} />
    </div>
  </div>
);

const PersonalTab = ({ employee, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const startEditing = () => {
    setFormData({
      mobile: employee.mobile || '',
      alt_mobile: employee.alt_mobile || '',
      email: employee.email || '',
      aadhaar_no: employee.aadhaar_no || '',
      pan_no: employee.pan_no || '',
      blood_group: employee.blood_group || '',
      address: employee.address || '',
      city: employee.city || '',
      state: employee.state || '',
      pincode: employee.pincode || '',
    });
    setIsEditing(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if ((name === 'mobile' || name === 'alt_mobile' || name === 'aadhaar_no') && value && !/^\d*$/.test(value)) {
      toast.error('Only numbers are allowed');
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    try {
      await api.put(`/employees/${employee.id}`, formData);
      toast.success('Personal info updated');
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error('Failed to update personal info');
    }
  };

  if (isEditing) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Edit Personal Information</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline btn-sm" onClick={() => setIsEditing(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleSave}>Save Changes</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div className="form-group"><label className="form-label">Mobile Number</label><input type="text" name="mobile" className="form-input" value={formData.mobile} onChange={handleChange} maxLength="10" /></div>
          <div className="form-group"><label className="form-label">Alternate Mobile</label><input type="text" name="alt_mobile" className="form-input" value={formData.alt_mobile} onChange={handleChange} maxLength="10" /></div>
          <div className="form-group"><label className="form-label">Email Address</label><input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} /></div>
          <div className="form-group"><label className="form-label">Aadhaar Number</label><input type="text" name="aadhaar_no" className="form-input" value={formData.aadhaar_no} onChange={handleChange} maxLength="12" /></div>
          <div className="form-group"><label className="form-label">PAN Number</label><input type="text" name="pan_no" className="form-input" value={formData.pan_no} onChange={handleChange} /></div>
          <div className="form-group"><label className="form-label">Blood Group</label><input type="text" name="blood_group" className="form-input" value={formData.blood_group} onChange={handleChange} /></div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Address</label><textarea name="address" className="form-input" value={formData.address} onChange={handleChange} rows="2" /></div>
          <div className="form-group"><label className="form-label">City</label><input type="text" name="city" className="form-input" value={formData.city} onChange={handleChange} /></div>
          <div className="form-group"><label className="form-label">State</label><input type="text" name="state" className="form-input" value={formData.state} onChange={handleChange} /></div>
          <div className="form-group"><label className="form-label">Pincode</label><input type="text" name="pincode" className="form-input" value={formData.pincode} onChange={handleChange} /></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Personal Information</h3>
        <button className="btn btn-outline btn-sm" onClick={startEditing}>Edit Info</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <InfoItem label="Full Name" value={employee.name} />
        <InfoItem label="Gender" value={employee.gender} />
        <InfoItem label="Date of Birth" value={employee.dob} />
        <InfoItem label="Blood Group" value={employee.blood_group} />
        <InfoItem label="Mobile Number" value={employee.mobile} />
        <InfoItem label="Alternate Mobile" value={employee.alt_mobile} />
        <InfoItem label="Email Address" value={employee.email} />
        <InfoItem label="Aadhaar Number" value={employee.aadhaar_no} />
        <InfoItem label="PAN Number" value={employee.pan_no} />
        <div style={{ gridColumn: '1 / -1' }}>
          <InfoItem label="Address" value={`${employee.address || ''}, ${employee.city || ''}, ${employee.state || ''} ${employee.pincode || ''}`.replace(/, ,/g, ',').replace(/^, | , $/g, '') || '-'} />
        </div>
      </div>
    </div>
  );
};

const ProfessionalTab = ({ employee, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const startEditing = () => {
    setFormData({
      emp_id: employee.emp_id || '',
      designation: employee.designation || '',
      department: employee.department || '',
      employment_type: employee.employment_type || '',
      joining_date: employee.joining_date ? new Date(employee.joining_date).toISOString().split('T')[0] : '',
      qualification: employee.qualification || '',
      experience: employee.experience || '',
      class_teacher_of: employee.class_teacher_of || '',
      subject: employee.subject ? employee.subject.join(', ') : ''
    });
    setIsEditing(true);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        subject: formData.subject ? formData.subject.split(',').map(s => s.trim()).filter(Boolean) : []
      };
      await api.put(`/employees/${employee.id}`, payload);
      toast.success('Professional info updated');
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error('Failed to update professional info');
    }
  };

  if (isEditing) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Edit Professional Information</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline btn-sm" onClick={() => setIsEditing(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleSave}>Save Changes</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div className="form-group"><label className="form-label">Employee ID</label><input type="text" name="emp_id" className="form-input" value={formData.emp_id} onChange={handleChange} /></div>
          <div className="form-group"><label className="form-label">Designation</label><input type="text" name="designation" className="form-input" value={formData.designation} onChange={handleChange} /></div>
          <div className="form-group"><label className="form-label">Department</label><input type="text" name="department" className="form-input" value={formData.department} onChange={handleChange} /></div>
          <div className="form-group"><label className="form-label">Employment Type</label>
            <select name="employment_type" className="form-input" value={formData.employment_type} onChange={handleChange}>
              <option value="">Select Type</option>
              <option value="Full Time">Full Time</option>
              <option value="Part Time">Part Time</option>
              <option value="Contract">Contract</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">Date of Joining</label><input type="date" name="joining_date" className="form-input" value={formData.joining_date} onChange={handleChange} /></div>
          <div className="form-group"><label className="form-label">Qualification</label><input type="text" name="qualification" className="form-input" value={formData.qualification} onChange={handleChange} /></div>
          <div className="form-group"><label className="form-label">Experience</label><input type="text" name="experience" className="form-input" value={formData.experience} onChange={handleChange} /></div>
          <div className="form-group"><label className="form-label">Class Teacher Of</label><input type="text" name="class_teacher_of" className="form-input" value={formData.class_teacher_of} onChange={handleChange} /></div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Subjects Taught (comma separated)</label><input type="text" name="subject" className="form-input" value={formData.subject} onChange={handleChange} /></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Professional Information</h3>
        <button className="btn btn-outline btn-sm" onClick={startEditing}>Edit Info</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <InfoItem label="Employee ID" value={employee.emp_id} />
        <InfoItem label="Designation" value={employee.designation} />
        <InfoItem label="Department" value={employee.department} />
        <InfoItem label="Employment Type" value={employee.employment_type} />
        <InfoItem label="Date of Joining" value={employee.joining_date} />
        <InfoItem label="Qualification" value={employee.qualification} />
        <InfoItem label="Experience" value={employee.experience} />
        <InfoItem label="Subjects Taught" value={employee.subject?.join(', ')} />
        <InfoItem label="Class Teacher Of" value={employee.class_teacher_of} />
      </div>
    </div>
  );
};

const SalaryTab = ({ employee, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  // Initialize form data when editing starts
  const startEditing = () => {
    setFormData({
      basic_salary: employee.basic_salary || '',
      hra: employee.hra || '',
      da: employee.da || '',
      medical_allowance: employee.medical_allowance || '',
      special_allowance: employee.special_allowance || '',
      bonus: employee.bonus || '',
      pf: employee.pf || '',
      professional_tax: employee.professional_tax || '',
      other_deductions: employee.other_deductions || '',
      bank_name: employee.bank_name || '',
      account_no: employee.account_no || '',
      ifsc_code: employee.ifsc_code || '',
    });
    setIsEditing(true);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        basic_salary: Number(formData.basic_salary) || 0,
        hra: Number(formData.hra) || 0,
        da: Number(formData.da) || 0,
        medical_allowance: Number(formData.medical_allowance) || 0,
        special_allowance: Number(formData.special_allowance) || 0,
        bonus: Number(formData.bonus) || 0,
        pf: Number(formData.pf) || 0,
        professional_tax: Number(formData.professional_tax) || 0,
        other_deductions: Number(formData.other_deductions) || 0,
      };
      await api.put(`/employees/${employee.id}`, payload);
      toast.success('Salary updated successfully');
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error('Failed to update salary');
    }
  };

  if (isEditing) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Edit Salary Structure</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline btn-sm" onClick={() => setIsEditing(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleSave}>Save Changes</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Earnings</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group"><label className="form-label">Basic Salary (₹)</label><input type="number" name="basic_salary" className="form-input" value={formData.basic_salary} onChange={handleChange} /></div>
              <div className="form-group"><label className="form-label">HRA (₹)</label><input type="number" name="hra" className="form-input" value={formData.hra} onChange={handleChange} /></div>
              <div className="form-group"><label className="form-label">DA (₹)</label><input type="number" name="da" className="form-input" value={formData.da} onChange={handleChange} /></div>
              <div className="form-group"><label className="form-label">Medical Allowance (₹)</label><input type="number" name="medical_allowance" className="form-input" value={formData.medical_allowance} onChange={handleChange} /></div>
              <div className="form-group"><label className="form-label">Special Allowance (₹)</label><input type="number" name="special_allowance" className="form-input" value={formData.special_allowance} onChange={handleChange} /></div>
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Deductions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group"><label className="form-label">PF (₹)</label><input type="number" name="pf" className="form-input" value={formData.pf} onChange={handleChange} /></div>
              <div className="form-group"><label className="form-label">Professional Tax (₹)</label><input type="number" name="professional_tax" className="form-input" value={formData.professional_tax} onChange={handleChange} /></div>
              <div className="form-group"><label className="form-label">Other Deductions (₹)</label><input type="number" name="other_deductions" className="form-input" value={formData.other_deductions} onChange={handleChange} /></div>
            </div>
          </div>
        </div>

        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>Bank Details</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div className="form-group"><label className="form-label">Bank Name</label><input type="text" name="bank_name" className="form-input" value={formData.bank_name} onChange={handleChange} /></div>
          <div className="form-group"><label className="form-label">Account Number</label><input type="text" name="account_no" className="form-input" value={formData.account_no} onChange={handleChange} /></div>
          <div className="form-group"><label className="form-label">IFSC Code</label><input type="text" name="ifsc_code" className="form-input" value={formData.ifsc_code} onChange={handleChange} /></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Salary Structure</h3>
        <button className="btn btn-outline btn-sm" onClick={startEditing}>Edit Salary</button>
      </div>
      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ color: 'var(--success-600)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>Earnings</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <InfoItem label="Basic Salary" value={`₹${employee.basic_salary || 0}`} />
            <InfoItem label="HRA" value={`₹${employee.hra || 0}`} />
            <InfoItem label="DA" value={`₹${employee.da || 0}`} />
            <InfoItem label="Medical Allowance" value={`₹${employee.medical_allowance || 0}`} />
            <InfoItem label="Special Allowance" value={`₹${employee.special_allowance || 0}`} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ color: 'var(--danger-600)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>Deductions</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <InfoItem label="PF" value={`₹${employee.pf || 0}`} />
            <InfoItem label="Professional Tax" value={`₹${employee.professional_tax || 0}`} />
            <InfoItem label="Other Deductions" value={`₹${employee.other_deductions || 0}`} />
          </div>
        </div>
      </div>
      <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
        <h4 style={{ marginBottom: '1rem' }}>Bank Details</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
          <InfoItem label="Bank Name" value={employee.bank_name} />
          <InfoItem label="Account Number" value={employee.account_no} />
          <InfoItem label="IFSC Code" value={employee.ifsc_code} />
        </div>
      </div>
    </div>
  );
};

const PayslipsTab = ({ employeeId }) => {
  const [payslips, setPayslips] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/salary/history?employee_id=${employeeId}`).then(res => {
      setPayslips(res.data.data || []);
    }).catch(err => {
      console.error(err);
      setPayslips([]);
    });
  }, [employeeId]);

  if (!payslips) return <div className="skeleton-loader" style={{ height: '200px' }} />;
  if (payslips.length === 0) return <div className="empty-state" style={{ padding: '3rem' }}>No payslips found for this employee.</div>;

  const formatMonthForUrl = (yyyy_mm) => {
    if (!yyyy_mm) return '';
    const [year, monthNum] = yyyy_mm.split('-');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[parseInt(monthNum, 10) - 1] || '';
    return `${monthName}-${year}`;
  };

  const getMonthDisplay = (yyyy_mm) => {
    if (!yyyy_mm) return '';
    const [year, monthNum] = yyyy_mm.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(monthNum, 10) - 1]} ${year}`;
  };

  return (
    <div>
      <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Salary Slips</h3>
      <div className="table-container" style={{ margin: 0, border: '1px solid var(--border)', boxShadow: 'none' }}>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Net Salary</th>
              <th>Status</th>
              <th>Paid On</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {payslips.map(sal => (
              <tr key={sal.id}>
                <td style={{ fontWeight: 500 }}>{getMonthDisplay(sal.month)}</td>
                <td style={{ fontWeight: 600 }}>₹{sal.net_salary}</td>
                <td>
                  <span style={{
                    display: 'inline-flex', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize',
                    backgroundColor: sal.status === 'paid' ? 'var(--success-50)' : 'var(--warning-50)',
                    color: sal.status === 'paid' ? 'var(--success-700)' : 'var(--warning-700)'
                  }}>
                    {sal.status}
                  </span>
                </td>
                <td>{sal.paid_date ? new Date(sal.paid_date).toLocaleDateString() : 'N/A'}</td>
                <td>
                  {sal.status === 'paid' && (
                    <button 
                      className="btn btn-outline btn-sm" 
                      onClick={() => navigate(`/salary/slip/${employeeId}/${formatMonthForUrl(sal.month)}`)}
                    >
                      View Payslip
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TimelineTab = ({ employeeId }) => {
  const [events, setEvents] = useState(null);
  useEffect(() => {
    api.get(`/employees/${employeeId}/timeline`).then(res => {
      setEvents(res.data.data?.map(log => ({
        date: log.created_at,
        title: log.action,
        description: `Resource: ${log.resource_type}`,
        color: 'blue',
        icon: Activity
      })) || []);
    }).catch(err => {
      console.error(err);
      setEvents([]);
    });
  }, [employeeId]);

  if (!events) return <div className="skeleton-loader" style={{ height: '200px' }} />;
  return <Timeline events={events} />;
};

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEmployee = async () => {
    try {
      const res = await api.get(`/employees/${id}`);
      setEmployee(res.data.data);
    } catch (error) {
      toast.error('Failed to load employee profile');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, [id, navigate]);

  if (loading) {
    return <div className="spinner-container" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;
  }

  if (!employee) return null;

  const headerConfig = {
    photoUrl: employee.photo_url,
    title: employee.name,
    subtitle: `${employee.designation} | Emp ID: ${employee.emp_id || 'N/A'}`,
    badges: [
      { label: employee.status, color: employee.status === 'Active' ? 'success' : 'danger' },
      { label: employee.department || 'N/A', color: 'primary' }
    ]
  };

  const tabsConfig = [
    { id: 'overview', label: 'Overview', icon: Activity, component: <OverviewTab employee={employee} /> },
    { id: 'personal', label: 'Personal', icon: User, component: <PersonalTab employee={employee} onUpdate={fetchEmployee} /> },
    { id: 'professional', label: 'Professional', icon: Briefcase, component: <ProfessionalTab employee={employee} onUpdate={fetchEmployee} /> },
    { id: 'salary', label: 'Salary', icon: IndianRupee, component: <SalaryTab employee={employee} onUpdate={fetchEmployee} /> },
    { id: 'payslips', label: 'Payslips', icon: FileCheck, component: <PayslipsTab employeeId={employee.id} /> },
    { id: 'attendance', label: 'Attendance', icon: Clock, component: <div className="empty-state">Attendance tracking coming soon.</div> },
    { id: 'leave', label: 'Leave', icon: Calendar, component: <div className="empty-state">Leave management coming soon.</div> },
    { id: 'documents', label: 'Documents', icon: FileText, component: <div className="empty-state">No documents uploaded.</div> },
    { id: 'timeline', label: 'Timeline', icon: History, component: <TimelineTab employeeId={employee.id} /> }
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/employees')}>
          ← Back to Employees
        </button>
      </div>
      <ProfileShell header={headerConfig} tabs={tabsConfig} />
    </div>
  );
};

export default EmployeeProfile;
