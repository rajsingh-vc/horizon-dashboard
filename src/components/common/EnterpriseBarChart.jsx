import React, { useState, useMemo, useRef, useEffect } from 'react';
import { formatCategoryLabel, formatNumber, formatPercentage } from '../../utils/analyticsFormatters';
import { useDynamicTopN, getAvailableLimits, parseLimit } from '../../utils/chartConfig';

/**
 * Reusable Enterprise Bar Chart Component
 * Implements strict design guidelines:
 * - Dynamic Top-N (Top 5 / Top 10 / Top 15 / All) dynamically derived from dataset length
 * - Automatic reset of limits when dataset shrinks (e.g. Top 10 -> Top 5)
 * - Balanced symmetrical margins (no abnormal gap before first category)
 * - Non-overlapping X-axis labels strictly below the baseline (intelligent 2-line wrapping)
 * - Clear Y-axis scale with unit (starts at 0 for counts, 0-100% for percentages)
 * - Identical visual scale between Vertical Bar and Horizontal Bar
 * - Informative tooltips on hover
 * - Zero font distortion or letter-spacing stretching: utilizes responsive container width
 * - Interactive click-to-filter / click-to-deselect support
 */
export function useTopNFilter(data = [], defaultTopN = 'Top 5', valueKey = 'value') {
  const dynamic = useDynamicTopN(data, defaultTopN, valueKey);

  return {
    topN: dynamic.activeLimit,
    setTopN: dynamic.setActiveLimit,
    hasMoreThan5: dynamic.showLimitDropdown,
    showLimitDropdown: dynamic.showLimitDropdown,
    sortedData: dynamic.sortedData,
    displayData: dynamic.displayData,
    topNOptions: dynamic.availableLimits,
    availableLimits: dynamic.availableLimits,
    activeLimit: dynamic.activeLimit,
    setActiveLimit: dynamic.setActiveLimit,
    rawData: dynamic.rawData,
    dataLength: dynamic.dataLength
  };
}

/**
 * Formats a category label for clean multi-line or single-line rendering without overlap
 */
export function splitLabelIntoTwoLines(label, maxCharsPerLine = 12) {
  if (!label) return ['', ''];
  const formatted = formatCategoryLabel(label);
  if (formatted.length <= maxCharsPerLine) return [formatted, ''];

  const words = formatted.split(' ');
  if (words.length > 1) {
    const half = Math.ceil(words.length / 2);
    const line1 = words.slice(0, half).join(' ');
    const line2 = words.slice(half).join(' ');
    return [
      line1.length > 16 ? `${line1.slice(0, 14)}…` : line1,
      line2.length > 16 ? `${line2.slice(0, 14)}…` : line2
    ];
  }

  // Single long word
  return [
    `${formatted.slice(0, 9)}-`,
    formatted.slice(9, 18) + (formatted.length > 18 ? '…' : '')
  ];
}

export default function EnterpriseBarChart({
  data = [],
  orientation = 'Vertical Bar', // 'Vertical Bar' | 'Horizontal Bar'
  metricType = 'count', // 'count' | 'percentage' | 'hours'
  yAxisTitle = '',
  topN = 'Top 5',
  height = 230,
  isLight = false,
  accentColor = '#FF5B22',
  selectedId = null,
  selectedLabel = null,
  selectedSite = null,
  onHoverItem,
  onItemClick
}) {
  const [hoveredItem, setHoveredItem] = useState(null);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(640);

  // Dynamically measure container width to prevent ANY SVG stretching or font distortion
  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        if (w > 0) {
          setContainerWidth(Math.floor(w));
        }
      }
    };
    updateWidth();

    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateWidth);
      ro.observe(containerRef.current);
    }
    window.addEventListener('resize', updateWidth);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  const cardBorder = isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)';
  const gridLineColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.04)';
  const textPrimary = isLight ? '#0F172A' : '#FFFFFF';
  const textMuted = isLight ? '#64748B' : '#94A3B8';
  const fontFamily = "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  // Normalize data items
  const normalizedData = useMemo(() => {
    return (data || []).map((d) => {
      const rawVal = d.value ?? d.val ?? d.count ?? d.score;
      const num = Number(rawVal);
      const isMissing = rawVal === null || rawVal === undefined || isNaN(num);
      // Valid percentage domain: strictly 0 - 100
      const clampedVal = isMissing ? 0 : Math.max(0, metricType === 'percentage' ? Math.min(100, num) : num);
      const label = d.label ?? d.name ?? d.siteName ?? d.category ?? '';
      const color = d.color || accentColor;
      const id = d.id ?? d.siteId ?? d.key ?? label;

      return {
        ...d,
        id,
        siteId: d.siteId ?? d.id,
        rawLabel: label,
        label: formatCategoryLabel(label),
        val: clampedVal,
        displayVal: isMissing ? '-' : (metricType === 'percentage' ? `${clampedVal}%` : formatNumber(clampedVal)),
        isMissing,
        color
      };
    });
  }, [data, accentColor, metricType]);

  // Total for percentage share
  const totalVal = useMemo(() => {
    const sum = normalizedData.reduce((acc, it) => acc + (it.isMissing ? 0 : it.val), 0);
    return sum > 0 ? sum : 1;
  }, [normalizedData]);

  // Scale calculations (Strictly 0 to 100 for percentages)
  const { maxScale, ticks } = useMemo(() => {
    if (metricType === 'percentage') {
      return {
        maxScale: 100,
        ticks: [100, 75, 50, 25, 0]
      };
    }

    const rawMax = Math.max(...normalizedData.map((d) => d.val), 0);
    if (rawMax <= 0) {
      return { maxScale: 10, ticks: [10, 7.5, 5, 2.5, 0] };
    }

    const rawStep = (rawMax * 1.15) / 4;
    const power = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
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
    const maxScale = step * 4;
    return {
      maxScale,
      ticks: [maxScale, step * 3, step * 2, step, 0]
    };
  }, [normalizedData, metricType]);

  const formatTick = (val) => {
    if (metricType === 'percentage') return `${val}%`;
    if (metricType === 'hours') return `${val}h`;
    return formatNumber(val);
  };

  const formatValueLabel = (item) => {
    if (item.displayVal) return item.displayVal;
    if (item.isTat && (item.val <= 0 || item.isMissing)) return '-';
    if (item.isMissing) return '-';
    if (metricType === 'percentage') return `${item.val}%`;
    if (metricType === 'hours') return `${item.val} hrs`;
    return formatNumber(item.val);
  };

  // Helper to generate business-friendly tooltip text
  const getTooltipText = (item) => {
    const lines = [];
    const name = item.siteName || item.name || item.rawLabel || item.label;
    lines.push(`Site: ${name}`);
    if (item.region && item.region !== '—') lines.push(`Region: ${item.region}`);
    if (item.city && item.city !== '—') lines.push(`City: ${item.city}`);
    if (item.health !== undefined && item.health !== null) lines.push(`Health: ${item.health}%`);

    // Zero / Empty value display rule for TAT/SLA:
    // If value is 0%, null, undefined, or missing -> "TAT Compliance: No applicable data"
    // If value > 0% -> "TAT Compliance: ${item.tat}%"
    const isTatZeroOrMissing = item.tat === undefined || item.tat === null || Number(item.tat) <= 0;
    if (isTatZeroOrMissing) {
      lines.push(`TAT Compliance: No applicable data`);
    } else {
      lines.push(`TAT Compliance: ${item.tat}%`);
    }

    if (item.ppm !== undefined && item.ppm !== null) lines.push(`PPM Adherence: ${item.ppm}%`);
    if (item.workforce !== undefined && item.workforce !== null) lines.push(`Workforce: ${item.workforce}%`);

    if (item.value !== undefined && !lines.some(l => l.includes(String(item.val)))) {
      lines.push(`Value: ${formatValueLabel(item)}`);
    }
    return lines.join('\n');
  };

  // Helper to check if an item is selected
  const isItemSelected = (item) => {
    if (!item) return false;
    const currentSite = selectedSite || selectedLabel;
    if (selectedId !== null && selectedId !== undefined) {
      if (item.id === selectedId || item.siteId === selectedId) return true;
    }
    if (currentSite && currentSite !== 'All Sites') {
      const name = item.siteName || item.name || item.rawLabel || item.label;
      if (name && name.toLowerCase() === currentSite.toLowerCase()) return true;
    }
    return false;
  };

  // If empty data
  if (normalizedData.length === 0) {
    return (
      <div
        ref={containerRef}
        style={{
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: textMuted,
          fontSize: '0.8125rem',
          fontFamily
        }}
      >
        No data available for the selected period
      </div>
    );
  }

  // =========================================================================
  // 1. VERTICAL BAR CHART
  // =========================================================================
  if (orientation === 'Vertical Bar') {
    const isAll = topN === 'All';
    const isTop5 = normalizedData.length <= 5;
    const n = normalizedData.length;

    // Viewbox & plotting layout
    const yAxisWidth = 46;
    const topMargin = 26;
    const bottomMargin = isTop5 ? 38 : 52;
    const svgHeight = height;
    const plotHeight = svgHeight - topMargin - bottomMargin;
    const baselineY = topMargin + plotHeight;

    // Responsive width based on real container measurement
    const availablePlotWidth = Math.max(260, containerWidth - yAxisWidth - 16);
    const minSlotWidth = isAll ? 44 : (n > 10 ? 32 : (isTop5 ? 68 : 50));
    const responsivePlotWidth = Math.max(availablePlotWidth, n * minSlotWidth);
    const slotWidth = responsivePlotWidth / n;
    const barWidth = Math.min(36, Math.max(14, slotWidth * 0.52));

    return (
      <div
        ref={containerRef}
        style={{
          height: `${height}px`,
          display: 'flex',
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          fontFamily
        }}
      >
        {/* Pinned Left Y-Axis */}
        <div style={{ width: `${yAxisWidth}px`, height: '100%', flexShrink: 0, position: 'relative', userSelect: 'none' }}>
          <svg width={yAxisWidth} height={svgHeight} style={{ display: 'block', overflow: 'visible' }}>
            {/* Optional Y-Axis Unit Title */}
            {yAxisTitle && (
              <text
                x={yAxisWidth - 6}
                y={topMargin - 12}
                textAnchor="end"
                fill={textMuted}
                fontSize="10"
                fontWeight="700"
                fontFamily={fontFamily}
              >
                {yAxisTitle}
              </text>
            )}

            {/* Y-Axis Ticks */}
            {ticks.map((val, idx) => {
              const yPos = baselineY - (val / (maxScale || 1)) * plotHeight;
              return (
                <text
                  key={idx}
                  x={yAxisWidth - 8}
                  y={yPos + 4}
                  textAnchor="end"
                  fill={textMuted}
                  fontSize="10"
                  fontFamily={fontFamily}
                >
                  {formatTick(val)}
                </text>
              );
            })}

            {/* Y-Axis Solid Line */}
            <line x1={yAxisWidth - 1} y1={topMargin} x2={yAxisWidth - 1} y2={baselineY} stroke={cardBorder} strokeWidth="1.2" />
          </svg>
        </div>

        {/* Scrollable / Responsive Plot Body */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            height: '100%',
            overflowX: isAll && n > 8 ? 'auto' : 'hidden',
            overflowY: 'hidden',
            paddingBottom: '2px'
          }}
        >
          <svg
            width={isAll && n > 8 ? `${responsivePlotWidth}px` : '100%'}
            height={svgHeight}
            viewBox={`0 0 ${responsivePlotWidth} ${svgHeight}`}
            preserveAspectRatio="xMinYMin meet"
            style={{ display: 'block', minWidth: isAll && n > 8 ? `${responsivePlotWidth}px` : '100%', overflow: 'visible' }}
          >
            {/* Horizontal Gridlines */}
            {ticks.map((val, idx) => {
              const yPos = baselineY - (val / (maxScale || 1)) * plotHeight;
              const isBaseline = val === 0;
              return (
                <line
                  key={idx}
                  x1="0"
                  y1={yPos}
                  x2={responsivePlotWidth}
                  y2={yPos}
                  stroke={isBaseline ? cardBorder : gridLineColor}
                  strokeWidth={isBaseline ? '1.2' : '1'}
                  strokeDasharray={isBaseline ? undefined : '2,2'}
                />
              );
            })}

            {/* Bars & Labels with Balanced Symmetrical Spacing */}
            {normalizedData.map((item, idx) => {
              const slotCenter = (idx + 0.5) * slotWidth;
              const barX = slotCenter - barWidth / 2;
              const barH = (item.val / (maxScale || 1)) * plotHeight;
              const barY = baselineY - barH;
              const isHovered = hoveredItem === item.rawLabel;
              const isSelected = isItemSelected(item);
              const [line1, line2] = splitLabelIntoTwoLines(item.label, isTop5 ? 14 : 10);

              return (
                <g
                  key={item.rawLabel || item.id || idx}
                  onClick={() => {
                    if (onItemClick) {
                      onItemClick(item);
                    }
                  }}
                  onMouseEnter={() => {
                    setHoveredItem(item.rawLabel);
                    onHoverItem && onHoverItem(item);
                  }}
                  onMouseLeave={() => {
                    setHoveredItem(null);
                    onHoverItem && onHoverItem(null);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Rich Tooltip Title */}
                  <title>{getTooltipText(item)}</title>

                  {/* Active selection outline background */}
                  {isSelected && (
                    <rect
                      x={barX - 4}
                      y={topMargin}
                      width={barWidth + 8}
                      height={plotHeight + 4}
                      fill={isLight ? 'rgba(0, 200, 83, 0.08)' : 'rgba(0, 200, 83, 0.15)'}
                      stroke="#00C853"
                      strokeWidth="1.5"
                      strokeDasharray="3,3"
                      rx="6"
                    />
                  )}

                  {/* Bar Rectangle */}
                  {item.val === 0 ? (
                    <rect
                      x={barX}
                      y={baselineY - 2}
                      width={barWidth}
                      height={2}
                      fill={item.color}
                      opacity={0.4}
                      rx="1"
                    />
                  ) : (
                    <rect
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={Math.max(2, barH)}
                      fill={item.color}
                      rx="4"
                      style={{
                        transition: 'all 0.2s ease',
                        filter: isHovered || isSelected ? 'brightness(1.2)' : 'none'
                      }}
                    />
                  )}

                  {/* Value Label above Bar */}
                  <text
                    x={slotCenter}
                    y={item.val === 0 ? baselineY - 6 : Math.max(topMargin + 8, barY - 5)}
                    textAnchor="middle"
                    fill={isSelected ? '#00C853' : (isHovered ? accentColor : textPrimary)}
                    fontSize="11"
                    fontWeight="700"
                    fontFamily={fontFamily}
                  >
                    {formatValueLabel(item)}
                  </text>

                  {/* Category Label strictly BELOW baseline */}
                  {isTop5 ? (
                    // Top 5: Centered 2-line text, completely horizontal, normal typography!
                    <text
                      x={slotCenter}
                      y={baselineY + 16}
                      textAnchor="middle"
                      fill={isSelected ? '#00C853' : (isHovered ? textPrimary : textMuted)}
                      fontSize="10.5"
                      fontWeight={isHovered || isSelected ? 700 : 500}
                      fontFamily={fontFamily}
                    >
                      <tspan x={slotCenter} dy="0">{line1}</tspan>
                      {line2 && <tspan x={slotCenter} dy="13">{line2}</tspan>}
                    </text>
                  ) : (
                    // More than 5: Clean gentle angle (-25°) with anchor="end"
                    <text
                      x={slotCenter}
                      y={baselineY + 14}
                      transform={`rotate(-25, ${slotCenter}, ${baselineY + 14})`}
                      textAnchor="end"
                      fill={isSelected ? '#00C853' : (isHovered ? textPrimary : textMuted)}
                      fontSize="10.5"
                      fontWeight={isHovered || isSelected ? 700 : 500}
                      fontFamily={fontFamily}
                    >
                      {item.label.length > 15 ? `${item.label.slice(0, 13)}…` : item.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. HORIZONTAL BAR CHART (True 1:1 Pixel-Ratio Scale, Site Name -> Y, Percentage -> X)
  // =========================================================================
  const isAll = topN === 'All';
  const n = normalizedData.length;
  const labelWidth = Math.min(160, Math.max(120, Math.floor(containerWidth * 0.22)));
  const rightPad = 70;
  const topPad = 24;
  const bottomAxisH = 30;

  const rowHeight = isAll ? 28 : (n <= 5 ? 42 : 28);
  const barHeight = isAll ? 14 : (n <= 5 ? 20 : 14);
  const plotHeight = n * rowHeight;
  const totalSvgHeight = topPad + plotHeight + bottomAxisH;
  const totalSvgWidth = Math.max(340, containerWidth);
  const plotWidth = Math.max(140, totalSvgWidth - labelWidth - rightPad);
  const xAxisY = topPad + plotHeight;
  const xTicks = [0, ticks[3], ticks[2], ticks[1], maxScale];

  return (
    <div
      ref={containerRef}
      style={{
        height: isAll && n > 8 ? `${Math.min(height * 1.5, totalSvgHeight)}px` : `${height}px`,
        width: '100%',
        overflowY: isAll && n > 8 ? 'auto' : 'hidden',
        overflowX: 'hidden',
        paddingBottom: '2px',
        fontFamily
      }}
    >
      <svg
        width="100%"
        height={totalSvgHeight}
        viewBox={`0 0 ${totalSvgWidth} ${totalSvgHeight}`}
        preserveAspectRatio="xMinYMin meet"
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* Optional X-Axis Unit Title at top-right */}
        {yAxisTitle && (
          <text
            x={totalSvgWidth - rightPad}
            y={topPad - 8}
            textAnchor="end"
            fill={textMuted}
            fontSize="10"
            fontWeight="700"
            fontFamily={fontFamily}
          >
            {yAxisTitle}
          </text>
        )}

        {/* Vertical Gridlines for X-axis numeric ticks */}
        {xTicks.map((val, idx) => {
          const xPos = labelWidth + (val / (maxScale || 1)) * plotWidth;
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
              {/* X-axis tick label */}
              <text
                x={xPos}
                y={xAxisY + 18}
                textAnchor="middle"
                fill={textMuted}
                fontSize="10"
                fontFamily={fontFamily}
              >
                {formatTick(val)}
              </text>
            </g>
          );
        })}

        {/* Bottom X-axis Baseline */}
        <line x1={labelWidth} y1={xAxisY} x2={labelWidth + plotWidth} y2={xAxisY} stroke={cardBorder} strokeWidth="1.2" />

        {/* Left Y-axis Line */}
        <line x1={labelWidth} y1={topPad} x2={labelWidth} y2={xAxisY} stroke={cardBorder} strokeWidth="1.2" />

        {/* Horizontal Bars & Y-axis labels */}
        {normalizedData.map((item, idx) => {
          // Strictly clamp within valid bounds (0 to plotWidth)
          const barW = Math.max(0, Math.min(plotWidth, (item.val / (maxScale || 1)) * plotWidth));
          const yMid = topPad + idx * rowHeight + rowHeight / 2;
          const barY = yMid - barHeight / 2;
          const isHovered = hoveredItem === item.rawLabel;
          const isSelected = isItemSelected(item);

          // Truncate site name cleanly for Y-axis if longer than available space
          const maxNameChars = labelWidth > 140 ? 18 : 14;
          const displayName = item.label.length > maxNameChars ? `${item.label.slice(0, maxNameChars - 2)}…` : item.label;

          return (
            <g
              key={item.rawLabel || item.id || idx}
              onClick={() => {
                if (onItemClick) {
                  onItemClick(item);
                }
              }}
              onMouseEnter={() => {
                setHoveredItem(item.rawLabel);
                onHoverItem && onHoverItem(item);
              }}
              onMouseLeave={() => {
                setHoveredItem(null);
                onHoverItem && onHoverItem(null);
              }}
              style={{ cursor: 'pointer' }}
            >
              <title>{getTooltipText(item)}</title>

              {/* Active selection background stripe */}
              {isSelected && (
                <rect
                  x={2}
                  y={yMid - rowHeight / 2 + 1}
                  width={totalSvgWidth - 4}
                  height={rowHeight - 2}
                  fill={isLight ? 'rgba(0, 200, 83, 0.08)' : 'rgba(0, 200, 83, 0.15)'}
                  rx="6"
                  stroke="#00C853"
                  strokeWidth="1.2"
                  strokeDasharray="3,3"
                />
              )}

              {/* Y-axis Category Label */}
              <text
                x={labelWidth - 10}
                y={yMid + 4}
                textAnchor="end"
                fill={isSelected ? '#00C853' : (isHovered ? textPrimary : textMuted)}
                fontSize={n <= 5 ? '11.5' : '10.5'}
                fontWeight={isHovered || isSelected ? 700 : 500}
                fontFamily={fontFamily}
              >
                {displayName}
              </text>

              {/* Bar Rectangle */}
              {item.val === 0 ? (
                <rect
                  x={labelWidth}
                  y={barY}
                  width={3}
                  height={barHeight}
                  fill={item.color}
                  opacity={0.4}
                  rx="2"
                />
              ) : (
                <rect
                  x={labelWidth}
                  y={barY}
                  width={Math.max(3, barW)}
                  height={barHeight}
                  fill={item.color}
                  rx="4"
                  style={{
                    transition: 'all 0.2s ease',
                    filter: isHovered || isSelected ? 'brightness(1.2)' : 'none'
                  }}
                />
              )}

              {/* Value Label at end of bar */}
              <text
                x={labelWidth + Math.max(3, barW) + 8}
                y={yMid + 4}
                textAnchor="start"
                fill={isSelected ? '#00C853' : (isHovered ? accentColor : textPrimary)}
                fontSize="11"
                fontWeight="700"
                fontFamily={fontFamily}
              >
                {formatValueLabel(item)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
