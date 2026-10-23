import { useState, useRef, useEffect, useMemo } from 'react';
import { Ticket, AlertTriangle, CheckCircle2, ShieldCheck, Clock, Check, ChevronDown, Search, X, ArrowUpDown } from 'lucide-react';
import EmptyState from '../common/EmptyState';
import AnimatedNumber from '../common/AnimatedNumber';
import ChartDropdown from '../common/ChartDropdown';
import ChartHeader from '../common/ChartHeader';
import EnterpriseBarChart, { useTopNFilter } from '../common/EnterpriseBarChart';
import EnterpriseDonutChart from '../common/EnterpriseDonutChart';
import EnterpriseRadarChart from '../common/EnterpriseRadarChart';
import { formatCategoryLabel, formatPercentage, formatNumber } from '../../utils/analyticsFormatters';
import { CHART_COMPATIBILITY } from '../../utils/chartConfig';
import SiteFilterDropdown from '../common/SiteFilterDropdown';

const CATEGORY_CHART_TYPES = CHART_COMPATIBILITY.ticketsByCategory;

export default function ServiceDesk({ 
  serviceDeskData, 
  triggerKey = 0, 
  theme = 'dark', 
  isLoading = false, 
  selectedCategory = 'All Categories',
  selectedSite = 'All Sites',
  onSiteSelect,
  sites = []
}) {
  const [hoveredBar, setHoveredBar] = useState(null);
  const [userSelectedChartType, setUserSelectedChartType] = useState('Vertical Bar');
  const [sortOrder, setSortOrder] = useState('highest'); // 'highest' | 'lowest' | 'alphabetical'
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const sortRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isLight = theme === 'light';

  const cardBorder = isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)';
  const gridLineColor = isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)';
  const textMuted = isLight ? '#64748B' : '#94A3B8';
  const textPrimary = isLight ? '#0F172A' : '#FFFFFF';

  const {
    total = 280,
    open = 0,
    inProgress = 0,
    closed = 138,
    slaStatus = { withinTat: 280, outsideTat: 0, tatCompliance: 100, avgResolution: '0h' },
    ticketsByCategory = [],
    priorityTickets = []
  } = serviceDeskData || {};

  const isDataLoading = isLoading || serviceDeskData?.isLoading;
  const categoryChartType = userSelectedChartType || 'Vertical Bar';

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const SORT_OPTIONS = [
    { id: 'highest', label: 'Highest First' },
    { id: 'lowest', label: 'Lowest First' },
    { id: 'alphabetical', label: 'Alphabetical' }
  ];

  // Dynamic sorting from API data in descending order of ticket counts
  const sortedCategories = useMemo(() => {
    if (!ticketsByCategory || ticketsByCategory.length === 0) return [];
    return [...ticketsByCategory].sort((a, b) => {
      const diff = (Number(b.count) || 0) - (Number(a.count) || 0);
      if (diff !== 0) return diff;
      return (a.category || '').localeCompare(b.category || '');
    });
  }, [ticketsByCategory]);

  // Dynamic Top-N selection (Top 5 / Top 10 / Top 15 / All)
  const {
    topN: topNFilter,
    setTopN: setTopNFilter,
    hasMoreThan5: hasMoreThan5Categories,
    displayData: activeTopCategories,
    topNOptions
  } = useTopNFilter(sortedCategories, 'Top 5');

  // Clean Y-axis scale calculation: sensible padding above max, minimum strictly 0, non-negative ticks
  const chartYAxis = useMemo(() => {
    const rawMax = Math.max(...activeTopCategories.map((c) => Number(c.count) || 0), 0);
    if (rawMax <= 0) {
      return { yMax: 10, ticks: [10, 7.5, 5, 2.5, 0] };
    }

    // Target 4 equal intervals above 0 with 12-20% headroom
    const rawStep = (rawMax * 1.15) / 4;
    const power = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const norm = rawStep / power;
    let stepMult = 1;
    if (norm <= 1) stepMult = 1;
    else if (norm <= 1.5) stepMult = 1.5;
    else if (norm <= 2) stepMult = 2;
    else if (norm <= 2.5) stepMult = 2.5;
    else if (norm <= 4) stepMult = 4;
    else if (norm <= 5) stepMult = 5;
    else if (norm <= 7.5) stepMult = 7.5;
    else stepMult = 10;

    let step = Math.ceil(stepMult * power);
    while (step * 4 < rawMax) {
      step += Math.ceil(power);
    }
    const yMax = step * 4;
    // Guaranteed non-negative, zero at bottom
    const ticks = [yMax, step * 3, step * 2, step, 0];
    return { yMax, ticks };
  }, [activeTopCategories]);

  const processedCategories = useMemo(() => {
    if (!ticketsByCategory || ticketsByCategory.length === 0) return [];

    let list = [...ticketsByCategory];

    // Filter by search query
    if (categorySearchQuery.trim()) {
      const q = categorySearchQuery.toLowerCase().trim();
      list = list.filter((cat) => {
        const formatted = formatCategoryLabel(cat.category).toLowerCase();
        const raw = (cat.category || '').toLowerCase();
        return formatted.includes(q) || raw.includes(q);
      });
    }

    // Sort order
    if (sortOrder === 'highest') {
      list.sort((a, b) => b.count - a.count);
    } else if (sortOrder === 'lowest') {
      list.sort((a, b) => a.count - b.count);
    } else if (sortOrder === 'alphabetical') {
      list.sort((a, b) => formatCategoryLabel(a.category).localeCompare(formatCategoryLabel(b.category)));
    }

    return list;
  }, [ticketsByCategory, categorySearchQuery, sortOrder]);

  const maxCategoryCount = Math.max(...processedCategories.map((c) => c.count), 1);
  const totalCategoryTickets = ticketsByCategory.reduce((acc, c) => acc + c.count, 0) || total || 1;

  // Monotonic Cubic Spline (Fritsch-Carlson) - strictly avoids overshoot and guarantees zero-clamping
  const getMonotonicBezierPath = (points, zeroY, boxY) => {
    const n = points.length;
    if (n < 2) return '';
    if (n === 2) {
      return `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)},${points[1].y.toFixed(1)}`;
    }

    const deltas = [];
    const dxs = [];
    for (let i = 0; i < n - 1; i++) {
      const dx = points[i + 1].x - points[i].x;
      dxs.push(dx);
      deltas.push((points[i + 1].y - points[i].y) / (dx || 1));
    }

    const m = new Array(n).fill(0);
    m[0] = deltas[0];
    m[n - 1] = deltas[n - 2];
    for (let i = 1; i < n - 1; i++) {
      if (deltas[i - 1] * deltas[i] <= 0) {
        m[i] = 0;
      } else {
        m[i] = (deltas[i - 1] + deltas[i]) / 2;
      }
    }

    for (let i = 0; i < n - 1; i++) {
      if (deltas[i] === 0) {
        m[i] = 0;
        m[i + 1] = 0;
      } else {
        const alpha = m[i] / deltas[i];
        const beta = m[i + 1] / deltas[i];
        const dist = alpha * alpha + beta * beta;
        if (dist > 9) {
          const tau = 3 / Math.sqrt(dist);
          m[i] = tau * alpha * deltas[i];
          m[i + 1] = tau * beta * deltas[i];
        }
      }
    }

    let d = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    for (let i = 0; i < n - 1; i++) {
      const thirdX = dxs[i] / 3;
      let cp1x = points[i].x + thirdX;
      let cp1y = points[i].y + m[i] * thirdX;
      let cp2x = points[i + 1].x - thirdX;
      let cp2y = points[i + 1].y - m[i + 1] * thirdX;

      // Absolute safety clamp: control points can NEVER exceed zeroY or boxY
      cp1y = Math.min(zeroY, Math.max(boxY, cp1y));
      cp2y = Math.min(zeroY, Math.max(boxY, cp2y));

      d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${points[i + 1].x.toFixed(1)},${points[i + 1].y.toFixed(1)}`;
    }
    return d;
  };

  // Renderer for Tickets by Category according to selected chart type
  const renderCategoryChart = () => {
    // 14. LOADING STATE: 5-6 skeleton horizontal bars
    if (isDataLoading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minHeight: '250px', justifyContent: 'center', padding: '10px 8px' }}>
          {[92, 60, 45, 78, 52, 30].map((widthPct, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 150px) 1fr 45px', alignItems: 'center', gap: '12px' }}>
              <div style={{ height: '12px', width: '85%', borderRadius: '4px', backgroundColor: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)' }} />
              <div style={{ height: '8px', width: `${widthPct}%`, borderRadius: '4px', backgroundColor: isLight ? '#CBD5E1' : 'rgba(255, 255, 255, 0.12)' }} />
              <div style={{ height: '12px', width: '32px', borderRadius: '4px', backgroundColor: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)' }} />
            </div>
          ))}
        </div>
      );
    }

    // 13. EMPTY STATE
    if (!ticketsByCategory || ticketsByCategory.length === 0) {
      return (
        <div style={{ minHeight: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <EmptyState
            icon="ticket"
            title="No ticket category data available"
            description="Service request category data is not available for the selected period."
          />
        </div>
      );
    }

    // 1. VERTICAL BAR & HORIZONTAL BAR (Unified EnterpriseBarChart)
    if (categoryChartType === 'Vertical Bar' || categoryChartType === 'Horizontal Bar') {
      return (
        <EnterpriseBarChart
          data={activeTopCategories}
          orientation={categoryChartType}
          metricType="count"
          yAxisTitle="Ticket Count"
          topN={topNFilter}
          accentColor="#FF5B22"
          isLight={isLight}
          height={210}
        />
      );
    }

    // 3. TREND / AREA (and Line / Area)
    if (categoryChartType === 'Trend / Area' || categoryChartType === 'Line' || categoryChartType === 'Area') {
      const boxY = 16;
      const boxH = 150;
      const zeroY = boxY + boxH; // 166
      const { yMax, ticks: yTicks } = chartYAxis;

      const isAll = topNFilter === 'All';
      const itemSpacing = isAll ? 46 : (topNFilter === 'Top 10' ? 28 : 56);
      const leftPad = 52;
      const rightPad = 24;
      const contentW = Math.max(280, leftPad + activeTopCategories.length * itemSpacing + rightPad);

      // Points calculation: strictly non-negative, zero on baseline, sensible headroom
      const points = activeTopCategories.map((cat, idx) => {
        const count = Number(cat.count) || 0;
        const x = isAll
          ? leftPad + idx * itemSpacing + itemSpacing / 2
          : leftPad + idx * ((contentW - leftPad - rightPad) / Math.max(activeTopCategories.length - 1, 1));
        const y = zeroY - (count / (yMax || 1)) * boxH;
        return {
          x,
          y,
          count,
          cat
        };
      });

      // Fritsch-Carlson monotonic cubic spline (guaranteed no overshoot below 0)
      const curvePath = getMonotonicBezierPath(points, zeroY, boxY);
      const areaPath = points.length > 0
        ? `${curvePath} L ${points[points.length - 1].x.toFixed(1)},${zeroY} L ${points[0].x.toFixed(1)},${zeroY} Z`
        : '';

      return (
        <div style={{ height: '240px', display: 'flex', position: 'relative', width: '100%' }}>
          {/* Pinned Left Y-Axis */}
          <div style={{ width: '38px', height: '100%', flexShrink: 0, position: 'relative', userSelect: 'none' }}>
            <svg width="38" height="235" style={{ display: 'block', overflow: 'visible' }}>
              {yTicks.map((val, idx) => {
                const yPos = boxY + boxH - (val / (yMax || 1)) * boxH;
                return (
                  <text
                    key={idx}
                    x="32"
                    y={yPos + 3.5}
                    textAnchor="end"
                    fill={textMuted}
                    fontSize="10"
                    fontFamily="'Plus Jakarta Sans', 'Inter', sans-serif"
                  >
                    {val}
                  </text>
                );
              })}
              {/* Y-axis line */}
              <line x1="37" y1={boxY} x2="37" y2={zeroY} stroke={cardBorder} strokeWidth="1" />
            </svg>
          </div>

          {/* Scrollable / Responsive Chart Body */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              height: '100%',
              overflowX: isAll ? 'auto' : 'hidden',
              overflowY: 'hidden',
              paddingBottom: '2px'
            }}
          >
            <svg
              width={isAll ? `${contentW}px` : '100%'}
              height="235"
              viewBox={`0 0 ${contentW} 235`}
              preserveAspectRatio="xMinYMin meet"
              style={{ display: 'block', minWidth: isAll ? `${contentW}px` : '100%', overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="ticketCategoryAreaGradSmooth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF7A45" stopOpacity={isLight ? 0.4 : 0.45} />
                  <stop offset="70%" stopColor="#FF7A45" stopOpacity={isLight ? 0.15 : 0.18} />
                  <stop offset="100%" stopColor="#FF7A45" stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {yTicks.map((val, idx) => {
                const yPos = boxY + boxH - (val / (yMax || 1)) * boxH;
                const isBaseline = val === 0;
                return (
                  <line
                    key={idx}
                    x1="0"
                    y1={yPos}
                    x2={contentW}
                    y2={yPos}
                    stroke={isBaseline ? cardBorder : gridLineColor}
                    strokeWidth="1"
                    strokeDasharray={isBaseline ? undefined : '2,2'}
                  />
                );
              })}

              {/* Area Path strictly bounded at zeroY */}
              {areaPath && (
                <path d={areaPath} fill="url(#ticketCategoryAreaGradSmooth)" />
              )}

              {/* Stroke Curve Path */}
              {curvePath && (
                <path
                  d={curvePath}
                  fill="none"
                  stroke="#FF7A45"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Points */}
              {points.map((p, idx) => {
                const isHovered = hoveredBar === p.cat.category;
                const formattedLabel = formatCategoryLabel(p.cat.category);
                const sharePct = totalCategoryTickets > 0 ? ((p.count / totalCategoryTickets) * 100).toFixed(1) : '0.0';
                const labelAngle = topNFilter === 'Top 5' ? -25 : -35;

                return (
                  <g
                    key={p.cat.category || idx}
                    onMouseEnter={() => setHoveredBar(p.cat.category)}
                    onMouseLeave={() => setHoveredBar(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <title>{`Tickets by Category\nCategory: ${formattedLabel}\nTickets: ${formatNumber(p.count)}\nShare: ${formatPercentage(sharePct)}`}</title>

                    {/* Data Point Dot */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? 5.5 : 3.5}
                      fill={isHovered ? '#FF7A45' : (isLight ? '#FFFFFF' : '#0F172A')}
                      stroke="#FF7A45"
                      strokeWidth="2"
                      style={{ transition: 'all 0.15s ease' }}
                    />

                    {/* Count text above point */}
                    <text
                      x={p.x}
                      y={p.count === 0 ? zeroY - 6 : Math.max(boxY + 9, p.y - 6)}
                      textAnchor="middle"
                      fill={isHovered ? '#FF5B22' : textPrimary}
                      fontSize={isAll ? '9' : '10'}
                      fontWeight="700"
                      fontFamily="'Plus Jakarta Sans', 'Inter', sans-serif"
                    >
                      {formatNumber(p.count)}
                    </text>

                    {/* Category Label below Baseline */}
                    <text
                      x={p.x}
                      y={zeroY + 14}
                      transform={`rotate(${labelAngle}, ${p.x}, ${zeroY + 14})`}
                      textAnchor="end"
                      fill={isHovered ? textPrimary : textMuted}
                      fontSize={isAll ? '7' : (topNFilter === 'Top 10' ? '7.5' : '8')}
                      fontWeight={isHovered ? 700 : 500}
                    >
                      {formattedLabel.length > 15 ? `${formattedLabel.substring(0, 14)}…` : formattedLabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      );
    }

    // 4. DONUT & PIE (Unified EnterpriseDonutChart with proper data labeling)
    if (categoryChartType === 'Donut' || categoryChartType === 'Pie' || categoryChartType === 'Donut / Share') {
      return (
        <EnterpriseDonutChart
          data={activeTopCategories.map((c) => ({
            label: c.category,
            value: Number(c.count || 0),
            color: c.color || '#FF5B22'
          }))}
          chartType={categoryChartType === 'Pie' ? 'Pie' : 'Donut'}
          centerLabel="Tickets"
          centerValue={totalCategoryTickets}
          height={220}
          isLight={isLight}
        />
      );
    }

    // 5. RADAR (Unified EnterpriseRadarChart with explicit data labeling)
    if (categoryChartType === 'Radar') {
      const maxCount = Math.max(...activeTopCategories.map((c) => Number(c.count || 0)), 10);
      return (
        <EnterpriseRadarChart
          data={activeTopCategories.map((c) => ({
            name: c.category,
            label: c.category,
            count: Number(c.count || 0),
            value: Number(c.count || 0)
          }))}
          metricKey="count"
          metricType="count"
          seriesLabel="Tickets"
          accentColor="#FF5B22"
          maxValue={maxCount}
          height={220}
          isLight={isLight}
        />
      );
    }

    return null;
  };

  return (
    <section id="servicedesk-section" style={{ marginBottom: '32px' }} className="animate-fade-in stagger-4">
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: isLight ? 'rgba(255, 91, 34, 0.1)' : 'rgba(255, 91, 34, 0.15)',
              border: isLight ? '1px solid rgba(255, 91, 34, 0.25)' : '1px solid rgba(255, 91, 34, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF7A45'
            }}
          >
            <Ticket size={20} strokeWidth={2.2} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', letterSpacing: '-0.02em' }}>
              Service Desk & SLA Intelligence
            </h3>
            <p style={{ fontSize: '0.8125rem', color: isLight ? '#64748B' : '#94A3B8' }}>
              {total} total service tickets processed across {selectedSite && selectedSite !== 'All Sites' ? selectedSite : 'all sites'}
            </p>
          </div>
        </div>

        {/* Site Filter Dropdown */}
        <SiteFilterDropdown
          selectedSite={selectedSite}
          onSiteSelect={onSiteSelect}
          sites={sites}
          isLight={isLight}
          accentColor="#FF5B22"
        />
      </div>

      {/* 4 Compact Ticket Status KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '16px'
        }}
      >
        {/* Total */}
        <div
          className="glass-card glass-card-lift"
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(255, 91, 34, 0.9) 0%, rgba(194, 65, 12, 0.95) 100%)',
            border: '1px solid rgba(255, 91, 34, 0.4)',
            boxShadow: '0 8px 24px rgba(255, 91, 34, 0.25)',
            color: '#FFFFFF'
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.9 }}>
            Total Tickets
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1.1, margin: '6px 0 2px 0' }}>
            <AnimatedNumber value={total} triggerKey={triggerKey} />
          </div>
          <span style={{ fontSize: '0.6875rem', opacity: 0.85 }}>All logged requests</span>
        </div>

        {/* Open */}
        <div
          className="glass-card glass-card-lift"
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.85) 0%, rgba(76, 29, 149, 0.95) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            boxShadow: '0 8px 24px rgba(124, 58, 237, 0.25)',
            color: '#FFFFFF'
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.9 }}>
            Open
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1.1, margin: '6px 0 2px 0' }}>
            <AnimatedNumber value={open} triggerKey={triggerKey} />
          </div>
          <span style={{ fontSize: '0.6875rem', opacity: 0.85 }}>Awaiting assignment</span>
        </div>

        {/* In Progress */}
        <div
          className="glass-card glass-card-lift"
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.85) 0%, rgba(180, 83, 9, 0.95) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            boxShadow: '0 8px 24px rgba(217, 119, 6, 0.25)',
            color: '#FFFFFF'
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.9 }}>
            In Progress
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1.1, margin: '6px 0 2px 0' }}>
            <AnimatedNumber value={inProgress} triggerKey={triggerKey} />
          </div>
          <span style={{ fontSize: '0.6875rem', opacity: 0.85 }}>Active work underway</span>
        </div>

        {/* Closed */}
        <div
          className="glass-card glass-card-lift"
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(0, 200, 83, 0.85) 0%, rgba(4, 120, 87, 0.95) 100%)',
            border: '1px solid rgba(0, 200, 83, 0.4)',
            boxShadow: '0 8px 24px rgba(0, 200, 83, 0.25)',
            color: '#FFFFFF'
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.9 }}>
            Closed
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1.1, margin: '6px 0 2px 0' }}>
            <AnimatedNumber value={closed} triggerKey={triggerKey} />
          </div>
          <span style={{ fontSize: '0.6875rem', opacity: 0.85 }}>Resolved & verified</span>
        </div>
      </div>

      {/* 3-Column Detailed Modules */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Module 1: SLA Status */}
        <div className="glass-card glass-card-lift" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <ChartHeader
              title="SLA Status & Compliance"
              subtitle="Tracks ticket resolution performance against agreed service level agreement targets."
              badgeText="100% On-Target"
              badgeColor="#00C853"
              isLight={isLight}
              marginBottom="14px"
            />

            {/* Within TAT Pill Card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: '12px',
                backgroundColor: 'rgba(0, 200, 83, 0.1)',
                border: '1px solid rgba(0, 200, 83, 0.3)',
                marginBottom: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="#00E676" />
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#00E676' }}>Within TAT</span>
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#00E676' }}>
                <AnimatedNumber value={slaStatus.withinTat} triggerKey={triggerKey} />
              </span>
            </div>

            {/* Outside TAT Pill Card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: '12px',
                backgroundColor: 'rgba(248, 113, 113, 0.08)',
                border: '1px solid rgba(248, 113, 113, 0.25)',
                marginBottom: '18px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} color="#F87171" />
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F87171' }}>Outside TAT</span>
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F87171' }}>
                <AnimatedNumber value={slaStatus.outsideTat} triggerKey={triggerKey} />
              </span>
            </div>

            {/* SLA Progress Bar */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                <span style={{ color: isLight ? '#64748B' : '#94A3B8', fontWeight: 500 }}>TAT Compliance</span>
                <strong style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>{formatPercentage(slaStatus.tatCompliance)}</strong>
              </div>
              <div style={{ height: '8px', width: '100%', backgroundColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${slaStatus.tatCompliance}%`, background: 'linear-gradient(90deg, #00E676 0%, #00A843 100%)', borderRadius: '4px' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: isLight ? '#64748B' : '#94A3B8', paddingTop: '12px', borderTop: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span>Avg Resolution Time</span>
            <strong style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>{slaStatus.avgResolution}</strong>
          </div>
        </div>

        {/* Module 2: Tickets by Category */}
        <div className="glass-card glass-card-lift" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <ChartHeader
            title="Tickets by Category"
            subtitle="Distribution of logged service requests across facility operational categories."
            rightAction={
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ChartDropdown
                  selectedType={categoryChartType}
                  onChange={(type) => setUserSelectedChartType(type)}
                  types={CATEGORY_CHART_TYPES}
                  isLight={isLight}
                  accentColor="#FF5B22"
                />
                {hasMoreThan5Categories && (
                  <ChartDropdown
                    selectedType={topNFilter}
                    onChange={(val) => setTopNFilter(val)}
                    options={topNOptions}
                    isLight={isLight}
                    accentColor="#FF5B22"
                  />
                )}
              </div>
            }
            isLight={isLight}
            marginBottom="14px"
          />

          {/* Dynamic Category Chart View */}
          {renderCategoryChart()}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: isLight ? '#64748B' : '#94A3B8', paddingTop: '10px', borderTop: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span>
              {topNFilter === 'All'
                ? `Showing All ${ticketsByCategory.length} Categories`
                : `Showing ${topNFilter} of ${ticketsByCategory.length} Categories`}
            </span>
            <span style={{ color: '#00E676', fontWeight: 700 }}>
              {topNFilter === 'All' && activeTopCategories.length > 8 ? 'Scroll for all →' : `${ticketsByCategory.length} Categories`}
            </span>
          </div>
        </div>

        {/* Module 3: Priority Tickets */}
        <div className="glass-card glass-card-lift" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <ChartHeader
            title="Priority Escalations"
            subtitle="Monitors urgent tickets and critical escalation resolution times."
            badgeText="0 Urgent"
            badgeColor="#00C853"
            isLight={isLight}
            marginBottom="14px"
          />

          {priorityTickets.length === 0 ? (
            <EmptyState
              icon="check"
              title="No Priority Tickets"
              description="All service requests across nationwide facilities are operating within normal priority thresholds."
            />
          ) : (
            <div>List of priority tickets</div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: isLight ? '#64748B' : '#94A3B8', paddingTop: '12px', borderTop: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span>Critical Escalation SLA: 15m</span>
            <span style={{ color: '#00E676', fontWeight: 700 }}>Zero Breaches</span>
          </div>
        </div>
      </div>
    </section>
  );
}
