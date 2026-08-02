import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  Bug, Search, Filter, RefreshCw, ExternalLink, MessageSquare, Building2, Check, X
} from 'lucide-react';

const SuperAdminBugReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  // Response modal state
  const [selectedReport, setSelectedReport] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('in_progress');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBugReports();
  }, []);

  const fetchBugReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/bug-reports');
      if (res.data?.success) {
        setReports(res.data.data || []);
      }
    } catch (error) {
      console.error('Fetch super admin bug reports error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch platform bug reports.');
    } finally {
      setLoading(false);
    }
  };

  const openReplyModal = (report) => {
    setSelectedReport(report);
    setReplyText(report.developer_response || '');
    setReplyStatus(report.status || 'in_progress');
  };

  const closeReplyModal = () => {
    setSelectedReport(null);
    setReplyText('');
    setReplyStatus('in_progress');
  };

  const handleSendResponse = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;

    if (!replyText || !replyText.trim()) {
      toast.error('Response text cannot be empty.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.put(
        `/super-admin/bug-reports/${selectedReport.school_id}/${selectedReport.id}/respond`,
        {
          developer_response: replyText.trim(),
          status: replyStatus,
        }
      );

      if (res.data?.success) {
        toast.success('Response sent successfully!');
        setReports((prev) =>
          prev.map((r) =>
            r.id === selectedReport.id && r.school_id === selectedReport.school_id
              ? { ...r, developer_response: replyText.trim(), status: replyStatus }
              : r
          )
        );
        closeReplyModal();
      }
    } catch (error) {
      console.error('Respond to bug report error:', error);
      toast.error(error.response?.data?.message || 'Failed to send response.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'high':
        return <span style={{ background: '#fee2e2', color: '#dc2626', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>High</span>;
      case 'medium':
        return <span style={{ background: '#fef3c7', color: '#d97706', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Medium</span>;
      case 'low':
      default:
        return <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Low</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'fixed':
        return <span style={{ background: '#dcfce7', color: '#166534', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Fixed</span>;
      case 'in_progress':
        return <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>In Progress</span>;
      case 'wont_fix':
        return <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Won't Fix</span>;
      case 'open':
      default:
        return <span style={{ background: '#fee2e2', color: '#991b1b', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Open</span>;
    }
  };

  // Get unique list of school names for filter
  const schoolOptions = Array.from(new Set(reports.map(r => r.school_name).filter(Boolean)));

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      r.reporter_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.school_name?.toLowerCase().includes(search.toLowerCase());

    const matchesSchool = schoolFilter === 'all' || r.school_name === schoolFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || r.severity === severityFilter;

    return matchesSearch && matchesSchool && matchesStatus && matchesSeverity;
  });

  return (
    <div className="page-container" style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bug size={24} style={{ color: 'var(--warning-600, #f59e0b)' }} /> Platform Bug Reports
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>
            Platform owner visibility into bug reports across all school tenants with response capabilities.
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={fetchBugReports}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search reports or school..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* School Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={16} style={{ color: 'var(--text-muted)' }} />
            <select
              className="form-input"
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
            >
              <option value="all">All Schools</option>
              {schoolOptions.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} style={{ color: 'var(--text-muted)' }} />
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="fixed">Fixed</option>
              <option value="wont_fix">Won't Fix</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              className="form-input"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="all">All Severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading platform bug reports...
          </div>
        ) : filteredReports.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No bug reports found matching filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', background: 'var(--bg-muted, #f9fafb)' }}>
                  <th style={{ padding: '0.875rem 1rem', fontSize: '0.85rem' }}>School</th>
                  <th style={{ padding: '0.875rem 1rem', fontSize: '0.85rem' }}>Reporter</th>
                  <th style={{ padding: '0.875rem 1rem', fontSize: '0.85rem' }}>Title & Description</th>
                  <th style={{ padding: '0.875rem 1rem', fontSize: '0.85rem' }}>Page URL</th>
                  <th style={{ padding: '0.875rem 1rem', fontSize: '0.85rem' }}>Severity</th>
                  <th style={{ padding: '0.875rem 1rem', fontSize: '0.85rem' }}>Status</th>
                  <th style={{ padding: '0.875rem 1rem', fontSize: '0.85rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={`${report.school_id}-${report.id}`} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary-700, #3730a3)' }}>
                        {report.school_name || 'Unknown School'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(report.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    <td style={{ padding: '1rem', whiteSpace: 'nowrap', fontWeight: 500, fontSize: '0.85rem' }}>
                      {report.reporter_name}
                    </td>

                    <td style={{ padding: '1rem', maxWidth: '320px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                        {report.title}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'pre-wrap', maxHeight: '80px', overflowY: 'auto' }}>
                        {report.description}
                      </div>
                      {report.developer_response && (
                        <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', fontSize: '0.8rem', color: '#166534' }}>
                          <strong>Response Sent:</strong> {report.developer_response}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '1rem', fontSize: '0.8rem', maxWidth: '180px', wordBreak: 'break-all' }}>
                      {report.page_url ? (
                        <a
                          href={report.page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--primary-600, #4f46e5)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          Link <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>

                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                      {getSeverityBadge(report.severity)}
                    </td>

                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                      {getStatusBadge(report.status)}
                    </td>

                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                        onClick={() => openReplyModal(report)}
                      >
                        <MessageSquare size={14} /> {report.developer_response ? 'Edit Reply' : 'Reply'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {selectedReport && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: '600px', width: '90%', padding: '1.5rem', background: '#fff', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={18} style={{ color: 'var(--warning-600)' }} /> Respond to Bug Report
              </h3>
              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={closeReplyModal}>
                <X size={16} />
              </button>
            </div>

            <div style={{ marginBottom: '1rem', background: 'var(--bg-muted, #f9fafb)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--primary-700)' }}>{selectedReport.school_name} — {selectedReport.reporter_name}</div>
              <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>{selectedReport.title}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>{selectedReport.description}</div>
            </div>

            <form onSubmit={handleSendResponse}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Developer Response / Resolution Note *</label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Enter resolution notes, workaround, or fix status update for the principal..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Update Report Status</label>
                <select
                  className="form-input"
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value)}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="fixed">Fixed</option>
                  <option value="wont_fix">Won't Fix</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeReplyModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Send Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminBugReports;
