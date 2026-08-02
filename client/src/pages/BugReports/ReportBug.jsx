import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Bug, Send, AlertTriangle } from 'lucide-react';

const ReportBug = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium',
    page_url: window.location.href,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || formData.title.trim().length < 5) {
      toast.error('Title must be at least 5 characters long.');
      return;
    }

    if (!formData.description || formData.description.trim().length < 10) {
      toast.error('Description must be at least 10 characters long.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/bug-reports', {
        title: formData.title.trim(),
        description: formData.description.trim(),
        severity: formData.severity,
        page_url: formData.page_url ? formData.page_url.trim() : null,
      });

      if (response.data?.success) {
        toast.success('Bug report submitted successfully! Thank you for your feedback.');
        setFormData({
          title: '',
          description: '',
          severity: 'medium',
          page_url: window.location.href,
        });
      }
    } catch (error) {
      console.error('Bug report submission error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit bug report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ArrowLeft size={18} /> Back
          </button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bug size={24} style={{ color: 'var(--danger-500, #ef4444)' }} /> Report a Bug
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>
              Help us improve ClassOrbit by submitting issues or unexpected application behaviors.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card">
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} style={{ color: 'var(--warning-500, #f59e0b)' }} /> Bug Details
            </h3>
          </div>

          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Title */}
            <div className="form-group">
              <label className="form-label">
                Bug Summary / Title *
              </label>
              <input
                type="text"
                name="title"
                className="form-input"
                placeholder="e.g. Cannot save student attendance on mobile browser"
                value={formData.title}
                onChange={handleChange}
                minLength={5}
                maxLength={200}
                required
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                Provide a short, descriptive title (5 to 200 characters).
              </small>
            </div>

            {/* Severity & Page URL row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Severity Level *</label>
                <select
                  name="severity"
                  className="form-input"
                  value={formData.severity}
                  onChange={handleChange}
                  required
                >
                  <option value="low">Low - Minor cosmetic or non-blocking issue</option>
                  <option value="medium">Medium - Functional glitch with workaround</option>
                  <option value="high">High - Critical feature broken / system blocker</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Affected Page URL (Optional)</label>
                <input
                  type="text"
                  name="page_url"
                  className="form-input"
                  placeholder="https://app.classorbit.in/..."
                  value={formData.page_url}
                  onChange={handleChange}
                  maxLength={500}
                />
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">
                Detailed Description *
              </label>
              <textarea
                name="description"
                className="form-input"
                rows={6}
                placeholder="Please describe what happened, steps to reproduce, expected result, and any error message displayed..."
                value={formData.description}
                onChange={handleChange}
                minLength={10}
                maxLength={2000}
                required
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                Provide as much detail as possible (10 to 2000 characters).
              </small>
            </div>
          </div>

          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {loading ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Send size={18} /> Submit Bug Report
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ReportBug;
