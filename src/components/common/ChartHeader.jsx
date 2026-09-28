import React from 'react';

/**
 * Standardized Reusable Chart Header Component
 * Enforces [Metric] + [Dimension] Title Casing, short explanatory subtitles,
 * metadata badges, and properly aligned controls across all six modules.
 */
export default function ChartHeader({
  title,
  subtitle,
  badgeText,
  badgeColor,
  rightAction,
  isLight,
  marginBottom = '14px'
}) {
  const textPrimary = isLight === true ? '#0F172A' : 'var(--text-main, #0F172A)';
  const textMuted = isLight === true ? '#475569' : 'var(--text-secondary, #475569)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom,
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <h4
            style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              color: textPrimary,
              margin: 0,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {title}
          </h4>

          {badgeText && (
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '5px',
                backgroundColor: badgeColor
                  ? `${badgeColor}1A`
                  : (isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.08)'),
                color: badgeColor || textMuted,
                border: badgeColor ? `1px solid ${badgeColor}33` : 'none',
                letterSpacing: '0.02em',
                lineHeight: 1.2
              }}
            >
              {badgeText}
            </span>
          )}
        </div>

        {subtitle && (
          <p
            style={{
              fontSize: '0.75rem',
              color: textMuted,
              margin: '2px 0 0 0',
              lineHeight: 1.35,
              fontWeight: 400
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {rightAction && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {rightAction}
        </div>
      )}
    </div>
  );
}
