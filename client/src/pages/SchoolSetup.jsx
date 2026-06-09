import { useState, useEffect } from 'react';
import api from '../api/axios';
import supabase from '../api/supabase';
import toast from 'react-hot-toast';
import { HiOutlineUpload, HiOutlineSave } from 'react-icons/hi';

const SchoolSetup = () => {
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    academicYear: '',
    academicYearStart: '',
    academicYearEnd: '',
  });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSchool();
  }, []);

  const fetchSchool = async () => {
    try {
      const res = await api.get('/schools');
      if (res.data.data) {
        const s = res.data.data;
        setForm({
          name: s.name || '',
          address: s.address || '',
          phone: s.phone || '',
          email: s.email || '',
          academicYear: s.academic_year || '',
          academicYearStart: s.academic_year_start ? s.academic_year_start.split('T')[0] : '',
          academicYearEnd: s.academic_year_end ? s.academic_year_end.split('T')[0] : '',
          joinCode: s.join_code || '',
        });
        if (s.logo_url || s.logo) setLogoPreview(s.logo_url || s.logo);
      }
    } catch (error) {
      console.error('Error fetching school:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.academicYear) {
      toast.error('School name and academic year are required');
      return;
    }

    setSaving(true);
    try {
      // Send only the fields the backend expects (exclude joinCode etc.)
      const schoolData = {
        name: form.name,
        address: form.address,
        phone: form.phone,
        email: form.email,
        academicYear: form.academicYear,
        academicYearStart: form.academicYearStart,
        academicYearEnd: form.academicYearEnd,
      };
      await api.put('/schools', schoolData);

      // Handle logo upload separately
      if (logo) {
        try {
          const fileExt = logo.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('logos')
            .upload(fileName, logo);
            
          if (uploadError) {
            console.error('Storage Upload Error:', uploadError);
            toast.error(`Logo upload failed: ${uploadError.message}. Please create a "logos" storage bucket in Supabase.`);
          } else {
            const { data } = supabase.storage
              .from('logos')
              .getPublicUrl(fileName);
              
            await api.post('/schools/logo', { logoUrl: data.publicUrl });
            toast.success('School settings & logo saved! 🎉');
            return;
          }
        } catch (logoErr) {
          console.error('Logo save error:', logoErr);
          toast.error('School info saved, but logo upload failed: ' + (logoErr.message || 'Unknown error'));
          return;
        }
      }

      toast.success('School settings saved! 🎉');
    } catch (error) {
      console.error('Save Settings Error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to save');
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
          <h1>School Setup</h1>
          <p>Configure your school information and academic year</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 800 }}>
        {form.joinCode && (
          <div style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--primary-50)', border: '1px solid var(--primary-200)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--primary-700)', marginBottom: '0.5rem', fontSize: '1rem' }}>School Join Code</h3>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '2px', color: 'var(--primary-900)' }}>{form.joinCode}</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--primary-600)', marginTop: '0.5rem' }}>Share this code with your teachers to let them join your school.</p>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          {/* Logo Upload */}
          <div className="form-group" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 'var(--radius-lg)',
                background: logoPreview ? 'transparent' : 'var(--gradient-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                overflow: 'hidden',
                border: '2px dashed var(--border-color)',
                cursor: 'pointer',
              }}
              onClick={() => document.getElementById('logo-upload').click()}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <HiOutlineUpload size={32} color="white" />
              )}
            </div>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              style={{ display: 'none' }}
            />
            <p className="form-help">Click to upload school logo (JPEG, PNG — max 5MB)</p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">School Name *</label>
              <input
                id="school-name"
                type="text"
                className="form-input"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g., Bright Future Academy"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                id="school-email"
                type="email"
                className="form-input"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="school@example.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                id="school-phone"
                type="text"
                className="form-input"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 9876543210"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Academic Year *</label>
              <input
                id="school-academic-year"
                type="text"
                className="form-input"
                name="academicYear"
                value={form.academicYear}
                onChange={handleChange}
                placeholder="e.g., 2024-25"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              id="school-address"
              className="form-textarea"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Full school address"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Academic Year Start</label>
              <input
                id="school-year-start"
                type="date"
                className="form-input"
                name="academicYearStart"
                value={form.academicYearStart}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Academic Year End</label>
              <input
                id="school-year-end"
                type="date"
                className="form-input"
                name="academicYearEnd"
                value={form.academicYearEnd}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button id="school-save" type="submit" className="btn btn-primary" disabled={saving}>
              <HiOutlineSave />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchoolSetup;
