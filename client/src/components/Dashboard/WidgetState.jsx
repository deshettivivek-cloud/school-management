import React from 'react';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const WidgetState = ({ loading, error, empty, emptyStateConfig, children }) => {
  if (loading) {
    return (
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton-loader" style={{ height: '50px', borderRadius: '8px' }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state" style={{ padding: '2rem 1rem', minHeight: '150px' }}>
        <div className="empty-state-icon" style={{ opacity: 0.8, color: 'var(--danger-500)', background: 'var(--danger-50)' }}>
          <AlertCircle size={28} />
        </div>
        <h4 className="empty-state-title" style={{ color: 'var(--danger-600)', marginTop: '0.5rem' }}>Failed to load data</h4>
        <p className="empty-state-description">{error}</p>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="empty-state" style={{ padding: '2rem 1rem', minHeight: '150px' }}>
        <div className="empty-state-icon" style={{ opacity: 0.5 }}>
          {emptyStateConfig?.icon}
        </div>
        <p className="empty-state-description">{emptyStateConfig?.message || 'No data found.'}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}>
      {children}
    </div>
  );
};

export default WidgetState;
