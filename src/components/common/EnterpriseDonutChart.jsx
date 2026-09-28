import React, { useState, useMemo } from 'react';
import { formatNumber, formatPercentage } from '../../utils/analyticsFormatters';

/**
 * EnterpriseDonutChart Component
 * Renders centered, high-fidelity Donut or Pie charts with:
 * - Dynamic data normalization (accepts data or items, with value/count, label/name)
 * - True visual centering (cx = size / 2, cy = size / 2)
 * - Interactive slice hover effects & floating tooltip
 * - Donut center badge displaying total count & label (or hovered slice breakdown)
 * - Clear slice labeling for Pie charts
 * - Safe handling of zero values (omitted from SVG arc, retained in data & legend)
 */
export default function EnterpriseDonutChart({
  data = [],
  items = [],
  chartType = 'Donut',
  variant,
  total,
  centerLabel = 'Assets',
  centerValue,
  isLight = false,
  height = 210,
  size = 180,
  strokeWidth = 26
}) {
  const [hoveredSlice, setHoveredSlice] = useState(null);

  // Normalize chart type ('Donut' or 'Pie')
  const resolvedType = (variant || chartType || 'Donut').toLowerCase();
  const isPie = resolvedType === 'pie';
  const isDonut = !isPie;

  // Source list: support either `data` or `items`
  const sourceList = Array.isArray(data) && data.length > 0 ? data : (Array.isArray(items) ? items : []);

  // Compute total value
  const computedTotal = useMemo(() => {
    if (typeof centerValue === 'number' && centerValue > 0) return centerValue;
    if (typeof total === 'number' && total > 0) return total;
    const sum = sourceList.reduce((acc, it) => acc + Number(it.value ?? it.count ?? 0), 0);
    return sum > 0 ? sum : 0;
  }, [centerValue, total, sourceList]);

  // Normalize items with guaranteed name, value, percentage, and color
  const normalizedItems = useMemo(() => {
    return sourceList.map((it) => {
      const name = it.label ?? it.name ?? 'Unknown';
      const val = Number(it.value ?? it.count ?? 0);
      const pct = computedTotal > 0 ? (val / computedTotal) * 100 : 0;
      const color = it.color || '#10B981';
      return {
        ...it,
        name,
        label: name,
        value: val,
        count: val,
        percentage: pct,
        color
      };
    });
  }, [sourceList, computedTotal]);

  // Active non-zero slices for SVG rendering
  const activeSlices = normalizedItems.filter((it) => it.value > 0);
  const allZero = activeSlices.length === 0;

  if (allZero) {
    return (
      <div
        style={{
          height: `${height}px`,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: isLight ? '#94A3B8' : '#64748B',
          fontSize: '0.8125rem',
          textAlign: 'center'
        }}
      >
        No status data available for the selected filters.
      </div>
    );
  }

  // Sizing & Geometry calculations
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  // Currently active item for center readout
  const activeItem = hoveredSlice
    ? normalizedItems.find((it) => it.name === hoveredSlice)
    : null;

  // SVG pie / donut offset accumulators
  let accumulatedDonutPercent = 0;
  let pieCurrentAngle = 0;

  return (
    <div
      style={{
        position: 'relative',
        height: `${height}px`,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* =================================================================== */}
      {/* 1. DONUT CHART MODE                                                 */}
      {/* =================================================================== */}
      {isDonut && (
        <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={{ transform: 'rotate(-90deg)', overflow: 'visible', display: 'block' }}
          >
            {/* Background Track Ring */}
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="transparent"
              stroke={isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.05)'}
              strokeWidth={strokeWidth}
            />

            {/* Segment Arcs */}
            {activeSlices.map((item, idx) => {
              const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedDonutPercent / 100) * circumference);
              accumulatedDonutPercent += item.percentage;

              const isHovered = hoveredSlice === item.name;

              return (
                <circle
                  key={idx}
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  style={{
                    transition: 'stroke-width 0.2s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={() => setHoveredSlice(item.name)}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
              );
            })}
          </svg>

          {/* Center Callout Badge */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              textAlign: 'center'
            }}
          >
            <span
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: activeItem ? activeItem.color : (isLight ? '#0F172A' : '#FFFFFF'),
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                transition: 'color 0.2s ease'
              }}
            >
              {formatNumber(activeItem ? activeItem.value : computedTotal)}
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: isLight ? '#64748B' : '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginTop: '2px',
                maxWidth: '90px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {activeItem ? activeItem.name : centerLabel}
            </span>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. PIE CHART MODE                                                   */}
      {/* =================================================================== */}
      {isPie && (
        <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={{ overflow: 'visible', display: 'block' }}
          >
            {activeSlices.map((item, idx) => {
              const sliceAngle = (item.percentage / 100) * 360;
              const startAngle = pieCurrentAngle;
              const endAngle = pieCurrentAngle + sliceAngle;
              pieCurrentAngle += sliceAngle;

              const r = size / 2 - 4;
              const x1 = cx + r * Math.cos((Math.PI * (startAngle - 90)) / 180);
              const y1 = cy + r * Math.sin((Math.PI * (startAngle - 90)) / 180);
              const x2 = cx + r * Math.cos((Math.PI * (endAngle - 90)) / 180);
              const y2 = cy + r * Math.sin((Math.PI * (endAngle - 90)) / 180);
              const largeArc = sliceAngle > 180 ? 1 : 0;

              const pathData =
                sliceAngle >= 359.9
                  ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
                  : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

              const isHovered = hoveredSlice === item.name;

              // Center point of the arc for slice percentage label
              const midAngle = startAngle + sliceAngle / 2;
              const labelR = r * 0.65;
              const labelX = cx + labelR * Math.cos((Math.PI * (midAngle - 90)) / 180);
              const labelY = cy + labelR * Math.sin((Math.PI * (midAngle - 90)) / 180);

              return (
                <g key={idx}>
                  <path
                    d={pathData}
                    fill={item.color}
                    stroke={isLight ? '#FFFFFF' : '#0F172A'}
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    style={{
                      cursor: 'pointer',
                      transformOrigin: `${cx}px ${cy}px`,
                      transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                      transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), filter 0.2s ease',
                      filter: isHovered ? 'brightness(1.1)' : 'none'
                    }}
                    onMouseEnter={() => setHoveredSlice(item.name)}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                  {/* Clean slice label if angle > 20 deg */}
                  {sliceAngle > 20 && (
                    <text
                      x={labelX}
                      y={labelY + 3}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="700"
                      pointerEvents="none"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                    >
                      {Math.round(item.percentage)}%
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Floating Hover Tooltip */}
      {hoveredSlice && (
        <div
          style={{
            position: 'absolute',
            top: '0px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '5px 12px',
            borderRadius: '6px',
            backgroundColor: isLight ? '#0F172A' : '#1E293B',
            color: '#FFFFFF',
            fontSize: '0.75rem',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
            zIndex: 20,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            animation: 'fadeInUp 0.12s ease'
          }}
        >
          {activeItem && (
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: activeItem.color
              }}
            />
          )}
          <span>
            {hoveredSlice}: {formatNumber(activeItem?.value || 0)} (
            {formatPercentage(activeItem?.percentage || 0)})
          </span>
        </div>
      )}
    </div>
  );
}
