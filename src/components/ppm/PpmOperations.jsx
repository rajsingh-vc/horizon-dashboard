import { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, CheckCircle2, AlertCircle, Clock, Check, ChevronDown, Sparkles } from 'lucide-react';
import AnimatedNumber from '../common/AnimatedNumber';
import ChartDropdown from '../common/ChartDropdown';
import ChartHeader from '../common/ChartHeader';
import ChartLegend from '../common/ChartLegend';
import { useTopNFilter } from '../common/EnterpriseBarChart';
import { formatCategoryLabel, formatPercentage, formatNumber } from '../../utils/analyticsFormatters';

const COMPLIANCE_CHART_TYPES = [
  'Donut',
  'Pie',
  'Radial Gauge',
  'Vertical Bar',
  'Horizontal Bar'
];

const PLANNED_CHART_TYPES = [
  'Vertical Bar',
  'Horizontal Bar',
  'Line',
  'Area',
  'Pie',
  'Donut',
  'Radar'
];

export default function PpmOperations({ ppmData, triggerKey = 0, theme = 'dark', selectedCategory = 'All Categories' }) {
  // Service selection: 'ppm' or 'softServices'
  const [activeService, setActiveService] = useState('ppm'); // 'ppm' | 'softServices'

  // PPM Card Chart Type State
  const [ppmChartType, setPpmChartType] = useState('Donut');
  const [isPpmDropdownOpen, setIsPpmDropdownOpen] = useState(false);
  const ppmDropdownRef = useRef(null);

  // Soft Services Card Chart Type State
  const [softChartType, setSoftChartType] = useState('Donut');
  const [isSoftDropdownOpen, setIsSoftDropdownOpen] = useState(false);
  const softDropdownRef = useRef(null);

  // Planned vs Achieved Chart Type State
  const [userSelectedPlannedChart, setUserSelectedPlannedChart] = useState(null);
  const [isPlannedDropdownOpen, setIsPlannedDropdownOpen] = useState(false);
  const plannedRef = useRef(null);

  const [hoveredBar, setHoveredBar] = useState(null);

  const isLight = theme === 'light';

  const cardBorder = isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)';
  const gridLineColor = isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)';
  const textMuted = isLight ? '#64748B' : '#94A3B8';
  const textPrimary = isLight ? '#0F172A' : '#FFFFFF';

  // Extract PPM & Soft Services Data
  const {
    scheduledTasks = 16,
    compliancePercentage = 43.8,
    stats = { completed: 7, pending: 0, overdue: 9 },
    plannedVsAchieved = [],
    categoryCompliance = [],
    softServices = {}
  } = ppmData || {};

  // Resolved PPM Data
  const ppmStats = useMemo(() => ({
    completed: stats.completed ?? 7,
    pending: stats.pending ?? 0,
    overdue: stats.overdue ?? 9,
    compliancePercentage: compliancePercentage ?? 43.8
  }), [stats, compliancePercentage]);

  const ppmPlannedVsAchievedData = useMemo(() => {
    if (plannedVsAchieved && plannedVsAchieved.length > 0) return plannedVsAchieved;
    return [
      { category: 'MONTHLY CHECKLIST - DG', planned: 1, achieved: 1 },
      { category: 'MONTHLY CHECKLIST - TRANSFORMER', planned: 1, achieved: 0 },
      { category: 'MONTHLY CHECKLIST - DG AMF PANEL', planned: 1, achieved: 0 },
      { category: 'MONTHLY CHECKLIST - PUMPS', planned: 6, achieved: 6 },
      { category: 'MONTHLY CHECKLIST - PANEL', planned: 7, achieved: 0 }
    ];
  }, [plannedVsAchieved]);

  const ppmCategoryComplianceData = useMemo(() => {
    if (categoryCompliance && categoryCompliance.length > 0) return categoryCompliance;
    return [
      { name: 'MONTHLY CHECKLIST - DG', completed: 1, total: 1, percentage: 100.0 },
      { name: 'MONTHLY CHECKLIST - TRANSFORMER', completed: 0, total: 1, percentage: 0.0 },
      { name: 'MONTHLY CHECKLIST - DG AMF PANEL', completed: 0, total: 1, percentage: 0.0 },
      { name: 'MONTHLY CHECKLIST - PUMPS', completed: 6, total: 6, percentage: 100.0 },
      { name: 'MONTHLY CHECKLIST - PANEL', completed: 0, total: 7, percentage: 0.0 }
    ];
  }, [categoryCompliance]);

  // Resolved Soft Services Data
  const softStats = useMemo(() => ({
    completed: softServices.completed ?? 6,
    pending: softServices.pending ?? 12,
    overdue: softServices.overdue ?? 42,
    compliancePercentage: softServices.compliancePercentage ?? 10.0,
    total: softServices.total ?? 60
  }), [softServices]);

  const softPlannedVsAchievedData = useMemo(() => {
    if (softServices.plannedVsAchieved && softServices.plannedVsAchieved.length > 0) {
      return softServices.plannedVsAchieved;
    }
    return [
      { category: 'DAILY CHECKLIST - HOUSEKEEPING', planned: 24, achieved: 4 },
      { category: 'WEEKLY CHECKLIST - WASTE MANAGEMENT', planned: 12, achieved: 1 },
      { category: 'MONTHLY CHECKLIST - PEST CONTROL', planned: 8, achieved: 1 },
      { category: 'BI-WEEKLY CHECKLIST - LANDSCAPING', planned: 10, achieved: 0 },
      { category: 'MONTHLY CHECKLIST - FACADE CLEANING', planned: 6, achieved: 0 }
    ];
  }, [softServices]);

  const softCategoryComplianceData = useMemo(() => {
    if (softServices.categoryCompliance && softServices.categoryCompliance.length > 0) {
      return softServices.categoryCompliance;
    }
    return [
      { name: 'DAILY CHECKLIST - HOUSEKEEPING', completed: 4, total: 24, percentage: 16.7 },
      { name: 'WEEKLY CHECKLIST - WASTE MANAGEMENT', completed: 1, total: 12, percentage: 8.3 },
      { name: 'MONTHLY CHECKLIST - PEST CONTROL', completed: 1, total: 8, percentage: 12.5 },
      { name: 'BI-WEEKLY CHECKLIST - LANDSCAPING', completed: 0, total: 10, percentage: 0.0 },
      { name: 'MONTHLY CHECKLIST - FACADE CLEANING', completed: 0, total: 6, percentage: 0.0 }
    ];
  }, [softServices]);

  // Active Category Data depending on which card is selected
  const activePlannedData = activeService === 'ppm' ? ppmPlannedVsAchievedData : softPlannedVsAchievedData;
  const activeComplianceData = activeService === 'ppm' ? ppmCategoryComplianceData : softCategoryComplianceData;

  const {
    topN: plannedTopN,
    setTopN: setPlannedTopN,
    hasMoreThan5: hasMoreThan5Planned,
    displayData: displayPlannedData,
    topNOptions: plannedTopNOptions
  } = useTopNFilter(activePlannedData, 'Top 5');

  const plannedChartType = userSelectedPlannedChart || (displayPlannedData.length > 5 ? 'Horizontal Bar' : 'Vertical Bar');

  const maxPlanned = useMemo(() => {
    return Math.max(...activePlannedData.map(p => Math.max(p.planned, p.achieved)), 1);
  }, [activePlannedData]);

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (ppmDropdownRef.current && !ppmDropdownRef.current.contains(event.target)) {
        setIsPpmDropdownOpen(false);
      }
      if (softDropdownRef.current && !softDropdownRef.current.contains(event.target)) {
        setIsSoftDropdownOpen(false);
      }
      if (plannedRef.current && !plannedRef.current.contains(event.target)) {
        setIsPlannedDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Catmull-Rom Bezier helper for smooth lines/areas with optional baseline clamping
  const getCatmullRomBezierPath = (points, minY, maxY) => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i !== points.length - 2 ? points[i + 2] : p2;

      let cp1x = p1.x + (p2.x - p0.x) / 6;
      let cp1y = p1.y + (p2.y - p0.y) / 6;
      let cp2x = p2.x - (p3.x - p1.x) / 6;
      let cp2y = p2.y - (p3.y - p1.y) / 6;

      // Prevent curve from bowing below baseline (maxY) or overshooting ceiling (minY)
      if (maxY !== undefined) {
        if (Math.abs(p1.y - maxY) < 0.5 && Math.abs(p2.y - maxY) < 0.5) {
          cp1y = maxY;
          cp2y = maxY;
        } else {
          cp1y = Math.min(maxY, cp1y);
          cp2y = Math.min(maxY, cp2y);
        }
      }
      if (minY !== undefined) {
        cp1y = Math.max(minY, cp1y);
        cp2y = Math.max(minY, cp2y);
      }

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  };

  /**
   * Reusable Left Card Donut / Chart Renderer
   * Renders the Donut gauge or other selected charts for PPM or Soft Services
   */
  const renderServiceChart = (chartType, pct, completed, pending, overdue, total) => {
    // 1. DONUT GAUGE (Exact match to screenshot)
    if (chartType === 'Donut') {
      const size = 150;
      const strokeWidth = 15;
      const radius = 55;
      const circumference = 2 * Math.PI * radius;
      const strokeDashoffset = circumference - (Math.min(100, Math.max(0, pct)) / 100) * circumference;

      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '4px 0 12px 0' }}>
          <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {/* Background Track Circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.06)'}
                strokeWidth={strokeWidth}
              />
              {/* Foreground Compliance Arc */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={pct >= 30 ? '#00E676' : (pct > 0 ? '#00C853' : '#CBD5E1')}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: `${size / 2}px ${size / 2}px`,
                  transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />
            </svg>

            {/* Inner Percentage & Label */}
            <div
              style={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                pointerEvents: 'none'
              }}
            >
              <span
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  color: pct <= 15 ? '#EF4444' : (isLight ? '#0F172A' : '#FFFFFF'),
                  letterSpacing: '-0.02em',
                  lineHeight: 1
                }}
              >
                {pct}%
              </span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  color: textMuted,
                  fontWeight: 600,
                  marginTop: '4px',
                  letterSpacing: '0.02em'
                }}
              >
                Compliance
              </span>
            </div>
          </div>
        </div>
      );
    }

    // 2. RADIAL GAUGE
    if (chartType === 'Radial Gauge') {
      const size = 150;
      const stroke = 16;
      const r = (size - stroke) / 2;
      const circ = 2 * Math.PI * r;
      const offset = circ - (pct / 100) * circ;

      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', margin: '6px 0 12px 0' }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="#00E676"
              strokeWidth={stroke}
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: textPrimary, lineHeight: 1 }}>
              {pct}%
            </span>
            <span style={{ fontSize: '0.6875rem', color: textMuted, fontWeight: 600, marginTop: '3px' }}>
              Compliance
            </span>
          </div>
        </div>
      );
    }

    // 3. PIE
    if (chartType === 'Pie') {
      const size = 140;
      const cx = size / 2;
      const cy = size / 2;
      const r = 54;
      const segs = [
        { label: 'Completed', count: completed, color: '#00E676' },
        { label: 'Pending', count: pending, color: isLight ? '#94A3B8' : '#475569' },
        { label: 'Overdue', count: overdue, color: '#EF4444' }
      ].filter(s => s.count > 0);

      const totalVal = (completed + pending + overdue) || 1;
      let accumAngle = -Math.PI / 2;

      const slices = segs.map((seg) => {
        const sweepAngle = (seg.count / totalVal) * 2 * Math.PI;
        const start = accumAngle;
        const end = accumAngle + sweepAngle;
        accumAngle = end;

        const x1 = cx + r * Math.cos(start);
        const y1 = cy + r * Math.sin(start);
        const x2 = cx + r * Math.cos(end);
        const y2 = cy + r * Math.sin(end);
        const largeArc = sweepAngle > Math.PI ? 1 : 0;
        const pathData = `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;

        return { ...seg, pathData };
      });

      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', margin: '8px 0 14px 0' }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {slices.map((sl, i) => (
              <path key={i} d={sl.pathData} fill={sl.color} stroke={isLight ? '#FFFFFF' : '#111827'} strokeWidth="1.5" />
            ))}
          </svg>
        </div>
      );
    }

    // 4. VERTICAL BAR / COLUMN
    if (chartType === 'Vertical Bar') {
      const maxVal = Math.max(completed, pending, overdue, 1);
      return (
        <div style={{ height: '140px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '24px', padding: '12px 0 10px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#00E676' }}>{completed}</span>
            <div style={{ width: '28px', height: `${Math.max(12, (completed / maxVal) * 80)}px`, backgroundColor: '#00E676', borderRadius: '4px 4px 0 0' }} />
            <span style={{ fontSize: '0.625rem', color: textMuted, fontWeight: 600 }}>Done</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isLight ? '#475569' : '#CBD5E1' }}>{pending}</span>
            <div style={{ width: '28px', height: `${Math.max(12, (pending / maxVal) * 80)}px`, backgroundColor: isLight ? '#94A3B8' : '#475569', borderRadius: '4px 4px 0 0' }} />
            <span style={{ fontSize: '0.625rem', color: textMuted, fontWeight: 600 }}>Wait</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#EF4444' }}>{overdue}</span>
            <div style={{ width: '28px', height: `${Math.max(12, (overdue / maxVal) * 80)}px`, backgroundColor: '#EF4444', borderRadius: '4px 4px 0 0' }} />
            <span style={{ fontSize: '0.625rem', color: textMuted, fontWeight: 600 }}>Overdue</span>
          </div>
        </div>
      );
    }

    // 5. HORIZONTAL BAR (with explicit X-Axis and Y-Axis)
    const items = [
      { label: 'Done', count: completed, color: '#00E676' },
      { label: 'Pending', count: pending, color: isLight ? '#94A3B8' : '#475569' },
      { label: 'Overdue', count: overdue, color: '#EF4444' }
    ];
    const maxVal = Math.max(completed, pending, overdue, 1);
    const boxX = 64;
    const boxY = 10;
    const boxW = 160;
    const plotH = 88;
    const xAxisY = boxY + plotH;
    const xTicks = [0, Math.ceil(maxVal / 2), maxVal];
    const rowH = 26;
    const barH = 12;

    return (
      <div style={{ height: '140px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="270" height="135" viewBox="0 0 270 135" style={{ display: 'block' }}>
          {/* Vertical Grid lines for X-axis ticks */}
          {xTicks.map((val, idx) => {
            const xPos = boxX + (val / maxVal) * boxW;
            const isBaseline = val === 0;
            return (
              <g key={idx}>
                {!isBaseline && (
                  <line
                    x1={xPos}
                    y1={boxY}
                    x2={xPos}
                    y2={xAxisY}
                    stroke={gridLineColor}
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                )}
                {/* X-axis tick label */}
                <text
                  x={xPos}
                  y={xAxisY + 16}
                  textAnchor="middle"
                  fill={textMuted}
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Bottom X-axis baseline */}
          <line x1={boxX} y1={xAxisY} x2={boxX + boxW} y2={xAxisY} stroke={cardBorder} strokeWidth="1.2" />

          {/* Left Y-axis line */}
          <line x1={boxX} y1={boxY} x2={boxX} y2={xAxisY} stroke={cardBorder} strokeWidth="1.2" />

          {/* Horizontal Bars */}
          {items.map((it, idx) => {
            const yMid = boxY + idx * rowH + rowH / 2;
            const barW = (it.count / maxVal) * boxW;
            return (
              <g key={idx}>
                {/* Y-axis Label */}
                <text
                  x={boxX - 8}
                  y={yMid + 3}
                  textAnchor="end"
                  fill={textMuted}
                  fontSize="8.5"
                  fontWeight="600"
                >
                  {it.label}
                </text>
                {/* Bar */}
                <rect
                  x={boxX}
                  y={yMid - barH / 2}
                  width={Math.max(2, barW)}
                  height={barH}
                  fill={it.color}
                  rx="3"
                >
                  <title>{`${it.label}: ${it.count}`}</title>
                </rect>
                {/* Value at end of bar */}
                <text
                  x={boxX + Math.max(2, barW) + 6}
                  y={yMid + 3}
                  textAnchor="start"
                  fill={textPrimary}
                  fontSize="8"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {it.count}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  /**
   * Planned vs Achieved Chart Renderer (Middle Column)
   */
  const renderPlannedChart = () => {
    if (!displayPlannedData || displayPlannedData.length === 0) {
      return (
        <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: textMuted, fontSize: '0.8125rem' }}>
          No planned vs achieved data available
        </div>
      );
    }

    // 1. VERTICAL BAR CHART (Exact visual match to user screenshot)
    if (plannedChartType === 'Vertical Bar') {
      const chartWidth = 520;
      const chartHeight = 220;
      const padLeft = 32;
      const padRight = 16;
      const padTop = 16;
      const padBottom = 46;

      const plotWidth = chartWidth - padLeft - padRight;
      const plotHeight = chartHeight - padTop - padBottom;

      // Calculate dynamic Y-axis scale based on maxPlanned
      let maxScale = 8;
      if (maxPlanned > 16) maxScale = 24;
      else if (maxPlanned > 8) maxScale = 16;

      const yTicks = [maxScale, Math.round(maxScale * 0.75), Math.round(maxScale * 0.5), Math.round(maxScale * 0.25), 0];

      const numCategories = displayPlannedData.length;
      const colWidth = plotWidth / numCategories;
      const barWidth = Math.min(22, Math.max(12, colWidth * 0.28));
      const barGap = 3;

      return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden' }}>
            <svg
              width="100%"
              height="230"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ overflow: 'visible', display: 'block' }}
            >
              {/* Horizontal Gridlines & Y-Axis Numbers */}
              {yTicks.map((tickVal, idx) => {
                const yPos = padTop + (1 - tickVal / maxScale) * plotHeight;
                return (
                  <g key={idx}>
                    <line
                      x1={padLeft}
                      y1={yPos}
                      x2={chartWidth - padRight}
                      y2={yPos}
                      stroke={gridLineColor}
                      strokeWidth="1"
                      strokeDasharray={tickVal === 0 ? 'none' : '4 4'}
                    />
                    <text
                      x={padLeft - 6}
                      y={yPos + 3.5}
                      textAnchor="end"
                      fill={textMuted}
                      fontSize="9"
                      fontWeight="600"
                      fontFamily="monospace"
                    >
                      {tickVal}
                    </text>
                  </g>
                );
              })}

              {/* Double Bars per Category */}
              {displayPlannedData.map((item, idx) => {
                const groupCenterX = padLeft + (idx + 0.5) * colWidth;
                const plannedH = (Math.max(0, item.planned) / maxScale) * plotHeight;
                const achievedH = (Math.max(0, item.achieved) / maxScale) * plotHeight;

                const plannedX = groupCenterX - barWidth - barGap / 2;
                const achievedX = groupCenterX + barGap / 2;

                const baselineY = padTop + plotHeight;
                const isHovered = hoveredBar === idx;

                const shortName = item.category.replace('MONTHLY CHECKLIST - ', '').replace('DAILY CHECKLIST - ', '').replace('WEEKLY CHECKLIST - ', '').replace('BI-WEEKLY CHECKLIST - ', '');

                return (
                  <g
                    key={idx}
                    onMouseEnter={() => setHoveredBar(idx)}
                    onMouseLeave={() => setHoveredBar(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Planned Bar (Soft Slate Blue matching screenshot) */}
                    <rect
                      x={plannedX}
                      y={baselineY - plannedH}
                      width={barWidth}
                      height={plannedH}
                      fill={isLight ? '#9FB3C8' : '#64748B'}
                      rx="3"
                      ry="3"
                      style={{ transition: 'height 0.4s ease' }}
                    >
                      <title>{`${item.category} - Planned: ${item.planned}`}</title>
                    </rect>

                    {/* Achieved Bar (Bright Green matching screenshot) */}
                    <rect
                      x={achievedX}
                      y={baselineY - achievedH}
                      width={barWidth}
                      height={achievedH}
                      fill="#00E676"
                      rx="3"
                      ry="3"
                      style={{ transition: 'height 0.4s ease' }}
                    >
                      <title>{`${item.category} - Achieved: ${item.achieved}`}</title>
                    </rect>

                    {/* Category Label below X-Axis */}
                    <text
                      x={groupCenterX}
                      y={baselineY + 16}
                      textAnchor="middle"
                      fill={isHovered ? textPrimary : textMuted}
                      fontSize="7.5"
                      fontWeight={isHovered ? 800 : 600}
                    >
                      <title>{formatCategoryLabel(item.category)}</title>
                      {formatCategoryLabel(item.category).length > 20 ? `${formatCategoryLabel(item.category).slice(0, 18)}…` : formatCategoryLabel(item.category)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Centered Legend matching user screenshot */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              marginTop: '8px',
              paddingTop: '10px',
              borderTop: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.06)',
              width: '100%'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: isLight ? '#475569' : '#CBD5E1' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: isLight ? '#9FB3C8' : '#64748B' }} />
              <span style={{ fontWeight: 600 }}>Planned</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: isLight ? '#475569' : '#CBD5E1' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#00E676' }} />
              <span style={{ fontWeight: 600 }}>Achieved</span>
            </div>
          </div>
        </div>
      );
    }

    // 2. HORIZONTAL BAR (with explicit X-Axis and Y-Axis)
    if (plannedChartType === 'Horizontal Bar') {
      const labelW = 110;
      const rightPad = 48;
      const topPad = 12;
      const bottomAxisH = 28;
      const rowH = 26;
      const barH = 5;
      const plotH = displayPlannedData.length * rowH;
      const totalSvgH = topPad + plotH + bottomAxisH;
      const totalSvgW = 460;
      const plotW = totalSvgW - labelW - rightPad;
      const xAxisY = topPad + plotH;

      let maxScale = 8;
      if (maxPlanned > 16) maxScale = 24;
      else if (maxPlanned > 8) maxScale = 16;
      else if (maxPlanned > 4) maxScale = 8;
      else maxScale = Math.max(4, maxPlanned);

      const xTicks = [0, Math.round(maxScale * 0.25), Math.round(maxScale * 0.5), Math.round(maxScale * 0.75), maxScale];

      return (
        <div style={{ height: '240px', width: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            <svg
              width="100%"
              height={`${totalSvgH}px`}
              viewBox={`0 0 ${totalSvgW} ${totalSvgH}`}
              style={{ display: 'block', minHeight: `${totalSvgH}px` }}
            >
              {/* Vertical Grid lines for X-axis ticks */}
              {xTicks.map((val, idx) => {
                const xPos = labelW + (val / maxScale) * plotW;
                const isBaseline = val === 0;
                return (
                  <g key={idx}>
                    {!isBaseline && (
                      <line
                        x1={xPos}
                        y1={topPad}
                        x2={xPos}
                        y2={xAxisY}
                        stroke={gridLineColor}
                        strokeWidth="1"
                        strokeDasharray="2,2"
                      />
                    )}
                    <text
                      x={xPos}
                      y={xAxisY + 16}
                      textAnchor="middle"
                      fill={textMuted}
                      fontSize="8"
                      fontFamily="monospace"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Bottom X-axis baseline */}
              <line x1={labelW} y1={xAxisY} x2={labelW + plotW} y2={xAxisY} stroke={cardBorder} strokeWidth="1.2" />

              {/* Left Y-axis line */}
              <line x1={labelW} y1={topPad} x2={labelW} y2={xAxisY} stroke={cardBorder} strokeWidth="1.2" />

              {/* Paired Horizontal Bars */}
              {displayPlannedData.map((item, idx) => {
                const isHovered = hoveredBar === idx;
                const catLabel = formatCategoryLabel(item.category);
                const yMid = topPad + idx * rowH + rowH / 2;
                const plannedW = (item.planned / maxScale) * plotW;
                const achievedW = (item.achieved / maxScale) * plotW;

                return (
                  <g
                    key={idx}
                    onMouseEnter={() => setHoveredBar(idx)}
                    onMouseLeave={() => setHoveredBar(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <title>{`${catLabel}\nPlanned: ${item.planned}\nAchieved: ${item.achieved}`}</title>

                    {/* Y-axis category label */}
                    <text
                      x={labelW - 8}
                      y={yMid + 3}
                      textAnchor="end"
                      fill={isHovered ? textPrimary : textMuted}
                      fontSize="7.5"
                      fontWeight={isHovered ? 700 : 500}
                    >
                      {catLabel.length > 17 ? `${catLabel.slice(0, 15)}…` : catLabel}
                    </text>

                    {/* Planned Bar (top sub-bar) */}
                    <rect
                      x={labelW}
                      y={yMid - barH - 1}
                      width={Math.max(2, plannedW)}
                      height={barH}
                      fill={isLight ? '#9FB3C8' : '#64748B'}
                      rx="2"
                    />

                    {/* Achieved Bar (bottom sub-bar) */}
                    <rect
                      x={labelW}
                      y={yMid + 1}
                      width={Math.max(2, achievedW)}
                      height={barH}
                      fill="#00E676"
                      rx="2"
                    />

                    {/* Values text */}
                    <text
                      x={labelW + Math.max(plannedW, achievedW) + 6}
                      y={yMid + 3}
                      textAnchor="start"
                      fontSize="7.5"
                      fontWeight="700"
                      fontFamily="monospace"
                      fill={textPrimary}
                    >
                      <tspan fill="#00E676">{item.achieved}</tspan>
                      <tspan fill={textMuted}>/</tspan>
                      <tspan fill={isLight ? '#64748B' : '#94A3B8'}>{item.planned}</tspan>
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px',
              paddingTop: '6px',
              borderTop: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '0.6875rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isLight ? '#475569' : '#CBD5E1' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: isLight ? '#9FB3C8' : '#64748B' }} />
              <span>Planned</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isLight ? '#475569' : '#CBD5E1' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#00E676' }} />
              <span>Achieved</span>
            </div>
          </div>
        </div>
      );
    }

    // 3. LINE & AREA CHART (Proper labeling, Y-axis ticks, baseline clamping, and legend)
    if (plannedChartType === 'Line' || plannedChartType === 'Area') {
      const chartWidth = 520;
      const chartHeight = 220;
      const padLeft = 36;
      const padRight = 24;
      const padTop = 18;
      const padBottom = 46;

      const plotWidth = chartWidth - padLeft - padRight;
      const plotHeight = chartHeight - padTop - padBottom;
      const baselineY = padTop + plotHeight;

      let maxScale = 8;
      if (maxPlanned > 16) maxScale = 24;
      else if (maxPlanned > 8) maxScale = 16;

      const yTicks = [maxScale, Math.round(maxScale * 0.75), Math.round(maxScale * 0.5), Math.round(maxScale * 0.25), 0];

      const n = displayPlannedData.length;
      const stepX = plotWidth / Math.max(n - 1, 1);

      const getY = (val) => padTop + (1 - Math.max(0, val) / maxScale) * plotHeight;
      const getX = (idx) => padLeft + idx * stepX;

      const plannedPoints = displayPlannedData.map((d, i) => ({
        x: getX(i),
        y: getY(d.planned),
        value: d.planned,
        label: formatCategoryLabel(d.category)
      }));

      const achievedPoints = displayPlannedData.map((d, i) => ({
        x: getX(i),
        y: getY(d.achieved),
        value: d.achieved,
        label: formatCategoryLabel(d.category)
      }));

      // Generate smooth Catmull-Rom Bezier curves clamped to baseline so they NEVER dip below line
      const plannedLine = getCatmullRomBezierPath(plannedPoints, padTop, baselineY);
      const achievedLine = getCatmullRomBezierPath(achievedPoints, padTop, baselineY);
      const achievedArea = `${achievedLine} L ${achievedPoints[achievedPoints.length - 1].x},${baselineY} L ${achievedPoints[0].x},${baselineY} Z`;

      return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden' }}>
            <svg
              width="100%"
              height="230"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ overflow: 'visible', display: 'block' }}
            >
              <defs>
                <linearGradient id="ppmAchievedAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00E676" stopOpacity={isLight ? 0.35 : 0.42} />
                  <stop offset="100%" stopColor="#00E676" stopOpacity={isLight ? 0.02 : 0.05} />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines & Y-Axis Numbers */}
              {yTicks.map((tickVal, idx) => {
                const yPos = getY(tickVal);
                return (
                  <g key={idx}>
                    <line
                      x1={padLeft - 4}
                      y1={yPos}
                      x2={padLeft}
                      y2={yPos}
                      stroke={textMuted}
                      strokeWidth="1.2"
                    />
                    <line
                      x1={padLeft}
                      y1={yPos}
                      x2={chartWidth - padRight}
                      y2={yPos}
                      stroke={gridLineColor}
                      strokeWidth="1"
                      strokeDasharray={tickVal === 0 ? 'none' : '4 4'}
                    />
                    <text
                      x={padLeft - 7}
                      y={yPos + 3.5}
                      textAnchor="end"
                      fill={textMuted}
                      fontSize="9"
                      fontWeight="600"
                      fontFamily="monospace"
                    >
                      {tickVal}
                    </text>
                  </g>
                );
              })}

              {/* Area Fill when in Area Mode */}
              {plannedChartType === 'Area' && (
                <path d={achievedArea} fill="url(#ppmAchievedAreaGrad)" />
              )}

              {/* Planned Line (Soft Blue #2B72DB) */}
              <path
                d={plannedLine}
                fill="none"
                stroke="#2B72DB"
                strokeWidth={plannedChartType === 'Area' ? '2' : '2.5'}
                strokeDasharray={plannedChartType === 'Area' ? '4 4' : 'none'}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Achieved Line (Vibrant Green #00E676) */}
              <path
                d={achievedLine}
                fill="none"
                stroke="#00E676"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Planned Circle Nodes (White center, blue border) */}
              {plannedPoints.map((pt, idx) => (
                <circle
                  key={`planned-pt-${idx}`}
                  cx={pt.x}
                  cy={pt.y}
                  r="4.5"
                  fill="#FFFFFF"
                  stroke="#2B72DB"
                  strokeWidth="2"
                  style={{ cursor: 'pointer' }}
                >
                  <title>{`${pt.label} - Planned: ${pt.value}`}</title>
                </circle>
              ))}

              {/* Achieved Circle Nodes (White center, green border) */}
              {achievedPoints.map((pt, idx) => (
                <circle
                  key={`achieved-pt-${idx}`}
                  cx={pt.x}
                  cy={pt.y}
                  r="4.5"
                  fill="#FFFFFF"
                  stroke="#00E676"
                  strokeWidth="2.5"
                  style={{ cursor: 'pointer' }}
                >
                  <title>{`${pt.label} - Achieved: ${pt.value}`}</title>
                </circle>
              ))}

              {/* X-Axis Tick Marks & Labels for EVERY category */}
              {displayPlannedData.map((d, i) => {
                const xPos = getX(i);
                const fullLabel = formatCategoryLabel(d.category);
                const shortLabel = fullLabel
                  .replace(/^Monthly Checklist – /i, '')
                  .replace(/^Daily Checklist – /i, '')
                  .replace(/^Weekly Checklist – /i, '')
                  .replace(/^Bi-Weekly Checklist – /i, '')
                  .trim();
                const isHovered = hoveredBar === i;

                return (
                  <g
                    key={`xtick-${i}`}
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <line x1={xPos} y1={baselineY} x2={xPos} y2={baselineY + 4} stroke={textMuted} strokeWidth="1" />
                    <text
                      x={xPos}
                      y={baselineY + 16}
                      textAnchor="middle"
                      fill={isHovered ? textPrimary : textMuted}
                      fontSize="7.5"
                      fontWeight={isHovered ? 800 : 600}
                      style={{ transition: 'fill 0.15s ease' }}
                    >
                      <title>{`${fullLabel}\nPlanned: ${d.planned} | Achieved: ${d.achieved}`}</title>
                      {shortLabel.length > 16 ? `${shortLabel.slice(0, 14)}…` : shortLabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Centered Legend with Line & Hollow Node Glyph */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '28px',
              marginTop: '8px',
              paddingTop: '10px',
              borderTop: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.06)',
              width: '100%'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
              <svg width="28" height="12" viewBox="0 0 28 12">
                <line x1="0" y1="6" x2="28" y2="6" stroke="#2B72DB" strokeWidth="2.5" strokeDasharray={plannedChartType === 'Area' ? '4 4' : 'none'} />
                <circle cx="14" cy="6" r="4" fill="#FFFFFF" stroke="#2B72DB" strokeWidth="2" />
              </svg>
              <span style={{ color: '#2B72DB', fontWeight: 600 }}>Planned</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
              <svg width="28" height="12" viewBox="0 0 28 12">
                <line x1="0" y1="6" x2="28" y2="6" stroke="#00E676" strokeWidth="2.5" />
                <circle cx="14" cy="6" r="4" fill="#FFFFFF" stroke="#00E676" strokeWidth="2.5" />
              </svg>
              <span style={{ color: '#00E676', fontWeight: 600 }}>Achieved</span>
            </div>
          </div>
        </div>
      );
    }

    // 4. PIE (Exact visual match to Screenshot 2)
    if (plannedChartType === 'Pie' || plannedChartType === 'Donut') {
      const isDonut = plannedChartType === 'Donut';
      const chartW = 520;
      const chartH = 240;
      const cx = 250;
      const cy = 120;
      const r = 64;
      const innerR = 36;

      const totalAchieved = activePlannedData.reduce((acc, it) => acc + (it.achieved || 0), 0) || 1;

      // Slice calculations
      let accumAngle = 0;
      const slices = activePlannedData.map((item) => {
        const val = item.achieved || 0;
        const fraction = val / totalAchieved;
        const sweep = fraction * 2 * Math.PI;
        const start = accumAngle;
        const end = accumAngle + sweep;
        accumAngle = end;

        const x1 = cx + r * Math.cos(start);
        const y1 = cy + r * Math.sin(start);
        const x2 = cx + r * Math.cos(end);
        const y2 = cy + r * Math.sin(end);
        const largeArc = sweep > Math.PI ? 1 : 0;

        let pathData = '';
        if (val > 0) {
          if (isDonut) {
            const ix1 = cx + innerR * Math.cos(end);
            const iy1 = cy + innerR * Math.sin(end);
            const ix2 = cx + innerR * Math.cos(start);
            const iy2 = cy + innerR * Math.sin(start);
            pathData = `M ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} L ${ix1},${iy1} A ${innerR},${innerR} 0 ${largeArc},0 ${ix2},${iy2} Z`;
          } else {
            pathData = `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;
          }
        }

        let color = '#22C55E';
        if (item.category.includes('DG AMF')) color = '#84CC16';
        else if (item.category.includes('DG')) color = '#DC2626';
        else if (item.category.includes('PUMP')) color = '#22C55E';
        else if (item.category.includes('TRANS')) color = '#84CC16';
        else if (item.category.includes('PANEL')) color = '#06B6D4';

        return {
          ...item,
          val,
          color,
          pathData,
          start,
          end,
          fraction
        };
      });

      return (
        <div style={{ width: '100%', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="100%" height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} style={{ overflow: 'visible', display: 'block' }}>
            {/* Draw Slices */}
            {slices.filter(s => s.pathData).map((slice, i) => (
              <path
                key={i}
                d={slice.pathData}
                fill={slice.color}
                stroke={isLight ? '#FFFFFF' : '#0B0F19'}
                strokeWidth="1.5"
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
              >
                <title>{`${slice.category}: ${slice.val} Achieved (${(slice.fraction * 100).toFixed(1)}%)`}</title>
              </path>
            ))}

            {/* Leader Lines and Labels matching Screenshot 2 */}
            {/* 1. DG (Red) - Top Right */}
            <g>
              <line x1={cx + r * Math.cos(-Math.PI / 6)} y1={cy + r * Math.sin(-Math.PI / 6)} x2={cx + r + 24} y2={cy - 20} stroke="#DC2626" strokeWidth="1.2" />
              <line x1={cx + r + 24} y1={cy - 20} x2={cx + r + 38} y2={cy - 20} stroke="#DC2626" strokeWidth="1.2" />
              <text x={cx + r + 42} y={cy - 16} fill="#DC2626" fontSize="10.5" fontWeight="600">
                Monthly Checklist – DG
              </text>
            </g>

            {/* 2. TRANSFORMER / DG AMF (Yellow Green) - Top Right Upper */}
            <g>
              <line x1={cx + r * Math.cos(-Math.PI / 3)} y1={cy + r * Math.sin(-Math.PI / 3)} x2={cx + r + 16} y2={cy - 48} stroke="#84CC16" strokeWidth="1.2" />
              <line x1={cx + r + 16} y1={cy - 48} x2={cx + r + 28} y2={cy - 48} stroke="#84CC16" strokeWidth="1.2" />
              <text x={cx + r + 32} y={cy - 44} fill="#84CC16" fontSize="10.5" fontWeight="600">
                Monthly Checklist – DG AMF / Transformer
              </text>
            </g>

            {/* 3. PANEL (Cyan) - Horizontal Right */}
            <g>
              <line x1={cx + r} y1={cy} x2={cx + r + 30} y2={cy} stroke="#06B6D4" strokeWidth="1.2" />
              <text x={cx + r + 34} y={cy + 3.5} fill="#06B6D4" fontSize="10.5" fontWeight="600">
                Monthly Checklist – Panel
              </text>
            </g>

            {/* 4. PUMPS (Green) - Bottom Left */}
            <g>
              <line x1={cx - r * 0.7} y1={cy + r * 0.7} x2={cx - r - 24} y2={cy + 45} stroke="#22C55E" strokeWidth="1.2" />
              <line x1={cx - r - 24} y1={cy + 45} x2={cx - r - 40} y2={cy + 45} stroke="#22C55E" strokeWidth="1.2" />
              <text x={cx - r - 44} y={cy + 49} textAnchor="end" fill="#22C55E" fontSize="10.5" fontWeight="600">
                Monthly Checklist – Pumps
              </text>
            </g>
          </svg>
        </div>
      );
    }

    // 5. RADAR (Exact visual match to Screenshot 3)
    if (plannedChartType === 'Radar') {
      const cx = 250;
      const cy = 95;
      const maxRadius = 65;
      const numSpokes = activePlannedData.length;
      const maxScale = 8;
      const rings = [0.25, 0.5, 0.75, 1.0]; // 2, 4, 6, 8

      const getAngle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / numSpokes;
      const getSpokePoint = (i, r) => {
        const theta = getAngle(i);
        return {
          x: cx + r * Math.cos(theta),
          y: cy + r * Math.sin(theta)
        };
      };

      // Planned polygon points
      const plannedPts = activePlannedData.map((p, i) => {
        const r = (Math.max(0, p.planned) / maxScale) * maxRadius;
        const pt = getSpokePoint(i, Math.max(3, r));
        return `${pt.x},${pt.y}`;
      }).join(' ');

      // Achieved polygon points
      const achievedPts = activePlannedData.map((p, i) => {
        const r = (Math.max(0, p.achieved) / maxScale) * maxRadius;
        const pt = getSpokePoint(i, Math.max(2, r));
        return `${pt.x},${pt.y}`;
      }).join(' ');

      return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <svg width="480" height="205" viewBox="0 0 480 205" style={{ overflow: 'visible', display: 'block' }}>
              {/* Concentric Pentagon Rings */}
              {rings.map((pct, idx) => {
                const ringR = pct * maxRadius;
                const ringPoints = Array.from({ length: numSpokes })
                  .map((_, i) => {
                    const pt = getSpokePoint(i, ringR);
                    return `${pt.x},${pt.y}`;
                  })
                  .join(' ');

                const tickLabel = Math.round(pct * maxScale);

                return (
                  <g key={idx}>
                    <polygon
                      points={ringPoints}
                      fill="none"
                      stroke={isLight ? '#CBD5E1' : '#334155'}
                      strokeWidth="1"
                    />
                    {/* Tick scale numbers along the right spoke */}
                    <text
                      x={cx + ringR * 0.95}
                      y={cy + 3}
                      fill={textMuted}
                      fontSize="7.5"
                      fontWeight="600"
                    >
                      {tickLabel}
                    </text>
                  </g>
                );
              })}

              {/* 5 Radiating Spokes */}
              {activePlannedData.map((_, i) => {
                const endPt = getSpokePoint(i, maxRadius);
                return (
                  <line
                    key={i}
                    x1={cx}
                    y1={cy}
                    x2={endPt.x}
                    y2={endPt.y}
                    stroke={isLight ? '#E2E8F0' : '#334155'}
                    strokeWidth="1"
                  />
                );
              })}

              {/* Planned Area (Blue fill & stroke) */}
              <polygon
                points={plannedPts}
                fill="rgba(59, 130, 246, 0.22)"
                stroke="#2B72DB"
                strokeWidth="2"
              />

              {/* Achieved Line/Polygon (Green stroke) */}
              <polygon
                points={achievedPts}
                fill="rgba(0, 200, 83, 0.12)"
                stroke="#00E676"
                strokeWidth="2.5"
              />

              {/* Category Labels around the radar perimeter matching Screenshot 3 */}
              {activePlannedData.map((item, i) => {
                const labelRadius = maxRadius + 18;
                const labelPt = getSpokePoint(i, labelRadius);
                const angle = getAngle(i);

                let textAnchor = 'middle';
                let dy = 3;
                if (Math.cos(angle) > 0.2) textAnchor = 'start';
                else if (Math.cos(angle) < -0.2) textAnchor = 'end';

                if (Math.sin(angle) < -0.7) dy = -4;
                else if (Math.sin(angle) > 0.7) dy = 10;

                return (
                  <text
                    key={i}
                    x={labelPt.x}
                    y={labelPt.y + dy}
                    textAnchor={textAnchor}
                    fill={textMuted}
                    fontSize="7"
                    fontWeight="600"
                  >
                    <title>{item.category}</title>
                    {item.category}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* Centered Legend matching Screenshot 3 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              marginTop: '4px',
              paddingTop: '8px',
              borderTop: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.06)',
              width: '100%'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: isLight ? '#475569' : '#CBD5E1' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#2B72DB' }} />
              <span style={{ fontWeight: 600 }}>Planned</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: isLight ? '#475569' : '#CBD5E1' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#00E676' }} />
              <span style={{ fontWeight: 600 }}>Achieved</span>
            </div>
          </div>
        </div>
      );
    }



    // Default fallback
    return (
      <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: textMuted }}>
        Chart rendered in {plannedChartType} view
      </div>
    );
  };

  return (
    <section id="ppm-section" style={{ marginBottom: '32px' }} className="animate-fade-in stagger-5">
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: isLight ? 'rgba(0, 200, 83, 0.1)' : 'rgba(0, 200, 83, 0.15)',
              border: isLight ? '1px solid rgba(0, 200, 83, 0.25)' : '1px solid rgba(0, 200, 83, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00E676'
            }}
          >
            <Calendar size={20} strokeWidth={2.2} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em', margin: 0 }}>
              PPM & Soft Services Operations
            </h3>
            <p style={{ fontSize: '0.8125rem', color: textMuted, margin: '2px 0 0 0' }}>
              Planned preventive maintenance & facility audit routines across 21 nationwide parks
            </p>
          </div>
        </div>
      </div>

      {/* 3-Column Layout Matching User Screenshot:
          Col 1: Stacked PPM Compliance + Soft Services Cards
          Col 2: Planned vs Achieved by Category Card
          Col 3: Compliance by Category Card
      */}
      <div
        className="ppm-softservices-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(270px, 310px) minmax(360px, 1.35fr) minmax(280px, 1.1fr)',
          gap: '16px',
          alignItems: 'stretch'
        }}
      >
        {/* COLUMN 1: STACKED OVERVIEW CARDS (PPM + SOFT SERVICES) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Card 1: PPM Compliance */}
          <div
            onClick={() => setActiveService('ppm')}
            className="glass-card glass-card-lift"
            style={{
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderRadius: '14px',
              cursor: 'pointer',
              border: activeService === 'ppm'
                ? '1.5px solid #00C853'
                : `1px solid ${cardBorder}`,
              boxShadow: activeService === 'ppm'
                ? '0 0 16px rgba(0, 200, 83, 0.15)'
                : 'none',
              transition: 'all 0.2s ease',
              backgroundColor: isLight
                ? (activeService === 'ppm' ? '#FFFFFF' : '#FAFAFA')
                : (activeService === 'ppm' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.02)')
            }}
          >
            {/* Header + Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: textPrimary }}>
                  PPM Compliance
                </span>
                {activeService === 'ppm' && (
                  <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', backgroundColor: 'rgba(0, 200, 83, 0.15)', color: '#00C853' }}>
                    Active
                  </span>
                )}
              </div>

              <ChartDropdown
                selectedType={ppmChartType}
                onChange={setPpmChartType}
                types={COMPLIANCE_CHART_TYPES}
                isLight={isLight}
                accentColor="#00C853"
              />
            </div>

            {/* Donut Chart Visual */}
            {renderServiceChart(ppmChartType, ppmStats.compliancePercentage, ppmStats.completed, ppmStats.pending, ppmStats.overdue, scheduledTasks)}

            {/* Metrics Row matching screenshot */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                paddingTop: '12px',
                borderTop: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#00E676' }}>{ppmStats.completed}</span>
                <div style={{ fontSize: '0.6875rem', color: textMuted, fontWeight: 500, marginTop: '1px' }}>Completed</div>
              </div>
              <div style={{ width: '1px', height: '22px', backgroundColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)' }} />
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: textPrimary }}>{ppmStats.pending}</span>
                <div style={{ fontSize: '0.6875rem', color: textMuted, fontWeight: 500, marginTop: '1px' }}>Pending</div>
              </div>
              <div style={{ width: '1px', height: '22px', backgroundColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)' }} />
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#EF4444' }}>{ppmStats.overdue}</span>
                <div style={{ fontSize: '0.6875rem', color: textMuted, fontWeight: 500, marginTop: '1px' }}>Overdue</div>
              </div>
            </div>
          </div>

          {/* Card 2: Soft Services */}
          <div
            onClick={() => setActiveService('softServices')}
            className="glass-card glass-card-lift"
            style={{
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderRadius: '14px',
              cursor: 'pointer',
              border: activeService === 'softServices'
                ? '1.5px solid #00C853'
                : `1px solid ${cardBorder}`,
              boxShadow: activeService === 'softServices'
                ? '0 0 16px rgba(0, 200, 83, 0.15)'
                : 'none',
              transition: 'all 0.2s ease',
              backgroundColor: isLight
                ? (activeService === 'softServices' ? '#FFFFFF' : '#FAFAFA')
                : (activeService === 'softServices' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.02)')
            }}
          >
            {/* Header + Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: textPrimary }}>
                  Soft Services
                </span>
                {activeService === 'softServices' && (
                  <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', backgroundColor: 'rgba(0, 200, 83, 0.15)', color: '#00C853' }}>
                    Active
                  </span>
                )}
              </div>

              <ChartDropdown
                selectedType={softChartType}
                onChange={setSoftChartType}
                types={COMPLIANCE_CHART_TYPES}
                isLight={isLight}
                accentColor="#00C853"
              />
            </div>

            {/* Donut Chart Visual */}
            {renderServiceChart(softChartType, softStats.compliancePercentage, softStats.completed, softStats.pending, softStats.overdue, softStats.total)}

            {/* Metrics Row matching screenshot */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                paddingTop: '12px',
                borderTop: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#00E676' }}>{softStats.completed}</span>
                <div style={{ fontSize: '0.6875rem', color: textMuted, fontWeight: 500, marginTop: '1px' }}>Completed</div>
              </div>
              <div style={{ width: '1px', height: '22px', backgroundColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)' }} />
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: textPrimary }}>{softStats.pending}</span>
                <div style={{ fontSize: '0.6875rem', color: textMuted, fontWeight: 500, marginTop: '1px' }}>Pending</div>
              </div>
              <div style={{ width: '1px', height: '22px', backgroundColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)' }} />
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#EF4444' }}>{softStats.overdue}</span>
                <div style={{ fontSize: '0.6875rem', color: textMuted, fontWeight: 500, marginTop: '1px' }}>Overdue</div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: PLANNED VS ACHIEVED BY CATEGORY (FULL HEIGHT MATCHING STACKED COL 1) */}
        <div
          className="glass-card glass-card-lift"
          style={{
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRadius: '16px',
            height: '100%',
            boxSizing: 'border-box'
          }}
        >
          {/* Header + Dropdown */}
          <ChartHeader
            title="Planned vs Achieved by Category"
            subtitle="Compare scheduled preventive maintenance activities with completed activities across each category."
            badgeText={activeService === 'ppm' ? 'PPM' : 'Soft Services'}
            badgeColor="#00C853"
            rightAction={
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ChartDropdown
                  selectedType={plannedChartType}
                  onChange={setUserSelectedPlannedChart}
                  types={PLANNED_CHART_TYPES}
                  isLight={isLight}
                  accentColor="#00C853"
                />
                {hasMoreThan5Planned && (
                  <ChartDropdown
                    selectedType={plannedTopN}
                    onChange={setPlannedTopN}
                    options={plannedTopNOptions}
                    isLight={isLight}
                    accentColor="#00C853"
                  />
                )}
              </div>
            }
            isLight={isLight}
          />

          {/* Chart Content Body */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderPlannedChart()}
          </div>
        </div>

        {/* COLUMN 3: COMPLIANCE BY CATEGORY (FULL HEIGHT MATCHING STACKED COL 1) */}
        <div
          className="glass-card glass-card-lift"
          style={{
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRadius: '16px',
            height: '100%',
            boxSizing: 'border-box'
          }}
        >
          {/* Header */}
          <ChartHeader
            title="Compliance by Category"
            subtitle="Shows the on-time completion percentage for each scheduled checklist category."
            badgeText={`${activeComplianceData.length} Audits`}
            badgeColor="#00C853"
            isLight={isLight}
          />

          {/* List of Categories with Progress Bars matching user screenshot */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              overflowY: 'auto',
              maxHeight: '380px',
              paddingRight: '4px'
            }}
          >
            {activeComplianceData.map((item, idx) => {
              const is100 = item.percentage === 100;
              const formattedName = formatCategoryLabel(item.name);
              const formattedPct = formatPercentage(item.percentage);
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {/* Category Name & Fraction / Percent */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.75rem' }}>
                    <span
                      style={{
                        fontWeight: 700,
                        color: textPrimary,
                        letterSpacing: '0.01em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '190px'
                      }}
                      title={formattedName}
                    >
                      {formattedName}
                    </span>
                    <span
                      style={{
                        fontWeight: 800,
                        color: is100 ? '#00C853' : (item.percentage > 0 ? '#3B82F6' : '#EF4444'),
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        flexShrink: 0
                      }}
                    >
                      {item.completed}/{item.total} {formattedPct}
                    </span>
                  </div>

                  {/* Progress Bar Track & Fill */}
                  <div
                    style={{
                      height: '7px',
                      width: '100%',
                      backgroundColor: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '999px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${item.percentage}%`,
                        backgroundColor: is100 ? '#00C853' : (item.percentage > 0 ? '#3B82F6' : 'transparent'),
                        borderRadius: '999px',
                        transition: 'width 0.8s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.6875rem',
              color: textMuted,
              paddingTop: '12px',
              borderTop: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.06)',
              marginTop: '12px'
            }}
          >
            <span>Cycle: Monthly Nationwide</span>
            <span style={{ color: '#00C853', fontWeight: 700 }}>
              {activeComplianceData.filter(d => d.percentage === 100).length}/{activeComplianceData.length} Compliant
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
