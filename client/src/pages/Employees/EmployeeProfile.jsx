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

const PersonalTab = ({ employee }) => (
  <div>
    <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Personal Information</h3>
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
        <InfoItem label="Address" value={`${employee.address || ''}, ${employee.city || ''}, ${employee.state || ''} ${employee.pincode || ''}`} />
      </div>
    </div>
  </div>
);

const ProfessionalTab = ({ employee }) => (
  <div>
    <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Professional Information</h3>
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

const SalaryTab = ({ employee }) => (
  <div>
    <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Salary Structure</h3>
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

  useEffect(() => {
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
    { id: 'personal', label: 'Personal', icon: User, component: <PersonalTab employee={employee} /> },
    { id: 'professional', label: 'Professional', icon: Briefcase, component: <ProfessionalTab employee={employee} /> },
    { id: 'salary', label: 'Salary', icon: IndianRupee, component: <SalaryTab employee={employee} /> },
    { id: 'payslips', label: 'Payslips', icon: FileCheck, component: <div className="empty-state">Payslips module coming soon.</div> },
    { id: 'attendance', label: 'Attendance', icon: Clock, component: <div className="empty-state">Attendance tracking coming soon.</div> },
    { id: 'leave', label: 'Leave', icon: Calendar, component: <div className="empty-state">Leave management coming soon.</div> },
    { id: 'documents', label: 'Documents', icon: FileText, component: <div className="empty-state">No documents uploaded.</div> },
    { id: 'timeline', label: 'Timeline', icon: History, component: <TimelineTab employeeId={employee.id} /> }
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '2rem' }}>
      <ProfileShell header={headerConfig} tabs={tabsConfig} />
    </div>
  );
};

export default EmployeeProfile;
