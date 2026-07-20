import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import WidgetState from './WidgetState';

const DashboardWidget = ({ config, widgetData }) => {
  const { id, title, icon: Icon, emptyState, allowedRoles } = config;
  const { user } = useAuth();
  
  // Don't render if the role is not allowed
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return null;
  }

  // Use pre-fetched data from the backend
  const data = widgetData?.data || [];
  const error = widgetData?.error;
  const loading = !widgetData;

  return (
    <div className="widget-card col-span-4" style={{ minHeight: '250px', display: 'flex', flexDirection: 'column' }}>
      <div className="widget-header">
        <div>
          <h3 className="widget-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             {Icon && <Icon size={18} className="text-primary-600" />} {title}
          </h3>
        </div>
        {!loading && !error && (
          <div className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
            {data.length} {data.length === 1 ? 'Item' : 'Items'}
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <WidgetState 
          loading={loading} 
          error={error} 
          empty={!loading && !error && data.length === 0}
          emptyStateConfig={emptyState}
        >
          {data.map((item, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={item.id || index}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '0.75rem',
                background: 'var(--bg-tertiary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                marginBottom: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {config.renderPrimary(item)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {config.renderSecondary(item)}
                </span>
              </div>
              {config.renderRight && (
                <div style={{ flexShrink: 0, marginLeft: '8px' }}>
                  {config.renderRight(item)}
                </div>
              )}
            </motion.div>
          ))}
        </WidgetState>
      </div>
    </div>
  );
};

export default DashboardWidget;
