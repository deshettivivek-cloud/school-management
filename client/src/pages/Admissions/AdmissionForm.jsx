import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import supabase from '../../api/supabase';
import toast from 'react-hot-toast';
import { HiOutlineSave, HiOutlineArrowLeft, HiOutlineUpload } from 'react-icons/hi';

const AdmissionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const currentYear = new Date().getFullYear();
  const currentAcademicYear = `${currentYear}-${String(currentYear + 1).slice(2)}`;

  const [form, setForm] = useState({
    name: '', dob: '', gender: 'male', grade: '', section: '',
    parentName: '', parentPhone: '', parentEmail: '', address: '',
    academicYear: currentAcademicYear, admissionDate: new Date().toISOString().split('T')[0],
    admissionNo: '', aadharNo: '',
    motherName: '', motherTongue: '', motherPhone: '', guardianPhone: '',
    permanentAddress: '', fatherOccupation: '', motherOccupation: '',
    fatherOccupationDesc: '', motherOccupationDesc: ''
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSchoolYear();
    if (isEdit) fetchStudent();
  }, [id]);

  const fetchSchoolYear = async () => {
    try {
      const res = await api.get('/schools');
      if (res.data.data?.academic_year) {
        setForm((prev) => ({ ...prev, academicYear: res.data.data.academic_year }));
      }
    } catch (err) { /* ignore */ }
  };

  const fetchStudent = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/students/${id}`);
      const s = res.data.data;
      setForm({
        name: s.name, dob: s.dob?.split('T')[0] || '', gender: s.gender,
        grade: s.grade, section: s.section || '', parentName: s.parentName,
        parentPhone: s.parentPhone, parentEmail: s.parentEmail || '',
        address: s.address || '', academicYear: s.academicYear || s.academic_year || '',
        admissionDate: s.admissionDate?.split('T')[0] || (s.admission_date ? s.admission_date.split('T')[0] : ''),
        admissionNo: s.admission_no || '', aadharNo: s.aadhar_no || '',
        motherName: s.mother_name || '', motherTongue: s.mother_tongue || '',
        motherPhone: s.mother_phone || '', guardianPhone: s.guardian_phone || '',
        permanentAddress: s.permanent_address || '', fatherOccupation: s.father_occupation || '',
        motherOccupation: s.mother_occupation || '', fatherOccupationDesc: s.father_occupation_desc || '',
        motherOccupationDesc: s.mother_occupation_desc || ''
      });
      if (s.photo_url || s.photoUrl) setPhotoPreview(s.photo_url || s.photoUrl);
    } catch (error) {
      toast.error('Failed to load student');
      navigate('/admissions');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const missing = [];
    if (!form.name) missing.push('Full Name');
    if (!form.dob) missing.push('Date of Birth');
    if (!form.grade) missing.push('Grade/Class');
    if (!form.parentName) missing.push('Father/Guardian Name');
    if (!form.parentPhone) missing.push('Father Phone');
    if (!form.academicYear) missing.push('Academic Year');

    if (missing.length > 0) {
      toast.error(`Please fill missing required fields: ${missing.join(', ')}`);
      return;
    }

    setSaving(true);
    try {
      let photoUrl = undefined;
      
      if (photo) {
        const formData = new FormData();
        formData.append('photo', photo);
        
        const uploadRes = await api.post('/upload/photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (!uploadRes.data.success) {
          throw new Error('Upload failed');
        }
        photoUrl = uploadRes.data.url;
      }

      const payload = { ...form };
      if (photoUrl) payload.photoUrl = photoUrl;

      if (isEdit) {
        await api.put(`/students/${id}`, payload);
        toast.success('Student updated! ✅');
      } else {
        await api.post('/students', payload);
        toast.success('Student registered! 🎉');
      }

      navigate('/admissions');
    } catch (error) {
      console.error("Save error:", error);
      const errMsg = error.message || error.response?.data?.message || 'Failed to save';
      toast.error(`Error: ${errMsg}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="spinner-container"><div className="spinner" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-info">
          <h1>{isEdit ? 'Edit Student' : 'New Admission'}</h1>
          <p>{isEdit ? 'Update student information' : 'Register a new student'}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/admissions')}>
          <HiOutlineArrowLeft /> Back
        </button>
      </div>

      <div className="card" style={{ maxWidth: 900 }}>
        <form onSubmit={handleSubmit}>
          {/* Photo Upload */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div
              style={{
                width: 100, height: 100, borderRadius: '50%',
                background: photoPreview ? 'transparent' : 'var(--gradient-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 0.75rem', overflow: 'hidden',
                border: '2px dashed var(--border-color)', cursor: 'pointer',
              }}
              onClick={() => document.getElementById('photo-upload').click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <HiOutlineUpload size={28} color="white" />
              )}
            </div>
            <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            <p className="form-help">Student Photo</p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Admission No</label>
              <input id="student-admission" type="text" className="form-input" name="admissionNo" value={form.admissionNo} onChange={handleChange} placeholder="Auto-generated if empty" />
            </div>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input id="student-name" type="text" className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Student full name" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date of Birth *</label>
              <input id="student-dob" type="date" className="form-input" name="dob" value={form.dob} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Mother Tongue</label>
              <input id="student-mtongue" type="text" className="form-input" name="motherTongue" value={form.motherTongue} onChange={handleChange} placeholder="e.g. Hindi, English" />
            </div>
            <div className="form-group">
              <label className="form-label">Aadhar Number</label>
              <input id="student-aadhar" type="text" className="form-input" name="aadharNo" value={form.aadharNo} onChange={handleChange} placeholder="12-digit Aadhar number" />
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Gender *</label>
              <select id="student-gender" className="form-select" name="gender" value={form.gender} onChange={handleChange}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Grade/Class *</label>
              <select id="student-grade" className="form-select" name="grade" value={form.grade} onChange={handleChange}>
                <option value="">Select Grade</option>
                {['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((g) => (
                  <option key={g} value={g}>Class {g}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Section</label>
              <input id="student-section" type="text" className="form-input" name="section" value={form.section} onChange={handleChange} placeholder="A, B, C..." />
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border-color)', margin: '1.5rem 0' }} />

          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Parent / Guardian Details</h3>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Father/Guardian Name *</label>
              <input id="parent-name" type="text" className="form-input" name="parentName" value={form.parentName} onChange={handleChange} placeholder="Father's name" />
            </div>
            <div className="form-group">
              <label className="form-label">Mother Name</label>
              <input id="mother-name" type="text" className="form-input" name="motherName" value={form.motherName} onChange={handleChange} placeholder="Mother's name" />
            </div>
            <div className="form-group">
              <label className="form-label">Father Phone *</label>
              <input id="parent-phone" type="text" className="form-input" name="parentPhone" value={form.parentPhone} onChange={handleChange} placeholder="+91 9876543210" />
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Mother Phone</label>
              <input id="mother-phone" type="text" className="form-input" name="motherPhone" value={form.motherPhone} onChange={handleChange} placeholder="+91 9876543210" />
            </div>
            <div className="form-group">
              <label className="form-label">Guardian Phone</label>
              <input id="guardian-phone" type="text" className="form-input" name="guardianPhone" value={form.guardianPhone} onChange={handleChange} placeholder="+91 9876543210" />
            </div>
            <div className="form-group">
              <label className="form-label">Parent Email</label>
              <input id="parent-email" type="email" className="form-input" name="parentEmail" value={form.parentEmail} onChange={handleChange} placeholder="parent@email.com" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Father Occupation</label>
              <select className="form-select" name="fatherOccupation" value={form.fatherOccupation} onChange={handleChange}>
                <option value="">Select...</option>
                <option value="service">Service</option>
                <option value="profession">Profession</option>
                <option value="business">Business</option>
              </select>
              <input type="text" className="form-input" style={{ marginTop: '0.5rem' }} name="fatherOccupationDesc" value={form.fatherOccupationDesc} onChange={handleChange} placeholder="Brief description..." />
            </div>
            <div className="form-group">
              <label className="form-label">Mother Occupation</label>
              <select className="form-select" name="motherOccupation" value={form.motherOccupation} onChange={handleChange}>
                <option value="">Select...</option>
                <option value="service">Service</option>
                <option value="profession">Profession</option>
                <option value="business">Business</option>
              </select>
              <input type="text" className="form-input" style={{ marginTop: '0.5rem' }} name="motherOccupationDesc" value={form.motherOccupationDesc} onChange={handleChange} placeholder="Brief description..." />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Present Address</label>
              <textarea id="student-address" className="form-textarea" name="address" value={form.address} onChange={handleChange} placeholder="Present address" rows={3} />
            </div>
            <div className="form-group">
              <label className="form-label">Permanent Address</label>
              <textarea id="student-permanent-address" className="form-textarea" name="permanentAddress" value={form.permanentAddress} onChange={handleChange} placeholder="Permanent address" rows={3} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Academic Year *</label>
              <input id="student-year" type="text" className="form-input" name="academicYear" value={form.academicYear} onChange={handleChange} placeholder="2024-25" />
            </div>
            <div className="form-group">
              <label className="form-label">Admission Date</label>
              <input id="student-admission-date" type="date" className="form-input" name="admissionDate" value={form.admissionDate} onChange={handleChange} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/admissions')}>Cancel</button>
            <button id="student-save" type="submit" className="btn btn-primary" disabled={saving}>
              <HiOutlineSave />
              {saving ? 'Saving...' : isEdit ? 'Update Student' : 'Register Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdmissionForm;
