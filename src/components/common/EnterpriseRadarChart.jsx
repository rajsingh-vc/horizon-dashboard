import React, { useState, useMemo } from 'react';
import { formatCategoryLabel, formatPercentage, formatNumber } from '../../utils/analyticsFormatters';

/**
 * EnterpriseRadarChart Component
 * Renders an authentic polygon/spider radar chart strictly matching reference design.
 * Features:
 * - Clear perimeter category labels paired with exact data value labels
 * - Interactive click & hover support to inspect individual categories
 * - Concentric scaling grid (25%, 50%, 75%, 100%)
 * - Symmetric visual centering
 * - Semi-transparent brand fill area with crisp polygon stroke
 * - Interactive vertex points with hover/selection animations
 * - Dynamic metric formatting (percentage for health, count for tickets)
 * - Bottom series legend (e.g. "■ Health" or "■ Tickets")
 */
export default function EnterpriseRadarChart({
  data = [],
  metricKey = 'score',
  labelKey = 'name',
  metricType = 'percentage', // 'percentage' | 'count'
  accentColor = '#8B5CF6',
  seriesLabel = 'Health',
  isLight = false,
  height = 210,
  maxValue = 100
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);

  // Auto-detect metricType if seriesLabel is 'Tickets' or metricKey is 'count'
  const resolvedMetricType = metricType || (seriesLabel === 'Tickets' || metricKey === 'count' ? 'count' : 'percentage');

  // Format metric value helper
  const formatMetricValue = (v) => {
    if (resolvedMetricType === 'count') {
      return formatNumber(v);
    }
    return formatPercentage(v);
  };

  // Normalize data
  const normalizedData = useMemo(() => {
    return (data || []).map((d) => {
      const val = Number(d[metricKey] ?? d.value ?? d.score ?? d.count ?? 0);
      const label = d[labelKey] ?? d.category ?? d.name ?? '';
      return {
        ...d,
        rawLabel: label,
        label: formatCategoryLabel(label),
        val: Math.max(0, val),
        operational: d.operational ?? d.completed ?? null,
        total: d.total ?? null
      };
    });
  }, [data, metricKey, labelKey]);

  // Compute maximum scale
  const resolvedMax = useMemo(() => {
    if (typeof maxValue === 'number' && maxValue > 0) return maxValue;
    const maxVal = Math.max(...normalizedData.map((d) => d.val), 0);
    if (resolvedMetricType === 'percentage') return 100;
    return maxVal > 0 ? maxVal * 1.15 : 10;
  }, [maxValue, normalizedData, resolvedMetricType]);

  // Check if all data values are zero or empty
  const allZero = normalizedData.length === 0 || normalizedData.every((d) => d.val === 0);

  // Layout dimensions
  const svgWidth = 380;
  const svgHeight = 220;
  const cx = svgWidth / 2;
  const cy = 105; // Visual center with space for top/bottom labels and legend
  const maxRadius = 66; // Radar grid radius
  const labelRadius = maxRadius + 22; // Radius for category + value text

  const count = normalizedData.length;
  // Step angle in radians (starting from top = -PI/2)
  const angleStep = count > 0 ? (2 * Math.PI) / count : 0;
  const startAngle = -Math.PI / 2;

  // Concentric grid levels (25, 50, 75, 100)
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  // Helper to calculate coordinate for given angle and radius
  const getCoord = (angle, radius) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle)
  });

  // Calculate polygon points for each grid level
  const gridPolygons = useMemo(() => {
    if (count < 3) return [];
    return gridLevels.map((lvl) => {
      const r = maxRadius * lvl;
      const pts = [];
      for (let i = 0; i < count; i++) {
        const angle = startAngle + i * angleStep;
        const pt = getCoord(angle, r);
        pts.push(`${pt.x},${pt.y}`);
      }
      return { level: lvl, pointsStr: pts.join(' ') };
    });
  }, [count, maxRadius]);

  // Calculate data polygon vertices
  const { dataPolygonPoints, dataPoints } = useMemo(() => {
    if (count === 0) return { dataPolygonPoints: '', dataPoints: [] };
    const pts = [];
    const pointsList = [];

    normalizedData.forEach((d, i) => {
      const angle = startAngle + i * angleStep;
      // Ratio clamped between 0 and 1
      const ratio = resolvedMax > 0 ? Math.min(Math.max(d.val / resolvedMax, 0), 1) : 0;
      const r = maxRadius * ratio;
      const coord = getCoord(angle, r);
      pts.push(`${coord.x},${coord.y}`);

      // Label coordinate (further out from perimeter)
      const labelCoord = getCoord(angle, labelRadius);

      // Determine text anchor based on angle
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      let textAnchor = 'middle';
      if (cos > 0.25) textAnchor = 'start';
      else if (cos < -0.25) textAnchor = 'end';

      // Small vertical shift based on top/bottom
      let dy = '0.35em';
      if (sin < -0.7) dy = '-0.3em'; // Near top
      else if (sin > 0.7) dy = '0.9em'; // Near bottom

      pointsList.push({
        ...d,
        x: coord.x,
        y: coord.y,
        labelX: labelCoord.x,
        labelY: labelCoord.y,
        textAnchor,
        dy,
        angle,
        ratio
      });
    });

    return { dataPolygonPoints: pts.join(' '), dataPoints: pointsList };
  }, [normalizedData, count, maxRadius, labelRadius, resolvedMax]);

  const gridStroke = isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.12)';
  const axisTickColor = isLight ? '#94A3B8' : '#64748B';
  const labelTextColor = isLight ? '#475569' : '#CBD5E1';

  if (allZero && normalizedData.length === 0) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: isLight ? '#94A3B8' : '#64748B',
          fontSize: '0.8125rem'
        }}
      >
        No data available for the selected filters.
      </div>
    );
  }

  // Active highlighted point (either clicked or hovered)
  const activePoint = hoveredPoint || selectedPoint;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: `${height}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={() => setSelectedPoint(null)}
    >
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: 'visible', maxWidth: '400px' }}
      >
        {/* Concentric Grid Polygons (25%, 50%, 75%, 100%) */}
        {gridPolygons.map((g, idx) => (
          <polygon
            key={idx}
            points={g.pointsStr}
            fill="none"
            stroke={gridStroke}
            strokeWidth="1"
            strokeDasharray={g.level === 1.0 ? 'none' : '2 2'}
          />
        ))}

        {/* Concentric Numeric Scale Ticks on Vertical Axis */}
        {gridLevels.map((lvl, idx) => {
          const tickVal = Math.round(lvl * resolvedMax);
          const tickY = cy - maxRadius * lvl;
          return (
            <text
              key={idx}
              x={cx + 3}
              y={tickY + 3}
              fontSize="9"
              fontFamily="'Plus Jakarta Sans', 'Inter', sans-serif"
              fill={axisTickColor}
              textAnchor="start"
            >
              {resolvedMetricType === 'percentage' ? `${tickVal}%` : tickVal}
            </text>
          );
        })}

        {/* Radial Axis Lines from Center to Each Vertex */}
        {dataPoints.map((p, idx) => {
          const rimPt = getCoord(p.angle, maxRadius);
          return (
            <line
              key={idx}
              x1={cx}
              y1={cy}
              x2={rimPt.x}
              y2={rimPt.y}
              stroke={gridStroke}
              strokeWidth="1"
            />
          );
        })}

        {/* Filled Data Polygon Area */}
        {dataPolygonPoints && (
          <polygon
            points={dataPolygonPoints}
            fill={`${accentColor}33`} // ~20% opacity fill
            stroke={accentColor}
            strokeWidth="2"
            strokeLinejoin="round"
            style={{ transition: 'all 0.3s ease' }}
          />
        )}

        {/* Perimeter Category Labels WITH Prominent Value Labels */}
        {dataPoints.map((p, idx) => {
          const isActive = activePoint?.rawLabel === p.rawLabel;
          return (
            <g
              key={idx}
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPoint((prev) => (prev?.rawLabel === p.rawLabel ? null : p));
              }}
              onMouseEnter={() => setHoveredPoint(p)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <text
                x={p.labelX}
                y={p.labelY}
                dy={p.dy}
                textAnchor={p.textAnchor}
                fontSize="8.5"
                fontWeight={isActive ? 700 : 500}
                fill={isActive ? (isLight ? '#0F172A' : '#FFFFFF') : labelTextColor}
                style={{
                  transition: 'fill 0.15s ease, font-weight 0.15s ease',
                  userSelect: 'none'
                }}
              >
                <tspan>{p.label}</tspan>
                <tspan
                  dx="4"
                  fontWeight="800"
                  fill={isActive ? accentColor : (isLight ? '#6D28D9' : '#A78BFA')}
                >
                  {formatMetricValue(p.val)}
                </tspan>
              </text>
            </g>
          );
        })}

        {/* Interactive Vertex Data Points */}
        {dataPoints.map((p, idx) => {
          const isActive = activePoint?.rawLabel === p.rawLabel;
          return (
            <g
              key={idx}
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPoint((prev) => (prev?.rawLabel === p.rawLabel ? null : p));
              }}
              onMouseEnter={() => setHoveredPoint(p)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={isActive ? 6 : 3.5}
                fill={isLight ? '#FFFFFF' : '#1E293B'}
                stroke={accentColor}
                strokeWidth={isActive ? 3 : 2}
                style={{ transition: 'all 0.15s ease' }}
              />
            </g>
          );
        })}
      </svg>

      {/* Floating Active/Hover Data Callout Tooltip */}
      {activePoint && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '5px 12px',
            borderRadius: '6px',
            backgroundColor: isLight ? '#0F172A' : '#1E293B',
            color: '#FFFFFF',
            fontSize: '0.75rem',
            fontWeight: 700,
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)',
            zIndex: 20,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            border: `1px solid ${accentColor}66`,
            animation: 'fadeInUp 0.12s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: accentColor }} />
          <span>{activePoint.label}: </span>
          <span style={{ color: accentColor }}>
            {formatMetricValue(activePoint.val)}
          </span>
          {activePoint.total !== null && activePoint.operational !== null && (
            <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: '#94A3B8' }}>
              ({formatNumber(activePoint.operational)}/{formatNumber(activePoint.total)} operational)
            </span>
          )}
        </div>
      )}

      {/* Bottom Series Legend: "■ SeriesLabel" */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          marginTop: '6px',
          fontSize: '0.75rem',
          color: accentColor,
          fontWeight: 600,
          userSelect: 'none'
        }}
      >
        <span
          style={{
            width: '10px',
            height: '10px',
            backgroundColor: accentColor,
            borderRadius: '2px',
            display: 'inline-block'
          }}
        />
        <span>{seriesLabel}</span>
      </div>
    </div>
  );
}
