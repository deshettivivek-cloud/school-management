import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Save, User, Briefcase, Lock, UserPlus, FileText, IndianRupee 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AddEmployee = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [createLogin, setCreateLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({
    username: '', // email
    password: '',
    role: 'teacher'
  });

  const [formData, setFormData] = useState({
    // Personal
    name: '', gender: '', dob: '', mobile: '', alt_mobile: '', email: '', 
    address: '', city: '', state: '', pincode: '', aadhaar_no: '', pan_no: '', blood_group: '',
    // Professional
    emp_id: '', joining_date: '', designation: '', department: '', subject: '', class_teacher_of: '',
    employment_type: 'Full Time', qualification: '', experience: '', status: 'Active',
    // Salary
    basic_salary: '', hra: '', da: '', medical_allowance: '', special_allowance: '', bonus: '',
    pf: '', professional_tax: '', other_deductions: '', bank_name: '', account_no: '', ifsc_code: '', remarks: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    setLoginForm({ ...loginForm, password: pwd });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.designation) {
      toast.error('Name and Designation are required.');
      return;
    }

    setLoading(true);
    try {
      let finalUserId = null;

      if (createLogin) {
        if (!loginForm.username || !loginForm.password || loginForm.password.length < 8) {
          toast.error('Valid Email and Password (min 8 chars) are required for login creation.');
          setLoading(false);
          return;
        }
        // Call auth register
        const resAuth = await api.post('/auth/register', {
          name: formData.name,
          email: loginForm.username,
          password: loginForm.password,
          role: loginForm.role
        });
        finalUserId = resAuth.data?.data?.id;
      }

      // Format arrays for PG
      const payload = {
        ...formData,
        user_id: finalUserId,
        subject: formData.subject ? formData.subject.split(',').map(s => s.trim()) : [],
        // convert numeric fields
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

      await api.post('/employees', payload);
      toast.success('Employee created successfully');
      navigate('/employees');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '2rem' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ padding: '0.5rem' }}>
          <ArrowLeft size={20} />
        </button>
        <div className="page-header-info" style={{ flex: 1 }}>
          <h1>Add New Employee</h1>
          <p>Register a new staff member into the system</p>
        </div>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Save size={16} />}
          Save Employee
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Login Account Section */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ background: 'var(--surface-hover)', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={18} className="icon-blue" /> System Access
            </h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
              <input 
                type="checkbox" 
                checked={createLogin} 
                onChange={(e) => setCreateLogin(e.target.checked)} 
                style={{ width: 18, height: 18 }}
              />
              Create Login Account
            </label>
          </div>
          
          {createLogin && (
            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', background: 'var(--primary-50)' }}>
              <div className="form-group">
                <label className="form-label">Email (Username) *</label>
                <input type="email" name="username" className="form-input" value={loginForm.username} onChange={handleLoginChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Temporary Password *</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" name="password" className="form-input" value={loginForm.password} onChange={handleLoginChange} style={{ flex: 1 }} required minLength={8} />
                  <button type="button" className="btn btn-outline" onClick={generatePassword}>Generate</button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">System Role *</label>
                <select name="role" className="form-input" value={loginForm.role} onChange={handleLoginChange}>
                  <option value="teacher">Teacher</option>
                  <option value="clerk">Clerk</option>
                  <option value="principal">Principal</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Personal Information */}
        <div className="card">
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} className="icon-purple" /> Personal Information
            </h3>
          </div>
          <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div className="form-group"><label className="form-label">Full Name *</label><input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} required /></div>
            <div className="form-group"><label className="form-label">Gender</label><select name="gender" className="form-input" value={formData.gender} onChange={handleChange}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>
            <div className="form-group"><label className="form-label">Date of Birth</label><input type="date" name="dob" className="form-input" value={formData.dob} onChange={handleChange} /></div>
            <div className="form-group"><label className="form-label">Mobile Number</label><input type="text" name="mobile" className="form-input" value={formData.mobile} onChange={handleChange} /></div>
            <div className="form-group"><label className="form-label">Personal Email</label><input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} /></div>
            <div className="form-group"><label className="form-label">Aadhaar Number</label><input type="text" name="aadhaar_no" className="form-input" value={formData.aadhaar_no} onChange={handleChange} /></div>
            <div className="form-group"><label className="form-label">PAN Number</label><input type="text" name="pan_no" className="form-input" value={formData.pan_no} onChange={handleChange} /></div>
            <div className="form-group"><label className="form-label">Blood Group</label><input type="text" name="blood_group" className="form-input" value={formData.blood_group} onChange={handleChange} /></div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Address</label><textarea name="address" className="form-input" value={formData.address} onChange={handleChange} rows="2" /></div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="card">
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={18} className="icon-green" /> Professional Information
            </h3>
          </div>
          <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div className="form-group"><label className="form-label">Employee ID (Auto-generated if blank)</label><input type="text" name="emp_id" className="form-input" value={formData.emp_id} onChange={handleChange} placeholder="EMP-2024-001" /></div>
            <div className="form-group"><label className="form-label">Joining Date</label><input type="date" name="joining_date" className="form-input" value={formData.joining_date} onChange={handleChange} /></div>
            <div className="form-group"><label className="form-label">Designation *</label><input type="text" name="designation" className="form-input" value={formData.designation} onChange={handleChange} placeholder="e.g. Senior Teacher" required /></div>
            <div className="form-group"><label className="form-label">Department</label><input type="text" name="department" className="form-input" value={formData.department} onChange={handleChange} placeholder="e.g. Science" /></div>
            <div className="form-group"><label className="form-label">Employment Type</label><select name="employment_type" className="form-input" value={formData.employment_type} onChange={handleChange}><option>Full Time</option><option>Part Time</option><option>Contract</option></select></div>
            <div className="form-group"><label className="form-label">Qualification</label><input type="text" name="qualification" className="form-input" value={formData.qualification} onChange={handleChange} /></div>
            <div className="form-group"><label className="form-label">Experience</label><input type="text" name="experience" className="form-input" value={formData.experience} onChange={handleChange} placeholder="e.g. 5 Years" /></div>
            <div className="form-group"><label className="form-label">Status</label><select name="status" className="form-input" value={formData.status} onChange={handleChange}><option>Active</option><option>Inactive</option></select></div>
            <div className="form-group"><label className="form-label">Subjects (Comma separated)</label><input type="text" name="subject" className="form-input" value={formData.subject} onChange={handleChange} placeholder="Physics, Chemistry" /></div>
            <div className="form-group"><label className="form-label">Class Teacher (Optional)</label><input type="text" name="class_teacher_of" className="form-input" value={formData.class_teacher_of} onChange={handleChange} placeholder="e.g. 10-A" /></div>
          </div>
        </div>

        {/* Salary Information */}
        <div className="card">
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <IndianRupee size={18} className="icon-orange" /> Salary Structure
            </h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
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
        </div>

      </form>
    </div>
  );
};

export default AddEmployee;
