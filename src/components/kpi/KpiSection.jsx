import { useState, useMemo } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  FileCheck2, 
  Activity, 
  Users, 
  Timer,
  Filter,
  ArrowRight,
  TrendingUp,
  Target,
  Search,
  X
} from 'lucide-react';
import KpiCard from './KpiCard';
import { filterVisibleKpis } from '../../utils/kpiVisibility';

export default function KpiSection({ 
  kpis, 
  triggerKey = 0, 
  onCardClick, 
  selectedDate = 'This Month',
  theme = 'dark' 
}) {
  const [filterCategory, setFilterCategory] = useState('all');
  const [cardSearchQuery, setCardSearchQuery] = useState('');
  const [benchmarkMode, setBenchmarkMode] = useState('period'); // 'period' | 'target'
  const [activeCardKey, setActiveCardKey] = useState(null);
  const isLight = theme === 'light';

  // Compute clear, human-friendly comparison label from selectedDate
  const periodLabel = useMemo(() => {
    switch (selectedDate) {
      case 'Today': return 'Yesterday';
      case 'Yesterday': return 'Prior Day';
      case 'This Week': return 'Last Week';
      case 'This Month': return 'Last Month';
      case 'Last 30 Days': return 'Prior 30 Days';
      case 'This Quarter': return 'Last Quarter';
      case 'Year to Date': return 'Prior Year';
      default: return 'Last Month';
    }
  }, [selectedDate]);

  const cardConfig = useMemo(() => {
    if (!kpis) return [];
    return [
      {
        id: 'serviceRequestTat',
        key: 'serviceRequestTat',
        title: 'Service Request SLA & TAT',
        searchable: true,
        data: kpis.serviceRequestTat,
        accentColor: '#FF5B22', // Horizon Orange
        icon: Clock,
        decimals: 0,
        keywords: [
          'service',
          'service request',
          'request',
          'tat',
          'sla',
          'tickets',
          'helpdesk',
          'incident',
          'resolution',
          'work order',
          'turnaround',
          'requests',
          'ticket'
        ],
        inspectionSummary: `${kpis.serviceRequestTat?.submetrics?.[1]?.value ?? 329} of ${kpis.serviceRequestTat?.submetrics?.[0]?.value ?? 329} requests within SLA window (${kpis.serviceRequestTat?.submetrics?.[2]?.value ?? 0} Breached)`,
        periodTrendText: kpis.serviceRequestTat?.trendText || `+0% vs ${periodLabel}`,
        targetTrendText: '100% on target (SLA Met)'
      },
      {
        id: 'ppmCompliance',
        key: 'ppmCompliance',
        title: 'PPM Compliance',
        searchable: true,
        data: kpis.ppmCompliance,
        accentColor: '#00C853', // Horizon Green
        icon: CheckCircle2,
        decimals: 1,
        keywords: [
          'ppm',
          'ppm compliance',
          'compliance',
          'preventive',
          'preventive maintenance',
          'maintenance',
          'scheduled',
          'overdue',
          'tasks',
          'planned',
          'routine'
        ],
        inspectionSummary: `${kpis.ppmCompliance?.submetrics?.[1]?.value ?? 7} Tasks Completed on-time • ${kpis.ppmCompliance?.submetrics?.[2]?.value ?? 9} Overdue out of ${kpis.ppmCompliance?.submetrics?.[0]?.value ?? 16} Scheduled`,
        periodTrendText: kpis.ppmCompliance?.trendText || `-56.2% vs ${periodLabel}`,
        targetTrendText: `${(95 - (kpis.ppmCompliance?.value ?? 43.8)).toFixed(1)}% below 95% Target`
      },
      {
        id: 'amcCompliance',
        key: 'amcCompliance',
        title: 'AMC Compliance',
        searchable: true,
        data: kpis.amcCompliance,
        accentColor: '#8B5CF6', // Horizon Violet
        icon: FileCheck2,
        decimals: 0,
        keywords: [
          'amc',
          'amc compliance',
          'maintenance contract',
          'contract',
          'annual maintenance',
          'annual maintenance contract',
          'vendor',
          'warranty',
          'agreements',
          'audit',
          'compliance'
        ],
        inspectionSummary: (kpis.amcCompliance?.value ?? 0) > 0
          ? `${kpis.amcCompliance.value}% compliance across active equipment contracts`
          : '0% AMC compliance recorded • 0 active contracts in current audit cycle',
        periodTrendText: kpis.amcCompliance?.trendText || `0% vs ${periodLabel}`,
        targetTrendText: kpis.amcCompliance?.targetText || ((kpis.amcCompliance?.value ?? 0) >= 100 ? '100% SLA compliant' : `${kpis.amcCompliance?.value ?? 0}% vs Target (100%)`)
      },
      {
        id: 'assetHealth',
        key: 'assetHealth',
        title: 'Asset Portfolio & Health',
        searchable: true,
        data: kpis.assetHealth,
        accentColor: '#00E676', // Horizon Bright Green
        icon: Activity,
        decimals: 1,
        keywords: [
          'asset',
          'assets',
          'asset health',
          'asset portfolio',
          'health',
          'telemetry',
          'breakdown',
          'operational',
          'nationwide',
          'equipment',
          'units',
          'uptime'
        ],
        inspectionSummary: `${kpis.assetHealth?.submetrics?.[1]?.value ?? 505} Operational Assets • ${kpis.assetHealth?.submetrics?.[2]?.value ?? 11} Units currently under maintenance`,
        periodTrendText: kpis.assetHealth?.trendText || `+1.2% vs ${periodLabel}`,
        targetTrendText: '2.9% above 95% target'
      },
      {
        id: 'totalVisitors',
        key: 'totalVisitors',
        title: 'Total Visitors',
        searchable: true,
        data: kpis.totalVisitors,
        accentColor: '#FF9100', // Horizon Amber
        icon: Users,
        decimals: 0,
        keywords: [
          'visitor',
          'visitors',
          'total visitors',
          'footfall',
          'gate',
          'security',
          'occupancy',
          'guest',
          'checkin',
          'passes',
          'traffic'
        ],
        inspectionSummary: `${(kpis.totalVisitors?.value ?? 1240).toLocaleString()} Currently inside parks (${(kpis.totalVisitors?.submetrics?.[0]?.value ?? 11078).toLocaleString()} checked in today)`,
        periodTrendText: kpis.totalVisitors?.trendText || `+0% vs ${periodLabel}`,
        targetTrendText: `Peak occupancy ${(kpis.totalVisitors?.value ?? 1240).toLocaleString()} visitors`
      },
      {
        id: 'avgResolutionTime',
        key: 'avgResolutionTime',
        title: 'Average Resolution Time',
        searchable: true,
        data: kpis.avgResolutionTime,
        accentColor: '#00B0FF', // Horizon Cyan
        icon: Timer,
        decimals: 1,
        keywords: [
          'average resolution',
          'average resolution time',
          'resolution time',
          'resolution',
          'avg resolution',
          'tat',
          'time',
          'speed',
          'hours',
          'sla',
          'closure',
          'duration'
        ],
        inspectionSummary: `Average closure time ${kpis.avgResolutionTime?.value ?? 0} hrs across ${kpis.avgResolutionTime?.submetrics?.[0]?.value ?? kpis.serviceRequestTat?.submetrics?.[0]?.value ?? 329} requests (Target < 4.0 hrs)`,
        periodTrendText: kpis.avgResolutionTime?.trendText || `${kpis.avgResolutionTime?.value ?? 0} hrs vs ${periodLabel}`,
        targetTrendText: kpis.avgResolutionTime?.targetText || `${kpis.avgResolutionTime?.value ?? 0} hrs vs 4.0h SLA Target`
      }
    ];
  }, [kpis, periodLabel]);

  // Centralized dynamic KPI visibility:
  // Card is visible if current filtered value !== 0, OR if search query matches it
  const visibleCards = useMemo(() => {
    return filterVisibleKpis(cardConfig, cardSearchQuery);
  }, [cardConfig, cardSearchQuery]);

  const activeCard = cardConfig.find(c => c.key === activeCardKey);

  const handleCardSelect = (key) => {
    setActiveCardKey(prev => prev === key ? null : key);
    if (onCardClick) {
      onCardClick(key);
    }
  };

  if (!kpis) return null;

  return (
    <section id="overview-section" style={{ marginBottom: '28px' }} className="animate-fade-in stagger-1">
      {/* Control Bar: Only Search Filter on the Left & Comparison on the Right */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '14px',
          padding: '4px 2px'
        }}
      >
        {/* Left: Dedicated Search Filter Bar (metric pills removed per instruction) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '420px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
            <Search 
              size={15} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                color: isLight ? '#94A3B8' : '#64748B', 
                pointerEvents: 'none' 
              }} 
            />
            <input
              type="text"
              placeholder="Search operational cards (TAT, PPM, Assets, Visitors...)"
              value={cardSearchQuery}
              onChange={(e) => setCardSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 32px 7px 34px',
                fontSize: '0.8125rem',
                fontWeight: 500,
                borderRadius: '10px',
                border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255, 255, 255, 0.12)',
                backgroundColor: isLight ? '#FFFFFF' : 'rgba(23, 31, 48, 0.7)',
                color: isLight ? '#0F172A' : '#FFFFFF',
                outline: 'none',
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
                transition: 'all 0.2s ease'
              }}
            />
            {cardSearchQuery && (
              <button
                type="button"
                onClick={() => setCardSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: isLight ? '#94A3B8' : '#64748B',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Right: Benchmark Comparison Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px',
              borderRadius: '8px',
              backgroundColor: isLight ? '#F1F5F9' : 'rgba(23, 31, 48, 0.8)',
              border: isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <button
              type="button"
              onClick={() => setBenchmarkMode('period')}
              title={`Compare values vs ${periodLabel}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 9px',
                fontSize: '0.6875rem',
                fontWeight: benchmarkMode === 'period' ? 700 : 500,
                borderRadius: '6px',
                border: 'none',
                backgroundColor: benchmarkMode === 'period' ? (isLight ? '#FFFFFF' : '#1E293B') : 'transparent',
                color: benchmarkMode === 'period' ? (isLight ? '#0F172A' : '#00E676') : (isLight ? '#64748B' : '#94A3B8'),
                cursor: 'pointer',
                boxShadow: benchmarkMode === 'period' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.18s ease'
              }}
            >
              <TrendingUp size={11} />
              <span>vs {periodLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => setBenchmarkMode('target')}
              title="Compare values vs SLA target"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 9px',
                fontSize: '0.6875rem',
                fontWeight: benchmarkMode === 'target' ? 700 : 500,
                borderRadius: '6px',
                border: 'none',
                backgroundColor: benchmarkMode === 'target' ? (isLight ? '#FFFFFF' : '#1E293B') : 'transparent',
                color: benchmarkMode === 'target' ? (isLight ? '#0F172A' : '#00E676') : (isLight ? '#64748B' : '#94A3B8'),
                cursor: 'pointer',
                boxShadow: benchmarkMode === 'target' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.18s ease'
              }}
            >
              <Target size={11} />
              <span>vs Target (SLA)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Card Quick Inspection Bar (shows when a card is selected) */}
      {activeCard && (
        <div
          className="dropdown-anim"
          style={{
            marginBottom: '14px',
            padding: '10px 16px',
            borderRadius: '12px',
            backgroundColor: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(19, 26, 42, 0.9)',
            border: `1px solid ${activeCard.accentColor}60`,
            boxShadow: `0 4px 18px -2px ${activeCard.accentColor}25`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="pulse-dot" style={{ backgroundColor: activeCard.accentColor, width: '8px', height: '8px' }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF' }}>
              {activeCard.title}:
            </span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: activeCard.accentColor }}>
              {activeCard.data.value}{activeCard.data.unit}
            </span>
            <span style={{ fontSize: '0.8125rem', color: isLight ? '#475569' : '#CBD5E1' }}>
              — {activeCard.inspectionSummary}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => onCardClick && onCardClick(activeCard.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeCard.accentColor,
                color: '#0B0F19',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <span>View Full Records & Logs</span>
              <ArrowRight size={13} strokeWidth={2.5} />
            </button>

            <button
              type="button"
              onClick={() => setActiveCardKey(null)}
              title="Close inspection"
              style={{
                padding: '4px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                color: isLight ? '#64748B' : '#94A3B8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid or Clean Empty State */}
      {visibleCards.length === 0 ? (
        <div
          style={{
            padding: '36px 20px',
            textAlign: 'center',
            borderRadius: '16px',
            backgroundColor: isLight ? '#FFFFFF' : 'rgba(23, 31, 48, 0.45)',
            border: isLight ? '1px dashed #CBD5E1' : '1px dashed rgba(255, 255, 255, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Search size={32} color={isLight ? '#94A3B8' : '#64748B'} style={{ opacity: 0.7, marginBottom: '4px' }} />
          <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: isLight ? '#0F172A' : '#FFFFFF' }}>
            {cardSearchQuery ? 'No matching operational cards found' : 'All operational metrics currently report 0'}
          </div>
          <div style={{ fontSize: '0.8125rem', color: isLight ? '#64748B' : '#94A3B8', maxWidth: '440px', lineHeight: 1.5 }}>
            {cardSearchQuery ? (
              <>
                No operational metrics match &ldquo;<strong>{cardSearchQuery}</strong>&rdquo;. Try searching for &ldquo;Asset&rdquo;, &ldquo;PPM&rdquo;, &ldquo;Visitor&rdquo;, &ldquo;Resolution&rdquo;, &ldquo;Service&rdquo;, or &ldquo;AMC&rdquo;.
              </>
            ) : (
              'Operational metrics with a 0 value are hidden from standard view. You can use the search bar above to inspect specific zero-value cards or select another site/group/date filter.'
            )}
          </div>
          {cardSearchQuery && (
            <button
              type="button"
              onClick={() => setCardSearchQuery('')}
              style={{
                marginTop: '8px',
                padding: '6px 14px',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#00C853',
                color: '#0B0F19',
                cursor: 'pointer',
                transition: 'opacity 0.2s ease'
              }}
            >
              Clear Search Filter
            </button>
          )}
        </div>
      ) : (
        <div 
          className="kpi-grid"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'stretch',
            gap: '14px',
            width: '100%'
          }}
        >
          {visibleCards.map((item) => (
            <div
              key={item.key}
              style={{
                flex: visibleCards.length === 1 
                  ? '0 1 420px' 
                  : visibleCards.length === 2 
                    ? '0 1 380px' 
                    : visibleCards.length === 3 
                      ? '0 1 370px' 
                      : visibleCards.length === 4 
                        ? '1 1 290px' 
                        : '1 1 260px',
                maxWidth: visibleCards.length <= 3 ? '400px' : '390px',
                minWidth: '260px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <KpiCard
                title={item.title}
                value={item.data.value}
                unit={item.data.unit}
                decimals={item.decimals}
                trend={item.data.trend}
                trendType={item.data.trendType}
                trendText={benchmarkMode === 'target' ? item.targetTrendText : item.periodTrendText}
                submetrics={item.data.submetrics}
                sparkline={item.data.sparkline}
                accentColor={item.accentColor}
                icon={item.icon}
                triggerKey={triggerKey}
                isActive={activeCardKey === item.key}
                onClick={() => handleCardSelect(item.key)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
