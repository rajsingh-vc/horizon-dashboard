import { ArrowUpRight, ArrowDownRight, Minus, ChevronRight } from 'lucide-react';
import AnimatedNumber from '../common/AnimatedNumber';
import { formatCategoryLabel, formatNumber } from '../../utils/analyticsFormatters';

export default function KpiCard({
  title,
  value,
  unit = '',
  decimals = 0,
  trend,
  trendType = 'neutral',
  trendText,
  submetrics = [],
  sparkline = [],
  accentColor = '#00C853',
  icon: Icon,
  triggerKey = 0,
  isActive = false,
  onClick
}) {
  // Sparkline path generator with smooth gradient area and endpoint dot
  const renderSparkline = () => {
    if (!sparkline || sparkline.length < 2) return null;
    const min = Math.min(...sparkline);
    const max = Math.max(...sparkline);
    const range = max - min || 1;
    const width = 88;
    const height = 24;

    const coords = sparkline.map((val, idx) => {
      const x = (idx / (sparkline.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return { x, y, val };
    });

    const points = coords.map(c => `${c.x},${c.y}`).join(' ');
    const lastCoord = coords[coords.length - 1];
    const areaPoints = `0,${height} ${points} ${width},${height}`;
    const gradId = `spark-grad-${accentColor.replace('#', '')}`;

    return (
      <svg 
        width={width} 
        height={height} 
        style={{ overflow: 'visible' }}
        title={`Telemetry points: ${sparkline.map(v => typeof v === 'number' ? v.toFixed(decimals > 0 ? 1 : 0) : v).join(' → ')}`}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.32" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polygon
          fill={`url(#${gradId})`}
          points={areaPoints}
        />
        <polyline
          fill="none"
          stroke={accentColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        <circle
          cx={lastCoord.x}
          cy={lastCoord.y}
          r="3"
          fill={accentColor}
          stroke="var(--bg-card, #0B0F19)"
          strokeWidth="1.5"
        />
      </svg>
    );
  };

  const renderTrendIcon = () => {
    if (trendType === 'up') return <ArrowUpRight size={13} color="#00C853" strokeWidth={2.5} />;
    if (trendType === 'down') return <ArrowDownRight size={13} color={title.toLowerCase().includes('resolution') ? '#00C853' : '#F87171'} strokeWidth={2.5} />;
    return <Minus size={13} color="var(--text-muted)" strokeWidth={2.5} />;
  };

  const getTrendColor = () => {
    if (trendType === 'up') return '#00C853';
    if (trendType === 'down') return title.toLowerCase().includes('resolution') ? '#00C853' : '#F87171';
    return 'var(--text-muted)';
  };

  return (
    <div
      onClick={onClick}
      className={`glass-card glass-card-lift ${isActive ? 'kpi-card-active' : ''}`}
      style={{
        padding: '16px 16px 14px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        borderRadius: '16px',
        border: isActive ? `1.5px solid ${accentColor}` : '1px solid var(--glass-border)',
        boxShadow: isActive ? `0 10px 30px -4px ${accentColor}35, 0 0 15px -2px ${accentColor}25` : undefined,
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Top radiant gradient accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: isActive ? '4px' : '3px',
          background: `linear-gradient(90deg, ${accentColor} 0%, rgba(255,255,255,0) 100%)`
        }}
      />

      {/* Header: Title + Icon + Chevron */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            {Icon && (
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '7px',
                  backgroundColor: `${accentColor}1A`,
                  border: `1px solid ${accentColor}33`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: accentColor,
                  flexShrink: 0
                }}
              >
                <Icon size={13} strokeWidth={2.4} />
              </div>
            )}
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.01em',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              title={formatCategoryLabel(title)}
            >
              {formatCategoryLabel(title)}
            </span>
          </div>

          <ChevronRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        </div>

        {/* Value Display */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '6px 0 6px 0' }}>
          <span
            style={{
              fontSize: '1.625rem',
              fontWeight: 900,
              color: 'var(--text-main)',
              letterSpacing: '-0.03em',
              lineHeight: 1.1
            }}
          >
            <AnimatedNumber
              value={value}
              decimals={decimals}
              triggerKey={triggerKey}
            />
          </span>
          {unit && (
            <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-muted)' }}>
              {unit}
            </span>
          )}
        </div>

        {/* Trend Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
          {renderTrendIcon()}
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: getTrendColor(),
              whiteSpace: 'nowrap'
            }}
          >
            {trendText}
          </span>
        </div>
      </div>

      {/* Footer: Sparkline & Submetrics */}
      <div>
        {sparkline && sparkline.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px', height: '22px' }}>
            {renderSparkline()}
          </div>
        )}

        <div
          style={{
            borderTop: '1px solid var(--glass-border)',
            paddingTop: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
          }}
        >
          {submetrics.map((sub, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.6875rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor:
                      sub.color === 'success' ? '#00C853' :
                      sub.color === 'warning' ? '#FF5B22' :
                      sub.color === 'danger' ? '#F87171' :
                      sub.color === 'primary' ? '#00C853' : 'var(--text-muted)'
                  }}
                />
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{sub.label}</span>
              </div>
              <span style={{ fontWeight: 700, color: 'var(--text-main)', fontVariantNumeric: 'tabular-nums' }}>
                {typeof sub.value === 'number' ? formatNumber(sub.value) : sub.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
