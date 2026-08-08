import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'blue', previousValue, periodLabel = 'Compared to last period', formatValue, className = '', hideDelta = false }) => {
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
    <div className={`kpi-card ${className}`}>
      <div className="kpi-header">
        <div className="kpi-value-container">
          <span className="kpi-label">{title}</span>
          <span className="kpi-value" style={{ 
            color: 'var(--text-primary)' 
          }}>
            {displayValue}
          </span>
        </div>
        {Icon && (
          <div className={`kpi-icon ${color}`}>
            <Icon size={24} strokeWidth={2} />
          </div>
        )}
      </div>
      {!hideDelta && deltaStr && (
        <div className={`kpi-trend ${trend}`} style={{ padding: 0, background: 'transparent' }}>
          {trend === 'positive' ? '↗' : trend === 'negative' ? '↘' : '→'} {deltaStr} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{periodLabel}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
