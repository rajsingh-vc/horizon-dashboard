import React from 'react';

/**
 * Standardized Reusable Chart Card Container
 * Enforces unified border-radius (16px), internal padding, overflow protection,
 * and seamless glassmorphic styling across all dashboards.
 */
export default function ChartCard({
  children,
  className = '',
  style = {},
  isLight = false,
  padding = '20px 22px',
  active = false,
  accentColor = '#00C853',
  onClick
}) {
  const cardBorder = isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)';

  return (
    <div
      onClick={onClick}
      className={`chart-card glass-card glass-card-lift ${className}`}
      style={{
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
        borderRadius: '16px',
        padding,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        minWidth: 0,
        backgroundColor: isLight
          ? (active ? '#FFFFFF' : '#FAFAFA')
          : (active ? 'rgba(255, 255, 255, 0.04)' : 'var(--bg-card, rgba(15, 20, 32, 0.8))'),
        border: active
          ? `1.5px solid ${accentColor}`
          : `1px solid ${cardBorder}`,
        boxShadow: active
          ? `0 10px 30px -4px ${accentColor}35, 0 0 15px -2px ${accentColor}25`
          : undefined,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        ...style
      }}
    >
      <div
        className="chart-content"
        style={{
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
      >
        {children}
      </div>
    </div>
  );
}
