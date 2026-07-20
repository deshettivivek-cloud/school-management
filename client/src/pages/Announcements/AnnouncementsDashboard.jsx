import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { motion } from 'framer-motion';
import { Megaphone, Plus, Calendar, User, Clock } from 'lucide-react';
import AnnouncementModal from '../../components/Announcements/AnnouncementModal';
import '../../styles/dashboard.css';

const AnnouncementsDashboard = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await api.get('/blogs');
      setAnnouncements(response.data.data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="dashboard-container" style={{ padding: '2rem' }}>
      <div className="dashboard-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="dashboard-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.75rem', fontWeight: 'bold' }}>
            <Megaphone size={28} className="text-primary-600" />
            Announcements
          </h1>
          <p className="dashboard-subtitle" style={{ color: 'var(--text-muted)' }}>Create and manage school-wide announcements</p>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={18} /> Create Announcement
        </button>
      </div>

      <div className="dashboard-grid">
        {loading && announcements.length === 0 ? (
          <div className="col-span-12" style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              style={{ width: 40, height: 40, border: '3px solid var(--primary-100)', borderTopColor: 'var(--primary-600)', borderRadius: '50%' }}
            />
          </div>
        ) : announcements.length === 0 ? (
          <div className="col-span-12">
            <div className="empty-state" style={{ background: 'var(--bg-card)', padding: '4rem', borderRadius: '12px', textAlign: 'center' }}>
              <Megaphone size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>No announcements yet</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Click the button above to create your first school announcement.</p>
              <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>Create Announcement</button>
            </div>
          </div>
        ) : (
          <div className="col-span-12" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {announcements.map((ann, index) => (
              <motion.div 
                key={ann.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                style={{ 
                  background: 'var(--bg-card)', 
                  borderRadius: '12px', 
                  padding: '1.5rem',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>
                    {ann.title}
                  </h3>
                  {!ann.is_published && (
                    <span style={{ background: 'var(--warning-100)', color: 'var(--warning-700)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      Draft
                    </span>
                  )}
                </div>
                
                <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {ann.content}
                </p>

                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={14} />
                    {formatDate(ann.created_at)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <User size={14} />
                    {ann.author_name || 'Admin'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnnouncementModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          fetchAnnouncements();
        }} 
      />
    </div>
  );
};

export default AnnouncementsDashboard;
