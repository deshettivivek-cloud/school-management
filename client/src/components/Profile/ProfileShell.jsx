import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl } from '../../utils/helpers';

const ProfileShell = ({ header, tabs }) => {
  const { user } = useAuth();
  
  // Filter tabs based on roles
  const visibleTabs = tabs.filter(tab => !tab.allowedRoles || tab.allowedRoles.includes(user?.role));
  
  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.id);

  if (!visibleTabs.length) {
    return <div className="empty-state">No accessible data.</div>;
  }

  const activeContent = visibleTabs.find(t => t.id === activeTab)?.component;

  return (
    <div className="profile-shell" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Header Section */}
      <div className="card" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          border: '2px solid var(--border-color)'
        }}>
          {header.photoUrl ? (
            <img src={getImageUrl(header.photoUrl)} alt={header.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '2rem', color: 'var(--text-muted)' }}>{header.title?.charAt(0)}</span>
          )}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{header.title}</h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{header.subtitle}</p>
          {header.badges && header.badges.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              {header.badges.map((badge, i) => (
                <span key={i} className={`badge badge-${badge.color || 'primary'}`}>{badge.label}</span>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {header.actions}
        </div>
      </div>

      {/* Tabs Section */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ 
          display: 'flex', 
          overflowX: 'auto', 
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-card)'
        }}>
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '1rem 1.5rem',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--primary-600)' : '2px solid transparent',
                  color: isActive ? 'var(--primary-600)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                {Icon && <Icon size={18} />}
                {tab.label}
              </button>
            );
          })}
        </div>
        
        {/* Tab Content */}
        <div style={{ padding: '1.5rem', background: 'var(--bg-default)', minHeight: '300px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeContent}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ProfileShell;
