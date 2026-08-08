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
          <h3 className="widget-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 700 }}>
             {Icon && <Icon size={20} className="text-primary-600" />} {title}
          </h3>
        </div>
        {!loading && !error && (
          <div className="badge badge-neutral" style={{ fontSize: '0.7rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            View All
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
          {data.map((item, index) => {
            const initial = config.renderPrimary(item)?.[0] || 'U';
            const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
            const bgColor = colors[index % colors.length];

            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={item.id || index}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.75rem 0',
                  borderBottom: index < data.length - 1 ? '1px solid var(--border-color)' : 'none',
                  marginBottom: '0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: '36px', height: '36px', borderRadius: '50%', 
                    background: bgColor, color: 'white', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 600, fontSize: '1rem', flexShrink: 0
                  }}>
                    {initial}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {config.renderPrimary(item)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {config.renderSecondary(item)}
                    </span>
                  </div>
                </div>
                {config.renderRight && (
                  <div style={{ flexShrink: 0, marginLeft: '8px' }}>
                    {config.renderRight(item)}
                  </div>
                )}
              </motion.div>
            );
          })}
        </WidgetState>
      </div>
    </div>
  );
};

export default DashboardWidget;
