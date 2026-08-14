import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

const ImportCalendarModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [academicYear, setAcademicYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !academicYear) {
      setError('Please provide an academic year and select a CSV/Excel file.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('academic_year', academicYear);

    try {
      await api.post('/dashboard/calendar/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onSuccess();
    } catch (err) {
      console.error('Import error:', err);
      setError(err.response?.data?.message || 'Failed to import calendar. Please check the file format.');
    } finally {
      setLoading(false);
    }
  };
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="modal-content" style={{
        background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px',
        width: '95%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: 'var(--shadow-xl)', position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <X size={20} color="var(--text-muted)" />
        </button>

        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
          <UploadCloud size={20} className="text-primary-600" />
          Import Academic Calendar
        </h3>

        <form onSubmit={handleSubmit}>
              <div className="alert alert-warning" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', background: 'var(--warning-50)', color: 'var(--warning-700)', borderRadius: 'var(--radius-md)', border: '1px solid var(--warning-200)' }}>
                <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.875rem' }}>
                  <strong>Warning:</strong> Importing a new calendar will overwrite all existing calendar events for the school.
                </div>
              </div>

              {error && (
                <div className="alert alert-error" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--danger-50)', color: 'var(--danger-700)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger-200)', fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">New Academic Year</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 2025-2026"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Upload Calendar (CSV or Excel)</label>
                <div className="file-upload-zone" style={{ border: '2px dashed var(--border-color)', padding: '2rem', borderRadius: 'var(--radius-lg)', textAlign: 'center', background: 'var(--bg-tertiary)', cursor: 'pointer', position: 'relative' }}>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    required
                  />
                  <UploadCloud size={32} color="var(--primary-500)" style={{ margin: '0 auto 1rem' }} />
                  {file ? (
                    <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-primary)' }}>{file.name}</p>
                  ) : (
                    <>
                      <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-primary)' }}>Click to upload or drag and drop</p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Must be a CSV or Excel file</p>
                    </>
                  )}
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Required Columns: <strong>Title</strong>, <strong>StartDate</strong> (YYYY-MM-DD), <strong>Type</strong> (event or holiday). Optional: <strong>Description</strong>, <strong>EndDate</strong>.
                </div>
              </div>

              <div className="modal-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" onClick={onClose} className="btn btn-ghost" disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Importing...' : 'Import Calendar'}
                </button>
              </div>
            </form>
      </div>
    </div>
  );
};

export default ImportCalendarModal;
