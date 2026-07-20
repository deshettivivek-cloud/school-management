import React from 'react';

const Timeline = ({ events }) => {
  if (!events || events.length === 0) {
    return <div className="empty-state">No timeline events found.</div>;
  }

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ position: 'relative', paddingLeft: '2rem' }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: '7px',
          width: '2px', background: 'var(--border-color)', zIndex: 0
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {events.map((event, i) => {
            const Icon = event.icon;
            const color = event.color || 'blue';
            
            // Map colors to CSS vars
            const bgVar = color === 'blue' ? 'var(--primary-100)' : 
                          color === 'green' ? 'var(--success-100)' : 
                          color === 'red' ? 'var(--danger-100)' : 
                          color === 'amber' ? 'var(--warning-100)' : 'var(--bg-tertiary)';
            const textVar = color === 'blue' ? 'var(--primary-600)' : 
                            color === 'green' ? 'var(--success-600)' : 
                            color === 'red' ? 'var(--danger-600)' : 
                            color === 'amber' ? 'var(--warning-600)' : 'var(--text-secondary)';

            return (
              <div key={i} style={{ position: 'relative', zIndex: 1 }}>
                {/* Timeline dot/icon */}
                <div style={{
                  position: 'absolute', left: '-2rem',
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: bgVar, border: `2px solid ${textVar}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transform: 'translateX(-50%)', marginTop: '4px'
                }}>
                  {Icon && <Icon size={10} color={textVar} />}
                </div>

                {/* Content */}
                <div style={{ 
                  background: 'var(--bg-card)', 
                  padding: '1rem', 
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{event.title}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>
                  {event.description && (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Timeline;
