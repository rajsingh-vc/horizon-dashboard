import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { formatCategoryLabel, formatPercentage, formatNumber } from '../../utils/analyticsFormatters';

const DEFAULT_PALETTE = [
  '#00C853', // Horizon Green
  '#FF5B22', // Horizon Orange
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#FF9100', // Amber
  '#00B0FF', // Cyan
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#F59E0B', // Yellow
  '#6366F1'  // Indigo
];

/**
 * Universal, Contained, Zero-Overflow Chart Category List Component
 * Used across ALL six Operational Intelligence Cards:
 *  1. Asset Portfolio & Health Telemetry
 *  2. Service Request SLA & TAT Intelligence
 *  3. Annual Maintenance Contracts (AMC) Intelligence
 *  4. PPM Compliance
 *  5. Total Visitors & Security Gate Operations
 *  6. Average Resolution Time & SLAs
 */
export default function AnalyticsChartList({
  data = [],
  total,
  isLight = false,
  selectedItem = null,
  onSelectItem,
  filterQuery = '',
  onFilterQueryChange,
  accentColor = '#00E676',
  unit = 'units'
}) {
  const [internalQuery, setInternalQuery] = useState('');
  const activeQuery = onFilterQueryChange !== undefined ? filterQuery : internalQuery;
  const setQuery = onFilterQueryChange || setInternalQuery;

  // Safe total calculation
  const computedTotal = useMemo(() => {
    if (typeof total === 'number' && total > 0) return total;
    const sum = data.reduce((acc, it) => acc + (Number(it.value) || 0), 0);
    return sum > 0 ? sum : 1;
  }, [total, data]);

  // Max value for visual relative bar calculation
  const maxVal = useMemo(() => {
    return Math.max(...data.map(d => Number(d.value) || 0), 1);
  }, [data]);

  // Filter items dynamically based on search
  const filteredItems = useMemo(() => {
    if (!activeQuery.trim()) return data;
    const q = activeQuery.toLowerCase().trim();
    return data.filter(d => (d.label || '').toLowerCase().includes(q));
  }, [data, activeQuery]);

  return (
    <div
      className="chart-section"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        minHeight: 0,
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {/* 1. FIXED CHART TOOLBAR & META CONTROLS (Always fixed outside the scroll container) */}
      <div
        className="chart-toolbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '2px 0 10px 0',
          flexWrap: 'wrap',
          flexShrink: 0
        }}
      >
        {/* Search Input with Clear Button */}
        <div
          style={{
            position: 'relative',
            width: '280px',
            maxWidth: '100%',
            flexShrink: 0
          }}
        >
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '11px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: isLight ? '#94A3B8' : '#64748B',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            placeholder="Search category in chart..."
            value={activeQuery}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 28px 7px 34px',
              fontSize: '0.75rem',
              borderRadius: '8px',
              border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)',
              color: isLight ? '#0F172A' : '#FFFFFF',
              outline: 'none',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              boxSizing: 'border-box'
            }}
          />
          {activeQuery && (
            <button
              type="button"
              onClick={() => setQuery('')}
              title="Clear category filter"
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: isLight ? '#94A3B8' : '#64748B',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Fixed Meta Header: Showing X of Y categories */}
        <div
          className="chart-meta"
          style={{
            fontSize: '0.75rem',
            color: isLight ? '#64748B' : '#94A3B8',
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}
        >
          Showing <strong style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>{filteredItems.length}</strong> of{' '}
          <strong style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>{data.length}</strong> categories
          <span style={{ opacity: 0.7, marginLeft: '6px' }}>• Click any bar to inspect</span>
        </div>
      </div>

      {/* 2. CONTROLLED CHART VIEWPORT
          Strict flex child: flex: 1, minHeight: 280px, maxHeight: 420px, overflowY: auto
          Right padding of 14px guarantees custom scrollbar never overlaps percentage badges.
          Bottom padding of 24px ensures the final row (e.g. CCTV, last category) is 100% visible.
      */}
      <div
        className="chart-viewport"
        style={{
          flex: 1,
          minHeight: '280px',
          maxHeight: '420px',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '8px 14px 24px 8px',
          boxSizing: 'border-box',
          position: 'relative'
        }}
      >
        {filteredItems.length === 0 ? (
          /* Empty Search State */
          <div
            style={{
              padding: '40px 16px',
              textAlign: 'center',
              borderRadius: '12px',
              backgroundColor: isLight ? '#F8FAFC' : 'rgba(255, 255, 255, 0.02)',
              border: isLight ? '1px dashed #E2E8F0' : '1px dashed rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: isLight ? '#64748B' : '#94A3B8',
              height: '100%',
              minHeight: '220px',
              boxSizing: 'border-box'
            }}
          >
            <Search size={22} style={{ opacity: 0.6 }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
              No matching categories found for &ldquo;{activeQuery}&rdquo;
            </span>
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{
                marginTop: '6px',
                padding: '5px 14px',
                fontSize: '0.6875rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                backgroundColor: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.1)',
                color: isLight ? '#0F172A' : '#FFFFFF',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
            >
              Reset Category Filter
            </button>
          </div>
        ) : (
          /* Scrollable Chart Content List */
          <div
            className="chart-list"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            {filteredItems.map((item, idx) => {
              const isSelected = selectedItem?.label === item.label;
              const val = Number(item.value) || 0;
              const percentage = computedTotal > 0 ? ((val / computedTotal) * 100).toFixed(1) : '0.0';

              // Power-curve visual scaling so lower values remain distinctly visible while never exceeding 100%
              const visualWidth = Math.min(
                100,
                Math.max(Math.round(Math.pow(val / maxVal, 0.5) * 100), 5)
              );

              const color = item.color || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length];

              return (
                <div
                  key={item.label || idx}
                  className="chart-row"
                  onClick={() => onSelectItem && onSelectItem(isSelected ? null : item)}
                  style={{
                    minHeight: '58px',
                    height: '58px',
                    flexShrink: 0,
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '7px',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    backgroundColor: isSelected
                      ? `${color}1A`
                      : (isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.02)'),
                    border: isSelected
                      ? `1.5px solid ${color}`
                      : (isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.05)'),
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease',
                    boxShadow: isSelected ? `0 0 12px ${color}33` : 'none',
                    width: '100%',
                    overflow: 'hidden'
                  }}
                >
                  {/* 3. ROW HEADER: FIXED CSS GRID TO PREVENT VALUE AND PERCENT SHIFTING */}
                  <div
                    className="chart-row-header"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1fr) auto auto',
                      alignItems: 'center',
                      columnGap: '12px',
                      fontSize: '0.8125rem',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Category Name & Color Bullet: Guaranteed Ellipsis + Accessible Hover Tooltip */}
                    <div
                      className="chart-category"
                      style={{
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 600,
                        color: isLight ? '#0F172A' : '#FFFFFF'
                      }}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: color,
                          flexShrink: 0
                        }}
                      />
                      <span
                        title={formatCategoryLabel(item.label)}
                        style={{
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {formatCategoryLabel(item.label)}
                      </span>
                    </div>

                    {/* Count / Value: Fixed width, right-aligned, monospace tabular-nums */}
                    <div
                      className="chart-value"
                      style={{
                        minWidth: '42px',
                        textAlign: 'right',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        fontVariantNumeric: 'tabular-nums',
                        color: isLight ? '#0F172A' : '#FFFFFF',
                        flexShrink: 0
                      }}
                    >
                      {formatNumber(val)}
                    </div>

                    {/* Percentage Badge: Fixed min-width, perfectly centered, never shifts row */}
                    <div
                      className="chart-percentage"
                      style={{
                        minWidth: '58px',
                        textAlign: 'center',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.08)',
                        color: color,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        boxSizing: 'border-box'
                      }}
                    >
                      {formatPercentage(percentage)}
                    </div>
                  </div>

                  {/* 4. PROGRESS BAR TRACK & FILL: Completely contained, never exceeds 100% */}
                  <div
                    className="progress-track"
                    style={{
                      width: '100%',
                      height: '8px',
                      borderRadius: '999px',
                      backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.06)',
                      overflow: 'hidden',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div
                      className="progress-fill"
                      style={{
                        width: `${visualWidth}%`,
                        maxWidth: '100%',
                        height: '100%',
                        borderRadius: 'inherit',
                        background: `linear-gradient(90deg, ${color} 0%, ${color}CC 100%)`,
                        boxShadow: isSelected ? `0 0 10px ${color}88` : 'none',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
