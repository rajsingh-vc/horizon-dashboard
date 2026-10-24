import React, { useState, useMemo } from 'react';
import { Wrench, AlertTriangle } from 'lucide-react';
import ChartDropdown from '../common/ChartDropdown';
import EnterpriseBarChart, { useTopNFilter } from '../common/EnterpriseBarChart';
import EnterpriseRadarChart from '../common/EnterpriseRadarChart';
import EnterpriseDonutChart from '../common/EnterpriseDonutChart';
import { CHART_COMPATIBILITY } from '../../utils/chartConfig';
import { formatCategoryLabel, formatPercentage, formatNumber } from '../../utils/analyticsFormatters';
import SiteFilterDropdown from '../common/SiteFilterDropdown';

export default function AssetPortfolio({
  assetsData,
  triggerKey = 0,
  theme = 'dark',
  selectedSite = 'All Sites',
  onSiteSelect,
  sites = [],
  selectedCategory = 'All Categories',
  onDrillDown
}) {
  const isLight = theme === 'light';

  // Compatible Chart Type selections:
  // Status Distribution defaults to 'Donut'
  const [statusChartType, setStatusChartType] = useState('Donut');

  // Category Performance defaults to 'Radar' matching reference UX
  const [categoryChartType, setCategoryChartType] = useState('Radar');

  // Normalize summary data dynamically from API / telemetry
  const summary = assetsData?.summary || {
    total: assetsData?.total ?? 516,
    operational: assetsData?.operational ?? 505,
    maintenance: assetsData?.maintenance ?? 11,
    critical: assetsData?.critical ?? 0,
    offline: assetsData?.offline ?? 0,
    health_percentage: assetsData?.health_percentage ?? 97.9
  };

  const total = Number(summary.total ?? 0);
  const operational = Number(summary.operational ?? 0);
  const maintenance = Number(summary.maintenance ?? 0);
  const critical = Number(summary.critical ?? 0);

  // Normalized categories matching API telemetry
  const rawCategories = assetsData?.category_breakdown || assetsData?.categories || [
    { category: 'Uncategorized', total: 338, operational: 327, health_percentage: 96.7 },
    { category: 'Electrical', total: 116, operational: 116, health_percentage: 100.0 },
    { category: 'Pump', total: 40, operational: 40, health_percentage: 100.0 },
    { category: 'Fire', total: 13, operational: 13, health_percentage: 100.0 },
    { category: 'Plumbing', total: 6, operational: 6, health_percentage: 100.0 },
    { category: 'CCTV', total: 3, operational: 3, health_percentage: 100.0 }
  ];

  const categories = useMemo(() => {
    return (rawCategories || []).map((cat) => ({
      name: cat.category || cat.name || 'Unknown',
      label: cat.category || cat.name || 'Unknown',
      score: Number(cat.health_percentage ?? cat.score ?? 100),
      value: Number(cat.health_percentage ?? cat.score ?? 100),
      total: Number(cat.total ?? 0),
      operational: Number(cat.operational ?? 0)
    }));
  }, [rawCategories]);

  // Dynamic Top-N hook: automatically determines valid limits from category count
  // and auto-resets when dataset shrinks
  const {
    topN: categoryTopN,
    setTopN: setCategoryTopN,
    hasMoreThan5: categoryHasMoreThan5,
    displayData: displayCategories,
    topNOptions: categoryTopNOptions
  } = useTopNFilter(categories, 'Top 5', 'score');

  // Status series for Donut / Bar
  const statusItems = useMemo(() => [
    { label: 'Operational', value: operational, color: '#10B981' },
    { label: 'BreakDown', value: maintenance, color: '#F59E0B' },
    { label: 'Critical', value: critical, color: '#EF4444' }
  ], [operational, maintenance, critical]);

  const criticalAssets = assetsData?.critical_assets || assetsData?.criticalAssets || [];

  // =========================================================================
  // RENDER STATUS CHART
  // =========================================================================
  const renderStatusChart = () => {
    if (statusChartType === 'Donut' || statusChartType === 'Pie') {
      return (
        <EnterpriseDonutChart
          data={statusItems}
          variant={statusChartType.toLowerCase()}
          centerLabel="Assets"
          centerValue={total}
          height={210}
          isLight={isLight}
          showLegend={false}
        />
      );
    }

    // Bar orientation fallback
    return (
      <EnterpriseBarChart
        data={statusItems}
        orientation={statusChartType}
        metricType="count"
        yAxisTitle="Assets"
        isLight={isLight}
        height={210}
      />
    );
  };

  // =========================================================================
  // RENDER CATEGORY PERFORMANCE CHART
  // =========================================================================
  const renderCategoryChart = () => {
    // 1. Radar Chart: authentic spider polygon
    if (categoryChartType === 'Radar') {
      return (
        <EnterpriseRadarChart
          data={displayCategories.map((cat) => ({
            name: cat.label || cat.name,
            label: cat.label || cat.name,
            value: cat.score ?? cat.value ?? 0,
            score: cat.score ?? cat.value ?? 0,
            operational: cat.operational,
            total: cat.total
          }))}
          metricKey="score"
          labelKey="name"
          metricType="percentage"
          seriesLabel="Health"
          maxValue={100}
          height={220}
          isLight={isLight}
          accentColor="#7C3AED"
        />
      );
    }

    // 2. Vertical Bar or Horizontal Bar
    return (
      <EnterpriseBarChart
        data={displayCategories.map((cat) => ({
          label: cat.label || cat.name,
          value: cat.score ?? cat.value ?? 0,
          color: '#7C3AED'
        }))}
        orientation={categoryChartType}
        metricType="percentage"
        yAxisTitle="Health (%)"
        topN={categoryTopN}
        accentColor="#7C3AED"
        isLight={isLight}
        height={220}
      />
    );
  };

  return (
    <section id="assets-section" style={{ marginBottom: '32px' }} className="animate-fade-in stagger-3">
      {/* Section Header Matching Service Desk & SLA Intelligence */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: isLight ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.15)',
              border: isLight ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981'
            }}
          >
            <Wrench size={20} strokeWidth={2.2} />
          </div>
          <div>
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: isLight ? '#0F172A' : '#FFFFFF',
                letterSpacing: '-0.02em',
                margin: 0
              }}
            >
              Asset Portfolio & Health
            </h3>
            <p
              style={{
                fontSize: '0.8125rem',
                color: isLight ? '#64748B' : '#94A3B8',
                margin: '2px 0 0 0'
              }}
            >
              {total} total assets across {selectedSite === 'All Sites' ? 'all sites' : selectedSite}
            </p>
          </div>
        </div>

        {/* Controls Container */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Site Filter Dropdown */}
          <SiteFilterDropdown
            selectedSite={selectedSite}
            onSiteSelect={onSiteSelect}
            sites={sites}
            isLight={isLight}
            accentColor="#10B981"
          />
        </div>
      </div>

      {/* 3-Column Chart Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
          alignItems: 'stretch'
        }}
      >
        {/* ================================================================= */}
        {/* CARD 1: STATUS DISTRIBUTION                                      */}
        {/* ================================================================= */}
        <div
          className="glass-card"
          onClick={() => onDrillDown && onDrillDown()}
          title="Click chart to open Asset Portfolio & Health drill-down"
          style={{
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: isLight ? '#FFFFFF' : 'var(--bg-card)',
            border: isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '340px',
            cursor: onDrillDown ? 'pointer' : 'default',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (onDrillDown) {
              e.currentTarget.style.borderColor = isLight ? '#10B981' : 'rgba(16, 185, 129, 0.4)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (onDrillDown) {
              e.currentTarget.style.borderColor = isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.transform = 'none';
            }
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: isLight ? '#64748B' : '#94A3B8'
              }}
            >
              STATUS DISTRIBUTION
            </span>
            <div onClick={(e) => e.stopPropagation()}>
              <ChartDropdown
                selectedType={statusChartType}
                onChange={setStatusChartType}
                types={CHART_COMPATIBILITY.statusDistribution}
                isLight={isLight}
                accentColor="#10B981"
              />
            </div>
          </div>

          {/* Plot Area */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '210px',
              width: '100%'
            }}
          >
            {renderStatusChart()}
          </div>

          {/* Dynamic Legend Matching Screenshot */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px 24px',
              paddingTop: '16px',
              borderTop: isLight ? '1px solid #F1F5F9' : '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            {/* Operational */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                onDrillDown && onDrillDown({ segment: 'Operational', tab: 'OPERATIONAL' });
              }}
              title="Click to view Operational assets"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                <span style={{ color: isLight ? '#64748B' : '#94A3B8' }}>Operational</span>
              </div>
              <strong style={{ color: isLight ? '#0F172A' : '#FFFFFF', fontWeight: 700 }}>{operational}</strong>
            </div>

            {/* BreakDown */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                onDrillDown && onDrillDown({ segment: 'BreakDown', tab: 'BREAKDOWN' });
              }}
              title="Click to view Breakdown assets"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                <span style={{ color: isLight ? '#64748B' : '#94A3B8' }}>BreakDown</span>
              </div>
              <strong style={{ color: isLight ? '#0F172A' : '#FFFFFF', fontWeight: 700 }}>{maintenance}</strong>
            </div>

            {/* Critical */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                onDrillDown && onDrillDown({ segment: 'Critical', tab: 'ALL' });
              }}
              title="Click to view Critical assets"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                <span style={{ color: isLight ? '#64748B' : '#94A3B8' }}>Critical</span>
              </div>
              <strong style={{ color: isLight ? '#0F172A' : '#FFFFFF', fontWeight: 700 }}>{critical}</strong>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* CARD 2: CATEGORY PERFORMANCE                                     */}
        {/* ================================================================= */}
        <div
          className="glass-card"
          onClick={() => onDrillDown && onDrillDown()}
          title="Click chart to open Asset Portfolio & Health drill-down"
          style={{
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: isLight ? '#FFFFFF' : 'var(--bg-card)',
            border: isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '340px',
            cursor: onDrillDown ? 'pointer' : 'default',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (onDrillDown) {
              e.currentTarget.style.borderColor = isLight ? '#7C3AED' : 'rgba(124, 58, 237, 0.4)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (onDrillDown) {
              e.currentTarget.style.borderColor = isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.transform = 'none';
            }
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: isLight ? '#64748B' : '#94A3B8'
              }}
            >
              CATEGORY PERFORMANCE
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
              <ChartDropdown
                selectedType={categoryChartType}
                onChange={setCategoryChartType}
                types={CHART_COMPATIBILITY.categoryPerformance}
                isLight={isLight}
                accentColor="#7C3AED"
              />
              {categoryHasMoreThan5 && (
                <ChartDropdown
                  selectedType={categoryTopN}
                  onChange={setCategoryTopN}
                  options={categoryTopNOptions}
                  isLight={isLight}
                  accentColor="#7C3AED"
                />
              )}
            </div>
          </div>

          {/* Plot Area */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '220px',
              width: '100%'
            }}
          >
            {renderCategoryChart()}
          </div>
        </div>

        {/* ================================================================= */}
        {/* CARD 3: CRITICAL ASSETS REQUIRING ATTENTION                      */}
        {/* ================================================================= */}
        <div
          className="glass-card"
          onClick={() => onDrillDown && onDrillDown({ segment: 'BreakDown', tab: 'BREAKDOWN' })}
          title="Click to open Asset Portfolio & Health breakdown drill-down"
          style={{
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: isLight ? '#FFFFFF' : 'var(--bg-card)',
            border: isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '340px',
            cursor: onDrillDown ? 'pointer' : 'default',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (onDrillDown) {
              e.currentTarget.style.borderColor = isLight ? '#EF4444' : 'rgba(239, 68, 68, 0.4)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (onDrillDown) {
              e.currentTarget.style.borderColor = isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.transform = 'none';
            }
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: isLight ? '#64748B' : '#94A3B8'
              }}
            >
              CRITICAL ASSETS REQUIRING ATTENTION
            </span>
          </div>

          {/* Body: Clean Vertically and Horizontally Centered Empty State */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '220px',
              width: '100%'
            }}
          >
            {criticalAssets.length === 0 ? (
              <div
                style={{
                  color: isLight ? '#64748B' : '#94A3B8',
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  textAlign: 'center'
                }}
              >
                No critical assets
              </div>
            ) : (
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: '220px',
                  overflowY: 'auto'
                }}
              >
                {criticalAssets.map((asset, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: isLight ? '#FEF2F2' : 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={16} color="#EF4444" />
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isLight ? '#991B1B' : '#FCA5A5' }}>
                          {asset.name || asset.tag || 'Asset Alert'}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: isLight ? '#64748B' : '#94A3B8' }}>
                          {asset.site || asset.category}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#EF4444' }}>Critical</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
