import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'blue', previousValue, periodLabel = 'Compared to last period', formatValue, className = '', hideDelta = false, loading = false }) => {
  let isNew = false;
  let deltaStr = '';
  let trend = 'neutral';
  
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g,"")) : (Number(value) || 0);
  const numPrev = previousValue !== undefined && previousValue !== null 
    ? (typeof previousValue === 'string' ? parseFloat(previousValue.replace(/[^0-9.-]+/g,"")) : Number(previousValue))
    : null;

  if (!hideDelta) {
    if (numPrev === null || numPrev === 0) {
      if (numValue > 0) {
        isNew = true;
        trend = 'positive';
      } else {
        deltaStr = '0%';
        trend = 'neutral';
      }
    } else {
      const diff = numValue - numPrev;
      const percent = (diff / Math.abs(numPrev)) * 100;
      
      if (percent > 0) {
        trend = 'positive';
        deltaStr = `↑ ${percent.toFixed(1)}%`;
      } else if (percent < 0) {
        trend = 'negative';
        deltaStr = `↓ ${Math.abs(percent).toFixed(1)}%`;
      } else {
        trend = 'neutral';
        deltaStr = '0%';
      }
    }
  }

  const displayValue = formatValue ? formatValue(value) : value;

  return (
    <div className={`card ${className}`} style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{title}</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {loading ? (
              <span style={{ opacity: 0.5, fontSize: '1.25rem' }}>Loading...</span>
            ) : (
              displayValue
            )}
          </span>
        </div>
        {Icon && (
          <div style={{ 
            background: `var(--${color}-50, #EFF6FF)`, 
            color: `var(--${color}-600, #2563EB)`, 
            padding: '0.75rem', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon size={24} strokeWidth={2} />
          </div>
        )}
      </div>
      {!hideDelta && deltaStr && (
        <div style={{ marginTop: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: trend === 'positive' ? 'var(--success-600)' : trend === 'negative' ? 'var(--danger-600)' : 'var(--text-secondary)', fontWeight: 600 }}>
            {trend === 'positive' ? '↗' : trend === 'negative' ? '↘' : '→'} {deltaStr}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>{periodLabel}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
