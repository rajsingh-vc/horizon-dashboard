import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Search, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown, 
  ArrowUpDown, 
  Check, 
  X,
  Activity,
  Clock,
  CheckCircle2,
  Users
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import SiteDrillDownDrawer from './SiteDrillDownDrawer';
import EnterpriseBarChart, { useTopNFilter } from '../common/EnterpriseBarChart';
import ChartDropdown from '../common/ChartDropdown';

const CHART_TYPES = [
  'Horizontal Bar',
  'Vertical Bar',
  'Line',
  'Area',
  'Pie',
  'Donut',
  'Radar'
];

// Meaningful business metrics without placeholder "Metric 1 / 2 / 3" naming
const METRIC_OPTIONS = [
  { id: 'health', label: 'Health', key: 'health', color: '#9333EA', icon: Activity },
  { id: 'tat', label: 'TAT Compliance', key: 'tat', color: '#EA580C', icon: Clock },
  { id: 'ppm', label: 'PPM Adherence', key: 'ppm', color: '#00C853', icon: CheckCircle2 },
  { id: 'workforce', label: 'Workforce Availability', key: 'workforce', color: '#2563EB', icon: Users }
];

export default function SitePerformance({ 
  sites = [], 
  onSiteSelect, 
  selectedSite = 'All Sites', 
  selectedGroup = 'All Groups', 
  theme = 'dark' 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('heatmap'); // 'table' | 'heatmap'
  const [chartType, setChartType] = useState('Horizontal Bar');
  const [activeMetric, setActiveMetric] = useState('health');
  const [sortField, setSortField] = useState('siteName');
  const [sortAsc, setSortAsc] = useState(true);
  const [activeSiteModal, setActiveSiteModal] = useState(null);

  // Dropdowns
  const [isChartDropdownOpen, setIsChartDropdownOpen] = useState(false);
  const [isSiteDropdownOpen, setIsSiteDropdownOpen] = useState(false);
  const [hoveredSiteIndex, setHoveredSiteIndex] = useState(null);

  // Responsive chart container ref to prevent any SVG font or width distortion
  const chartContainerRef = useRef(null);
  const [chartContainerWidth, setChartContainerWidth] = useState(800);

  // Pagination State for Table (10 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const chartDropdownRef = useRef(null);
  const siteDropdownRef = useRef(null);

  const isLight = theme === 'light';

  useEffect(() => {
    function handleClickOutside(event) {
      if (chartDropdownRef.current && !chartDropdownRef.current.contains(event.target)) {
        setIsChartDropdownOpen(false);
      }
      if (siteDropdownRef.current && !siteDropdownRef.current.contains(event.target)) {
        setIsSiteDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Track real container width for responsive SVG rendering without font stretching
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const updateWidth = () => {
      if (chartContainerRef.current) {
        const w = chartContainerRef.current.clientWidth;
        if (w > 0) setChartContainerWidth(Math.floor(w));
      }
    };
    updateWidth();
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateWidth);
      ro.observe(chartContainerRef.current);
    }
    window.addEventListener('resize', updateWidth);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, [viewMode, chartType]);

  // Close modal on Escape key press & lock body scroll
  useEffect(() => {
    if (!activeSiteModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveSiteModal(null);
      }
    };
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [activeSiteModal]);

  // =========================================================================
  // 1. UNIFIED NORMALIZED DATASET (Requirement 11)
  // Single source of truth consumed by Table, Heatmap, and all Chart types
  // =========================================================================
  const sitePerformanceData = useMemo(() => {
    return (sites || []).map((s) => {
      const siteId = s.id ?? s.siteId;
      const siteName = s.name ?? s.siteName ?? 'Unknown Site';
      const region = s.group || s.region || '—';
      const city = s.city || s.location || '—';

      const rawHealth = s.health_score ?? s.health;
      const rawTat = s.tat ?? s.sla_percentage;
      const rawPpm = s.ppm_percentage ?? s.ppm;
      const rawWorkforce = s.workforce_percentage ?? s.workforce;

      const totalAssets = s.total_assets ?? s.activeAssets ?? 0;
      const pendingTickets = s.pending_tickets ?? s.tickets ?? 0;

      // Meaningful Zero & Missing Data Logic (Requirement 9):
      // Health: If total_assets === 0 and health is not set, no assets exist -> missing/N/A
      const hasHealthData = rawHealth !== null && rawHealth !== undefined && (totalAssets > 0 || rawHealth > 0);
      const health = hasHealthData ? Math.max(0, Math.min(100, Number(Number(rawHealth).toFixed(1)))) : null;

      // Keep underlying API value unchanged (presentation layer formats 0 / missing as "-")
      const tat = rawTat !== null && rawTat !== undefined && !isNaN(Number(rawTat))
        ? Math.max(0, Math.min(100, Number(Number(rawTat).toFixed(1))))
        : null;

      // PPM Adherence: Requires scheduled maintenance to compute adherence
      const hasPpmData = rawPpm !== null && rawPpm !== undefined && (rawPpm > 0 || (s.scheduled_ppm ?? 0) > 0);
      const ppm = hasPpmData ? Math.max(0, Math.min(100, Number(Number(rawPpm).toFixed(1)))) : null;

      // Workforce Availability
      const hasWorkforceData = rawWorkforce !== null && rawWorkforce !== undefined && rawWorkforce > 0;
      const workforce = hasWorkforceData ? Math.max(0, Math.min(100, Number(Number(rawWorkforce).toFixed(1)))) : null;

      return {
        siteId,
        id: siteId,
        siteName,
        name: siteName,
        label: siteName,
        region,
        group: region,
        city,
        location: city,
        health,
        health_score: health,
        tat,
        sla_percentage: tat,
        ppm,
        ppm_percentage: ppm,
        workforce,
        workforce_percentage: workforce,
        total_assets: totalAssets,
        pending_tickets: pendingTickets,
        hasHealthData,
        hasTatData: tat !== null && tat > 0,
        hasPpmData,
        hasWorkforceData,
        raw: s
      };
    });
  }, [sites]);

  // Helper to extract active metric value from unified dataset
  const getSiteMetricValue = (site, metricId = activeMetric) => {
    if (!site) return null;
    if (metricId === 'tat') return site.tat;
    if (metricId === 'ppm') return site.ppm;
    if (metricId === 'workforce') return site.workforce;
    return site.health;
  };

  // Filter and sort sites dynamically
  const filteredSites = useMemo(() => {
    return sitePerformanceData
      .filter((site) => {
        const loc = site.city || '';
        const grp = site.region || '';
        const matchesSearch = 
          site.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          grp.toLowerCase().includes(searchQuery.toLowerCase()) ||
          loc.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGroup = !selectedGroup || selectedGroup === 'All Groups' || grp.toLowerCase() === selectedGroup.toLowerCase();
        const matchesSite = !selectedSite || selectedSite === 'All Sites' || site.siteName.toLowerCase() === selectedSite.toLowerCase();
        return matchesSearch && matchesGroup && matchesSite;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        // Push null / N/A values to the end when sorting numeric metrics
        if (['health', 'tat', 'ppm', 'workforce'].includes(sortField)) {
          if (valA === null && valB === null) return 0;
          if (valA === null) return 1;
          if (valB === null) return -1;
        }

        if (typeof valA === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (valA === valB) {
          return a.siteName.localeCompare(b.siteName);
        }
        return sortAsc ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
      });
  }, [sitePerformanceData, searchQuery, selectedGroup, selectedSite, sortField, sortAsc]);

  // Chart data formatted for EnterpriseBarChart & custom SVG charts
  const siteChartData = useMemo(() => {
    return filteredSites.map((site) => {
      const val = getSiteMetricValue(site);
      const isMissing = val === null || val === undefined;
      const numVal = isMissing ? 0 : val;
      const isTatMetric = activeMetric === 'tat';
      const isZeroTat = isTatMetric && (val === null || val === undefined || Number(val) <= 0);

      return {
        ...site,
        label: site.siteName,
        name: site.siteName,
        value: numVal,
        val: numVal,
        isMissing,
        isTat: isTatMetric,
        displayVal: (isZeroTat || isMissing) ? '-' : `${numVal}%`,
        color: numVal >= 85 ? '#00C853' : numVal >= 50 ? '#F59E0B' : '#EF4444'
      };
    });
  }, [filteredSites, activeMetric]);

  // Dynamic Top N options (never displays Top 10 if fewer than 10 records exist)
  const {
    topN: siteTopN,
    setTopN: setSiteTopN,
    hasMoreThan5: hasMoreThan5Sites,
    displayData: displaySites,
    topNOptions: siteTopNOptions
  } = useTopNFilter(siteChartData, 'Top 10');

  // Reset pagination on search, group, or site change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGroup, selectedSite]);

  const totalPages = Math.max(1, Math.ceil(filteredSites.length / pageSize));
  const paginatedSites = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredSites.slice(startIndex, startIndex + pageSize);
  }, [filteredSites, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // =========================================================================
  // 2. CHART CLICK DRILL-DOWN & FILTERING IMPLEMENTATION
  // - Clicking a site on the chart opens the Site Drill-Down Drawer (just like table view)
  // - Sets the active site filter for consistent dashboard telemetry
  // =========================================================================
  const handleChartSiteClick = (item) => {
    if (!item) return;
    const siteId = item.siteId ?? item.id ?? item.raw?.id;
    const siteName = item.siteName ?? item.name ?? item.label;

    console.log("Clicked chart item:", item);
    console.log("Resolved site:", siteName);
    console.log("Resolved siteId:", siteId);

    // 1. Resolve full site object for drill-down modal
    const targetSite = item.raw || (sites || []).find((s) => 
      (s.id && (s.id === siteId || String(s.id) === String(siteId))) || 
      (s.name && s.name.toLowerCase() === (siteName || '').toLowerCase())
    ) || item;

    // 2. Open the comprehensive site performance drill-down drawer
    setActiveSiteModal(targetSite);

    // 3. Update central site filter selection
    if (siteName && onSiteSelect) {
      onSiteSelect(siteName);
    }
  };

  // Status Badge Formatter with meaningful '-' for missing / unmonitored / N/A
  const renderMetricBadge = (val, hasData) => {
    if (!hasData || val === null || val === undefined) {
      return (
        <StatusBadge
          type="neutral"
          label="-"
          icon={false}
        />
      );
    }
    const score = Number(val);
    const type = score >= 85 ? 'success' : score >= 50 ? 'warning' : 'danger';
    return (
      <StatusBadge
        type={type}
        label={`${score}%`}
        icon={false}
      />
    );
  };

  // Dedicated TAT/SLA Metric Badge Formatter (Zero / Empty Value Display Rule)
  // - If value is 0%, display "-"
  // - If value is null/undefined/missing, display "-"
  // - If value is greater than 0%, display the actual percentage
  // - If value is 100%, display "100%"
  const renderTatBadge = (val) => {
    if (val === null || val === undefined || Number(val) <= 0) {
      return (
        <StatusBadge
          type="neutral"
          label="-"
          icon={false}
        />
      );
    }
    const score = Number(val);
    const type = score >= 85 ? 'success' : score >= 50 ? 'warning' : 'danger';
    return (
      <StatusBadge
        type={type}
        label={`${score}%`}
        icon={false}
      />
    );
  };

  // Styling Tokens
  const cardBg = isLight ? '#FFFFFF' : '#111827';
  const cardBorder = isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)';
  const textPrimary = isLight ? '#0F172A' : '#F8FAFC';
  const textMuted = isLight ? '#64748B' : '#94A3B8';
  const gridLineColor = isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)';
  const fontFamily = "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  // Helper: Clamped Bezier Curve with NO DIP below 0 and NO overshooting ceiling
  const getClampedBezierPath = (points, minY, maxY) => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      if (p1.y >= maxY && p2.y >= maxY) {
        d += ` L ${p2.x},${maxY}`;
        continue;
      }

      let cp1x = p1.x + (p2.x - p0.x) / 6;
      let cp1y = p1.y + (p2.y - p0.y) / 6;
      let cp2x = p2.x - (p3.x - p1.x) / 6;
      let cp2y = p2.y - (p3.y - p1.y) / 6;

      if (p2.y >= maxY) {
        cp2y = maxY;
        cp1y = Math.min(maxY, cp1y);
      }
      if (p1.y <= minY && p2.y <= minY) {
        cp1y = minY;
        cp2y = minY;
      }

      cp1y = Math.max(minY, Math.min(maxY, cp1y));
      cp2y = Math.max(minY, Math.min(maxY, cp2y));

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  };

  // =========================================================================
  // 3. RESPONSIVE CHART RENDERERS (Zero Font Stretching - Requirement 3)
  // =========================================================================

  // AREA & LINE CHART
  const renderAreaChart = () => {
    const boxX = 52;
    const boxY = 25;
    const totalW = Math.max(340, chartContainerWidth);
    const boxW = Math.max(220, totalW - 74);
    const boxH = 240;
    const yTicks = [100, 75, 50, 25, 0];

    const currentDisplaySites = displaySites;
    const n = currentDisplaySites.length;
    if (n === 0) return null;

    const points = currentDisplaySites.map((site, idx) => {
      const val = site.isMissing ? 0 : site.val;
      return {
        x: boxX + (n === 1 ? boxW / 2 : (idx / (n - 1)) * boxW),
        y: boxY + boxH - (Math.min(100, Math.max(0, val)) / 100) * boxH,
        val,
        isMissing: site.isMissing,
        site
      };
    });

    const minY = boxY;
    const maxY = boxY + boxH;

    const curve = getClampedBezierPath(points, minY, maxY);
    const area = `${curve} L ${boxX + boxW},${maxY} L ${boxX},${maxY} Z`;

    const hoveredPoint = hoveredSiteIndex !== null && points[hoveredSiteIndex] ? points[hoveredSiteIndex] : null;
    const currentMetricInfo = METRIC_OPTIONS.find(m => m.id === activeMetric) || METRIC_OPTIONS[0];

    return (
      <div ref={chartContainerRef} style={{ width: '100%', padding: '10px 0', position: 'relative', fontFamily }}>
        <svg
          width="100%"
          height="380"
          viewBox={`0 0 ${totalW} 380`}
          preserveAspectRatio="xMinYMin meet"
          style={{ overflow: 'visible', display: 'block' }}
        >
          {/* Border frame */}
          <rect x={boxX} y={boxY} width={boxW} height={boxH} fill="none" stroke={cardBorder} strokeWidth="1" />

          {/* Horizontal Dashed Lines */}
          {yTicks.map((val) => {
            const yPos = boxY + boxH - (val / 100) * boxH;
            return (
              <g key={val}>
                <text x={boxX - 10} y={yPos + 4} textAnchor="end" fill={textMuted} fontSize="10.5" fontWeight="500" fontFamily={fontFamily}>
                  {val}%
                </text>
                <line
                  x1={boxX}
                  y1={yPos}
                  x2={boxX + boxW}
                  y2={yPos}
                  stroke={gridLineColor}
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
              </g>
            );
          })}

          {/* Vertical grid lines */}
          {points.map((pt, idx) => (
            <line
              key={`vert-${idx}`}
              x1={pt.x}
              y1={boxY}
              x2={pt.x}
              y2={boxY + boxH}
              stroke={gridLineColor}
              strokeWidth="1"
              strokeDasharray="3,3"
            />
          ))}

          {/* Shaded Area */}
          {chartType === 'Area' && (
            <path
              d={area}
              fill={`${currentMetricInfo.color}33`}
            />
          )}

          {/* Curve Stroke */}
          <path
            d={curve}
            fill="none"
            stroke={currentMetricInfo.color}
            strokeWidth="2.5"
          />

          {/* Points & Hover / Click Target Areas */}
          {points.map((pt, idx) => {
            const isSelected = selectedSite === pt.site.siteName;
            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredSiteIndex(idx)}
                onMouseLeave={() => setHoveredSiteIndex(null)}
                onClick={() => handleChartSiteClick(pt.site)}
                style={{ cursor: 'pointer' }}
              >
                <title>{`${pt.site.siteName}\n${activeMetric === 'tat' ? (pt.site.tat > 0 ? `TAT Compliance: ${pt.site.tat}%` : 'TAT Compliance: No applicable data') : `${currentMetricInfo.label}: ${pt.isMissing ? '-' : `${pt.val}%`}`}\n(Click to filter dashboard)`}</title>
                <rect x={pt.x - 16} y={boxY} width="32" height={boxH + 50} fill="transparent" />

                {(hoveredSiteIndex === idx || isSelected || pt.val > 0) && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 7 : (hoveredSiteIndex === idx ? 6 : 4)}
                    fill={isSelected ? '#00C853' : currentMetricInfo.color}
                    stroke={cardBg}
                    strokeWidth="2.5"
                    style={{ transition: 'all 0.15s ease' }}
                  />
                )}
              </g>
            );
          })}

          {/* Clean Diagonal X-Axis Labels (No horizontal stretching) */}
          {points.map((pt, idx) => {
            const isSelected = selectedSite === pt.site.siteName;
            const displayName = pt.site.siteName.length > 15 ? `${pt.site.siteName.slice(0, 13)}…` : pt.site.siteName;
            return (
              <g 
                key={`lbl-${idx}`} 
                transform={`translate(${pt.x}, ${boxY + boxH + 16})`}
                onClick={() => handleChartSiteClick(pt.site)}
                style={{ cursor: 'pointer' }}
              >
                <text
                  x="0"
                  y="0"
                  transform="rotate(-35)"
                  textAnchor="end"
                  fill={isSelected ? '#00C853' : (hoveredSiteIndex === idx ? (isLight ? '#0F172A' : '#FFFFFF') : textMuted)}
                  fontSize="10.5"
                  fontWeight={isSelected || hoveredSiteIndex === idx ? 700 : 500}
                  fontFamily={fontFamily}
                >
                  {displayName}
                </text>
              </g>
            );
          })}

          {/* Interactive Tooltip Overlay */}
          {hoveredPoint && (
            <g transform={`translate(${Math.max(boxX + 10, Math.min(boxX + boxW - 160, hoveredPoint.x - 75))}, ${Math.max(boxY + 10, hoveredPoint.y - 75)})`}>
              <rect
                x="0"
                y="0"
                width="160"
                height="62"
                rx="8"
                fill={cardBg}
                stroke={cardBorder}
                filter="drop-shadow(0 6px 16px rgba(0,0,0,0.3))"
              />
              <text x="12" y="18" fill={textPrimary} fontSize="11" fontWeight="700" fontFamily={fontFamily}>
                {hoveredPoint.site.siteName}
              </text>
              <text x="12" y="34" fill={currentMetricInfo.color} fontSize="11" fontWeight="600" fontFamily={fontFamily}>
                {activeMetric === 'tat'
                  ? (hoveredPoint.site.tat > 0 ? `TAT Compliance: ${hoveredPoint.site.tat}%` : 'TAT Compliance: No applicable data')
                  : `${currentMetricInfo.label}: ${hoveredPoint.isMissing ? '-' : `${hoveredPoint.val}%`}`}
              </text>
              <text x="12" y="50" fill={textMuted} fontSize="9.5" fontFamily={fontFamily}>
                Region: {hoveredPoint.site.region} | Click to filter
              </text>
            </g>
          )}
        </svg>
      </div>
    );
  };

  // PIE & DONUT CHART
  const renderPieChart = () => {
    const totalW = Math.max(340, chartContainerWidth);
    const cx = totalW / 2;
    const cy = 200;
    const r = Math.min(140, Math.floor(totalW * 0.22));
    const isDonut = chartType === 'Donut';
    const innerR = isDonut ? r * 0.6 : 0;

    const positiveSites = displaySites.filter(s => s.val > 0);
    const totalPositive = positiveSites.reduce((sum, s) => sum + s.val, 0) || 1;

    let accumAngle = -Math.PI / 2;

    const slices = positiveSites.map((site) => {
      const val = site.val;
      const sweepAngle = (val / totalPositive) * (2 * Math.PI);
      const start = accumAngle;
      const end = accumAngle + sweepAngle;
      const mid = start + sweepAngle / 2;
      accumAngle = end;

      const x1 = cx + r * Math.cos(start);
      const y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(end);
      const y2 = cy + r * Math.sin(end);
      const largeArc = sweepAngle > Math.PI ? 1 : 0;

      let pathData = '';
      if (isDonut) {
        const ix1 = cx + innerR * Math.cos(start);
        const iy1 = cy + innerR * Math.sin(start);
        const ix2 = cx + innerR * Math.cos(end);
        const iy2 = cy + innerR * Math.sin(end);
        pathData = `M ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} L ${ix2},${iy2} A ${innerR},${innerR} 0 ${largeArc},0 ${ix1},${iy1} Z`;
      } else {
        pathData = `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;
      }

      const calloutR1 = r;
      const calloutR2 = r + 24;
      const lineStart = { x: cx + calloutR1 * Math.cos(mid), y: cy + calloutR1 * Math.sin(mid) };
      const lineElbow = { x: cx + calloutR2 * Math.cos(mid), y: cy + calloutR2 * Math.sin(mid) };
      const isRight = Math.cos(mid) >= 0;
      const lineEnd = { x: lineElbow.x + (isRight ? 24 : -24), y: lineElbow.y };

      return {
        ...site,
        val,
        pathData,
        lineStart,
        lineElbow,
        lineEnd,
        isRight
      };
    });

    const currentMetricInfo = METRIC_OPTIONS.find(m => m.id === activeMetric) || METRIC_OPTIONS[0];

    return (
      <div ref={chartContainerRef} style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '16px 0', fontFamily }}>
        <svg width="100%" height="420" viewBox={`0 0 ${totalW} 420`} preserveAspectRatio="xMinYMin meet" style={{ overflow: 'visible', maxWidth: '900px' }}>
          {slices.map((slice, idx) => {
            const isSelected = selectedSite === slice.siteName;
            return (
              <g 
                key={idx} 
                onClick={() => handleChartSiteClick(slice)} 
                style={{ cursor: 'pointer' }}
              >
                <path
                  d={slice.pathData}
                  fill={isSelected ? '#00C853' : currentMetricInfo.color}
                  opacity={isSelected ? 1 : 0.82}
                  stroke={cardBg}
                  strokeWidth="2"
                  style={{ transition: 'all 0.15s ease' }}
                >
                  <title>{`${slice.siteName}: ${slice.val}%\n(Click to filter dashboard)`}</title>
                </path>

                <polyline
                  points={`${slice.lineStart.x},${slice.lineStart.y} ${slice.lineElbow.x},${slice.lineElbow.y} ${slice.lineEnd.x},${slice.lineEnd.y}`}
                  fill="none"
                  stroke={isSelected ? '#00C853' : textMuted}
                  strokeWidth="1.2"
                />
                <text
                  x={slice.lineEnd.x + (slice.isRight ? 6 : -6)}
                  y={slice.lineEnd.y + 4}
                  textAnchor={slice.isRight ? 'start' : 'end'}
                  fill={isSelected ? '#00C853' : textPrimary}
                  fontSize="11"
                  fontWeight={isSelected ? 700 : 500}
                  fontFamily={fontFamily}
                >
                  {slice.siteName} ({slice.val}%)
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // RADAR SPIDER CHART
  const renderRadarChart = () => {
    const totalW = Math.max(340, chartContainerWidth);
    const cx = totalW / 2;
    const cy = 200;
    const maxRadius = Math.min(150, Math.floor(totalW * 0.22));
    const radarSites = displaySites;
    const numSpokes = radarSites.length;
    if (numSpokes < 3) return null;

    const rings = [25, 50, 75, 100];
    const getAngle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / numSpokes;
    const getSpokePoint = (i, r) => {
      const theta = getAngle(i);
      return {
        x: cx + r * Math.cos(theta),
        y: cy + r * Math.sin(theta)
      };
    };

    // Health polygon
    const healthPolygon = radarSites
      .map((site, idx) => {
        const val = site.health ?? 0;
        const r = (val / 100) * maxRadius;
        const pt = getSpokePoint(idx, r);
        return `${pt.x},${pt.y}`;
      })
      .join(' ');

    // TAT polygon
    const tatPolygon = radarSites
      .map((site, idx) => {
        const val = site.tat ?? 0;
        const r = (val / 100) * maxRadius;
        const pt = getSpokePoint(idx, r);
        return `${pt.x},${pt.y}`;
      })
      .join(' ');

    return (
      <div ref={chartContainerRef} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', fontFamily }}>
        <svg width="100%" height="440" viewBox={`0 0 ${totalW} 440`} preserveAspectRatio="xMinYMin meet" style={{ overflow: 'visible', maxWidth: '850px' }}>
          {rings.map((ringVal) => {
            const ringR = (ringVal / 100) * maxRadius;
            return (
              <g key={ringVal}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={ringR}
                  fill="none"
                  stroke={isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.12)'}
                  strokeWidth="1"
                  strokeDasharray={ringVal === 100 ? 'none' : '3,3'}
                />
                <text
                  x={cx + 4}
                  y={cy - ringR + 12}
                  fill={textMuted}
                  fontSize="9.5"
                  textAnchor="start"
                  fontFamily={fontFamily}
                >
                  {ringVal}%
                </text>
              </g>
            );
          })}

          {radarSites.map((site, idx) => {
            const endPt = getSpokePoint(idx, maxRadius);
            const isSelected = selectedSite === site.siteName;
            return (
              <line
                key={idx}
                x1={cx}
                y1={cy}
                x2={endPt.x}
                y2={endPt.y}
                stroke={isSelected ? '#00C853' : (isLight ? '#CBD5E1' : 'rgba(255, 255, 255, 0.1)')}
                strokeWidth={isSelected ? 1.8 : 1}
              />
            );
          })}

          {/* Purple Health Polygon */}
          <polygon
            points={healthPolygon}
            fill="rgba(147, 51, 234, 0.28)"
            stroke="#9333EA"
            strokeWidth="2"
          />

          {/* Orange TAT Polygon */}
          <polygon
            points={tatPolygon}
            fill="rgba(234, 88, 12, 0.22)"
            stroke="#EA580C"
            strokeWidth="2"
          />

          {/* Spokes & Category Labels */}
          {radarSites.map((site, idx) => {
            const labelR = maxRadius + 20;
            const pt = getSpokePoint(idx, labelR);
            const theta = getAngle(idx);
            const cos = Math.cos(theta);
            const isSelected = selectedSite === site.siteName;

            let anchor = 'middle';
            if (cos > 0.25) anchor = 'start';
            else if (cos < -0.25) anchor = 'end';

            const displayName = site.siteName.length > 15 ? `${site.siteName.slice(0, 13)}…` : site.siteName;

            return (
              <text
                key={idx}
                x={pt.x}
                y={pt.y + 4}
                textAnchor={anchor}
                fill={isSelected ? '#00C853' : (isLight ? '#0F172A' : textMuted)}
                fontSize="10"
                fontWeight={isSelected ? 700 : 500}
                fontFamily={fontFamily}
                onClick={() => handleChartSiteClick(site)}
                style={{ cursor: 'pointer' }}
              >
                {displayName}
              </text>
            );
          })}
        </svg>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '14px', fontSize: '0.8125rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: '#9333EA', borderRadius: '2px' }} />
            <span style={{ fontWeight: 600, color: '#9333EA' }}>Health Score</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: '#EA580C', borderRadius: '2px' }} />
            <span style={{ fontWeight: 600, color: '#EA580C' }}>TAT Compliance</span>
          </div>
        </div>
      </div>
    );
  };

  // HORIZONTAL BAR CHART (via dynamically responsive EnterpriseBarChart)
  const renderHorizontalBarChart = () => (
    <div style={{ width: '100%', padding: '8px 0' }}>
      <EnterpriseBarChart
        data={displaySites}
        orientation="Horizontal Bar"
        metricType="percentage"
        yAxisTitle="Score (%)"
        topN={siteTopN}
        accentColor="#00C853"
        isLight={isLight}
        height={340}
        selectedSite={selectedSite}
        onItemClick={handleChartSiteClick}
      />
    </div>
  );

  // VERTICAL BAR CHART (via dynamically responsive EnterpriseBarChart)
  const renderVerticalBarChart = () => (
    <div style={{ width: '100%', padding: '8px 0' }}>
      <EnterpriseBarChart
        data={displaySites}
        orientation="Vertical Bar"
        metricType="percentage"
        yAxisTitle="Score (%)"
        topN={siteTopN}
        accentColor="#00C853"
        isLight={isLight}
        height={340}
        selectedSite={selectedSite}
        onItemClick={handleChartSiteClick}
      />
    </div>
  );

  return (
    <section id="sites-section" style={{ marginBottom: '32px' }} className="animate-fade-in stagger-2">
      <div className="glass-card" style={{ padding: '24px' }}>
        {/* SECTION HEADER & CONTROLS TOOLBAR */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '16px'
          }}
        >
          {/* Title & Metadata */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.05)',
                border: isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: textMuted
              }}
            >
              <MapPin size={20} strokeWidth={2} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: textPrimary,
                    letterSpacing: '-0.01em',
                    margin: 0
                  }}
                >
                  Site Performance Overview
                </h3>
                {selectedSite !== 'All Sites' && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: 'rgba(0, 200, 83, 0.15)',
                      color: '#00E676',
                      border: '1px solid rgba(0, 200, 83, 0.3)'
                    }}
                  >
                    <span>Filtered: {selectedSite}</span>
                    <button
                      type="button"
                      onClick={() => onSiteSelect && onSiteSelect('All Sites')}
                      title="Reset site filter"
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', display: 'flex' }}
                    >
                      <X size={11} />
                    </button>
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.8125rem', color: textMuted, margin: '2px 0 0 0' }}>
                {filteredSites.length} of {sites.length} sites
              </p>
            </div>
          </div>

          {/* Right Toolbar Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: '180px' }}>
              <Search
                size={14}
                color={textMuted}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search sites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 30px',
                  fontSize: '0.8125rem',
                  borderRadius: '6px',
                  border: `1px solid ${cardBorder}`,
                  backgroundColor: cardBg,
                  color: textPrimary,
                  outline: 'none',
                  fontFamily
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: textMuted
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Segmented Table / Heatmap Toggle */}
            <div style={{ display: 'inline-flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={{
                  padding: '5px 14px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: viewMode === 'table' ? '#8B5CF6' : (isLight ? '#F1F5F9' : '#1E293B'),
                  color: viewMode === 'table' ? '#FFFFFF' : textMuted,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode('heatmap')}
                style={{
                  padding: '5px 14px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: viewMode === 'heatmap' ? '1.5px solid #EA580C' : `1px solid ${cardBorder}`,
                  backgroundColor: cardBg,
                  color: viewMode === 'heatmap' ? textPrimary : textMuted,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Heatmap
              </button>
            </div>

            {/* Chart Type Selector Dropdown */}
            <div ref={chartDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsChartDropdownOpen(!isChartDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  color: textPrimary,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                <span>{chartType}</span>
                <ChevronDown size={14} style={{ color: textMuted, transform: isChartDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
              </button>

              {isChartDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    right: 0,
                    width: '140px',
                    backgroundColor: isLight ? '#FFFFFF' : '#1E293B',
                    border: `1px solid ${cardBorder}`,
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                    zIndex: 60,
                    padding: '4px'
                  }}
                >
                  {CHART_TYPES.map((type) => {
                    const isActive = chartType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setChartType(type);
                          setViewMode('heatmap');
                          setIsChartDropdownOpen(false);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: isActive ? (isLight ? '#F1F5F9' : '#334155') : 'transparent',
                          color: isActive ? '#00C853' : textPrimary,
                          fontSize: '0.75rem',
                          fontWeight: isActive ? 600 : 400,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span>{type}</span>
                        {isActive && <Check size={12} strokeWidth={2.5} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dynamic Top-N Filter based strictly on dataset length (Requirement 7) */}
            {hasMoreThan5Sites && (
              <ChartDropdown
                selectedType={siteTopN}
                onChange={setSiteTopN}
                options={siteTopNOptions}
                isLight={isLight}
                accentColor="#00C853"
              />
            )}

            {/* Site Dropdown Selector (Single source of truth with header) */}
            <div ref={siteDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsSiteDropdownOpen(!isSiteDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: cardBg,
                  border: `1px solid ${selectedSite !== 'All Sites' ? '#00C853' : cardBorder}`,
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  color: selectedSite !== 'All Sites' ? '#00E676' : textPrimary,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <span>{selectedSite}</span>
                <ChevronDown size={14} style={{ color: textMuted, transform: isSiteDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
              </button>

              {isSiteDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    right: 0,
                    width: '190px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    backgroundColor: isLight ? '#FFFFFF' : '#1E293B',
                    border: `1px solid ${cardBorder}`,
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
                    zIndex: 60,
                    padding: '4px'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (onSiteSelect) onSiteSelect('All Sites');
                      setIsSiteDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '7px 10px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: selectedSite === 'All Sites' ? (isLight ? '#F1F5F9' : '#334155') : 'transparent',
                      color: selectedSite === 'All Sites' ? '#00C853' : textPrimary,
                      fontSize: '0.8125rem',
                      fontWeight: selectedSite === 'All Sites' ? 700 : 400,
                      cursor: 'pointer'
                    }}
                  >
                    All Sites
                  </button>
                  {sitePerformanceData.map((s) => (
                    <button
                      key={s.siteId || s.siteName}
                      type="button"
                      onClick={() => {
                        if (onSiteSelect) onSiteSelect(s.siteName);
                        setIsSiteDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '7px 10px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: selectedSite === s.siteName ? (isLight ? '#F1F5F9' : '#334155') : 'transparent',
                        color: selectedSite === s.siteName ? '#00C853' : textPrimary,
                        fontSize: '0.8125rem',
                        fontWeight: selectedSite === s.siteName ? 700 : 400,
                        cursor: 'pointer'
                      }}
                    >
                      {s.siteName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Meaningful Metric Switcher Pills for Charts (Requirement 8) */}
        {viewMode === 'heatmap' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: textMuted }}>Plot Metric:</span>
            {METRIC_OPTIONS.map((m) => {
              const isActive = activeMetric === m.id;
              const IconComp = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveMetric(m.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: isActive ? `1.5px solid ${m.color}` : `1px solid ${cardBorder}`,
                    backgroundColor: isActive ? (isLight ? `${m.color}15` : `${m.color}25`) : 'transparent',
                    color: isActive ? m.color : textMuted,
                    fontSize: '0.75rem',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <IconComp size={12} color={isActive ? m.color : textMuted} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* VIEW MODE: HEATMAP OR TABLE */}
        {viewMode === 'heatmap' ? (
          <div style={{ width: '100%' }}>
            {chartType === 'Horizontal Bar' && renderHorizontalBarChart()}
            {chartType === 'Vertical Bar' && renderVerticalBarChart()}
            {chartType === 'Area' && renderAreaChart()}
            {chartType === 'Line' && renderAreaChart()}
            {chartType === 'Pie' && renderPieChart()}
            {chartType === 'Donut' && renderPieChart()}
            {chartType === 'Radar' && renderRadarChart()}
          </div>
        ) : (
          /* =========================================================================
             4. TABLE VIEW WITH 10 ITEMS PER PAGE PAGINATION
             Columns strictly match Requirements 1 & 2:
             SITE NAME | REGION | CITY | HEALTH | TAT | PPM | >
             No "#", no "ACTION" / "DETAILS" text column
             ========================================================================= */
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: isLight ? '#F8FAFC' : 'rgba(23, 31, 48, 0.95)',
                    borderBottom: isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: isLight ? '#475569' : '#94A3B8',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  <th
                    onClick={() => handleSort('siteName')}
                    style={{ padding: '12px 18px', cursor: 'pointer', borderTopLeftRadius: '10px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>SITE NAME</span>
                      <ArrowUpDown size={12} opacity={0.8} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('region')}
                    style={{ padding: '12px 18px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>REGION</span>
                      <ArrowUpDown size={12} opacity={0.8} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('city')}
                    style={{ padding: '12px 18px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>CITY</span>
                      <ArrowUpDown size={12} opacity={0.8} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('health')}
                    style={{ padding: '12px 18px', cursor: 'pointer', textAlign: 'center' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <span>HEALTH</span>
                      <ArrowUpDown size={12} opacity={0.8} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('tat')}
                    style={{ padding: '12px 18px', cursor: 'pointer', textAlign: 'center' }}
                    title="Turnaround Time (TAT) Compliance Percentage"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <span>TAT</span>
                      <ArrowUpDown size={12} opacity={0.8} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('ppm')}
                    style={{ padding: '12px 18px', cursor: 'pointer', textAlign: 'center' }}
                    title="Planned Preventive Maintenance Adherence Percentage"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <span>PPM</span>
                      <ArrowUpDown size={12} opacity={0.8} />
                    </div>
                  </th>
                  {/* Empty header for right arrow navigation - NO "Action" or "Details" text (Requirement 2) */}
                  <th style={{ padding: '12px 16px', textAlign: 'center', borderTopRightRadius: '10px', width: '48px' }}>
                    <span style={{ display: 'none' }}>Navigation</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSites.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: textMuted }}>
                      No matching facility sites found for &quot;{searchQuery}&quot;
                    </td>
                  </tr>
                ) : (
                  paginatedSites.map((site, index) => {
                    const isEven = index % 2 === 0;
                    const isSelected = selectedSite === site.siteName;

                    return (
                      <tr
                        key={site.siteId || index}
                        onClick={() => setActiveSiteModal(site.raw || site)}
                        title={`Click to open ${site.siteName} performance drilldown`}
                        style={{
                          backgroundColor: isSelected
                            ? (isLight ? '#ECFDF5' : 'rgba(0, 200, 83, 0.16)')
                            : isEven 
                            ? (isLight ? '#FFFFFF' : 'rgba(16, 22, 34, 0.6)') 
                            : (isLight ? '#F8FAFC' : 'rgba(21, 28, 42, 0.6)'),
                          borderBottom: isLight ? '1px solid #F1F5F9' : '1px solid rgba(255, 255, 255, 0.05)',
                          boxShadow: isSelected ? 'inset 3px 0 0 #00C853' : 'none',
                          transition: 'background-color 0.15s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = isLight ? '#F1F5F9' : 'rgba(0, 200, 83, 0.08)';
                          }
                          const arrow = e.currentTarget.querySelector('.row-nav-arrow');
                          if (arrow) arrow.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = isEven 
                              ? (isLight ? '#FFFFFF' : 'rgba(16, 22, 34, 0.6)') 
                              : (isLight ? '#F8FAFC' : 'rgba(21, 28, 42, 0.6)');
                          }
                          const arrow = e.currentTarget.querySelector('.row-nav-arrow');
                          if (arrow) arrow.style.transform = 'none';
                        }}
                      >
                        <td style={{ padding: '13px 18px', fontWeight: 700, color: isSelected ? '#00E676' : textPrimary, fontSize: '0.875rem' }}>
                          {site.siteName}
                        </td>
                        <td style={{ padding: '13px 18px', color: textMuted, fontSize: '0.8125rem' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              backgroundColor: site.region === 'North' 
                                ? (isLight ? '#EFF6FF' : 'rgba(56, 189, 248, 0.15)') 
                                : site.region === 'South' 
                                ? (isLight ? '#ECFDF5' : 'rgba(0, 200, 83, 0.15)') 
                                : site.region === 'Mumbai'
                                ? (isLight ? '#F5F3FF' : 'rgba(139, 92, 246, 0.15)')
                                : (isLight ? '#FFF7ED' : 'rgba(255, 91, 34, 0.15)'),
                              color: site.region === 'North' 
                                ? (isLight ? '#1D4ED8' : '#38BDF8') 
                                : site.region === 'South' 
                                ? (isLight ? '#047857' : '#00E676') 
                                : site.region === 'Mumbai'
                                ? (isLight ? '#7C3AED' : '#A78BFA')
                                : (isLight ? '#C2410C' : '#FF7A45'),
                              fontWeight: 700
                            }}
                          >
                            {site.region}
                          </span>
                        </td>
                        <td style={{ padding: '13px 18px', color: textMuted, fontSize: '0.8125rem' }}>
                          {site.city}
                        </td>
                        <td style={{ padding: '13px 18px', textAlign: 'center' }}>
                          {renderMetricBadge(site.health, site.hasHealthData)}
                        </td>
                        <td style={{ padding: '13px 18px', textAlign: 'center' }}>
                          {renderTatBadge(site.tat)}
                        </td>
                        <td style={{ padding: '13px 18px', textAlign: 'center' }}>
                          {renderMetricBadge(site.ppm, site.hasPpmData)}
                        </td>
                        {/* Only right arrow icon vertically centered (Requirement 2 & 16) */}
                        <td style={{ padding: '13px 16px', textAlign: 'center', width: '48px' }}>
                          <ChevronRight 
                            size={18} 
                            className="row-nav-arrow" 
                            style={{ 
                              color: isSelected ? '#00E676' : (isLight ? '#94A3B8' : '#64748B'), 
                              transition: 'transform 0.18s ease, color 0.18s ease',
                              display: 'inline-block',
                              verticalAlign: 'middle'
                            }} 
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Pagination Controls Toolbar */}
            {filteredSites.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderTop: isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: isLight ? '#F8FAFC' : 'rgba(14, 19, 30, 0.8)',
                  flexWrap: 'wrap',
                  gap: '12px',
                  borderBottomLeftRadius: '14px',
                  borderBottomRightRadius: '14px'
                }}
              >
                <div style={{ fontSize: '0.8125rem', color: textMuted }}>
                  Showing <strong style={{ color: textPrimary }}>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                  <strong style={{ color: textPrimary }}>
                    {Math.min(currentPage * pageSize, filteredSites.length)}
                  </strong> of <strong style={{ color: textPrimary }}>{filteredSites.length}</strong> sites
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255, 255, 255, 0.12)',
                      backgroundColor: cardBg,
                      color: currentPage === 1 ? textMuted : textPrimary,
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      opacity: currentPage === 1 ? 0.5 : 1,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        style={{
                          minWidth: '32px',
                          height: '32px',
                          padding: '0 8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          borderRadius: '8px',
                          border: isActive ? 'none' : `1px solid ${cardBorder}`,
                          backgroundColor: isActive ? '#00C853' : cardBg,
                          color: isActive ? '#090D14' : textPrimary,
                          cursor: 'pointer',
                          boxShadow: isActive ? '0 2px 8px rgba(0, 200, 83, 0.4)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255, 255, 255, 0.12)',
                      backgroundColor: cardBg,
                      color: currentPage === totalPages ? textMuted : textPrimary,
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      opacity: currentPage === totalPages ? 0.5 : 1,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Comprehensive 5-Level Enterprise Site Performance Drill-Down Drawer */}
        <SiteDrillDownDrawer
          isOpen={Boolean(activeSiteModal)}
          onClose={() => setActiveSiteModal(null)}
          site={activeSiteModal}
          theme={theme}
          onSiteSelect={onSiteSelect}
        />
      </div>
    </section>
  );
}
