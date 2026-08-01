import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { 
  History, Send, MessageSquare, MessageCircle, 
  Smartphone, ChevronLeft, ChevronRight, Eye, Calendar, User, RefreshCw 
} from 'lucide-react';

const SmsHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  
  // Selected message for preview modal
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchHistory = async (pageNum = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/communications/history?page=${pageNum}&limit=10`);
      if (res.data?.success) {
        setLogs(res.data.data || []);
        setPagination(res.data.pagination || { page: pageNum, limit: 10, total: 0, totalPages: 1 });
      } else {
        toast.error('Failed to load message history');
      }
    } catch (error) {
      console.error('Fetch history error:', error);
      toast.error('Error fetching message history log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(page);
  }, [page]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'sent':
        return (
          <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, display: 'inline-block' }}>
            Sent
          </span>
        );
      case 'partial':
        return (
          <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, display: 'inline-block' }}>
            Partial
          </span>
        );
      case 'failed':
        return (
          <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, display: 'inline-block' }}>
            Failed
          </span>
        );
      default:
        return (
          <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, display: 'inline-block' }}>
            {status || 'Unknown'}
          </span>
        );
    }
  };

  const getChannelBadge = (channel) => {
    const isWhatsapp = (channel || '').toLowerCase() === 'whatsapp';
    return (
      <span 
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.35rem',
          background: isWhatsapp ? '#25D366' : '#6b7280',
          color: '#fff',
          padding: '0.2rem 0.55rem',
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase'
        }}
      >
        {isWhatsapp ? <MessageCircle size={13} /> : <Smartphone size={13} />}
        {isWhatsapp ? 'WhatsApp' : 'SMS'}
      </span>
    );
  };

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            <History size={28} style={{ color: 'var(--primary-600)' }} />
            Message History
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Audit log of all sent WhatsApp and SMS bulk messages.
          </p>
        </div>

        {/* Tab Navigation & Refresh */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => fetchHistory(page)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
            title="Refresh logs"
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
          </button>

          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface)', padding: '0.25rem', borderRadius: '10px', boxShadow: 'var(--shadow-sm)' }}>
            <Link
              to="/communications"
              className="btn"
              style={{
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                fontSize: '0.875rem',
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                textDecoration: 'none'
              }}
            >
              <Send size={16} /> Send Message
            </Link>
            <button
              className="btn"
              style={{
                background: 'var(--primary-600)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.875rem',
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <History size={16} /> Message History
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div 
        className="card" 
        style={{ 
          background: 'var(--surface)', 
          borderRadius: '16px', 
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border-color, #e5e7eb)',
          overflow: 'hidden'
        }}
      >
        {loading ? (
          <div style={{ padding: '4rem', textCenter: 'center', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem auto' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading communication logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <MessageSquare size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>No Message History</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>No bulk messages have been sent yet.</p>
            <Link to="/communications" className="btn btn-primary">
              <Send size={16} style={{ marginRight: '0.5rem' }} /> Send Your First Broadcast
            </Link>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-muted, #f9fafb)', borderBottom: '1px solid var(--border-color, #e5e7eb)' }}>
                    <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Date & Time</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Channel</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Target</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Message Preview</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Recipients</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Sent By</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr 
                      key={log.id} 
                      style={{ borderBottom: '1px solid var(--border-color, #f3f4f6)', transition: 'background 0.15s' }}
                    >
                      <td style={{ padding: '1rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                          {formatDate(log.created_at)}
                        </div>
                      </td>

                      <td style={{ padding: '1rem' }}>
                        {getChannelBadge(log.channel)}
                      </td>

                      <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {log.target_filter || 'All Students'}
                      </td>

                      <td style={{ padding: '1rem', color: 'var(--text-secondary)', maxWidth: '280px' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {log.message_text}
                        </div>
                      </td>

                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {log.recipient_count}
                      </td>

                      <td style={{ padding: '1rem' }}>
                        {getStatusBadge(log.status)}
                      </td>

                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <User size={14} />
                          {log.sender_name || 'System User'}
                        </div>
                      </td>

                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setSelectedLog(log)}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            {pagination.totalPages > 1 && (
              <div 
                style={{ 
                  display: 'flex', 
                  justify: 'space-between', 
                  alignItems: 'center', 
                  padding: '1rem 1.5rem', 
                  borderTop: '1px solid var(--border-color, #e5e7eb)',
                  background: 'var(--surface)'
                }}
              >
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total logs)
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-secondary"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <button
                    className="btn btn-secondary"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* View Message Modal */}
      {selectedLog && (
        <div 
          className="modal-overlay" 
          onClick={() => setSelectedLog(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              borderRadius: '16px',
              maxWidth: '550px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-lg, 0 10px 25px -5px rgba(0, 0, 0, 0.1))',
              border: '1px solid var(--border-color, #e5e7eb)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Broadcast Details</h3>
              {getChannelBadge(selectedLog.channel)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', fontSize: '0.875rem', background: 'var(--bg-muted, #f9fafb)', padding: '1rem', borderRadius: '10px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Date & Time</span>
                <strong style={{ color: 'var(--text-primary)' }}>{formatDate(selectedLog.created_at)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Target Audience</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedLog.target_filter}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Recipients Count</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedLog.recipient_count} parents</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Status</span>
                <div style={{ marginTop: '2px' }}>{getStatusBadge(selectedLog.status)}</div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Full Message Text:
              </label>
              <div 
                style={{ 
                  background: 'var(--surface)', 
                  border: '1px solid var(--border-color, #d1d5db)', 
                  borderRadius: '10px', 
                  padding: '1rem', 
                  fontSize: '0.925rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: 'var(--text-primary)',
                  maxHeight: '220px',
                  overflowY: 'auto'
                }}
              >
                {selectedLog.message_text}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-primary"
                onClick={() => setSelectedLog(null)}
                style={{ padding: '0.5.rem 1.25rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SmsHistory;