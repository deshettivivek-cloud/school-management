import React, { useState } from 'react';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import api from '../../api/axios';

const AddEventModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'event',
    start_date: '',
    end_date: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/dashboard/calendar/events', formData);
      setFormData({ title: '', type: 'event', start_date: '', end_date: '', description: '' });
      onSuccess();
    } catch (err) {
      console.error('Failed to create event:', err);
      setError(err.response?.data?.message || 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="modal-content" style={{
        background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px',
        width: '100%', maxWidth: '500px', boxShadow: 'var(--shadow-xl)',
        position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <X size={20} color="var(--text-muted)" />
        </button>

        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
          <CalendarIcon size={20} className="text-primary-600" />
          Add Custom Event
        </h3>

        {error && (
          <div style={{ padding: '0.75rem', background: 'var(--danger-50)', color: 'var(--danger-600)', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 500 }}>Event Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
              required
              placeholder="E.g., Summer Break"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: (formData.type === 'exam' || formData.type === 'holiday') ? '1fr 1fr 1fr' : '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 500 }}>Event Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="form-input"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                required
              >
                <option value="event">General Event</option>
                <option value="holiday">Holiday</option>
                <option value="exam">Exam</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 500 }}>
                {(formData.type === 'exam' || formData.type === 'holiday') ? 'From Date *' : 'Date *'}
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="form-input"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                required
              />
            </div>

            {(formData.type === 'exam' || formData.type === 'holiday') && (
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 500 }}>To Date *</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="form-input"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                  required
                />
              </div>
            )}
          </div>

          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 500 }}>Description (Optional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', minHeight: '80px', resize: 'vertical' }}
              placeholder="Add any extra details..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEventModal;
