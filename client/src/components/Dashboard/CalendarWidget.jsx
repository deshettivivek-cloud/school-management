import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WidgetState from './WidgetState';

const CalendarWidget = ({ widgetData }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const data = widgetData?.data || [];
  const error = widgetData?.error;
  const loading = !widgetData;

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const getEventsForDate = (date) => {
    const dateString = new Date(currentDate.getFullYear(), currentDate.getMonth(), date).toISOString().split('T')[0];
    return data.filter(e => e.date === dateString);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="widget-card" style={{ minHeight: '350px', display: 'flex', flexDirection: 'column', width: '100%' }}>
      <div className="widget-header">
        <div>
          <h3 className="widget-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={18} className="text-primary-600" /> Event Calendar
          </h3>
          <p className="widget-subtitle">Exams, Announcements & Holidays</p>
        </div>
        {!loading && !error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-outline" style={{ padding: '4px' }} onClick={handlePrevMonth}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', width: '120px', textAlign: 'center' }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button className="btn btn-outline" style={{ padding: '4px' }} onClick={handleNextMonth}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <WidgetState 
          loading={loading} 
          error={error} 
          empty={false} // Calendar is never "empty", it always shows the grid
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {day}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', flex: 1 }}>
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const events = getEventsForDate(day);
              const isSelected = selectedDate === day;
              
              const hasExams = events.some(e => e.type === 'exam');
              const hasAnnouncements = events.some(e => e.type === 'announcement');
              const hasHolidays = events.some(e => e.type === 'holiday');

              return (
                <div 
                  key={day}
                  onClick={() => events.length > 0 ? setSelectedDate(day) : setSelectedDate(null)}
                  style={{
                    aspectRatio: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    background: isSelected ? 'var(--primary-50)' : (events.length > 0 ? 'var(--bg-tertiary)' : 'transparent'),
                    border: isSelected ? '1px solid var(--primary-400)' : '1px solid transparent',
                    cursor: events.length > 0 ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <span style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: isSelected ? 700 : (events.length > 0 ? 600 : 500),
                    color: isSelected ? 'var(--primary-700)' : (events.length > 0 ? 'var(--text-primary)' : 'var(--text-secondary)')
                  }}>
                    {day}
                  </span>
                  
                  {/* Event Indicators */}
                  {events.length > 0 && (
                    <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                      {hasExams && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warning-500)' }} />}
                      {hasAnnouncements && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--info-500)' }} />}
                      {hasHolidays && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success-500)' }} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning-500)' }} /> Exams</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--info-500)' }} /> Announcements</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success-500)' }} /> Holidays</div>
          </div>

          <AnimatePresence>
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                style={{
                  position: 'absolute',
                  bottom: '2rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-lg)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  width: '90%',
                  zIndex: 10
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    Events on {monthNames[currentDate.getMonth()]} {selectedDate}
                  </h4>
                  <button onClick={() => setSelectedDate(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedDateEvents.map(ev => (
                    <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                      <div style={{ 
                        width: 8, height: 8, borderRadius: '50%', 
                        background: ev.type === 'exam' ? 'var(--warning-500)' : (ev.type === 'announcement' ? 'var(--info-500)' : 'var(--success-500)')
                      }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{ev.title}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </WidgetState>
      </div>
    </div>
  );
};

export default CalendarWidget;
