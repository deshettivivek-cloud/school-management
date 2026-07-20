import React, { useState } from 'react';
import { X, Megaphone } from 'lucide-react';
import api from '../../api/axios';

const AnnouncementModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isPublished: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/blogs', formData);
      setFormData({ title: '', content: '', isPublished: true });
      onSuccess();
    } catch (err) {
      console.error('Failed to create announcement:', err);
      setError(err.response?.data?.message || 'Failed to create announcement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="modal-content" style={{
        background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px',
        width: '100%', maxWidth: '600px', boxShadow: 'var(--shadow-xl)',
        position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <X size={20} color="var(--text-muted)" />
        </button>

        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
          <Megaphone size={20} className="text-primary-600" />
          Create Announcement
        </h3>

        {error && (
          <div style={{ padding: '0.75rem', background: 'var(--danger-50)', color: 'var(--danger-600)', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 500 }}>Announcement Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
              required
              placeholder="E.g., School Closed on Friday"
            />
          </div>

          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 500 }}>Message Content *</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              className="form-input"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', minHeight: '150px', resize: 'vertical' }}
              required
              placeholder="Type the full announcement message here..."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <input
              type="checkbox"
              id="isPublished"
              name="isPublished"
              checked={formData.isPublished}
              onChange={handleChange}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="isPublished" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
              Publish immediately (visible on dashboard)
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnnouncementModal;
