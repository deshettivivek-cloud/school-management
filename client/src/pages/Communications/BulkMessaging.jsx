import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { 
  MessageSquare, Send, History, Users, CheckCircle2, 
  AlertCircle, Loader2, MessageCircle, Smartphone, Info 
} from 'lucide-react';

const BulkMessaging = () => {
  const navigate = useNavigate();

  // Form states
  const [targetFilter, setTargetFilter] = useState('All Students');
  const [channel, setChannel] = useState('whatsapp');
  const [messageText, setMessageText] = useState('');
  
  // Data & UI states
  const [availableGrades, setAvailableGrades] = useState([]);
  const [sending, setSending] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);

  // Fetch available student grades for the target dropdown
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const res = await api.get('/students?active=true');
        const students = res.data?.data || [];
        const uniqueGrades = [...new Set(students.map(s => s.grade).filter(Boolean))].sort((a, b) => {
          const gradeOrder = { 'LKG': -2, 'UKG': -1 };
          const valA = gradeOrder[a] !== undefined ? gradeOrder[a] : parseInt(a) || 0;
          const valB = gradeOrder[b] !== undefined ? gradeOrder[b] : parseInt(b) || 0;
          return valA - valB;
        });

        if (uniqueGrades.length > 0) {
          setAvailableGrades(uniqueGrades);
        } else {
          setAvailableGrades(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
        }
      } catch (err) {
        console.error('Failed to fetch grades for target selection:', err);
        setAvailableGrades(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
      }
    };
    fetchGrades();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();

    if (!messageText.trim()) {
      toast.error('Please enter a message text before sending.');
      return;
    }

    if (channel === 'sms') {
      toast.error('SMS channel is not yet configured.');
      return;
    }

    try {
      setSending(true);
      setResultSummary(null);

      const payload = {
        targetFilter,
        channel,
        messageText: messageText.trim()
      };

      const response = await api.post('/communications/send', payload);
      
      if (response.data?.success) {
        const data = response.data.data;
        setResultSummary({
          success: true,
          message: response.data.message,
          recipientCount: data.recipientCount,
          successCount: data.successCount,
          failCount: data.failCount,
          status: data.status,
          targetFilter: data.targetFilter,
          channel: data.channel
        });
        toast.success(response.data.message || 'Bulk message processed!');
        setMessageText(''); // Clear input after successful send
      } else {
        toast.error(response.data?.message || 'Failed to send bulk message');
      }
    } catch (error) {
      console.error('Bulk send error:', error);
      const msg = error.response?.data?.message || 'An error occurred while sending the message.';
      toast.error(msg);
      setResultSummary({
        success: false,
        message: msg
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            <MessageSquare size={28} style={{ color: 'var(--primary-600)' }} />
            Bulk Messaging
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Broadcast instant updates and notifications to parents via WhatsApp or SMS.
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface)', padding: '0.25rem', borderRadius: '10px', boxShadow: 'var(--shadow-sm)' }}>
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
            <Send size={16} /> Send Message
          </button>
          <Link
            to="/communications/history"
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
            <History size={16} /> Message History
          </Link>
        </div>
      </div>

      {/* Result Summary Banner */}
      {resultSummary && (
        <div 
          style={{ 
            marginBottom: '1.5rem',
            padding: '1.25rem',
            borderRadius: '12px',
            background: resultSummary.success ? 'var(--emerald-50, #ecfdf5)' : 'var(--rose-50, #fff1f2)',
            border: `1px solid ${resultSummary.success ? '#10b981' : '#f43f5e'}`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem'
          }}
        >
          {resultSummary.success ? (
            <CheckCircle2 size={24} style={{ color: '#059669', flexShrink: 0, marginTop: '2px' }} />
          ) : (
            <AlertCircle size={24} style={{ color: '#e11d48', flexShrink: 0, marginTop: '2px' }} />
          )}

          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: resultSummary.success ? '#065f46' : '#9f1239' }}>
              {resultSummary.success ? 'Message Processing Completed' : 'Sending Failed'}
            </h3>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.9rem', color: resultSummary.success ? '#047857' : '#be123c' }}>
              {resultSummary.message}
            </p>

            {resultSummary.success && (
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                <span style={{ background: '#d1fae5', color: '#065f46', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 600 }}>
                  Successful: {resultSummary.successCount}
                </span>
                {resultSummary.failCount > 0 && (
                  <span style={{ background: '#fee2e2', color: '#9f1239', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 600 }}>
                    Failed: {resultSummary.failCount}
                  </span>
                )}
                <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 600 }}>
                  Total Recipients: {resultSummary.recipientCount}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Broadcast Form Card */}
      <div 
        className="card" 
        style={{ 
          background: 'var(--surface)', 
          borderRadius: '16px', 
          padding: '2rem',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border-color, #e5e7eb)'
        }}
      >
        <form onSubmit={handleSend}>
          
          {/* Section 1: Channel Selector */}
          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              1. Select Communication Channel
            </label>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              
              {/* WhatsApp Option (Active) */}
              <div
                onClick={() => setChannel('whatsapp')}
                style={{
                  border: `2px solid ${channel === 'whatsapp' ? '#25D366' : 'var(--border-color, #e5e7eb)'}`,
                  background: channel === 'whatsapp' ? 'rgba(37, 211, 102, 0.05)' : 'var(--bg-default)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <div style={{ background: '#25D366', color: '#fff', padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center' }}>
                  <MessageCircle size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    WhatsApp
                    <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', padding: '0.15rem 0.5rem', borderRadius: '12px', fontWeight: 700 }}>
                      Active
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Direct WhatsApp text messaging to parents
                  </div>
                </div>
              </div>

              {/* SMS Option (Disabled / Stub) */}
              <div
                style={{
                  border: '2px solid var(--border-color, #e5e7eb)',
                  background: 'var(--bg-muted, #f9fafb)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  opacity: 0.65,
                  cursor: 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <div style={{ background: '#9ca3af', color: '#fff', padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center' }}>
                  <Smartphone size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    SMS (GSM)
                    <span style={{ fontSize: '0.75rem', background: '#f3f4f6', color: '#6b7280', padding: '0.15rem 0.5rem', borderRadius: '12px', fontWeight: 600, border: '1px solid #d1d5db' }}>
                      Coming soon
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Provider not configured yet
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: Target Audience Selector */}
          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              2. Target Audience
            </label>
            <div style={{ position: 'relative' }}>
              <select
                className="form-control"
                value={targetFilter}
                onChange={(e) => setTargetFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color, #d1d5db)',
                  fontSize: '0.95rem',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="All Students">All Active Students (Entire School)</option>
                {availableGrades.map((g) => (
                  <option key={g} value={`Grade ${g}`}>
                    Grade {g} Students
                  </option>
                ))}
              </select>
              <Users 
                size={18} 
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
              />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Info size={14} /> Messages will be sent to the registered <code style={{ background: 'var(--bg-muted)', padding: '1px 5px', borderRadius: '4px' }}>parent_phone</code> of matching students.
            </p>
          </div>

          {/* Section 3: Message Textarea */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                3. Message Content
              </label>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {messageText.length} characters
              </span>
            </div>
            <textarea
              className="form-control"
              rows={5}
              placeholder="Type your announcement, emergency notice, or reminder here..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color, #d1d5db)',
                fontSize: '0.95rem',
                resize: 'vertical',
                lineHeight: 1.5,
                background: 'var(--surface)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color, #e5e7eb)', paddingTop: '1.25rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setMessageText('')}
              disabled={sending || !messageText}
              style={{ padding: '0.65rem 1.25rem', borderRadius: '8px' }}
            >
              Clear Text
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={sending || !messageText.trim()}
              style={{
                padding: '0.65rem 1.75rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 600,
                background: channel === 'whatsapp' ? '#25D366' : 'var(--primary-600)',
                borderColor: channel === 'whatsapp' ? '#25D366' : 'var(--primary-600)',
                color: '#fff'
              }}
            >
              {sending ? (
                <>
                  <Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                  Sending Broadcast...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send WhatsApp Message
                </>
              )}
            </button>
          </div>

        </form>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default BulkMessaging;