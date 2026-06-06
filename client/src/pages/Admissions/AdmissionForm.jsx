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

  const [form, setForm] = useState({
    name: '', dob: '', gender: 'male', grade: '', section: '',
    parentName: '', parentPhone: '', parentEmail: '', address: '',
    academicYear: '', admissionDate: new Date().toISOString().split('T')[0],
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
      if (res.data.data?.academicYear) {
        setForm((prev) => ({ ...prev, academicYear: res.data.data.academicYear }));
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
        address: s.address || '', academicYear: s.academicYear,
        admissionDate: s.admissionDate?.split('T')[0] || (s.admission_date ? s.admission_date.split('T')[0] : ''),
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
    if (!form.name || !form.dob || !form.grade || !form.parentName || !form.parentPhone || !form.academicYear) {
      toast.error('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      let photoUrl = undefined;
      
      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, photo);
          
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage
          .from('photos')
          .getPublicUrl(fileName);
          
        photoUrl = data.publicUrl;
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
      toast.error(error.response?.data?.message || 'Failed to save');
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
              <label className="form-label">Full Name *</label>
              <input id="student-name" type="text" className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Student full name" />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth *</label>
              <input id="student-dob" type="date" className="form-input" name="dob" value={form.dob} onChange={handleChange} />
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

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Parent/Guardian Name *</label>
              <input id="parent-name" type="text" className="form-input" name="parentName" value={form.parentName} onChange={handleChange} placeholder="Parent full name" />
            </div>
            <div className="form-group">
              <label className="form-label">Parent Phone *</label>
              <input id="parent-phone" type="text" className="form-input" name="parentPhone" value={form.parentPhone} onChange={handleChange} placeholder="+91 9876543210" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Parent Email</label>
              <input id="parent-email" type="email" className="form-input" name="parentEmail" value={form.parentEmail} onChange={handleChange} placeholder="parent@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Academic Year *</label>
              <input id="student-year" type="text" className="form-input" name="academicYear" value={form.academicYear} onChange={handleChange} placeholder="2024-25" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea id="student-address" className="form-textarea" name="address" value={form.address} onChange={handleChange} placeholder="Full address" rows={3} />
          </div>

          <div className="form-group">
            <label className="form-label">Admission Date</label>
            <input id="student-admission-date" type="date" className="form-input" name="admissionDate" value={form.admissionDate} onChange={handleChange} style={{ maxWidth: 300 }} />
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
