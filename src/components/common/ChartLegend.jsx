import React from 'react';

/**
 * Standardized Centered Chart Legend Component
 * Supports circle nodes, rounded bars, line-with-nodes, and polygon swatches.
 */
export default function ChartLegend({
  items = [],
  isLight = false,
  style = {},
  marginTop = '12px'
}) {
  if (!items || items.length === 0) return null;

  const textMuted = isLight ? '#475569' : '#CBD5E1';

  return (
    <div
      className="chart-legend"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        marginTop,
        paddingTop: '10px',
        borderTop: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.06)',
        width: '100%',
        boxSizing: 'border-box',
        ...style
      }}
    >
      {items.map((item, idx) => (
        <div
          key={item.label || idx}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            fontSize: '0.75rem',
            color: textMuted
          }}
        >
          {item.variant === 'line' ? (
            <svg width="24" height="12" viewBox="0 0 24 12" style={{ flexShrink: 0 }}>
              <line x1="0" y1="6" x2="24" y2="6" stroke={item.color} strokeWidth="2.5" />
              <circle cx="12" cy="6" r="3.5" fill="#FFFFFF" stroke={item.color} strokeWidth="2" />
            </svg>
          ) : (
            <span
              style={{
                width: item.variant === 'circle' ? '9px' : '11px',
                height: item.variant === 'circle' ? '9px' : '11px',
                borderRadius: item.variant === 'circle' ? '50%' : '3px',
                backgroundColor: item.color,
                flexShrink: 0
              }}
            />
          )}
          <span style={{ fontWeight: 600, color: item.textColor || textMuted }}>
            {item.label}
          </span>
          {item.value !== undefined && (
            <span style={{ fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', marginLeft: '2px' }}>
              {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
