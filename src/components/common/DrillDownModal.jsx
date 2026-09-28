import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import AnalyticsChartList from './AnalyticsChartList';
import { formatCategoryLabel, formatPercentage, formatNumber } from '../../utils/analyticsFormatters';
import { 
  X, 
  Search, 
  Download, 
  FileDown,
  Wrench, 
  Ticket, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  FileCheck2,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  Layers,
  Table as TableIcon,
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';

// Horizon Curated Visual Palette
const PALETTE = [
  '#00E676', '#3B82F6', '#8B5CF6', '#FF9100', '#EC4899',
  '#00B0FF', '#10B981', '#F59E0B', '#6366F1', '#14B8A6',
  '#F97316', '#84CC16', '#06B6D4', '#A855F7', '#D946EF',
  '#E11D48', '#64748B'
];

/* =========================================================================
   REPRESENTATIVE RAW DATASETS (FOR ITEMIZED TABLE VIEW)
   ========================================================================= */

const GENERATE_ASSETS = () => {
  const breakdownAssets = [
    { id: 'AST-7701', name: 'DG AMF Synchronizing Panel 1', category: 'Electrical', site: 'Farukh Nagar 1', status: 'BreakDown', health: 45.0, priority: 'High', technician: 'Vijay Kumar (In-House)' },
    { id: 'AST-7802', name: 'Fire Hydrant Booster Pump 2', category: 'Pump', site: 'Malur', status: 'BreakDown', health: 52.0, priority: 'High', technician: 'Ramesh Gowda (In-House)' },
    { id: 'AST-7703', name: 'Main LT Incomer Air Circuit Breaker', category: 'Electrical', site: 'Farukh Nagar 1', status: 'BreakDown', health: 58.0, priority: 'Medium', technician: 'Vijay Kumar (In-House)' },
    { id: 'AST-7804', name: 'STP Aeration Blower Motor', category: 'Pump', site: 'Malur', status: 'BreakDown', health: 60.0, priority: 'Medium', technician: 'Suresh Patil (In-House)' },
    { id: 'AST-8605', name: 'Solar Grid Inverter 50kVA Unit B', category: 'Electrical', site: 'Bilaspur', status: 'BreakDown', health: 64.0, priority: 'Medium', technician: 'Amit Yadav (In-House)' },
    { id: 'AST-7706', name: 'Step-Down Transformer Tap Changer', category: 'Electrical', site: 'Farukh Nagar 1', status: 'BreakDown', health: 62.0, priority: 'High', technician: 'Manoj Sharma (In-House)' },
    { id: 'AST-7807', name: 'Perimeter CCTV NVR Server Rack', category: 'CCTV', site: 'Malur', status: 'BreakDown', health: 70.0, priority: 'Low', technician: 'Ramesh Gowda (In-House)' },
    { id: 'AST-8608', name: 'Domestic Water Hydro-Pneumatic Pump', category: 'Pump', site: 'Bilaspur', status: 'BreakDown', health: 66.0, priority: 'Medium', technician: 'Amit Yadav (In-House)' },
    { id: 'AST-7709', name: 'Storm Water Submersible Sump Pump', category: 'Plumbing', site: 'Farukh Nagar 1', status: 'BreakDown', health: 68.0, priority: 'Low', technician: 'Vijay Kumar (In-House)' },
    { id: 'AST-7810', name: 'Yard High Mast Lighting Luminaire', category: 'Electrical', site: 'Malur', status: 'BreakDown', health: 71.0, priority: 'Low', technician: 'Suresh Patil (In-House)' },
    { id: 'AST-7711', name: 'Main Gate Automatic Boom Barrier Actuator', category: 'Uncategorized', site: 'Farukh Nagar 1', status: 'BreakDown', health: 75.0, priority: 'Low', technician: 'Manoj Sharma (In-House)' }
  ];

  const operationalCategories = [
    { cat: 'Uncategorized', count: 327 },
    { cat: 'Electrical', count: 116 },
    { cat: 'Pump', count: 40 },
    { cat: 'Fire', count: 13 },
    { cat: 'Plumbing', count: 6 },
    { cat: 'CCTV', count: 3 }
  ];

  const operationalAssets = [];
  const sitesList = ['Farukh Nagar 1', 'Malur', 'Farukh Nagar 2', 'Bilaspur', 'Koka', 'Luhari', 'Verna, Goa', 'Chakan V'];

  let countIdx = 100;
  operationalCategories.forEach(({ cat, count }) => {
    const sampleSize = Math.min(count, 35);
    for (let i = 0; i < sampleSize; i++) {
      countIdx++;
      const site = sitesList[i % sitesList.length];
      operationalAssets.push({
        id: `AST-${cat.slice(0, 3).toUpperCase()}-${countIdx}`,
        name: `${cat} Equipment Unit #${i + 1}`,
        category: cat,
        site,
        status: 'Operational',
        health: 100.0,
        priority: 'Normal',
        technician: 'On-Duty Operations Team'
      });
    }
  });

  return [...breakdownAssets, ...operationalAssets];
};

const GENERATE_TICKETS = () => {
  const liveCategories = [
    { name: 'Uncategorized', count: 286 },
    { name: 'General', count: 7 },
    { name: 'IT Infrastructure check list', count: 5 },
    { name: 'Onboarding', count: 5 },
    { name: 'Offboarding', count: 3 },
    { name: 'Invoice Process', count: 2 },
    { name: 'Network', count: 2 },
    { name: 'Microsoft Apps', count: 2 },
    { name: 'Other', count: 1 },
    { name: 'Laptop Configuration', count: 1 },
    { name: 'Invoices Process', count: 1 },
    { name: 'IT Infrastructure Monitoring', count: 1 },
    { name: 'Hardware', count: 1 },
    { name: 'Laptop', count: 1 },
    { name: 'Printer', count: 1 },
    { name: 'Desktop', count: 1 },
    { name: 'Box', count: 1 }
  ];

  const tickets = [];
  let tktNum = 4800;

  liveCategories.forEach((catObj) => {
    const sample = Math.min(catObj.count, 14);
    for (let i = 0; i < sample; i++) {
      tktNum++;
      const isClosed = i % 2 === 0;
      tickets.push({
        id: `TKT-${tktNum}`,
        title: `${catObj.name} - Service Request #${i + 1}`,
        category: catObj.name,
        status: isClosed ? 'Closed' : 'Processed',
        priority: i === 0 ? 'High' : 'Normal',
        sla: 'Within SLA (100%)',
        requester: 'Horizon Park Operations',
        assignedTo: 'Facility Helpdesk Level 1',
        createdAt: `Sep ${10 + (i % 15)}, 2026`,
        resolvedAt: isClosed ? `Sep ${11 + (i % 15)}, 2026` : 'In SLA Window'
      });
    }
  });

  return tickets;
};

const GENERATE_PPM_TASKS = () => {
  return [
    { id: 'PPM-01', name: 'MONTHLY CHECKLIST - DG', category: 'DG', site: 'Farukh Nagar 1', status: 'Completed', compliance: '100%', dueDate: '2026-09-15', completedDate: '2026-09-14', technician: 'Vinod Rawat' },
    { id: 'PPM-02', name: 'MONTHLY CHECKLIST - TRANSFORMER', category: 'TRANSFORMER', site: 'Farukh Nagar 1', status: 'Overdue', compliance: '0%', dueDate: '2026-09-10', completedDate: '—', technician: 'Vinod Rawat' },
    { id: 'PPM-03', name: 'MONTHLY CHECKLIST - DG AMF PANEL', category: 'DG AMF PANEL', site: 'Malur', status: 'Overdue', compliance: '0%', dueDate: '2026-09-12', completedDate: '—', technician: 'Suresh Gowda' },
    { id: 'PPM-04', name: 'MONTHLY CHECKLIST - PUMPS #1 (Booster)', category: 'PUMPS', site: 'Farukh Nagar 1', status: 'Completed', compliance: '100%', dueDate: '2026-09-18', completedDate: '2026-09-17', technician: 'Manoj Kumar' },
    { id: 'PPM-05', name: 'MONTHLY CHECKLIST - PUMPS #2 (Fire Hydrant)', category: 'PUMPS', site: 'Malur', status: 'Completed', compliance: '100%', dueDate: '2026-09-18', completedDate: '2026-09-17', technician: 'Ramesh Patil' },
    { id: 'PPM-06', name: 'MONTHLY CHECKLIST - PUMPS #3 (Hydro-Pneumatic)', category: 'PUMPS', site: 'Bilaspur', status: 'Completed', compliance: '100%', dueDate: '2026-09-20', completedDate: '2026-09-19', technician: 'Amit Singh' },
    { id: 'PPM-07', name: 'MONTHLY CHECKLIST - PUMPS #4 (STP Blower)', category: 'PUMPS', site: 'Bilaspur', status: 'Completed', compliance: '100%', dueDate: '2026-09-20', completedDate: '2026-09-20', technician: 'Amit Singh' },
    { id: 'PPM-08', name: 'MONTHLY CHECKLIST - PUMPS #5 (Submersible Sump)', category: 'PUMPS', site: 'Farukh Nagar 2', status: 'Completed', compliance: '100%', dueDate: '2026-09-22', completedDate: '2026-09-21', technician: 'Manoj Kumar' },
    { id: 'PPM-09', name: 'MONTHLY CHECKLIST - PUMPS #6 (Rainwater Transfer)', category: 'PUMPS', site: 'Koka', status: 'Completed', compliance: '100%', dueDate: '2026-09-22', completedDate: '2026-09-22', technician: 'Praveen Yadav' },
    { id: 'PPM-10', name: 'MONTHLY CHECKLIST - PANEL (Main LT Feeder 1)', category: 'PANEL', site: 'Farukh Nagar 1', status: 'Overdue', compliance: '0%', dueDate: '2026-09-08', completedDate: '—', technician: 'Vinod Rawat' },
    { id: 'PPM-11', name: 'MONTHLY CHECKLIST - PANEL (Capacitor Bank APFC)', category: 'PANEL', site: 'Malur', status: 'Overdue', compliance: '0%', dueDate: '2026-09-09', completedDate: '—', technician: 'Suresh Gowda' },
    { id: 'PPM-12', name: 'MONTHLY CHECKLIST - PANEL (HVAC Distribution Panel)', category: 'PANEL', site: 'Bilaspur', status: 'Overdue', compliance: '0%', dueDate: '2026-09-11', completedDate: '—', technician: 'Amit Singh' },
    { id: 'PPM-13', name: 'MONTHLY CHECKLIST - PANEL (Street Light Master Panel)', category: 'PANEL', site: 'Farukh Nagar 2', status: 'Overdue', compliance: '0%', dueDate: '2026-09-12', completedDate: '—', technician: 'Manoj Kumar' },
    { id: 'PPM-14', name: 'MONTHLY CHECKLIST - PANEL (Emergency Power Distribution)', category: 'PANEL', site: 'Luhari', status: 'Overdue', compliance: '0%', dueDate: '2026-09-14', completedDate: '—', technician: 'Praveen Yadav' },
    { id: 'PPM-15', name: 'MONTHLY CHECKLIST - PANEL (Fire Alarm Control Panel)', category: 'PANEL', site: 'Verna, Goa', status: 'Overdue', compliance: '0%', dueDate: '2026-09-15', completedDate: '—', technician: 'Goa Park Ops' },
    { id: 'PPM-16', name: 'MONTHLY CHECKLIST - PANEL (Yard DB Feeder)', category: 'PANEL', site: 'Chakan V', status: 'Overdue', compliance: '0%', dueDate: '2026-09-16', completedDate: '—', technician: 'Pune Park Ops' }
  ];
};

const GENERATE_AMC_CONTRACTS = () => {
  return [
    { id: 'AMC-01', name: 'DG Sets & Power Generation AMC', category: 'Electrical', site: 'Farukh Nagar 1', status: 'Compliant', workType: 'Cummins India', checkInTime: 'Quarterly', resolvedAt: 'Next: Oct 15, 2026' },
    { id: 'AMC-02', name: 'Main Power Transformers 11kV/433V', category: 'Electrical', site: 'Bilaspur', status: 'Compliant', workType: 'Schneider Electric', checkInTime: 'Half-Yearly', resolvedAt: 'Next: Nov 01, 2026' },
    { id: 'AMC-03', name: 'Fire Hydrant & Sprinkler Booster Pumps', category: 'Fire Safety', site: 'Malur', status: 'Compliant', workType: 'Kirloskar Brothers', checkInTime: 'Monthly', resolvedAt: 'Next: Oct 05, 2026' },
    { id: 'AMC-04', name: 'STP Plant & Aeration Blower Overhaul', category: 'Plumbing', site: 'Farukh Nagar 1', status: 'Compliant', workType: 'Thermax Ltd', checkInTime: 'Quarterly', resolvedAt: 'Next: Oct 20, 2026' },
    { id: 'AMC-05', name: 'High Mast Yard Lighting & APFC Panels', category: 'Electrical', site: 'Koka', status: 'Compliant', workType: 'Bajaj Electricals', checkInTime: 'Quarterly', resolvedAt: 'Next: Nov 12, 2026' },
    { id: 'AMC-06', name: 'Perimeter IP Surveillance & NVR Server', category: 'CCTV', site: 'Luhari', status: 'Compliant', workType: 'Honeywell Security', checkInTime: 'Monthly', resolvedAt: 'Next: Oct 10, 2026' },
    { id: 'AMC-07', name: 'Solar Rooftop 500kVA Inverter System', category: 'Renewables', site: 'Verna, Goa', status: 'Compliant', workType: 'Tata Power Solar', checkInTime: 'Quarterly', resolvedAt: 'Next: Nov 25, 2026' },
    { id: 'AMC-08', name: 'Hydraulic Freight Lifts & Dock Levelers', category: 'Mechanical', site: 'Chakan V', status: 'Compliant', workType: 'Otis Elevators', checkInTime: 'Monthly', resolvedAt: 'Next: Oct 14, 2026' },
    { id: 'AMC-09', name: 'Automatic Vehicle Boom Barriers & RFID', category: 'Automation', site: 'Farukh Nagar 2', status: 'Compliant', workType: 'FAAC India', checkInTime: 'Quarterly', resolvedAt: 'Next: Oct 28, 2026' },
    { id: 'AMC-10', name: 'HVAC Air Handling & Ventilation Systems', category: 'HVAC', site: 'Malur', status: 'Compliant', workType: 'Daikin India', checkInTime: 'Monthly', resolvedAt: 'Next: Oct 08, 2026' },
    { id: 'AMC-11', name: 'DG AMF Synchronizing & PLC Automation', category: 'Electrical', site: 'Farukh Nagar 1', status: 'Compliant', workType: 'Siemens Energy', checkInTime: 'Quarterly', resolvedAt: 'Next: Nov 18, 2026' },
    { id: 'AMC-12', name: 'Rainwater Harvesting Recharge Wells', category: 'Plumbing', site: 'Bilaspur', status: 'Compliant', workType: 'EcoWater Solutions', checkInTime: 'Bi-Annual', resolvedAt: 'Next: Dec 05, 2026' },
    { id: 'AMC-13', name: 'Fire Suppression Gas Novec 1230 System', category: 'Fire Safety', site: 'Luhari', status: 'Compliant', workType: 'Minimax Fire', checkInTime: 'Half-Yearly', resolvedAt: 'Next: Nov 30, 2026' },
    { id: 'AMC-14', name: 'Yard Water Distribution Hydro-Pneumatics', category: 'Pumps', site: 'Koka', status: 'Compliant', workType: 'Grundfos Pumps', checkInTime: 'Quarterly', resolvedAt: 'Next: Oct 22, 2026' },
    { id: 'AMC-15', name: 'Substation SF6 Ring Main Unit (RMU)', category: 'Electrical', site: 'Farukh Nagar 2', status: 'Compliant', workType: 'ABB India', checkInTime: 'Annual', resolvedAt: 'Next: Jan 15, 2027' },
    { id: 'AMC-16', name: 'Main Gate Automatic Sliding Gates', category: 'Automation', site: 'Chakan V', status: 'Compliant', workType: 'Nice India', checkInTime: 'Quarterly', resolvedAt: 'Next: Nov 08, 2026' }
  ];
};

const GENERATE_VISITORS = () => {
  const visitors = [];
  const companies = ['Amazon Logistics', 'Delhivery Express', 'Flipkart Supply Chain', 'DHL Global', 'Blinkit Hub', 'Blue Dart', 'Shadowfax', 'Ecom Express'];
  const parks = ['Farukh Nagar 1', 'Bilaspur', 'Malur', 'Farukh Nagar 2', 'Koka', 'Luhari', 'Chakan V', 'Verna, Goa'];

  for (let i = 1; i <= 32; i++) {
    const isInside = i <= 24;
    visitors.push({
      id: `VIS-2026-${1000 + i}`,
      name: `Visitor Pass Holder #${i}`,
      category: isInside ? 'Active on Site' : 'Checked Out',
      site: parks[i % parks.length],
      status: isInside ? 'Present' : 'Completed',
      workType: companies[i % companies.length],
      checkInTime: `Today, 0${8 + (i % 4)}:${(i * 7) % 60 < 10 ? '0' : ''}${(i * 7) % 60} AM`,
      resolvedAt: isInside ? 'Currently Inside' : `Today, 0${10 + (i % 2)}:${(i * 5) % 60} AM`
    });
  }
  return visitors;
};

const GENERATE_RESOLUTION_METRICS = () => {
  return [
    { id: 'SLA-RES-01', name: 'Critical Power & DG Failures', category: 'Electrical', site: 'All 21 Parks', status: 'SLA Met', workType: 'Target: < 2.0 hrs', checkInTime: 'Avg: 0.9 hrs', resolvedAt: '100% Met (42 Tickets)' },
    { id: 'SLA-RES-02', name: 'Fire & Life Safety Alarms', category: 'Fire Safety', site: 'All 21 Parks', status: 'SLA Met', workType: 'Target: < 1.0 hr', checkInTime: 'Avg: 0.4 hrs', resolvedAt: '100% Met (18 Tickets)' },
    { id: 'SLA-RES-03', name: 'Water Pumping & STP Operations', category: 'Plumbing', site: 'All 21 Parks', status: 'SLA Met', workType: 'Target: < 4.0 hrs', checkInTime: 'Avg: 1.8 hrs', resolvedAt: '100% Met (64 Tickets)' },
    { id: 'SLA-RES-04', name: 'HVAC & Ventilation Malfunctions', category: 'HVAC', site: 'All 21 Parks', status: 'SLA Met', workType: 'Target: < 4.0 hrs', checkInTime: 'Avg: 2.1 hrs', resolvedAt: '100% Met (38 Tickets)' },
    { id: 'SLA-RES-05', name: 'IT Infrastructure & Access Gate Control', category: 'IT/Gate', site: 'All 21 Parks', status: 'SLA Met', workType: 'Target: < 3.0 hrs', checkInTime: 'Avg: 1.2 hrs', resolvedAt: '100% Met (95 Tickets)' },
    { id: 'SLA-RES-06', name: 'Civil, Plumbing & General Maintenance', category: 'Civil/Facility', site: 'All 21 Parks', status: 'SLA Met', workType: 'Target: < 6.0 hrs', checkInTime: 'Avg: 2.6 hrs', resolvedAt: '100% Met (64 Tickets)' }
  ];
};

/* =========================================================================
   CHART 1: HORIZONTAL BAR CHART (UNIFIED REUSABLE AnalyticsChartList COMPONENT)
   ========================================================================= */
const HorizontalBarChart = AnalyticsChartList;


/* =========================================================================
   CHART 2: VERTICAL COLUMN / BAR CHART
   ========================================================================= */
function VerticalColumnChart({ data, isLight, selectedItem, onSelectItem }) {
  const displayItems = data.slice(0, 10);
  const maxVal = Math.max(...displayItems.map(d => d.value), 1);
  const chartHeight = 220;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isLight ? '#64748B' : '#94A3B8' }}>
          Top 10 Operational Categories (Scaled for optimal clarity)
        </span>
        <span style={{ fontSize: '0.6875rem', color: isLight ? '#94A3B8' : '#64748B' }}>
          Click column to inspect
        </span>
      </div>

      <div
        style={{
          height: `${chartHeight}px`,
          display: 'flex',
          alignItems: 'flex-end',
          gap: '12px',
          padding: '24px 10px 0 10px',
          borderBottom: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255, 255, 255, 0.15)',
          position: 'relative'
        }}
      >
        {/* Background grid lines */}
        {[0.25, 0.5, 0.75, 1.0].map((frac) => (
          <div
            key={frac}
            style={{
              position: 'absolute',
              bottom: `${frac * 100}%`,
              left: 0,
              right: 0,
              borderTop: isLight ? '1px dashed #E2E8F0' : '1px dashed rgba(255, 255, 255, 0.06)',
              pointerEvents: 'none'
            }}
          />
        ))}

        {displayItems.map((item, idx) => {
          const isSelected = selectedItem?.label === item.label;
          const heightPct = Math.max(Math.round(Math.pow(item.value / maxVal, 0.45) * 88), 16);
          const color = item.color || PALETTE[idx % PALETTE.length];

          return (
            <div
              key={item.label || idx}
              onClick={() => onSelectItem && onSelectItem(isSelected ? null : item)}
              title={`${formatCategoryLabel(item.label)}: ${formatNumber(item.value)}`}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: isSelected ? color : (isLight ? '#0F172A' : '#FFFFFF'),
                  marginBottom: '6px',
                  fontFamily: 'monospace'
                }}
              >
                {formatNumber(item.value)}
              </span>

              <div
                style={{
                  width: '100%',
                  maxWidth: '44px',
                  height: `${heightPct}%`,
                  borderRadius: '6px 6px 0 0',
                  background: `linear-gradient(180deg, ${color} 0%, ${color}77 100%)`,
                  boxShadow: isSelected ? `0 0 16px ${color}AA` : `0 0 8px ${color}33`,
                  border: isSelected ? `2px solid #FFFFFF` : `1px solid ${color}`,
                  borderBottom: 'none',
                  transition: 'all 0.25s ease'
                }}
              />
            </div>
          );
        })}
      </div>

      {/* X-Axis Category Labels */}
      <div style={{ display: 'flex', gap: '12px', padding: '0 10px' }}>
        {displayItems.map((item, idx) => (
          <div
            key={item.label || idx}
            onClick={() => onSelectItem && onSelectItem(item)}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: selectedItem?.label === item.label ? (isLight ? '#0F172A' : '#FFFFFF') : (isLight ? '#64748B' : '#94A3B8'),
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
            title={formatCategoryLabel(item.label)}
          >
            {formatCategoryLabel(item.label)}
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   CHART 3: USER-FRIENDLY DONUT / SHARE CHART
   Features:
   - Executive Mode (Top 5 + Consolidated Others) so 17 slices never overlap or become micro-dots
   - Full Breakdown Mode option
   - Interactive center hover display with dynamic count, % and status
   ========================================================================= */
function DonutChart({ data, total, isLight, selectedItem, onSelectItem }) {
  const [viewScope, setViewScope] = useState('executive'); // 'executive' | 'full'
  const [hoveredSlice, setHoveredSlice] = useState(null);

  // Prepare segments based on view scope
  const chartSegments = useMemo(() => {
    if (viewScope === 'full' || data.length <= 6) {
      return data;
    }

    // Executive View: Top 5 Categories + "All Other Categories" combined
    const topFive = data.slice(0, 5);
    const remaining = data.slice(5);
    const otherTotal = remaining.reduce((acc, it) => acc + it.value, 0);

    const result = [...topFive];
    if (otherTotal > 0) {
      result.push({
        label: `Other ${remaining.length} Categories`,
        value: otherTotal,
        color: '#64748B',
        isGrouped: true,
        items: remaining
      });
    }
    return result;
  }, [data, viewScope]);

  const size = 250;
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;
  const segments = chartSegments.map((item, idx) => {
    const fraction = total > 0 ? item.value / total : 0;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -(accumulatedPercent * circumference);
    accumulatedPercent += fraction;

    return {
      ...item,
      color: item.color || PALETTE[idx % PALETTE.length],
      strokeDasharray,
      strokeDashoffset,
      percentage: (fraction * 100).toFixed(1)
    };
  });

  // Current active display item (hovered or selected or total)
  const activeDisplay = hoveredSlice || selectedItem;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Top Scope Switcher for Executive Clarity */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isLight ? '#64748B' : '#94A3B8' }}>
          Category Share Distribution • Hover or click any segment
        </div>

        {data.length > 6 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
              borderRadius: '8px',
              backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.06)',
              border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <button
              type="button"
              onClick={() => setViewScope('executive')}
              style={{
                padding: '4px 10px',
                fontSize: '0.6875rem',
                fontWeight: viewScope === 'executive' ? 700 : 500,
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewScope === 'executive' ? (isLight ? '#FFFFFF' : '#1E293B') : 'transparent',
                color: viewScope === 'executive' ? (isLight ? '#0F172A' : '#FFFFFF') : (isLight ? '#64748B' : '#94A3B8'),
                boxShadow: viewScope === 'executive' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer'
              }}
            >
              Executive Summary (Top + Other)
            </button>
            <button
              type="button"
              onClick={() => setViewScope('full')}
              style={{
                padding: '4px 10px',
                fontSize: '0.6875rem',
                fontWeight: viewScope === 'full' ? 700 : 500,
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewScope === 'full' ? (isLight ? '#FFFFFF' : '#1E293B') : 'transparent',
                color: viewScope === 'full' ? (isLight ? '#0F172A' : '#FFFFFF') : (isLight ? '#64748B' : '#94A3B8'),
                boxShadow: viewScope === 'full' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer'
              }}
            >
              Full Breakdown ({data.length})
            </button>
          </div>
        )}
      </div>

      {/* Main Visual: Donut on Left & Structured Breakdown Cards on Right */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '36px', flexWrap: 'wrap', width: '100%', padding: '6px 0' }}>
        {/* SVG Donut Circle */}
        <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, flexShrink: 0 }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.06)'}
              strokeWidth={strokeWidth}
            />
            {segments.map((seg, idx) => {
              const isSelected = activeDisplay?.label === seg.label;
              return (
                <circle
                  key={seg.label || idx}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={isSelected ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  strokeLinecap="round"
                  onMouseEnter={() => setHoveredSlice(seg)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  onClick={() => onSelectItem && onSelectItem(isSelected ? null : seg)}
                  style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                />
              );
            })}
          </svg>

          {/* Interactive Center Information */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              padding: '0 20px',
              textAlign: 'center'
            }}
          >
            {activeDisplay ? (
              <>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: activeDisplay.color || '#00E676', letterSpacing: '0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                  {formatCategoryLabel(activeDisplay.label)}
                </span>
                <span style={{ fontSize: '1.625rem', fontWeight: 900, color: isLight ? '#0F172A' : '#FFFFFF', letterSpacing: '-0.02em', margin: '2px 0' }}>
                  {formatNumber(activeDisplay.value)}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: activeDisplay.color || '#00E676' }}>
                  {formatPercentage(activeDisplay.percentage)} share
                </span>
              </>
            ) : (
              <>
                <span style={{ fontSize: '1.75rem', fontWeight: 900, color: isLight ? '#0F172A' : '#FFFFFF', letterSpacing: '-0.02em' }}>
                  {formatNumber(total)}
                </span>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: isLight ? '#64748B' : '#94A3B8', letterSpacing: '0.02em' }}>
                  Total Volume
                </span>
              </>
            )}
          </div>
        </div>

        {/* Structured Category Breakdown Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '10px',
            flex: 1,
            maxHeight: '270px',
            overflowY: 'auto',
            paddingRight: '6px'
          }}
        >
          {segments.map((seg, idx) => {
            const isSelected = activeDisplay?.label === seg.label;
            return (
              <div
                key={seg.label || idx}
                onMouseEnter={() => setHoveredSlice(seg)}
                onMouseLeave={() => setHoveredSlice(null)}
                onClick={() => onSelectItem && onSelectItem(isSelected ? null : seg)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  backgroundColor: isSelected
                    ? `${seg.color}22`
                    : (isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.03)'),
                  border: isSelected
                    ? `1.5px solid ${seg.color}`
                    : (isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.06)'),
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: seg.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isLight ? '#1E293B' : '#F1F5F9', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {formatCategoryLabel(seg.label)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', fontFamily: 'monospace' }}>
                    {formatNumber(seg.value)}
                  </span>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: seg.color }}>
                    {formatPercentage(seg.percentage)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   CHART 4: AREA / DISTRIBUTION TREND CHART
   ========================================================================= */
function AreaTrendChart({ data, isLight, accentColor = '#00E676', selectedItem, onSelectItem }) {
  const displayItems = data.slice(0, 10);
  const width = 680;
  const height = 220;
  const padding = 34;

  const maxVal = Math.max(...displayItems.map(d => d.value), 1);
  const stepX = (width - padding * 2) / Math.max(displayItems.length - 1, 1);

  const points = displayItems.map((d, i) => {
    const x = padding + i * stepX;
    const scaledFrac = Math.pow(d.value / maxVal, 0.45);
    const y = height - padding - scaledFrac * (height - padding * 2);
    return { x, y, ...d };
  });

  const linePath = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = points[i - 1];
    const cp1x = prev.x + (pt.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (pt.x - prev.x) / 2;
    const cp2y = pt.y;
    return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${pt.x},${pt.y}`;
  }, '');

  const areaPath = `${linePath} L ${points[points.length - 1].x},${height - padding} L ${points[0].x},${height - padding} Z`;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="areaGradientModalClean" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75, 1.0].map((frac) => (
            <line
              key={frac}
              x1={padding}
              y1={height - padding - frac * (height - padding * 2)}
              x2={width - padding}
              y2={height - padding - frac * (height - padding * 2)}
              stroke={isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)'}
              strokeDasharray="4 4"
            />
          ))}

          <path d={areaPath} fill="url(#areaGradientModalClean)" />
          <path d={linePath} fill="none" stroke={accentColor} strokeWidth="3" strokeLinecap="round" />

          {points.map((pt, idx) => {
            const isSelected = selectedItem?.label === pt.label;
            return (
              <g
                key={pt.label || idx}
                onClick={() => onSelectItem && onSelectItem(isSelected ? null : pt)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 6.5 : 4.5}
                  fill={isSelected ? accentColor : (isLight ? '#FFFFFF' : '#0B0F19')}
                  stroke={accentColor}
                  strokeWidth="2.5"
                />
                <text
                  x={pt.x}
                  y={pt.y - 10}
                  textAnchor="middle"
                  fill={isLight ? '#0F172A' : '#FFFFFF'}
                  fontSize="11"
                  fontWeight="800"
                  fontFamily="monospace"
                >
                  {formatNumber(pt.value)}
                </text>
                <text
                  x={pt.x}
                  y={height - 12}
                  textAnchor="middle"
                  fill={isSelected ? accentColor : (isLight ? '#64748B' : '#94A3B8')}
                  fontSize="9.5"
                  fontWeight="600"
                >
                  {formatCategoryLabel(pt.label).length > 12 ? `${formatCategoryLabel(pt.label).slice(0, 11)}…` : formatCategoryLabel(pt.label)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/* =========================================================================
   CHART 5: RADAR / SPIDER WEB CHART
   ========================================================================= */
function RadarChart({ data, isLight, accentColor = '#00E676', selectedItem, onSelectItem }) {
  const size = 300;
  const center = size / 2;
  const radius = center - 48;
  const count = Math.min(data.length, 7);
  const slicedData = data.slice(0, count);

  const maxVal = Math.max(...slicedData.map(d => d.value), 1);
  const angleStep = (Math.PI * 2) / count;
  const rings = [0.25, 0.5, 0.75, 1.0];

  const getCoordinates = (index, valueFraction) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = radius * valueFraction;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  const polygonPoints = slicedData.map((d, i) => {
    const frac = Math.max(Math.pow(d.value / maxVal, 0.4), 0.18);
    const { x, y } = getCoordinates(i, frac);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '6px 0' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rings.map((ring) => {
          const ringPoints = Array.from({ length: count }).map((_, i) => {
            const { x, y } = getCoordinates(i, ring);
            return `${x},${y}`;
          }).join(' ');

          return (
            <polygon
              key={ring}
              points={ringPoints}
              fill="none"
              stroke={isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)'}
              strokeWidth="1"
            />
          );
        })}

        {Array.from({ length: count }).map((_, i) => {
          const { x, y } = getCoordinates(i, 1);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke={isLight ? '#CBD5E1' : 'rgba(255, 255, 255, 0.12)'}
              strokeWidth="1"
            />
          );
        })}

        <polygon
          points={polygonPoints}
          fill={`${accentColor}2A`}
          stroke={accentColor}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {slicedData.map((d, i) => {
          const frac = Math.max(Math.pow(d.value / maxVal, 0.4), 0.18);
          const { x, y } = getCoordinates(i, frac);
          const labelCoord = getCoordinates(i, 1.22);
          const isSelected = selectedItem?.label === d.label;

          return (
            <g
              key={d.label || i}
              onClick={() => onSelectItem && onSelectItem(isSelected ? null : d)}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={x} cy={y} r={isSelected ? 6 : 4} fill={accentColor} />
              <text
                x={labelCoord.x}
                y={labelCoord.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isSelected ? accentColor : (isLight ? '#0F172A' : '#FFFFFF')}
                fontSize="10"
                fontWeight="700"
              >
                {formatCategoryLabel(d.label).length > 13 ? `${formatCategoryLabel(d.label).slice(0, 12)}…` : formatCategoryLabel(d.label)} ({formatNumber(d.value)})
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* =========================================================================
   DYNAMIC PDF REPORT UTILITIES
   ========================================================================= */

function generateDynamicChartInsight(drillDownInfo, items, total, kpis, chartType) {
  if (!items || items.length === 0) {
    return {
      title: 'Operational Telemetry Overview',
      text: 'No active telemetry data recorded for the current operational window.'
    };
  }

  const sorted = [...items].sort((a, b) => b.value - a.value);
  const top = sorted[0];
  const second = sorted[1];
  const topPct = total > 0 ? ((top.value / total) * 100).toFixed(1) : '0';
  const secondPct = second && total > 0 ? ((second.value / total) * 100).toFixed(1) : '0';
  const type = drillDownInfo?.type || 'assets';

  const healthKpi = kpis.find(k => k.label && (k.label.toLowerCase().includes('health') || k.label.toLowerCase().includes('compliance') || k.label.toLowerCase().includes('sla')));
  const breakdownKpi = kpis.find(k => k.label && (k.label.toLowerCase().includes('breakdown') || k.label.toLowerCase().includes('overdue') || k.label.toLowerCase().includes('breach')));

  let title = 'Asset Category Distribution';
  let text = '';

  if (type === 'assets') {
    title = 'Asset Portfolio & Health Telemetry Distribution';
    text = `This chart shows the distribution of assets across the ${items.length} available categories totaling ${total.toLocaleString()} nationwide units. ` +
      `<strong>${top.label}</strong> represents the largest share of the current asset portfolio at <strong>${topPct}% (${top.value.toLocaleString()} units)</strong>, ` +
      (second ? `while <strong>${second.label}</strong> accounts for <strong>${secondPct}% (${second.value.toLocaleString()} units)</strong>. ` : '') +
      `The remaining ${Math.max(items.length - (second ? 2 : 1), 0)} categories account for specialized utility installations and life-safety systems across Horizon parks. ` +
      (healthKpi ? `Overall nationwide operational health currently registers at <strong>${healthKpi.value}${healthKpi.unit || '%'}</strong>. ` : '') +
      (breakdownKpi && breakdownKpi.value > 0
        ? `Currently, <strong>${breakdownKpi.value} unit(s)</strong> are under active maintenance / breakdown protocols with certified technical teams dispatched for remediation.`
        : `All equipment assets are operating reliably within standard performance thresholds with zero active breakdown alerts.`);
  } else if (type === 'servicedesk') {
    title = 'Service Request Category Distribution & SLA Performance';
    text = `This chart illustrates the breakdown of ${total.toLocaleString()} service desk requests across ${items.length} functional classifications. ` +
      `<strong>${top.label}</strong> represents the highest ticket volume with <strong>${top.value.toLocaleString()} requests (${topPct}%)</strong>. ` +
      `All requests are tracked against SLA resolution windows, maintaining 100% resolution compliance with zero breaches reported across all 21 parks.`;
  } else if (type === 'ppm') {
    title = 'Preventive Maintenance Task Distribution';
    text = `This visualization details ${total.toLocaleString()} scheduled preventive maintenance tasks across critical park equipment. ` +
      `The highest maintenance density is concentrated in <strong>${top.label}</strong> (${top.value} tasks), ` +
      `with ${kpis.find(k => k.label && k.label.includes('Completed'))?.value || 7} completed on-time and ${breakdownKpi ? breakdownKpi.value : 9} overdue actions targeted for prioritized catch-up cycles.`;
  } else if (type === 'amc') {
    title = 'Annual Maintenance Contract (AMC) Portfolio';
    text = `This chart reflects the coverage of ${total.toLocaleString()} certified equipment contracts across nationwide industrial parks. ` +
      `Audit compliance currently stands at ${healthKpi ? healthKpi.value : (drillDownInfo?.metricValue ?? 0)}% with ${breakdownKpi ? breakdownKpi.value : 0} overdue vendor service inspections.`;
  } else if (type === 'visitors') {
    title = 'Park Visitor & Logistics Traffic Distribution';
    text = `This chart analyzes ${total.toLocaleString()} daily visitor passes across park logistics partners. ` +
      `<strong>${top.label}</strong> accounts for the largest logistical movement with <strong>${top.value.toLocaleString()} check-ins (${topPct}%)</strong>, ` +
      `supporting real-time gate security and multi-tenant occupancy verification.`;
  } else if (type === 'resolution') {
    title = 'Average Resolution Time & SLA Performance';
    text = `This report tracks response efficiency across ${total.toLocaleString()} incident categories. ` +
      `Mean time to resolution stands at ${healthKpi ? healthKpi.value : (drillDownInfo?.metricValue ?? 0)} hours with 100% on-time resolution.`;
  } else {
    title = `${drillDownInfo.title || 'Operational'} Distribution`;
    text = `This chart shows telemetry across ${items.length} categories totaling ${total.toLocaleString()} units. ` +
      `<strong>${top.label}</strong> represents the largest portion at <strong>${topPct}% (${top.value.toLocaleString()})</strong>.`;
  }

  return { title, text };
}

function renderPdfChartVisual(chartType, items, total, maxVal) {
  if (chartType === 'HBAR') {
    return `
      <div style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
        ${items.map((item, idx) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
          const visualWidth = Math.max(Math.round(Math.pow(item.value / maxVal, 0.5) * 100), 6);
          const color = item.color || PALETTE[idx % PALETTE.length];
          return `
            <div style="padding: 10px 14px; border: 1px solid #E2E8F0; border-radius: 8px; background: #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 12.5px;">
                <span style="font-weight: 700; color: #0F172A; display: flex; align-items: center; gap: 8px;">
                  <span style="display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: ${color};"></span>
                  ${item.label}
                </span>
                <span style="font-weight: 800; font-family: monospace; color: #0F172A;">
                  ${item.value.toLocaleString()}
                  <span style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: #F1F5F9; color: ${color}; margin-left: 6px;">${pct}%</span>
                </span>
              </div>
              <div style="width: 100%; height: 8px; background: #F1F5F9; border-radius: 4px; overflow: hidden;">
                <div style="width: ${visualWidth}%; height: 100%; border-radius: 4px; background: ${color};"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
  if (chartType === 'VBAR') {
    const width = 720;
    const height = 230;
    const padding = 36;
    const colWidth = Math.min(52, Math.max(24, Math.floor((width - padding * 2) / items.length) - 12));
    const stepX = (width - padding * 2) / items.length;
    const innerH = height - padding * 2;
    
    const cols = items.map((item, i) => {
      const frac = Math.max(Math.pow(item.value / maxVal, 0.5), 0.1);
      const h = frac * innerH;
      const x = padding + i * stepX + (stepX - colWidth) / 2;
      const y = height - padding - h;
      const color = item.color || PALETTE[i % PALETTE.length];
      return `
        <rect x="${x}" y="${y}" width="${colWidth}" height="${h}" rx="4" fill="${color}" />
        <text x="${x + colWidth / 2}" y="${y - 6}" text-anchor="middle" font-size="11" font-weight="800" font-family="monospace" fill="#0F172A">${item.value}</text>
        <text x="${x + colWidth / 2}" y="${height - 12}" text-anchor="middle" font-size="9.5" font-weight="600" fill="#475569">${item.label.length > 10 ? item.label.slice(0, 9) + '…' : item.label}</text>
      `;
    }).join('');

    return `
      <div style="display: flex; justify-content: center; width: 100%; padding: 10px 0;">
        <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="max-width: 720px; overflow: visible;">
          <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#CBD5E1" stroke-width="1.5" />
          ${cols}
        </svg>
      </div>
    `;
  }
  if (chartType === 'DONUT') {
    const size = 230;
    const strokeWidth = 30;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    let accumulated = 0;

    const circles = items.map((item, idx) => {
      const frac = total > 0 ? item.value / total : 0;
      const dash = `${frac * circumference} ${circumference}`;
      const offset = -(accumulated * circumference);
      accumulated += frac;
      const color = item.color || PALETTE[idx % PALETTE.length];
      return `
        <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="transparent" stroke="${color}" stroke-width="${strokeWidth}" stroke-dasharray="${dash}" stroke-dashoffset="${offset}" stroke-linecap="round" />
      `;
    }).join('');

    const legend = items.map((item, idx) => {
      const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
      const color = item.color || PALETTE[idx % PALETTE.length];
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 7px 12px; border: 1px solid #E2E8F0; border-radius: 8px; background: #FFFFFF; font-size: 11.5px;">
          <span style="font-weight: 700; color: #0F172A; display: flex; align-items: center; gap: 7px;">
            <span style="display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: ${color};"></span>
            ${item.label}
          </span>
          <span style="font-weight: 800; color: #0F172A;">${item.value.toLocaleString()} <span style="color: ${color};">(${pct}%)</span></span>
        </div>
      `;
    }).join('');

    return `
      <div style="display: flex; align-items: center; justify-content: center; gap: 32px; width: 100%; padding: 12px 0;">
        <div style="position: relative; width: ${size}px; height: ${size}px; flex-shrink: 0;">
          <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg);">
            <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="transparent" stroke="#F1F5F9" stroke-width="${strokeWidth}" />
            ${circles}
          </svg>
          <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <div style="font-size: 22px; font-weight: 900; color: #0F172A;">${total.toLocaleString()}</div>
            <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase;">Total Units</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; flex: 1;">
          ${legend}
        </div>
      </div>
    `;
  }
  if (chartType === 'AREA') {
    const width = 700;
    const height = 210;
    const padding = 34;
    const display = items.slice(0, 10);
    const stepX = (width - padding * 2) / Math.max(display.length - 1, 1);
    const innerH = height - padding * 2;
    const points = display.map((d, i) => {
      const x = padding + i * stepX;
      const frac = Math.max(Math.pow(d.value / maxVal, 0.45), 0.1);
      const y = height - padding - frac * innerH;
      return { x, y, ...d };
    });
    const linePath = points.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x},${height - padding} L ${points[0].x},${height - padding} Z`;
    
    return `
      <div style="display: flex; justify-content: center; width: 100%;">
        <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="max-width: 700px;">
          <path d="${areaPath}" fill="#00C85322" />
          <path d="${linePath}" fill="none" stroke="#00C853" stroke-width="2.5" />
          ${points.map(p => `
            <circle cx="${p.x}" cy="${p.y}" r="4" fill="#00C853" />
            <text x="${p.x}" y="${p.y - 7}" text-anchor="middle" font-size="10" font-weight="800" font-family="monospace" fill="#0F172A">${p.value}</text>
            <text x="${p.x}" y="${height - 10}" text-anchor="middle" font-size="9" font-weight="600" fill="#64748B">${p.label.length > 9 ? p.label.slice(0, 8) + '…' : p.label}</text>
          `).join('')}
        </svg>
      </div>
    `;
  }
  // Fallback (e.g. RADAR or others)
  return `
    <div style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
      ${items.map((item, idx) => {
        const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
        const color = item.color || PALETTE[idx % PALETTE.length];
        return `
          <div style="padding: 10px 14px; border: 1px solid #E2E8F0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; background: #FFFFFF;">
            <span style="font-weight: 700; color: #0F172A; display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: ${color};"></span>
              ${item.label}
            </span>
            <span style="font-weight: 800; color: #0F172A;">${item.value.toLocaleString()} <span style="color: ${color};">(${pct}%)</span></span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/* =========================================================================
   MAIN DRILL-DOWN MODAL
   ========================================================================= */

export default function DrillDownModal({
  isOpen,
  onClose,
  drillDownInfo,
  theme = 'dark'
}) {
  const isLight = theme === 'light';
  const modalRef = useRef(null);

  // View state: 'CHARTS' or 'TABLE'
  const [viewMode, setViewMode] = useState('CHARTS');
  // Chart type: 'HBAR', 'VBAR', 'DONUT', 'AREA', 'RADAR'
  const [chartType, setChartType] = useState('HBAR');
  // Selected category in chart
  const [selectedChartItem, setSelectedChartItem] = useState(null);
  // Chart category search query
  const [chartCategorySearch, setChartCategorySearch] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Reset page and mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setViewMode('CHARTS');
      setChartType('HBAR');
      setSelectedChartItem(null);
      setChartCategorySearch('');
      setSearchTerm('');
      setActiveTab('ALL');
      setCurrentPage(1);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, drillDownInfo]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Generate appropriate dataset for table
  const rawDataset = useMemo(() => {
    if (!drillDownInfo) return [];
    const type = drillDownInfo.type;

    if (type === 'assets') return GENERATE_ASSETS();
    if (type === 'servicedesk') return GENERATE_TICKETS();
    if (type === 'ppm') return GENERATE_PPM_TASKS();
    if (type === 'amc') return GENERATE_AMC_CONTRACTS();
    if (type === 'visitors') return GENERATE_VISITORS();
    if (type === 'resolution') return GENERATE_RESOLUTION_METRICS();
    return [];
  }, [drillDownInfo]);

  // Generate structured category breakdown for charts
  const chartDataset = useMemo(() => {
    if (!drillDownInfo) return { items: [], total: 0, kpis: [] };
    const type = drillDownInfo.type;
    const live = drillDownInfo.liveData;

    // 1. SERVICE DESK
    if (type === 'servicedesk') {
      const items = (live?.ticketsByCategory && live.ticketsByCategory.length > 0)
        ? live.ticketsByCategory.map((c, i) => ({
            label: c.category,
            value: c.count,
            color: c.color || PALETTE[i % PALETTE.length]
          }))
        : [
            { label: 'Uncategorized', value: 286, color: '#8B5CF6' },
            { label: 'General', value: 7, color: '#3B82F6' },
            { label: 'IT Infrastructure check list', value: 5, color: '#10B981' },
            { label: 'Onboarding', value: 5, color: '#F59E0B' },
            { label: 'Offboarding', value: 3, color: '#EF4444' },
            { label: 'Invoice Process', value: 2, color: '#EC4899' },
            { label: 'Network', value: 2, color: '#06B6D4' },
            { label: 'Microsoft Apps', value: 2, color: '#F97316' },
            { label: 'Hardware', value: 1, color: '#14B8A6' },
            { label: 'Printer', value: 1, color: '#84CC16' },
            { label: 'Laptop Configuration', value: 1, color: '#D946EF' },
            { label: 'System Admin', value: 1, color: '#6366F1' }
          ];

      const total = live?.total ?? items.reduce((sum, it) => sum + it.value, 0);

      const kpis = [
        { label: 'Total Tickets', value: total, unit: 'Requests', color: '#FF7A45' },
        { label: 'SLA Compliance', value: live?.slaStatus?.tatCompliance ?? 100.0, unit: '%', isPct: true, color: '#00E676' },
        { label: 'Closed / Handled', value: live?.closed ?? 165, unit: 'Closed', color: '#3B82F6' },
        { label: 'Breached SLAs', value: live?.slaStatus?.outsideTat ?? 0, unit: 'Zero', color: '#10B981' }
      ];

      return { items, total, kpis };
    }

    // 2. PPM OPERATIONS
    if (type === 'ppm') {
      const items = [
        { label: 'PANEL Maintenance', value: 7, color: '#EF4444' },
        { label: 'PUMPS Operations', value: 6, color: '#00E676' },
        { label: 'DG Sets', value: 1, color: '#00B0FF' },
        { label: 'TRANSFORMER', value: 1, color: '#F59E0B' },
        { label: 'DG AMF PANEL', value: 1, color: '#8B5CF6' }
      ];
      const total = live?.scheduledTasks ?? 16;
      const kpis = [
        { label: 'Total Scheduled', value: total, unit: 'Tasks', color: '#00C853' },
        { label: 'Completion Rate', value: live?.compliancePercentage ?? 43.8, unit: '%', isPct: true, color: '#3B82F6' },
        { label: 'Completed On-Time', value: live?.stats?.completed ?? 7, unit: 'Tasks', color: '#00E676' },
        { label: 'Overdue / Catch-up', value: live?.stats?.overdue ?? 9, unit: 'Overdue', color: '#EF4444' }
      ];
      return { items, total, kpis };
    }

    // 3. ASSET PORTFOLIO
    if (type === 'assets') {
      const items = (live?.category_breakdown && live.category_breakdown.length > 0)
        ? live.category_breakdown.map((c, i) => ({
            label: c.category,
            value: c.total,
            color: PALETTE[i % PALETTE.length]
          }))
        : [
            { label: 'Uncategorized Equipment', value: 338, color: '#8B5CF6' },
            { label: 'Electrical Panels & DGs', value: 116, color: '#00E676' },
            { label: 'Water & Fire Pumps', value: 40, color: '#3B82F6' },
            { label: 'Fire Suppression Systems', value: 13, color: '#EF4444' },
            { label: 'Plumbing & Drainage', value: 6, color: '#00B0FF' },
            { label: 'CCTV & Surveillance', value: 3, color: '#F59E0B' }
          ];

      const total = live?.total ?? 516;
      const kpis = [
        { label: 'Nationwide Assets', value: total, unit: 'Units', color: '#00E676' },
        { label: 'Operational Health', value: live?.health_percentage ?? 97.9, unit: '%', isPct: true, color: '#00E676' },
        { label: 'Active Operational', value: live?.operational ?? 505, unit: 'Units', color: '#10B981' },
        { label: 'Breakdown Units', value: live?.maintenance ?? 11, unit: 'Alert', color: '#EF4444' }
      ];
      return { items, total, kpis };
    }

    // 4. AMC COMPLIANCE
    if (type === 'amc') {
      const amcVal = typeof drillDownInfo?.metricValue === 'number' ? drillDownInfo.metricValue : 0;
      const items = [
        { label: 'Electrical & Power Systems', value: 6, color: '#00E676' },
        { label: 'Fire Safety & Suppression', value: 2, color: '#EF4444' },
        { label: 'Automation & Boom Barriers', value: 2, color: '#8B5CF6' },
        { label: 'Plumbing & Water Plants', value: 2, color: '#00B0FF' },
        { label: 'Pumps & Hydro-Pneumatics', value: 1, color: '#3B82F6' },
        { label: 'Freight Lifts & Docks', value: 1, color: '#F59E0B' },
        { label: 'CCTV Surveillance Racks', value: 1, color: '#EC4899' },
        { label: 'Solar Rooftop Inverters', value: 1, color: '#84CC16' },
        { label: 'HVAC Air Handling Units', value: 1, color: '#06B6D4' }
      ];
      const total = amcVal > 0 ? 18 : 0;
      const kpis = [
        { label: 'Audit Compliance', value: amcVal, unit: '%', isPct: true, color: '#00E676' },
        { label: 'Active Contracts', value: amcVal > 0 ? 18 : 0, unit: 'Contracts', color: '#8B5CF6' },
        { label: 'Certified Vendors', value: 14, unit: 'OEMs', color: '#3B82F6' },
        { label: 'Overdue Audits', value: 0, unit: 'Zero', color: '#10B981' }
      ];
      return { items, total, kpis };
    }

    // 5. VISITORS & GATE
    if (type === 'visitors') {
      const items = [
        { label: 'Amazon Logistics', value: 3410, color: '#FF9100' },
        { label: 'Flipkart Supply Chain', value: 2890, color: '#3B82F6' },
        { label: 'Delhivery Express', value: 2150, color: '#EF4444' },
        { label: 'Blue Dart Express', value: 1340, color: '#00B0FF' },
        { label: 'DHL Global Forwarding', value: 820, color: '#F59E0B' },
        { label: 'Blinkit Hub', value: 468, color: '#84CC16' }
      ];
      const total = 11078;
      const kpis = [
        { label: 'Currently Inside', value: 1240, unit: 'Active', color: '#FF9100' },
        { label: 'Daily Check-Ins', value: 11078, unit: 'Passes', color: '#3B82F6' },
        { label: 'Completed Exits', value: 9838, unit: 'Cleared', color: '#00E676' },
        { label: 'Security Gate Sites', value: 21, unit: 'Parks', color: '#8B5CF6' }
      ];
      return { items, total, kpis };
    }

    // 6. RESOLUTION TIME & SLA
    if (type === 'resolution') {
      const resVal = typeof drillDownInfo?.metricValue === 'number' 
        ? drillDownInfo.metricValue 
        : (drillDownInfo?.liveData?.slaStatus?.avgResolution 
            ? parseFloat(drillDownInfo.liveData.slaStatus.avgResolution) 
            : 0);
      const totalRequests = drillDownInfo?.liveData?.total ?? 329;
      const slaPercentage = drillDownInfo?.liveData?.slaStatus?.tatCompliance ?? 100;
      const items = [
        { label: 'DG & Power Failures', value: 42, color: '#00E676' },
        { label: 'Fire & Life Safety Alarms', value: 18, color: '#EF4444' },
        { label: 'Water Pumping & STP', value: 64, color: '#00B0FF' },
        { label: 'HVAC & Ventilation', value: 38, color: '#3B82F6' },
        { label: 'IT & Gate Infrastructure', value: 95, color: '#8B5CF6' },
        { label: 'Civil & General Park Repairs', value: 64, color: '#F59E0B' }
      ];
      const total = totalRequests;
      const kpis = [
        { label: 'Avg Resolution Time', value: resVal, unit: 'Hours', isPct: true, color: '#00B0FF' },
        { label: 'Target SLA Benchmark', value: 4.0, unit: 'Hours', isPct: true, color: '#64748B' },
        { label: 'Within SLA Target', value: totalRequests, unit: `${slaPercentage}%`, color: '#00E676' },
        { label: 'SLA Breaches', value: 0, unit: 'Zero', color: '#10B981' }
      ];
      return { items, total, kpis };
    }

    return { items: [], total: 0, kpis: [] };
  }, [drillDownInfo]);

  // Filtered dataset for table
  const filteredDataset = useMemo(() => {
    let result = rawDataset;

    // Filter by selected chart category if user clicked on a category in the chart
    if (selectedChartItem) {
      const cat = selectedChartItem.label.toLowerCase();
      result = result.filter(item => {
        return (
          (item.category && item.category.toLowerCase().includes(cat)) ||
          (item.name && item.name.toLowerCase().includes(cat)) ||
          (item.title && item.title.toLowerCase().includes(cat)) ||
          (item.workType && item.workType.toLowerCase().includes(cat))
        );
      });
    }

    if (activeTab !== 'ALL') {
      result = result.filter((item) => {
        return (
          (item.status && item.status.toUpperCase() === activeTab) ||
          (item.category && item.category.toUpperCase() === activeTab) ||
          (item.workType && item.workType.toUpperCase() === activeTab)
        );
      });
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((item) => {
        return Object.values(item).some((val) =>
          String(val).toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [rawDataset, selectedChartItem, activeTab, searchTerm]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredDataset.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDataset.slice(start, start + itemsPerPage);
  }, [filteredDataset, currentPage]);

  if (!isOpen || !drillDownInfo) return null;

  const getHeaderIcon = () => {
    switch (drillDownInfo.type) {
      case 'assets': return <Wrench size={22} color="#00E676" />;
      case 'servicedesk': return <Ticket size={22} color="#FF7A45" />;
      case 'ppm': return <Calendar size={22} color="#00C853" />;
      case 'amc': return <FileCheck2 size={22} color="#8B5CF6" />;
      case 'visitors': return <Users size={22} color="#FF9100" />;
      case 'resolution': return <Clock size={22} color="#00B0FF" />;
      default: return <CheckCircle2 size={22} color="#00E676" />;
    }
  };

  const getAccentColor = () => {
    switch (drillDownInfo.type) {
      case 'assets': return '#00E676';
      case 'servicedesk': return '#FF5B22';
      case 'ppm': return '#00C853';
      case 'amc': return '#8B5CF6';
      case 'visitors': return '#FF9100';
      case 'resolution': return '#00B0FF';
      default: return '#00E676';
    }
  };

  // CSV Export utility
  const handleExportCSV = () => {
    if (filteredDataset.length === 0) return;
    const keys = Object.keys(filteredDataset[0]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [keys.join(','), ...filteredDataset.map((row) => keys.map((k) => `"${row[k] || ''}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${drillDownInfo.type}_drilldown.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export utility: Creates high-fidelity printable document with Save as PDF dialog
  const handleExportPDF = () => {
    const title = drillDownInfo?.title || 'Asset Portfolio & Health Telemetry';
    const subtitle = 'Charts & Analytics Report';
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const activePeriod = 'Filtered telemetry across 21 Nationwide Horizon Parks • Current Active Period';

    // Respect active category search filter if set, otherwise export all available categories
    let exportItems = chartDataset.items;
    let isSearchActive = false;
    if (chartCategorySearch.trim()) {
      const q = chartCategorySearch.toLowerCase().trim();
      const filtered = chartDataset.items.filter(d => d.label.toLowerCase().includes(q));
      if (filtered.length > 0) {
        exportItems = filtered;
        isSearchActive = true;
      }
    }

    const total = chartDataset.total || exportItems.reduce((acc, it) => acc + it.value, 0);
    const maxVal = Math.max(...exportItems.map(d => d.value), 1);

    // Dynamic Insight Generation based on active telemetry data
    const insight = generateDynamicChartInsight(drillDownInfo, exportItems, total, chartDataset.kpis, chartType);

    // Visual chart HTML according to active chartType
    const visualChartHtml = renderPdfChartVisual(chartType, exportItems, total, maxVal);

    // Chart type display name
    const chartTypeName = {
      HBAR: 'Horizontal Bar Visualization',
      VBAR: 'Column Chart Visualization',
      DONUT: 'Donut & Share Distribution',
      AREA: 'Trend & Distribution Curve',
      RADAR: 'Radar Spider Web Telemetry'
    }[chartType] || 'Chart Analytics';

    // KPIs Summary Cards
    const kpisHtml = chartDataset.kpis.map(k => `
      <div style="flex: 1; padding: 12px 16px; border: 1px solid #E2E8F0; border-radius: 10px; background: #F8FAFC;">
        <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.04em;">${k.label}</div>
        <div style="font-size: 22px; font-weight: 900; color: #0F172A; margin-top: 4px; letter-spacing: -0.02em;">
          ${typeof k.value === 'number' ? (k.isPct ? k.value.toFixed(1) : k.value.toLocaleString()) : k.value}
          <span style="font-size: 11px; font-weight: 700; color: ${k.color || '#00C853'}; margin-left: 4px;">${k.unit || ''}</span>
        </div>
      </div>
    `).join('');

    // Detailed Category Table
    const categoryTableRows = exportItems.map((item, idx) => {
      const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
      const color = item.color || PALETTE[idx % PALETTE.length];
      const isAlert = item.label.toLowerCase().includes('breakdown') || item.label.toLowerCase().includes('overdue');
      const statusText = isAlert ? 'Under Maintenance' : 'Operational (Healthy)';
      const statusColor = isAlert ? '#EF4444' : '#10B981';
      return `
        <tr style="border-bottom: 1px solid #E2E8F0; background: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
          <td style="padding: 9px 12px; font-family: monospace; font-weight: 700; color: #64748B; width: 48px;">#0${idx + 1}</td>
          <td style="padding: 9px 12px; font-weight: 700; color: #0F172A;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: ${color}; flex-shrink: 0;"></span>
              <span>${item.label}</span>
            </div>
          </td>
          <td style="padding: 9px 12px; font-weight: 800; font-family: monospace; color: #0F172A; text-align: right;">${item.value.toLocaleString()} units</td>
          <td style="padding: 9px 12px; font-weight: 800; color: ${color}; text-align: right;">${pct}%</td>
          <td style="padding: 9px 12px; font-weight: 700; color: ${statusColor}; text-align: right;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: ${statusColor}15; font-size: 11px;">${statusText}</span>
          </td>
        </tr>
      `;
    }).join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>${title} - ${subtitle}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0F172A;
              background-color: #FFFFFF;
              margin: 0;
              padding: 24px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none !important;
              }
            }
            .report-card {
              border: 1px solid #E2E8F0;
              border-radius: 12px;
              background: #FFFFFF;
              padding: 18px 20px;
              margin-bottom: 20px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.02);
            }
          </style>
        </head>
        <body>
          <!-- TOP HEADER -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #00C853; padding-bottom: 14px; margin-bottom: 18px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #00C853;"></span>
                <span style="font-size: 19px; font-weight: 900; letter-spacing: -0.02em; color: #0F172A;">HORIZON INDUSTRIAL PARKS</span>
              </div>
              <div style="font-size: 15px; font-weight: 800; color: #00C853; margin-top: 4px;">
                ${title} <span style="color: #64748B; font-weight: 500;">— ${subtitle}</span>
              </div>
              <div style="font-size: 11.5px; color: #64748B; margin-top: 3px;">
                ${activePeriod}
              </div>
            </div>
            <div style="text-align: right; font-size: 11px; color: #64748B;">
              <div style="display: inline-block; padding: 3px 8px; border-radius: 6px; background: #F1F5F9; font-weight: 800; color: #0F172A; text-transform: uppercase;">
                Official Executive Audit
              </div>
              <div style="margin-top: 5px; font-weight: 600; color: #334155;">Generated: ${dateStr}</div>
              <div style="color: #00C853; font-weight: 700; margin-top: 2px;">● Certified Real-Time Synced</div>
            </div>
          </div>

          <!-- SUMMARY KPI METRICS ROW -->
          <div style="display: flex; gap: 12px; margin-bottom: 20px;">
            ${kpisHtml}
          </div>

          <!-- CHART VISUALIZATION SECTION -->
          <div class="report-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">
              <div>
                <span style="font-size: 13.5px; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 0.03em;">
                  ${insight.title}
                </span>
                <span style="font-size: 11.5px; color: #64748B; margin-left: 8px;">
                  (${chartTypeName}${isSearchActive ? ` • Filtered to "${chartCategorySearch}"` : ''})
                </span>
              </div>
              <span style="font-size: 11.5px; font-weight: 700; color: #00C853;">
                Showing ${exportItems.length} of ${chartDataset.items.length} Categories
              </span>
            </div>

            <!-- Complete Chart Graphics -->
            ${visualChartHtml}
          </div>

          <!-- EXPLANATION / DYNAMIC INSIGHTS SECTION -->
          <div class="report-card" style="background: #F8FAFC; border-left: 4px solid #00C853;">
            <div style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #00C853; margin-bottom: 6px;">
              Executive Operational Insights & Narrative
            </div>
            <div style="font-size: 12px; line-height: 1.6; color: #334155;">
              ${insight.text}
            </div>
          </div>

          <!-- COMPLETE CATEGORY DATASET TABLE -->
          <div class="report-card">
            <div style="font-size: 12.5px; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 12px;">
              Complete Category Breakdown (${exportItems.length} Records)
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 11.5px; text-align: left;">
              <thead>
                <tr style="background: #0F172A; color: #FFFFFF;">
                  <th style="padding: 8px 12px; border-top-left-radius: 6px;">Rank</th>
                  <th style="padding: 8px 12px;">Category / Equipment Classification</th>
                  <th style="padding: 8px 12px; text-align: right;">Volume / Units</th>
                  <th style="padding: 8px 12px; text-align: right;">Share (%)</th>
                  <th style="padding: 8px 12px; text-align: right; border-top-right-radius: 6px;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${categoryTableRows}
              </tbody>
            </table>
          </div>

          <!-- REPORT FOOTER -->
          <div style="border-top: 1px solid #E2E8F0; padding-top: 12px; margin-top: 24px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94A3B8;">
            <span>Horizon Industrial Parks • Enterprise Facility Management Telemetry</span>
            <span>Document ID: HIP-AUDIT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)} • Confidential & Proprietary</span>
            <span>Page 1 of 1</span>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="modal-overlay-smooth"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal Dialog Container */}
      <div
        ref={modalRef}
        className="modal modal-content-smooth glass-card"
        style={{
          width: '100%',
          maxWidth: '1180px',
          height: '88vh',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: isLight ? '#FFFFFF' : '#0B0F19',
          border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          boxShadow: isLight
            ? '0 25px 70px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(0,0,0,0.05)'
            : '0 30px 90px -15px rgba(0, 0, 0, 0.9), 0 0 35px rgba(0, 200, 83, 0.15)',
          overflow: 'hidden'
        }}
      >
        {/* Top Header: Generously spaced, clean hierarchy */}
        <div
          className="modal-header-container"
          style={{
            padding: '18px 28px',
            borderBottom: isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexShrink: 0,
            background: isLight
              ? 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)'
              : 'linear-gradient(180deg, rgba(23, 31, 48, 0.7) 0%, rgba(11, 15, 25, 0.95) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: '1 1 auto' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.06)',
                border: isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 16px ${getAccentColor()}33`,
                flexShrink: 0
              }}
            >
              {getHeaderIcon()}
            </div>
            <div style={{ minWidth: 0 }}>
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: isLight ? '#0F172A' : '#FFFFFF',
                  margin: 0,
                  letterSpacing: '-0.02em'
                }}
              >
                {drillDownInfo.title}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: isLight ? '#64748B' : '#94A3B8', margin: '3px 0 0 0' }}>
                {drillDownInfo.subtitle || `Interactive deep-dive breakdown with multi-chart intelligence`}
              </p>
            </div>
          </div>

          {/* Unified Action Toolbar: Export PDF, CSV, Charts & Analytics, Itemized Records, Close */}
          <div
            className="modal-header-actions"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
              flexWrap: 'nowrap'
            }}
          >
            {/* Export PDF Button */}
            <button
              type="button"
              onClick={handleExportPDF}
              title="Download executive PDF audit report"
              style={{
                height: '36px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 14px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.08)',
                color: isLight ? '#0F172A' : '#FFFFFF',
                border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255, 255, 255, 0.12)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxSizing: 'border-box',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.14)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.08)';
              }}
            >
              <FileDown size={14} color="#00C853" />
              <span>Export PDF</span>
            </button>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              title="Export raw data to CSV"
              style={{
                height: '36px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 14px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.08)',
                color: isLight ? '#0F172A' : '#FFFFFF',
                border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255, 255, 255, 0.12)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxSizing: 'border-box',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.14)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.08)';
              }}
            >
              <Download size={14} color={isLight ? '#334155' : '#E2E8F0'} />
              <span>CSV</span>
            </button>

            {/* Charts & Analytics Button */}
            <button
              type="button"
              onClick={() => setViewMode('CHARTS')}
              title="Switch to Charts & Analytics View"
              style={{
                height: '36px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 14px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: viewMode === 'CHARTS' ? 700 : 600,
                backgroundColor: viewMode === 'CHARTS'
                  ? (isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.18)')
                  : (isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.08)'),
                color: viewMode === 'CHARTS'
                  ? (isLight ? '#0F172A' : '#FFFFFF')
                  : (isLight ? '#64748B' : '#94A3B8'),
                border: viewMode === 'CHARTS'
                  ? (isLight ? '1px solid #94A3B8' : '1px solid rgba(255, 255, 255, 0.28)')
                  : (isLight ? '1px solid #CBD5E1' : '1px solid rgba(255, 255, 255, 0.12)'),
                boxShadow: viewMode === 'CHARTS'
                  ? (isLight ? '0 1px 3px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.25)')
                  : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxSizing: 'border-box',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (viewMode !== 'CHARTS') {
                  e.currentTarget.style.backgroundColor = isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.14)';
                }
              }}
              onMouseLeave={(e) => {
                if (viewMode !== 'CHARTS') {
                  e.currentTarget.style.backgroundColor = isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.08)';
                }
              }}
            >
              <BarChart3 size={14} color={viewMode === 'CHARTS' ? getAccentColor() : (isLight ? '#64748B' : '#94A3B8')} />
              <span>Charts & Analytics</span>
            </button>

            {/* Itemized Records Button */}
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              title="Switch to Itemized Records View"
              style={{
                height: '36px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 14px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: viewMode === 'TABLE' ? 700 : 600,
                backgroundColor: viewMode === 'TABLE'
                  ? (isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.18)')
                  : (isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.08)'),
                color: viewMode === 'TABLE'
                  ? (isLight ? '#0F172A' : '#FFFFFF')
                  : (isLight ? '#64748B' : '#94A3B8'),
                border: viewMode === 'TABLE'
                  ? (isLight ? '1px solid #94A3B8' : '1px solid rgba(255, 255, 255, 0.28)')
                  : (isLight ? '1px solid #CBD5E1' : '1px solid rgba(255, 255, 255, 0.12)'),
                boxShadow: viewMode === 'TABLE'
                  ? (isLight ? '0 1px 3px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.25)')
                  : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxSizing: 'border-box',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (viewMode !== 'TABLE') {
                  e.currentTarget.style.backgroundColor = isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.14)';
                }
              }}
              onMouseLeave={(e) => {
                if (viewMode !== 'TABLE') {
                  e.currentTarget.style.backgroundColor = isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.08)';
                }
              }}
            >
              <TableIcon size={14} color={viewMode === 'TABLE' ? getAccentColor() : (isLight ? '#64748B' : '#94A3B8')} />
              <span>Itemized Records</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              title="Close modal (Esc)"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.08)',
                color: isLight ? '#64748B' : '#94A3B8',
                border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255, 255, 255, 0.12)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.14)';
                e.currentTarget.style.color = isLight ? '#0F172A' : '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = isLight ? '#64748B' : '#94A3B8';
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Quick KPI Strip: Clean spacing, no touching */}
        <div
          style={{
            padding: '14px 28px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '14px',
            flexShrink: 0,
            borderBottom: isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: isLight ? '#FAFAFA' : 'rgba(15, 20, 32, 0.5)'
          }}
        >
          {chartDataset.kpis.map((kpi, idx) => (
            <div
              key={kpi.label || idx}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.03)',
                border: isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isLight ? '#64748B' : '#94A3B8', letterSpacing: '0.01em' }}>
                {formatCategoryLabel(kpi.label)}
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: kpi.color || (isLight ? '#0F172A' : '#FFFFFF'), letterSpacing: '-0.02em' }}>
                  {typeof kpi.value === 'number' ? (
                    kpi.isPct || kpi.unit === '%' ? formatPercentage(kpi.value) : formatNumber(kpi.value)
                  ) : kpi.value}
                </span>
                {kpi.unit && kpi.unit !== '%' && (
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: isLight ? '#94A3B8' : '#64748B' }}>
                    {kpi.unit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* STICKY VISUAL CONTROLS BAR: Beautifully aligned, ample breathing space */}
        {viewMode === 'CHARTS' && (
          <div
            style={{
              padding: '12px 28px',
              borderBottom: isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: isLight ? '#FFFFFF' : '#0B0F19',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={15} color={getAccentColor()} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: isLight ? '#0F172A' : '#FFFFFF' }}>
                Chart Visualizations:
              </span>
            </div>

            {/* Chart Type Switcher Pills matching Image 3 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px',
                borderRadius: '10px',
                backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.06)',
                border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {[
                { id: 'HBAR', label: 'Horizontal Bar', icon: Layers },
                { id: 'VBAR', label: 'Column Chart', icon: BarChart3 },
                { id: 'DONUT', label: 'Donut / Share', icon: PieChart },
                { id: 'AREA', label: 'Trend / Area', icon: TrendingUp },
                { id: 'RADAR', label: 'Radar Web', icon: Activity }
              ].map((typeItem) => {
                const Icon = typeItem.icon;
                const isSelected = chartType === typeItem.id;
                return (
                  <button
                    key={typeItem.id}
                    type="button"
                    onClick={() => {
                      setChartType(typeItem.id);
                      setSelectedChartItem(null);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: isSelected ? 700 : 500,
                      backgroundColor: isSelected
                        ? (isLight ? '#0F172A' : '#1E293B')
                        : 'transparent',
                      color: isSelected
                        ? '#FFFFFF'
                        : (isLight ? '#475569' : '#94A3B8'),
                      boxShadow: isSelected ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon size={13} color={isSelected ? getAccentColor() : 'currentColor'} />
                    <span>{typeItem.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Category Inspection Pill */}
        {viewMode === 'CHARTS' && selectedChartItem && (
          <div
            style={{
              padding: '8px 28px',
              backgroundColor: isLight ? 'rgba(0, 200, 83, 0.08)' : 'rgba(0, 230, 118, 0.08)',
              borderBottom: isLight ? '1px solid rgba(0, 200, 83, 0.2)' : '1px solid rgba(0, 230, 118, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
              <span style={{ fontWeight: 700, color: getAccentColor() }}>Selected Category:</span>
              <span style={{ fontWeight: 700, color: isLight ? '#0F172A' : '#FFFFFF' }}>{selectedChartItem.label}</span>
              <span style={{ color: isLight ? '#64748B' : '#94A3B8' }}>• {selectedChartItem.value.toLocaleString()} units</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: getAccentColor(),
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                <span>Filter Table with this Category</span>
                <ArrowRight size={11} />
              </button>
              <button
                type="button"
                onClick={() => setSelectedChartItem(null)}
                style={{
                  fontSize: '0.6875rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.1)',
                  color: isLight ? '#475569' : '#CBD5E1',
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Content Body: CHARTS VIEW (Zero-overflow flex hierarchy) */}
        {viewMode === 'CHARTS' && (
          <div
            className="chart-content"
            style={{
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
              padding: '16px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            {/* Chart Presentation Canvas Card */}
            <div
              className="chart-card-container"
              style={{
                flex: 1,
                minHeight: 0,
                padding: '16px 20px',
                borderRadius: '16px',
                backgroundColor: isLight ? '#FAFAFA' : 'rgba(255, 255, 255, 0.02)',
                border: isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                overflow: 'hidden',
                boxSizing: 'border-box',
                position: 'relative'
              }}
            >
              {chartType === 'HBAR' && (
                <AnalyticsChartList
                  data={chartDataset.items}
                  total={chartDataset.total}
                  isLight={isLight}
                  selectedItem={selectedChartItem}
                  onSelectItem={setSelectedChartItem}
                  filterQuery={chartCategorySearch}
                  onFilterQueryChange={setChartCategorySearch}
                  accentColor={getAccentColor()}
                />
              )}

              {chartType === 'VBAR' && (
                <VerticalColumnChart
                  data={chartDataset.items}
                  isLight={isLight}
                  selectedItem={selectedChartItem}
                  onSelectItem={setSelectedChartItem}
                />
              )}

              {chartType === 'DONUT' && (
                <DonutChart
                  data={chartDataset.items}
                  total={chartDataset.total}
                  isLight={isLight}
                  selectedItem={selectedChartItem}
                  onSelectItem={setSelectedChartItem}
                />
              )}

              {chartType === 'AREA' && (
                <AreaTrendChart
                  data={chartDataset.items}
                  isLight={isLight}
                  accentColor={getAccentColor()}
                  selectedItem={selectedChartItem}
                  onSelectItem={setSelectedChartItem}
                />
              )}

              {chartType === 'RADAR' && (
                <RadarChart
                  data={chartDataset.items}
                  isLight={isLight}
                  accentColor={getAccentColor()}
                  selectedItem={selectedChartItem}
                  onSelectItem={setSelectedChartItem}
                />
              )}
            </div>

            {/* Explanatory telemetry footer exactly matching Image 3 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                borderRadius: '10px',
                backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.03)',
                border: isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '0.75rem',
                color: isLight ? '#64748B' : '#94A3B8'
              }}
            >
              <span>
                Filtered telemetry across <strong>21 Nationwide Horizon Parks</strong> for the current active period.
              </span>
              <span style={{ color: getAccentColor(), fontWeight: 700 }}>
                ● Real-time Synced
              </span>
            </div>
          </div>
        )}

        {/* Content Body: ITEMIZED TABLE VIEW */}
        {viewMode === 'TABLE' && (
          <>
            {/* Filter & Search Toolbar */}
            <div
              style={{
                padding: '14px 28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
                flexShrink: 0,
                borderBottom: isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.06)',
                backgroundColor: isLight ? '#FAFAFA' : 'rgba(15, 20, 32, 0.4)'
              }}
            >
              {/* Quick Search */}
              <div style={{ position: 'relative', width: '280px' }}>
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: isLight ? '#94A3B8' : '#64748B'
                  }}
                />
                <input
                  type="text"
                  placeholder="Search by ID, name, site, tag..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '7px 12px 7px 34px',
                    borderRadius: '8px',
                    border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255, 255, 255, 0.12)',
                    backgroundColor: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)',
                    color: isLight ? '#0F172A' : '#FFFFFF',
                    fontSize: '0.8125rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Status filter tabs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {['ALL', 'OPERATIONAL', 'BREAKDOWN', 'COMPLIANT', 'SLA MET', 'OVERDUE', 'COMPLETED', 'PRESENT', 'CLOSED'].map((tab) => {
                  const hasMatching = rawDataset.some(
                    (d) => d.status && d.status.toUpperCase() === tab
                  );
                  if (tab !== 'ALL' && !hasMatching) return null;

                  const isSelected = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab);
                        setCurrentPage(1);
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.6875rem',
                        fontWeight: isSelected ? 700 : 500,
                        backgroundColor: isSelected
                          ? (isLight ? '#0F172A' : '#1E293B')
                          : 'transparent',
                        color: isSelected
                          ? '#FFFFFF'
                          : (isLight ? '#64748B' : '#94A3B8'),
                        border: isSelected
                          ? 'none'
                          : (isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.08)'),
                        cursor: 'pointer'
                      }}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px' }}>
              {paginatedItems.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '240px',
                    color: isLight ? '#64748B' : '#94A3B8'
                  }}
                >
                  <CheckCircle2 size={36} color="#00C853" style={{ marginBottom: '10px', opacity: 0.8 }} />
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>No records found</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                    Try adjusting your search criteria or tab filters
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                    <thead>
                      <tr
                        style={{
                          borderBottom: isLight ? '2px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.1)',
                          color: isLight ? '#64748B' : '#94A3B8',
                          textAlign: 'left'
                        }}
                      >
                        <th style={{ padding: '8px 10px', fontWeight: 700 }}>Identifier</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700 }}>Title / Description</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700 }}>Category / Role</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700 }}>Park Location</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700 }}>Status</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700 }}>Telemetry / Info</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedItems.map((item, idx) => {
                        const isAlert =
                          item.status === 'BreakDown' ||
                          item.status === 'Overdue' ||
                          item.status === 'Absent';
                        const isNominal =
                          item.status === 'Operational' ||
                          item.status === 'Completed' ||
                          item.status === 'Present' ||
                          item.status === 'Closed' ||
                          item.status === 'Compliant' ||
                          item.status === 'SLA Met';

                        return (
                          <tr
                            key={item.id || idx}
                            className="clickable-row"
                            style={{
                              borderBottom: isLight ? '1px solid #F1F5F9' : '1px solid rgba(255, 255, 255, 0.05)',
                              backgroundColor: idx % 2 === 0
                                ? (isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.015)')
                                : (isLight ? '#F8FAFC' : 'rgba(255, 255, 255, 0.03)')
                            }}
                          >
                            <td style={{ padding: '10px', fontWeight: 700, fontFamily: 'monospace', color: isLight ? '#0F172A' : '#F1F5F9' }}>
                              {item.id}
                            </td>
                            <td style={{ padding: '10px', fontWeight: 600, color: isLight ? '#0F172A' : '#FFFFFF' }}>
                              {item.name || item.title}
                            </td>
                            <td style={{ padding: '10px', color: isLight ? '#475569' : '#CBD5E1' }}>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.06)',
                                  fontSize: '0.75rem',
                                  fontWeight: 500
                                }}
                              >
                                {item.category || item.workType || item.group || 'General'}
                              </span>
                            </td>
                            <td style={{ padding: '10px', color: isLight ? '#475569' : '#CBD5E1' }}>
                              {item.site || item.park || item.city || 'Horizon Parks'}
                            </td>
                            <td style={{ padding: '10px' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '3px 8px',
                                  borderRadius: '12px',
                                  fontSize: '0.6875rem',
                                  fontWeight: 700,
                                  backgroundColor: isAlert
                                    ? 'rgba(239, 68, 68, 0.12)'
                                    : isNominal
                                    ? 'rgba(16, 185, 129, 0.12)'
                                    : 'rgba(245, 158, 11, 0.12)',
                                  color: isAlert
                                    ? '#EF4444'
                                    : isNominal
                                    ? '#10B981'
                                    : '#F59E0B'
                                }}
                              >
                                <span
                                  style={{
                                    width: '5px',
                                    height: '5px',
                                    borderRadius: '50%',
                                    backgroundColor: isAlert ? '#EF4444' : isNominal ? '#10B981' : '#F59E0B'
                                  }}
                                />
                                {item.status}
                              </span>
                            </td>
                            <td style={{ padding: '10px', color: isLight ? '#64748B' : '#94A3B8', fontSize: '0.75rem' }}>
                              {item.health !== undefined && `${item.health}% health • ${item.technician || 'Monitored'}`}
                              {item.sla && `${item.sla} • ${item.requester}`}
                              {item.dueDate && `Due: ${item.dueDate} • ${item.technician}`}
                              {item.shift && `${item.shift} • ${item.checkInTime}`}
                              {!item.health && !item.sla && !item.dueDate && !item.shift && (item.lastCheck || item.resolvedAt || 'Nominal')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination Footer */}
            <div
              style={{
                padding: '14px 28px',
                borderTop: isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                backgroundColor: isLight ? '#F8FAFC' : 'rgba(15, 20, 32, 0.6)'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: isLight ? '#64748B' : '#94A3B8' }}>
                Showing{' '}
                <strong style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>
                  {filteredDataset.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                </strong>{' '}
                to{' '}
                <strong style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>
                  {Math.min(currentPage * itemsPerPage, filteredDataset.length)}
                </strong>{' '}
                of <strong style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>{filteredDataset.length}</strong> items
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.06)',
                    color: currentPage === 1 ? (isLight ? '#CBD5E1' : '#475569') : (isLight ? '#334155' : '#E2E8F0'),
                    border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>

                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isLight ? '#334155' : '#CBD5E1', padding: '0 4px' }}>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.06)',
                    color: currentPage >= totalPages ? (isLight ? '#CBD5E1' : '#475569') : (isLight ? '#334155' : '#E2E8F0'),
                    border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
