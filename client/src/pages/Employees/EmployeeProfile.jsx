import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Briefcase, FileText, IndianRupee, Calendar, Clock, Activity, Download } from 'lucide-react';

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'professional', label: 'Professional Info', icon: Briefcase },
    { id: 'salary', label: 'Salary', icon: IndianRupee },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leave', label: 'Leave', icon: Calendar },
    { id: 'documents', label: 'Documents', icon: FileText }
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '2rem' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/employees')} style={{ padding: '0.5rem' }}>
          <ArrowLeft size={20} />
        </button>
        <div className="page-header-info" style={{ flex: 1 }}>
          <h1>Employee Profile</h1>
          <p>Detailed records for {employee.name}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Left Sidebar Profile Card */}
        <div className="card" style={{ flex: '1 1 300px', padding: '2rem', textAlign: 'center' }}>
          <div style={{
            width: 120, height: 120, borderRadius: '50%', background: 'var(--primary-100)', color: 'var(--primary-700)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 700,
            margin: '0 auto 1.5rem', objectFit: 'cover'
          }}>
            {employee.photo_url ? <img src={employee.photo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : employee.name.charAt(0)}
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>{employee.name}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>{employee.designation}</p>
          <span style={{
            display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
            backgroundColor: employee.status === 'Active' ? 'var(--success-50)' : 'var(--danger-50)',
            color: employee.status === 'Active' ? 'var(--success-700)' : 'var(--danger-700)'
          }}>
            {employee.status}
          </span>

          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Employee ID</p>
              <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{employee.emp_id || 'N/A'}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Department</p>
              <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{employee.department || 'N/A'}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Email</p>
              <p style={{ fontWeight: 500, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{employee.email || 'N/A'}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Phone</p>
              <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{employee.mobile || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div style={{ flex: '3 1 600px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Tabs */}
          <div className="card" style={{ display: 'flex', padding: '0.5rem', overflowX: 'auto', gap: '0.5rem' }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem',
                    background: activeTab === tab.id ? 'var(--primary-50)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--primary-700)' : 'var(--text-secondary)',
                    border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: activeTab === tab.id ? 600 : 500,
                    whiteSpace: 'nowrap', transition: 'all 0.2s'
                  }}
                >
                  <Icon size={16} /> {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          <div className="card" style={{ padding: '2rem', minHeight: '400px' }}>
            {activeTab === 'overview' && (
              <div>
                <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Overview</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  <div style={{ padding: '1rem', background: 'var(--surface-hover)', borderRadius: '12px' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Date of Joining</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{employee.joining_date ? new Date(employee.joining_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div style={{ padding: '1rem', background: 'var(--surface-hover)', borderRadius: '12px' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Employment Type</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{employee.employment_type || 'N/A'}</p>
                  </div>
                  <div style={{ padding: '1rem', background: 'var(--surface-hover)', borderRadius: '12px' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Experience</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{employee.experience || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'personal' && (
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
            )}

            {activeTab === 'professional' && (
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
            )}

            {activeTab === 'salary' && (
              <div>
                <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Salary Structure</h3>
                
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: 'var(--success-600)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>Earnings</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <InfoItem label="Basic Salary" value={`₹${employee.basic_salary || 0}`} />
                      <InfoItem label="HRA" value={`₹${employee.hra || 0}`} />
                      <InfoItem label="DA" value={`₹${employee.da || 0}`} />
                      <InfoItem label="Medical Allowance" value={`₹${employee.medical_allowance || 0}`} />
                      <InfoItem label="Special Allowance" value={`₹${employee.special_allowance || 0}`} />
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: 'var(--danger-600)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>Deductions</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <InfoItem label="PF" value={`₹${employee.pf || 0}`} />
                      <InfoItem label="Professional Tax" value={`₹${employee.professional_tax || 0}`} />
                      <InfoItem label="Other Deductions" value={`₹${employee.other_deductions || 0}`} />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                  <h4 style={{ marginBottom: '1rem' }}>Bank Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                    <InfoItem label="Bank Name" value={employee.bank_name} />
                    <InfoItem label="Account Number" value={employee.account_no} />
                    <InfoItem label="IFSC Code" value={employee.ifsc_code} />
                  </div>
                </div>
              </div>
            )}

            {(activeTab === 'attendance' || activeTab === 'leave' || activeTab === 'documents') && (
              <div className="empty-state" style={{ margin: '4rem 0' }}>
                <div className="empty-state-icon">🚧</div>
                <h3 className="empty-state-title">Feature Coming Soon</h3>
                <p className="empty-state-text">This section is currently under development.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div>
    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{label}</p>
    <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{value || '-'}</p>
  </div>
);

export default EmployeeProfile;
