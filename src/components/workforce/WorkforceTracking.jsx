import { useState, useRef, useEffect, useMemo } from 'react';
import { Users, UserCheck, UserX, ChevronDown, Check } from 'lucide-react';
import AnimatedNumber from '../common/AnimatedNumber';
import ChartDropdown from '../common/ChartDropdown';
import ChartHeader from '../common/ChartHeader';
import EnterpriseBarChart, { useTopNFilter } from '../common/EnterpriseBarChart';
import { formatCategoryLabel, formatPercentage, formatNumber } from '../../utils/analyticsFormatters';

const CHART_TYPES = [
  'Horizontal Bar',
  'Vertical Bar',
  'Line',
  'Area',
  'Pie',
  'Donut',
  'Radar'
];

export default function WorkforceTracking({
  workforceData,
  triggerKey = 0,
  theme = 'dark',
  selectedSite = 'All Sites',
  onSiteSelect,
  sites = [],
  selectedVendor = 'All Vendors',
  onDrillDown
}) {
  const isLight = theme === 'light';

  const {
    totalEmployees = 46,
    overallAvailability = 15.2,
    present = 7,
    absent = 39,
    byVendor = [{ name: 'In-House', present: 7, absent: 39, total: 46 }],
    byWorkType = [
      { type: 'Technical', count: 2, color: '#FF5B22' },
      { type: 'Security', count: 11, color: '#F97316' },
      { type: 'Unknown!', count: 1, color: '#FB923C' },
      { type: 'Property Manager', count: 2, color: '#F59E0B' },
      { type: 'Facility Executive', count: 2, color: '#EA580C' },
      { type: 'Security Guard', count: 9, color: '#C2410C' },
      { type: 'Multi Skilled Technician', count: 4, color: '#FF7A45' },
      { type: 'Housekeeping Staff', count: 5, color: '#059669' },
      { type: 'Horizon Project', count: 1, color: '#FF8A00' },
      { type: 'Project C&W', count: 7, color: '#475569' },
      { type: 'Pantry', count: 1, color: '#D97706' },
      { type: 'Bouncer', count: 1, color: '#FFA000' }
    ],
    lowAvailabilityVendors = [
      { vendor: 'In-House', present: 0, total: 46, percentage: 0 }
    ]
  } = workforceData || {};

  // Dropdown states
  const [vendorChartType, setVendorChartType] = useState('Area');
  const [workTypeChartType, setWorkTypeChartType] = useState('Area');
  const [isSiteDropdownOpen, setIsSiteDropdownOpen] = useState(false);
  const [selectedWorkTypeIndex, setSelectedWorkTypeIndex] = useState(null);

  const formattedWorkTypes = useMemo(() => {
    return (byWorkType || []).map((wt) => ({
      ...wt,
      label: wt.type,
      name: wt.type,
      value: wt.count,
      color: wt.color || '#FF5B22'
    }));
  }, [byWorkType]);

  const {
    topN: workTypeTopN,
    setTopN: setWorkTypeTopN,
    hasMoreThan5: hasMoreThan5WorkTypes,
    displayData: displayWorkTypes,
    topNOptions: workTypeTopNOptions
  } = useTopNFilter(formattedWorkTypes, 'Top 5');

  // Close site dropdown on outside click
  const siteRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (siteRef.current && !siteRef.current.contains(event.target)) {
        setIsSiteDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Theme styling tokens
  const cardBg = isLight ? '#FFFFFF' : '#111827';
  const cardBorder = isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)';
  const cardShadow = isLight ? '0 1px 3px rgba(0, 0, 0, 0.05)' : '0 4px 20px rgba(0, 0, 0, 0.4)';
  const textPrimary = isLight ? '#0F172A' : '#F8FAFC';
  const textMuted = isLight ? '#64748B' : '#94A3B8';
  const headerColor = isLight ? '#475569' : '#94A3B8';
  const gridLineColor = isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)';

  // Helper to calculate smooth bezier curve string
  const getCatmullRomBezierPath = (points) => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i !== points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  };

  // Helper renderer for By Vendor charts
  const renderVendorChart = () => {
    // 1. AREA CHART (Matches User Screenshot 1)
    if (vendorChartType === 'Area' || vendorChartType === 'Line') {
      const yTicks = [60, 45, 30, 15, 0];
      const boxX = 35;
      const boxY = 15;
      const boxW = 185;
      const boxH = 100;

      const presentY = boxY + boxH - (present / 60) * boxH; // ~103.3
      const absentY = boxY + boxH - (absent / 60) * boxH; // ~50

      return (
        <div style={{ height: '175px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <svg width="235" height="135" viewBox="0 0 235 135">
            {/* Border frame */}
            <rect x={boxX} y={boxY} width={boxW} height={boxH} fill="none" stroke={cardBorder} strokeWidth="1" />

            {/* Horizontal Dashed Gridlines & Ticks */}
            {yTicks.map((val) => {
              const yPos = boxY + boxH - (val / 60) * boxH;
              return (
                <g key={val}>
                  <text x={boxX - 6} y={yPos + 3.5} textAnchor="end" fill={textMuted} fontSize="9">
                    {val}
                  </text>
                  <line
                    x1={boxX}
                    y1={yPos}
                    x2={boxX + boxW}
                    y2={yPos}
                    stroke={gridLineColor}
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                </g>
              );
            })}

            {/* Center vertical dashed line for In-House */}
            <line
              x1={boxX + boxW / 2}
              y1={boxY}
              x2={boxX + boxW / 2}
              y2={boxY + boxH}
              stroke={gridLineColor}
              strokeWidth="1"
              strokeDasharray="2,2"
            />

            {/* X-axis label */}
            <text x={boxX + boxW / 2} y={boxY + boxH + 14} textAnchor="middle" fill={textMuted} fontSize="9">
              In-House
            </text>

            {/* Present point: green hollow circle */}
            <circle cx={boxX + boxW / 2} cy={presentY} r="4" fill={cardBg} stroke="#10B981" strokeWidth="2" />

            {/* Absent point: red hollow circle */}
            <circle cx={boxX + boxW / 2} cy={absentY} r="4" fill={cardBg} stroke="#EF4444" strokeWidth="2" />
          </svg>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '8px', height: '1.5px', backgroundColor: '#10B981' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', border: '1.5px solid #10B981', backgroundColor: cardBg }} />
                <span style={{ width: '8px', height: '1.5px', backgroundColor: '#10B981' }} />
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 500 }}>Present</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '8px', height: '1.5px', backgroundColor: '#EF4444' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', border: '1.5px solid #EF4444', backgroundColor: cardBg }} />
                <span style={{ width: '8px', height: '1.5px', backgroundColor: '#EF4444' }} />
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#EF4444', fontWeight: 500 }}>Absent</span>
            </div>
          </div>
        </div>
      );
    }

    // 2. RADAR CHART
    if (vendorChartType === 'Radar') {
      return (
        <div style={{ height: '175px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="220" height="145" viewBox="0 0 220 145" style={{ overflow: 'visible' }}>
            <line x1="110" y1="24" x2="110" y2="120" stroke={isLight ? '#CBD5E1' : '#475569'} strokeWidth="1" />
            <line x1="110" y1="120" x2="185" y2="120" stroke={isLight ? '#CBD5E1' : '#475569'} strokeWidth="1" />
            
            <text x="110" y="14" textAnchor="middle" fill={textMuted} fontSize="11" fontWeight="500">
              In-House
            </text>

            {[0, 15, 30, 45].map((val, idx) => {
              const xPos = 110 + idx * 20;
              return (
                <g key={idx}>
                  <line x1={xPos} y1="120" x2={xPos} y2="124" stroke={isLight ? '#94A3B8' : '#64748B'} strokeWidth="1" />
                  <text x={xPos} y="135" textAnchor="middle" fill={textMuted} fontSize="9">
                    {val}
                  </text>
                </g>
              );
            })}

            <polygon points="110,120 110,105 120,120" fill="rgba(16, 185, 129, 0.3)" stroke="#10B981" strokeWidth="2" />
            <polygon points="110,120 110,38 170,120" fill="rgba(239, 68, 68, 0.2)" stroke="#EF4444" strokeWidth="2" />
          </svg>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#10B981', borderRadius: '2px' }} />
              <span style={{ fontSize: '0.6875rem', color: '#10B981' }}>Present</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#EF4444', borderRadius: '2px' }} />
              <span style={{ fontSize: '0.6875rem', color: '#EF4444' }}>Absent</span>
            </div>
          </div>
        </div>
      );
    }

    // 3. VERTICAL BAR & HORIZONTAL BAR
    if (vendorChartType === 'Vertical Bar' || vendorChartType === 'Horizontal Bar') {
      const vendorItems = [
        { label: 'Present', value: present, color: '#10B981' },
        { label: 'Absent', value: absent, color: '#EF4444' }
      ];
      return (
        <div style={{ height: '175px', width: '100%', display: 'flex', alignItems: 'center' }}>
          <EnterpriseBarChart
            data={vendorItems}
            orientation={vendorChartType}
            metricType="count"
            yAxisTitle="Staff"
            topN="All"
            accentColor="#10B981"
            isLight={isLight}
            height={175}
          />
        </div>
      );
    }

    // 5. PIE & DONUT
    const isDonut = vendorChartType === 'Donut';
    const size = 120;
    const radius = isDonut ? 44 : 50;
    const strokeWidth = isDonut ? 18 : 0;
    const circ = 2 * Math.PI * radius;
    const presentRatio = present / totalEmployees;
    const absentRatio = absent / totalEmployees;

    return (
      <div style={{ height: '175px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
            {isDonut ? (
              <>
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke="#10B981"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${presentRatio * circ} ${circ}`}
                  strokeDashoffset={0}
                />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke="#EF4444"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${absentRatio * circ} ${circ}`}
                  strokeDashoffset={-(presentRatio * circ)}
                />
              </>
            ) : (
              <>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="#EF4444" />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius / 2}
                  fill="transparent"
                  stroke="#10B981"
                  strokeWidth={radius}
                  strokeDasharray={`${presentRatio * (2 * Math.PI * (radius / 2))} 1000`}
                />
              </>
            )}
          </svg>
          {isDonut && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: textPrimary }}>{totalEmployees}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: '#10B981', borderRadius: '50%' }} />
            <span style={{ fontSize: '0.6875rem', color: textMuted }}>Present ({present})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: '#EF4444', borderRadius: '50%' }} />
            <span style={{ fontSize: '0.6875rem', color: textMuted }}>Absent ({absent})</span>
          </div>
        </div>
      </div>
    );
  };

  // Helper renderer for By Work Type charts
  const renderWorkTypeChart = () => {
    // 1. AREA CHART (Matches User Screenshot 1)
    if (workTypeChartType === 'Area' || workTypeChartType === 'Line') {
      const maxY = 12;
      const yTicks = [12, 9, 6, 3, 0];
      const boxX = 26;
      const boxY = 8;
      const boxW = 210;
      const boxH = 92;

      // 12 points coordinates
      const points = byWorkType.map((wt, idx) => ({
        x: boxX + (idx / (byWorkType.length - 1)) * boxW,
        y: boxY + boxH - (wt.count / maxY) * boxH
      }));

      const curvePath = getCatmullRomBezierPath(points);
      const areaPath = `${curvePath} L ${boxX + boxW},${boxY + boxH} L ${boxX},${boxY + boxH} Z`;

      return (
        <div style={{ width: '100%', marginBottom: '10px' }}>
          <svg width="100%" height="118" viewBox="0 0 248 118">
            {/* Border frame */}
            <rect x={boxX} y={boxY} width={boxW} height={boxH} fill="none" stroke={cardBorder} strokeWidth="1" />

            {/* Horizontal Dashed Lines */}
            {yTicks.map((val) => {
              const yPos = boxY + boxH - (val / maxY) * boxH;
              return (
                <g key={val}>
                  <text x={boxX - 4} y={yPos + 3.5} textAnchor="end" fill={textMuted} fontSize="9">
                    {val}
                  </text>
                  <line
                    x1={boxX}
                    y1={yPos}
                    x2={boxX + boxW}
                    y2={yPos}
                    stroke={gridLineColor}
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                </g>
              );
            })}

            <defs>
              <linearGradient id="workTypeOrangeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF7A45" stopOpacity={isLight ? 0.52 : 0.58} />
                <stop offset="60%" stopColor="#FF5B22" stopOpacity={isLight ? 0.22 : 0.26} />
                <stop offset="100%" stopColor="#EA580C" stopOpacity={isLight ? 0.02 : 0.04} />
              </linearGradient>
            </defs>

            {/* Filled smooth area in bright orange */}
            {workTypeChartType === 'Area' && (
              <path
                d={areaPath}
                fill="url(#workTypeOrangeGradient)"
              />
            )}

            {/* Smooth top curve in vibrant bright orange */}
            <path
              d={curvePath}
              fill="none"
              stroke={isLight ? '#FF5B22' : '#FB923C'}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Line data points when in Line view */}
            {workTypeChartType === 'Line' && points.map((p, idx) => (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r="3"
                fill={isLight ? '#FFFFFF' : '#0F172A'}
                stroke="#FF5B22"
                strokeWidth="2"
              />
            ))}

            {/* Selected work type highlight on curve in bright orange */}
            {selectedWorkTypeIndex !== null && points[selectedWorkTypeIndex] && (
              <g>
                <circle
                  cx={points[selectedWorkTypeIndex].x}
                  cy={points[selectedWorkTypeIndex].y}
                  r="7"
                  fill="rgba(255, 91, 34, 0.3)"
                />
                <circle
                  cx={points[selectedWorkTypeIndex].x}
                  cy={points[selectedWorkTypeIndex].y}
                  r="4"
                  fill="#FF5B22"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              </g>
            )}

            {/* X-axis labels matching user screenshot (Security, Multi Skilled Tech, Bouncer) */}
            <text x={boxX + 22} y={boxY + boxH + 12} textAnchor="middle" fill={textMuted} fontSize="7.5">
              Security
            </text>
            <text x={boxX + 115} y={boxY + boxH + 12} textAnchor="middle" fill={textMuted} fontSize="7.5">
              Multi Skilled Technician
            </text>
            <text x={boxX + boxW - 12} y={boxY + boxH + 12} textAnchor="middle" fill={textMuted} fontSize="7.5">
              Bouncer
            </text>
          </svg>
        </div>
      );
    }

    // 2. RADAR CHART (Matches User Screenshot 3)
    if (workTypeChartType === 'Radar') {
      const cx = 125;
      const cy = 76;
      const maxRadius = 55;
      const numSpokes = byWorkType.length; // 12
      const rings = [3, 6, 9, 12];

      // Angle for spoke i (starts at 12 o'clock, clockwise)
      const getAngle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / numSpokes;

      // Outer spoke end point
      const getSpokePoint = (i, r) => {
        const theta = getAngle(i);
        return {
          x: cx + r * Math.cos(theta),
          y: cy + r * Math.sin(theta)
        };
      };

      // Generate polygon points for value
      const dataPolygonPoints = byWorkType
        .map((wt, idx) => {
          const r = (wt.count / 12) * maxRadius;
          const pt = getSpokePoint(idx, r);
          return `${pt.x},${pt.y}`;
        })
        .join(' ');

      return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <svg width="250" height="152" viewBox="0 0 250 152" style={{ overflow: 'visible' }}>
            {/* Concentric 12-sided polygon rings for 3, 6, 9, 12 */}
            {rings.map((ringVal) => {
              const ringR = (ringVal / 12) * maxRadius;
              const ringPoints = Array.from({ length: numSpokes })
                .map((_, i) => {
                  const pt = getSpokePoint(i, ringR);
                  return `${pt.x},${pt.y}`;
                })
                .join(' ');

              return (
                <g key={ringVal}>
                  <polygon
                    points={ringPoints}
                    fill="none"
                    stroke={isLight ? '#CBD5E1' : '#475569'}
                    strokeWidth="0.8"
                  />
                  {/* Axis scale label */}
                  <text
                    x={cx + ringR * Math.cos(getAngle(3))}
                    y={cy + ringR * Math.sin(getAngle(3)) + 3}
                    textAnchor="middle"
                    fill={textMuted}
                    fontSize="7"
                  >
                    {ringVal}
                  </text>
                </g>
              );
            })}

            {/* 12 Spoke lines from center to outer ring */}
            {byWorkType.map((_, idx) => {
              const endPt = getSpokePoint(idx, maxRadius);
              return (
                <line
                  key={idx}
                  x1={cx}
                  y1={cy}
                  x2={endPt.x}
                  y2={endPt.y}
                  stroke={isLight ? '#E2E8F0' : '#334155'}
                  strokeWidth="0.8"
                />
              );
            })}

            {/* Radar shaded polygon in vibrant bright orange */}
            <polygon
              points={dataPolygonPoints}
              fill={isLight ? 'rgba(255, 91, 34, 0.28)' : 'rgba(255, 122, 69, 0.32)'}
              stroke="#FF5B22"
              strokeWidth="2"
            />

            {/* Outer Labels around spokes */}
            {byWorkType.map((wt, idx) => {
              const labelR = maxRadius + 14;
              const pt = getSpokePoint(idx, labelR);
              const theta = getAngle(idx);
              const cos = Math.cos(theta);

              let anchor = 'middle';
              if (cos > 0.3) anchor = 'start';
              else if (cos < -0.3) anchor = 'end';

              return (
                <text
                  key={idx}
                  x={pt.x}
                  y={pt.y + 3}
                  textAnchor={anchor}
                  fill={textMuted}
                  fontSize="7"
                >
                  {wt.type}
                </text>
              );
            })}
          </svg>
        </div>
      );
    }

    // 3. PIE CHART WITH CALLOUT LINES (Matches User Screenshot 2)
    if (workTypeChartType === 'Pie' || workTypeChartType === 'Donut') {
      const isDonut = workTypeChartType === 'Donut';
      const cx = 125;
      const cy = 76;
      const r = isDonut ? 46 : 48;
      let accumAngle = -Math.PI / 2;

      const slices = byWorkType.map((wt) => {
        const sweepAngle = (wt.count / totalEmployees) * 2 * Math.PI;
        const start = accumAngle;
        const end = accumAngle + sweepAngle;
        const mid = start + sweepAngle / 2;
        accumAngle = end;

        const x1 = cx + r * Math.cos(start);
        const y1 = cy + r * Math.sin(start);
        const x2 = cx + r * Math.cos(end);
        const y2 = cy + r * Math.sin(end);
        const largeArc = sweepAngle > Math.PI ? 1 : 0;

        const pathData = `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;

        // Callout pointer lines for significant slices
        const calloutR1 = r;
        const calloutR2 = r + 10;
        const lineStart = { x: cx + calloutR1 * Math.cos(mid), y: cy + calloutR1 * Math.sin(mid) };
        const lineElbow = { x: cx + calloutR2 * Math.cos(mid), y: cy + calloutR2 * Math.sin(mid) };
        const isRight = Math.cos(mid) >= 0;
        const lineEnd = { x: lineElbow.x + (isRight ? 12 : -12), y: lineElbow.y };

        return {
          ...wt,
          pathData,
          mid,
          isRight,
          lineStart,
          lineElbow,
          lineEnd,
          shouldShowCallout: wt.count >= 2 // show callouts for prominent slices as in screenshot 2
        };
      });

      return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <svg width="250" height="152" viewBox="0 0 250 152" style={{ overflow: 'visible' }}>
            {/* Pie Slices */}
            {slices.map((slice, idx) => (
              <path
                key={idx}
                d={slice.pathData}
                fill={slice.color}
                stroke={cardBg}
                strokeWidth="1"
              >
                <title>{`${slice.type}: ${slice.count}`}</title>
              </path>
            ))}

            {/* Inner circle cutout for Donut */}
            {isDonut && (
              <circle cx={cx} cy={cy} r={r * 0.55} fill={cardBg} />
            )}

            {/* Callout Lines & Labels */}
            {slices.map((slice, idx) => {
              if (!slice.shouldShowCallout) return null;
              return (
                <g key={`callout-${idx}`}>
                  <polyline
                    points={`${slice.lineStart.x},${slice.lineStart.y} ${slice.lineElbow.x},${slice.lineElbow.y} ${slice.lineEnd.x},${slice.lineEnd.y}`}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth="1"
                  />
                  <text
                    x={slice.lineEnd.x + (slice.isRight ? 3 : -3)}
                    y={slice.lineEnd.y + 3}
                    textAnchor={slice.isRight ? 'start' : 'end'}
                    fill={slice.color}
                    fontSize="7.5"
                    fontWeight="500"
                  >
                    {slice.type}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      );
    }

    // 4. VERTICAL BAR & HORIZONTAL BAR
    if (workTypeChartType === 'Vertical Bar' || workTypeChartType === 'Horizontal Bar') {
      return (
        <div style={{ width: '100%', marginBottom: '10px' }}>
          <EnterpriseBarChart
            data={displayWorkTypes}
            orientation={workTypeChartType}
            metricType="count"
            yAxisTitle="Staff"
            topN={workTypeTopN}
            accentColor="#FF5B22"
            isLight={isLight}
            height={180}
          />
        </div>
      );
    }
  };

  return (
    <section id="workforce-section" style={{ marginBottom: '40px' }} className="animate-fade-in stagger-6">
      {/* SECTION HEADER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Left: Icon, Title, Subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.05)',
              border: isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: textMuted
            }}
          >
            <Users size={19} strokeWidth={2} />
          </div>
          <div>
            <h3
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: textPrimary,
                letterSpacing: '-0.01em',
                margin: 0
              }}
            >
              Workforce Tracking
            </h3>
            <p style={{ fontSize: '0.8125rem', color: textMuted, margin: '2px 0 0 0' }}>
              {totalEmployees} employees across {selectedSite && selectedSite !== 'All Sites' ? selectedSite : 'all sites'}
            </p>
          </div>
        </div>

        {/* Right: Site Filter Dropdown */}
        <div ref={siteRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setIsSiteDropdownOpen(!isSiteDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 14px',
              backgroundColor: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: '8px',
              boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              color: textPrimary,
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
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
                width: '180px',
                maxHeight: '260px',
                overflowY: 'auto',
                backgroundColor: isLight ? '#FFFFFF' : '#1E293B',
                border: `1px solid ${cardBorder}`,
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                zIndex: 50,
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
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: selectedSite === 'All Sites' ? (isLight ? '#F1F5F9' : '#334155') : 'transparent',
                  color: selectedSite === 'All Sites' ? '#3B82F6' : textPrimary,
                  fontSize: '0.8125rem',
                  fontWeight: selectedSite === 'All Sites' ? 600 : 400,
                  cursor: 'pointer'
                }}
              >
                All Sites
              </button>
              {sites.map((s) => (
                <button
                  key={s.id || s.name}
                  type="button"
                  onClick={() => {
                    if (onSiteSelect) onSiteSelect(s.name);
                    setIsSiteDropdownOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: selectedSite === s.name ? (isLight ? '#F1F5F9' : '#334155') : 'transparent',
                    color: selectedSite === s.name ? '#3B82F6' : textPrimary,
                    fontSize: '0.8125rem',
                    fontWeight: selectedSite === s.name ? 600 : 400,
                    cursor: 'pointer'
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4-COLUMN MAIN WORKFORCE GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          alignItems: 'stretch'
        }}
      >
        {/* COLUMN 1: STACKED METRICS (Aligned to match other 3 column boxes) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
          {/* Top Block: Overall Availability */}
          <div
            onClick={() => onDrillDown && onDrillDown({ tab: 'ALL' })}
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: '12px',
              padding: '20px 22px',
              boxShadow: cardShadow,
              flex: '1.2 1 0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            title="Click to inspect workforce availability"
          >
            <div style={{ fontSize: '0.8125rem', color: textMuted, fontWeight: 500, marginBottom: '8px' }}>
              Overall Availability
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#EF4444', lineHeight: 1, marginBottom: '14px' }}>
              <AnimatedNumber value={overallAvailability} triggerKey={triggerKey} />%
            </div>
            <div
              style={{
                height: '7px',
                width: '100%',
                backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.08)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${overallAvailability}%`,
                  backgroundColor: '#EF4444',
                  borderRadius: '4px',
                  transition: 'width 0.8s ease'
                }}
              />
            </div>
          </div>

          {/* Middle Row: Present & Absent side-by-side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flex: '1 1 0' }}>
            <div
              onClick={() => onDrillDown && onDrillDown({ tab: 'PRESENT' })}
              style={{
                backgroundColor: isLight ? '#F0FDF4' : 'rgba(16, 185, 129, 0.1)',
                border: isLight ? '1px solid #DCFCE7' : '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '10px',
                padding: '16px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              title="Click to inspect present personnel"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16A34A', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                <UserCheck size={15} />
                <span>Present</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: textPrimary, lineHeight: 1 }}>
                <AnimatedNumber value={present} triggerKey={triggerKey} />
              </div>
            </div>

            <div
              onClick={() => onDrillDown && onDrillDown({ tab: 'ABSENT' })}
              style={{
                backgroundColor: isLight ? '#FEF2F2' : 'rgba(239, 68, 68, 0.1)',
                border: isLight ? '1px solid #FEE2E2' : '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '10px',
                padding: '16px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              title="Click to inspect absent personnel"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                <UserX size={15} />
                <span>Absent</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: textPrimary, lineHeight: 1 }}>
                <AnimatedNumber value={absent} triggerKey={triggerKey} />
              </div>
            </div>
          </div>

          {/* Bottom Block: Total Workforce */}
          <div
            onClick={() => onDrillDown && onDrillDown({ tab: 'ALL' })}
            style={{
              backgroundColor: isLight ? '#F8FAFC' : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${cardBorder}`,
              borderRadius: '10px',
              padding: '18px 20px',
              boxShadow: cardShadow,
              flex: '1 1 0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            title="Click to inspect all staff records"
          >
            <div style={{ fontSize: '0.8125rem', color: textMuted, fontWeight: 500, marginBottom: '6px' }}>
              Total Workforce
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: textPrimary, lineHeight: 1 }}>
              <AnimatedNumber value={totalEmployees} triggerKey={triggerKey} />
            </div>
          </div>
        </div>

        {/* COLUMN 2: BY VENDOR */}
        <div
          onClick={() => onDrillDown && onDrillDown({ tab: 'ALL', segment: 'Vendor' })}
          style={{
            backgroundColor: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '12px',
            padding: '18px 20px',
            boxShadow: cardShadow,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            boxSizing: 'border-box',
            cursor: 'pointer'
          }}
          title="Click to view contractor vendor drill-down"
        >
          <div>
            <div style={{ marginBottom: '14px' }}>
              <ChartHeader
                title="Attendance by Vendor"
                subtitle="Present vs absent personnel telemetry across service contractor partners."
                isLight={isLight}
                rightAction={
                  <div onClick={(e) => e.stopPropagation()}>
                    <ChartDropdown
                      value={vendorChartType}
                      options={CHART_TYPES}
                      isLight={isLight}
                      onChange={(type) => setVendorChartType(type)}
                    />
                  </div>
                }
              />
            </div>

            {/* Vendor Chart View */}
            {renderVendorChart()}
          </div>
        </div>

        {/* COLUMN 3: BY WORK TYPE */}
        <div
          onClick={() => onDrillDown && onDrillDown({ tab: 'ALL', segment: 'WorkType' })}
          style={{
            backgroundColor: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '12px',
            padding: '18px 20px',
            boxShadow: cardShadow,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            boxSizing: 'border-box',
            cursor: 'pointer'
          }}
          title="Click to view work type discipline drill-down"
        >
          {/* Header row with chart selector */}
          <div style={{ marginBottom: '8px' }}>
            <ChartHeader
              title="Workforce by Work Type"
              subtitle="Staffing distribution across operational technical and security disciplines."
              isLight={isLight}
              rightAction={
                <div 
                  onClick={(e) => e.stopPropagation()} 
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ChartDropdown
                    value={workTypeChartType}
                    options={CHART_TYPES}
                    isLight={isLight}
                    onChange={(type) => setWorkTypeChartType(type)}
                  />
                  {hasMoreThan5WorkTypes && (
                    <ChartDropdown
                      value={workTypeTopN}
                      options={workTypeTopNOptions}
                      isLight={isLight}
                      onChange={(type) => setWorkTypeTopN(type)}
                    />
                  )}
                </div>
              }
            />
          </div>

          {/* Work Type Chart */}
          {renderWorkTypeChart()}

          {/* 12-Item Work Type List matching previous website */}
          <div
            style={{
              maxHeight: '190px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              paddingRight: '4px'
            }}
          >
            {byWorkType.map((wt, idx) => {
              const isSelected = selectedWorkTypeIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWorkTypeIndex(isSelected ? null : idx);
                    onDrillDown && onDrillDown({ tab: 'ALL', segment: wt.type, workType: wt.type });
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? (isLight ? '#FFF7ED' : 'rgba(255, 91, 34, 0.18)') : 'transparent',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: wt.color,
                        display: 'inline-block',
                        flexShrink: 0
                      }}
                    />
                    <span style={{ color: isSelected ? '#2563EB' : (isLight ? '#334155' : '#CBD5E1'), fontWeight: isSelected ? 600 : 500 }}>
                      {formatCategoryLabel(wt.type)}
                    </span>
                  </div>
                  <span
                    style={{
                      fontWeight: 700,
                      color: isSelected ? '#FFFFFF' : textPrimary,
                      backgroundColor: isSelected ? '#2563EB' : 'transparent',
                      padding: isSelected ? '1px 6px' : '0',
                      borderRadius: isSelected ? '4px' : '0',
                      fontSize: '0.75rem'
                    }}
                  >
                    {formatNumber(wt.count)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 4: LOW AVAILABILITY VENDORS */}
        <div
          onClick={() => onDrillDown && onDrillDown({ tab: 'ABSENT', segment: 'LowAvailability' })}
          style={{
            backgroundColor: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '12px',
            padding: '18px 20px',
            boxShadow: cardShadow,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            boxSizing: 'border-box',
            cursor: 'pointer'
          }}
          title="Click to inspect low availability contractor vendors"
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: headerColor, marginBottom: '14px' }}>
            LOW AVAILABILITY VENDORS
          </div>

          {lowAvailabilityVendors.map((v, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: isLight ? '#FEF2F2' : 'rgba(239, 68, 68, 0.1)',
                border: isLight ? '1px solid #FEE2E2' : '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: textPrimary, margin: 0 }}>
                  {v.vendor}
                </h4>
                <p style={{ fontSize: '0.75rem', color: textMuted, margin: '3px 0 0 0' }}>
                  {v.present}/{v.total} present
                </p>
              </div>

              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: isLight ? '#FFFFFF' : 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#EF4444',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                ({v.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
