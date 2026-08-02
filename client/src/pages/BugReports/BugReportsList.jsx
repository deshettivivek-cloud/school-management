import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Bug, Search, Filter, RefreshCw, ExternalLink } from 'lucide-react';

const BugReportsList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  useEffect(() => {
    fetchBugReports();
  }, []);

  const fetchBugReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bug-reports');
      if (res.data?.success) {
        setReports(res.data.data || []);
      }
    } catch (error) {
      console.error('Fetch bug reports error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch bug reports.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reportId, newStatus) => {
    setUpdatingId(reportId);
    try {
      const res = await api.put(`/bug-reports/${reportId}/status`, { status: newStatus });
      if (res.data?.success) {
        toast.success('Status updated successfully!');
        setReports(prev =>
          prev.map(r => (r.id === reportId ? { ...r, status: newStatus } : r))
        );
      }
    } catch (error) {
      console.error('Update status error:', error);
      toast.error(error.response?.data?.message || 'Failed to update bug status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'high':
        return <span className="badge badge-danger" style={{ background: '#fee2e2', color: '#dc2626', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>High</span>;
      case 'medium':
        return <span className="badge badge-warning" style={{ background: '#fef3c7', color: '#d97706', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Medium</span>;
      case 'low':
      default:
        return <span className="badge badge-info" style={{ background: '#e0f2fe', color: '#0284c7', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Low</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'fixed':
        return <span style={{ color: '#16a34a', fontWeight: 600 }}>Fixed</span>;
      case 'in_progress':
        return <span style={{ color: '#2563eb', fontWeight: 600 }}>In Progress</span>;
      case 'wont_fix':
        return <span style={{ color: '#6b7280', fontWeight: 600 }}>Won't Fix</span>;
      case 'open':
      default:
        return <span style={{ color: '#dc2626', fontWeight: 600 }}>Open</span>;
    }
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      (r.reporter_name && r.reporter_name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || r.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  return (
    <div className="page-container" style={{ padding: '2rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bug size={24} style={{ color: 'var(--primary-600, #4f46e5)' }} /> Bug Reports
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>
            Review and manage bug reports submitted by staff members.
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

      {/* Filters Card */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search reports or reporter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

      {/* Table Card */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading bug reports...
          </div>
        ) : filteredReports.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No bug reports found matching your criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', background: 'var(--bg-muted, #f9fafb)' }}>
                  <th style={{ padding: '0.875rem 1rem', fontSize: '0.85rem' }}>Date</th>
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
                  <tr key={report.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem', whiteSpace: 'nowrap', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {new Date(report.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td style={{ padding: '1rem', whiteSpace: 'nowrap', fontWeight: 500, fontSize: '0.875rem' }}>
                      {report.reporter_name}
                    </td>

                    <td style={{ padding: '1rem', maxWidth: '300px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                        {report.title}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'pre-wrap', maxHeight: '80px', overflowY: 'auto' }}>
                        {report.description}
                      </div>
                      {report.developer_response && (
                        <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', fontSize: '0.8rem', color: '#166534' }}>
                          <strong>Developer Reply:</strong> {report.developer_response}
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

                    <td style={{ padding: '1rem', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                      {getStatusBadge(report.status)}
                    </td>

                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                      <select
                        className="form-input"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                        value={report.status}
                        disabled={updatingId === report.id}
                        onChange={(e) => handleStatusChange(report.id, e.target.value)}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="fixed">Fixed</option>
                        <option value="wont_fix">Won't Fix</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BugReportsList;
