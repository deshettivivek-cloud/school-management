import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import CalendarWidget from '../components/Dashboard/CalendarWidget';
import AddEventModal from '../components/Dashboard/AddEventModal';
import ImportCalendarModal from '../components/Dashboard/ImportCalendarModal';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Plus, UploadCloud } from 'lucide-react';
import '../styles/dashboard.css';

const CalendarView = () => {
  const [calendarEvents, setCalendarEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/widgets');
      setCalendarEvents(response.data.data.calendarEvents);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="dashboard-container" style={{ padding: '2rem' }}>
      <div className="dashboard-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="dashboard-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.75rem', fontWeight: 'bold' }}>
            <CalendarIcon size={28} className="text-primary-600" />
            Event Calendar
          </h1>
          <p className="dashboard-subtitle" style={{ color: 'var(--text-muted)' }}>View all upcoming exams, announcements, and holidays</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => setIsImportModalOpen(true)}
          >
            <UploadCloud size={18} /> Import Calendar
          </button>
          <button 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={18} /> Add Event
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        {loading && !calendarEvents ? (
          <div className="col-span-12" style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              style={{ width: 40, height: 40, border: '3px solid var(--primary-100)', borderTopColor: 'var(--primary-600)', borderRadius: '50%' }}
            />
          </div>
        ) : (
          <div className="col-span-12" style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '900px' }}>
              <CalendarWidget widgetData={calendarEvents} />
            </div>
          </div>
        )}
      </div>

      <AddEventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          fetchEvents();
        }} 
      />

      <ImportCalendarModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setIsImportModalOpen(false);
          fetchEvents();
        }}
      />
    </div>
  );
};

export default CalendarView;
