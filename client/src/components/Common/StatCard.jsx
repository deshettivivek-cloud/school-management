import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'blue', previousValue, periodLabel = 'Compared to last period', formatValue, className = 'col-span-3', hideDelta = false }) => {
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
    <div className={`widget-card ${className} stat-card`}>
      <div className="stat-card-header">
        <span className="stat-card-label">{title}</span>
        {Icon && (
          <div className={`stat-card-icon ${color}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="stat-card-value" style={{ 
        color: color === 'green' ? 'var(--success-600)' : color === 'red' ? 'var(--danger-600)' : 'var(--text-primary)' 
      }}>
        {displayValue}
      </div>
      
    </div>
  );
};

export default StatCard;
